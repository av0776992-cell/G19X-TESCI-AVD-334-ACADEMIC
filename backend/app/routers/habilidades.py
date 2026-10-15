from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import obtener_usuario_actual
from app.models.candidato import Candidato
from app.models.candidato_habilidad import CandidatoHabilidad
from app.models.habilidad import Habilidad
from app.models.usuario import Usuario
from app.schemas.habilidad import (
    CandidatoHabilidadActualizar,
    CandidatoHabilidadCrear,
    CandidatoHabilidadRespuesta,
    HabilidadRespuesta,
)


router = APIRouter(
    prefix="/api/v1/habilidades",
    tags=["Habilidades"],
)


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
            detail="Perfil de candidato no encontrado",
        )

    return candidato


@router.get(
    "/catalogo",
    response_model=list[HabilidadRespuesta],
)
def listar_catalogo_habilidades(
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    habilidades = db.scalars(
        select(Habilidad).order_by(Habilidad.nombre)
    ).all()

    return habilidades


@router.post(
    "",
    response_model=CandidatoHabilidadRespuesta,
    status_code=status.HTTP_201_CREATED,
)
def agregar_habilidad(
    datos: CandidatoHabilidadCrear,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    candidato = obtener_candidato_actual(
        usuario_actual,
        db,
    )

    habilidad = db.get(
        Habilidad,
        datos.habilidad_id,
    )

    if habilidad is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habilidad no encontrada",
        )

    habilidad_existente = db.scalar(
        select(CandidatoHabilidad).where(
            CandidatoHabilidad.candidato_id == candidato.id,
            CandidatoHabilidad.habilidad_id == datos.habilidad_id,
        )
    )

    if habilidad_existente is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El candidato ya tiene registrada esta habilidad",
        )

    nueva_habilidad = CandidatoHabilidad(
        candidato_id=candidato.id,
        habilidad_id=datos.habilidad_id,
        nivel=datos.nivel,
    )

    try:
        db.add(nueva_habilidad)
        db.commit()
        db.refresh(nueva_habilidad)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El candidato ya tiene registrada esta habilidad",
        )

    return nueva_habilidad


@router.get(
    "",
    response_model=list[CandidatoHabilidadRespuesta],
)
def listar_habilidades_candidato(
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    candidato = obtener_candidato_actual(
        usuario_actual,
        db,
    )

    habilidades = db.scalars(
        select(CandidatoHabilidad)
        .where(
            CandidatoHabilidad.candidato_id == candidato.id
        )
        .order_by(CandidatoHabilidad.id)
    ).all()

    return habilidades


@router.get(
    "/{candidato_habilidad_id}",
    response_model=CandidatoHabilidadRespuesta,
)
def obtener_habilidad_candidato(
    candidato_habilidad_id: int,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    candidato = obtener_candidato_actual(
        usuario_actual,
        db,
    )

    candidato_habilidad = db.scalar(
        select(CandidatoHabilidad).where(
            CandidatoHabilidad.id == candidato_habilidad_id,
            CandidatoHabilidad.candidato_id == candidato.id,
        )
    )

    if candidato_habilidad is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habilidad del candidato no encontrada",
        )

    return candidato_habilidad


@router.patch(
    "/{candidato_habilidad_id}",
    response_model=CandidatoHabilidadRespuesta,
)
def actualizar_habilidad(
    candidato_habilidad_id: int,
    datos: CandidatoHabilidadActualizar,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    candidato = obtener_candidato_actual(
        usuario_actual,
        db,
    )

    candidato_habilidad = db.scalar(
        select(CandidatoHabilidad).where(
            CandidatoHabilidad.id == candidato_habilidad_id,
            CandidatoHabilidad.candidato_id == candidato.id,
        )
    )

    if candidato_habilidad is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habilidad del candidato no encontrada",
        )

    candidato_habilidad.nivel = datos.nivel

    try:
        db.commit()
        db.refresh(candidato_habilidad)

    except Exception:
        db.rollback()
        raise

    return candidato_habilidad


@router.delete(
    "/{candidato_habilidad_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def eliminar_habilidad(
    candidato_habilidad_id: int,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    candidato = obtener_candidato_actual(
        usuario_actual,
        db,
    )

    candidato_habilidad = db.scalar(
        select(CandidatoHabilidad).where(
            CandidatoHabilidad.id == candidato_habilidad_id,
            CandidatoHabilidad.candidato_id == candidato.id,
        )
    )

    if candidato_habilidad is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habilidad del candidato no encontrada",
        )

    try:
        db.delete(candidato_habilidad)
        db.commit()

    except Exception:
        db.rollback()
        raise