
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import requerir_roles
from app.models.evaluacion import Evaluacion
from app.models.postulacion import Postulacion
from app.models.usuario import Usuario
from app.schemas.evaluacion import (
    EvaluacionCrear,
    EvaluacionRespuesta,
)


router = APIRouter(
    prefix="/api/v1/evaluaciones",
    tags=["Evaluaciones Técnicas"],
)


@router.post(
    "/postulaciones/{postulacion_id}",
    response_model=EvaluacionRespuesta,
    status_code=status.HTTP_201_CREATED,
)
def registrar_evaluacion(
    postulacion_id: int,
    datos: EvaluacionCrear,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(
        requerir_roles("RECLUTADOR")
    ),
):
    postulacion = db.get(Postulacion, postulacion_id)

    if postulacion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La postulación no existe.",
        )

    evaluacion = Evaluacion(
        postulacion_id=postulacion_id,
        reclutador_id=usuario_actual.id,
        tipo=datos.tipo,
        puntuacion=datos.puntuacion,
        observaciones=datos.observaciones,
    )

    db.add(evaluacion)
    db.commit()
    db.refresh(evaluacion)

    return evaluacion


@router.get(
    "/postulaciones/{postulacion_id}",
    response_model=list[EvaluacionRespuesta],
)
def listar_evaluaciones(
    postulacion_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(
        requerir_roles("RECLUTADOR", "ADMINISTRADOR")
    ),
):
    postulacion = db.get(Postulacion, postulacion_id)

    if postulacion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La postulación no existe.",
        )

    evaluaciones = db.scalars(
        select(Evaluacion)
        .where(Evaluacion.postulacion_id == postulacion_id)
        .order_by(Evaluacion.fecha_evaluacion.desc())
    ).all()

    return evaluaciones
