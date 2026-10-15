
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import requerir_roles
from app.models.candidato import Candidato
from app.models.evaluacion_reclutador import EvaluacionReclutador
from app.models.postulacion import Postulacion
from app.models.usuario import Usuario
from app.models.vacante import Vacante
from app.schemas.evaluacion_reclutador import (
    EvaluacionReclutadorCrear,
    EvaluacionReclutadorRespuesta,
)
from app.schemas.postulacion import PostulacionRespuesta
from app.schemas.reclutador import PostulacionDetalleReclutador


router = APIRouter(
    prefix="/api/v1/reclutadores",
    tags=["Reclutadores"],
)


@router.get(
    "/postulaciones",
    response_model=list[PostulacionRespuesta],
)
def listar_postulaciones_recibidas(
    usuario_actual: Usuario = Depends(
        requerir_roles("RECLUTADOR", "ADMINISTRADOR")
    ),
    db: Session = Depends(get_db),
):
    postulaciones = db.scalars(
        select(Postulacion)
        .order_by(Postulacion.fecha_postulacion.desc())
    ).all()

    return postulaciones


@router.get(
    "/postulaciones/{postulacion_id}",
    response_model=PostulacionDetalleReclutador,
)
def obtener_detalle_postulacion(
    postulacion_id: int,
    usuario_actual: Usuario = Depends(
        requerir_roles("RECLUTADOR", "ADMINISTRADOR")
    ),
    db: Session = Depends(get_db),
):
    resultado = db.execute(
        select(Postulacion, Candidato, Usuario, Vacante)
        .join(
            Candidato,
            Candidato.id == Postulacion.candidato_id,
        )
        .join(
            Usuario,
            Usuario.id == Candidato.usuario_id,
        )
        .join(
            Vacante,
            Vacante.id == Postulacion.vacante_id,
        )
        .where(Postulacion.id == postulacion_id)
    ).first()

    if resultado is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Postulación no encontrada",
        )

    postulacion, candidato, usuario, vacante = resultado

    return PostulacionDetalleReclutador(
        id=postulacion.id,
        candidato_id=candidato.id,
        vacante_id=vacante.id,
        fecha_postulacion=postulacion.fecha_postulacion,
        nombre_candidato=usuario.nombre,
        correo_candidato=usuario.correo,
        ciudad_candidato=candidato.ciudad,
        titulo_vacante=vacante.titulo,
    )


@router.post(
    "/postulaciones/{postulacion_id}/recomendacion",
    response_model=EvaluacionReclutadorRespuesta,
    status_code=status.HTTP_201_CREATED,
)
def registrar_recomendacion(
    postulacion_id: int,
    datos: EvaluacionReclutadorCrear,
    usuario_actual: Usuario = Depends(
        requerir_roles("RECLUTADOR")
    ),
    db: Session = Depends(get_db),
):
    postulacion = db.get(Postulacion, postulacion_id)

    if postulacion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Postulación no encontrada",
        )

    recomendacion_existente = db.scalar(
        select(EvaluacionReclutador).where(
            EvaluacionReclutador.postulacion_id == postulacion_id
        )
    )

    if recomendacion_existente is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Esta postulación ya tiene una recomendación",
        )

    nueva_recomendacion = EvaluacionReclutador(
        postulacion_id=postulacion_id,
        reclutador_id=usuario_actual.id,
        recomendacion=datos.recomendacion,
        resumen=datos.resumen,
    )

    db.add(nueva_recomendacion)
    db.commit()
    db.refresh(nueva_recomendacion)

    return nueva_recomendacion


@router.get(
    "/postulaciones/{postulacion_id}/recomendacion",
    response_model=EvaluacionReclutadorRespuesta,
)
def consultar_recomendacion(
    postulacion_id: int,
    usuario_actual: Usuario = Depends(
        requerir_roles("RECLUTADOR", "ADMINISTRADOR")
    ),
    db: Session = Depends(get_db),
):
    postulacion = db.get(Postulacion, postulacion_id)

    if postulacion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Postulación no encontrada",
        )

    recomendacion = db.scalar(
        select(EvaluacionReclutador).where(
            EvaluacionReclutador.postulacion_id == postulacion_id
        )
    )

    if recomendacion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Esta postulación todavía no tiene una recomendación",
        )

    return recomendacion
