
from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import obtener_usuario_actual
from app.models.candidato import Candidato
from app.models.documento import Documento
from app.models.postulacion import Postulacion
from app.models.usuario import Usuario
from app.schemas.documento import DocumentoRespuesta


router = APIRouter(
    prefix="/api/v1/documentos",
    tags=["Documentos"],
)

BASE_DIR = Path(__file__).resolve().parents[2]
DIRECTORIO_DOCUMENTOS = BASE_DIR / "storage" / "documentos"

TAMANO_MAXIMO = 10 * 1024 * 1024

ROLES_REVISION = {"RECLUTADOR", "ADMINISTRADOR"}


def obtener_candidato_actual(
    usuario_actual: Usuario,
    db: Session,
) -> Candidato:
    candidato = db.scalar(
        select(Candidato).where(
            Candidato.usuario_id == usuario_actual.id
        )
    )

    if candidato is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el perfil del candidato",
        )

    return candidato


def obtener_postulacion_del_candidato(
    postulacion_id: int,
    candidato: Candidato,
    db: Session,
) -> Postulacion:
    postulacion = db.scalar(
        select(Postulacion).where(
            Postulacion.id == postulacion_id,
            Postulacion.candidato_id == candidato.id,
        )
    )

    if postulacion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Postulación no encontrada",
        )

    return postulacion


def obtener_postulacion_autorizada(
    postulacion_id: int,
    usuario_actual: Usuario,
    db: Session,
) -> Postulacion:
    rol = (
        usuario_actual.rol.nombre
        if usuario_actual.rol is not None
        else None
    )

    if rol == "CANDIDATO":
        candidato = obtener_candidato_actual(usuario_actual, db)

        return obtener_postulacion_del_candidato(
            postulacion_id,
            candidato,
            db,
        )

    if rol in ROLES_REVISION:
        postulacion = db.get(Postulacion, postulacion_id)

        if postulacion is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Postulación no encontrada",
            )

        return postulacion

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="No tienes permisos para consultar estos documentos",
    )


@router.post(
    "",
    response_model=DocumentoRespuesta,
    status_code=status.HTTP_201_CREATED,
)
async def subir_documento(
    postulacion_id: int = Form(...),
    tipo: str = Form(...),
    archivo: UploadFile = File(...),
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    rol = (
        usuario_actual.rol.nombre
        if usuario_actual.rol is not None
        else None
    )

    if rol != "CANDIDATO":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los candidatos pueden subir documentos",
        )

    candidato = obtener_candidato_actual(usuario_actual, db)

    postulacion = obtener_postulacion_del_candidato(
        postulacion_id,
        candidato,
        db,
    )

    tipo_limpio = tipo.strip()

    if not tipo_limpio:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El tipo de documento es obligatorio",
        )

    nombre_original = Path(archivo.filename or "").name

    if not nombre_original:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El archivo debe tener un nombre",
        )

    extension = Path(nombre_original).suffix.lower()

    if extension != ".pdf":
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Solo se permiten archivos PDF",
        )

    contenido = await archivo.read(TAMANO_MAXIMO + 1)

    if len(contenido) > TAMANO_MAXIMO:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="El archivo supera el límite de 10 MB",
        )

    if not contenido.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="El archivo no contiene un PDF válido",
        )

    DIRECTORIO_DOCUMENTOS.mkdir(
        parents=True,
        exist_ok=True,
    )

    nombre_interno = f"{uuid4().hex}.pdf"
    ruta_archivo = DIRECTORIO_DOCUMENTOS / nombre_interno

    try:
        ruta_archivo.write_bytes(contenido)

        nuevo_documento = Documento(
            postulacion_id=postulacion.id,
            tipo=tipo_limpio,
            nombre_archivo=nombre_original,
            ruta_archivo=str(ruta_archivo),
        )

        db.add(nuevo_documento)
        db.commit()
        db.refresh(nuevo_documento)

        return nuevo_documento

    except Exception:
        db.rollback()

        if ruta_archivo.exists():
            ruta_archivo.unlink()

        raise

    finally:
        await archivo.close()


@router.get(
    "/postulacion/{postulacion_id}",
    response_model=list[DocumentoRespuesta],
)
def listar_documentos_postulacion(
    postulacion_id: int,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    postulacion = obtener_postulacion_autorizada(
        postulacion_id,
        usuario_actual,
        db,
    )

    documentos = db.scalars(
        select(Documento)
        .where(
            Documento.postulacion_id == postulacion.id
        )
        .order_by(Documento.fecha_subida.desc())
    ).all()

    return documentos


@router.get("/{documento_id}/descargar")
def descargar_documento(
    documento_id: int,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    documento = db.get(Documento, documento_id)

    if documento is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento no encontrado",
        )

    obtener_postulacion_autorizada(
        documento.postulacion_id,
        usuario_actual,
        db,
    )

    ruta_archivo = Path(documento.ruta_archivo)

    if not ruta_archivo.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El archivo del documento no está disponible",
        )

    return FileResponse(
        path=ruta_archivo,
        media_type="application/pdf",
        filename=documento.nombre_archivo,
    )