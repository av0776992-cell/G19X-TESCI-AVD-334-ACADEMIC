
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import obtener_usuario_actual

from app.models.candidato import Candidato
from app.models.decision import Decision
from app.models.estado import Estado
from app.models.historial_estado import HistorialEstado
from app.models.postulacion import Postulacion
from app.models.usuario import Usuario
from app.models.vacante import Vacante

from app.schemas.postulacion import (
    PostulacionCrear,
    PostulacionRespuesta,
    PostulacionSeguimientoRespuesta,
)


router = APIRouter(
    prefix="/api/v1/postulaciones",
    tags=["Postulaciones"],
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
            detail="No se encontró el perfil del candidato",
        )

    return candidato


def construir_seguimiento(
    postulacion: Postulacion,
    db: Session,
) -> PostulacionSeguimientoRespuesta:
    """
    Construye la información de seguimiento de una postulación.

    Prioridad:
    1. Decisión final del administrador.
    2. Último estado registrado en el historial.
    3. Estado inicial Postulado.
    """

    vacante = db.get(Vacante, postulacion.vacante_id)

    titulo_vacante = (
        vacante.titulo
        if vacante is not None
        else f"Vacante #{postulacion.vacante_id}"
    )

    ultimo_historial = db.scalar(
        select(HistorialEstado)
        .where(
            HistorialEstado.postulacion_id == postulacion.id
        )
        .order_by(
            HistorialEstado.fecha_cambio.desc(),
            HistorialEstado.id.desc(),
        )
        .limit(1)
    )

    estado_actual = "Postulado"
    fecha_estado = None

    if ultimo_historial is not None:
        estado = db.get(
            Estado,
            ultimo_historial.estado_id,
        )

        if estado is not None:
            estado_actual = estado.nombre

        fecha_estado = ultimo_historial.fecha_cambio

    decision = db.scalar(
        select(Decision).where(
            Decision.postulacion_id == postulacion.id
        )
    )

    decision_final = None
    fecha_decision = None

    if decision is not None:
        decision_final = decision.decision
        fecha_decision = decision.fecha_decision

        if decision.decision == "ACEPTADO":
            estado_actual = "Aceptado"

        elif decision.decision == "RECHAZADO":
            estado_actual = "Rechazado"

    return PostulacionSeguimientoRespuesta(
        id=postulacion.id,
        candidato_id=postulacion.candidato_id,
        vacante_id=postulacion.vacante_id,
        fecha_postulacion=postulacion.fecha_postulacion,
        titulo_vacante=titulo_vacante,
        estado_actual=estado_actual,
        fecha_estado=fecha_estado,
        decision_final=decision_final,
        fecha_decision=fecha_decision,
    )


@router.post(
    "",
    response_model=PostulacionRespuesta,
    status_code=status.HTTP_201_CREATED,
)
def crear_postulacion(
    datos: PostulacionCrear,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    candidato = obtener_candidato_actual(
        usuario_actual,
        db,
    )

    vacante = db.scalar(
        select(Vacante).where(
            Vacante.id == datos.vacante_id,
            Vacante.estado == "ABIERTA",
        )
    )

    if vacante is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vacante no encontrada o no disponible",
        )

    postulacion_existente = db.scalar(
        select(Postulacion).where(
            Postulacion.candidato_id == candidato.id,
            Postulacion.vacante_id == vacante.id,
        )
    )

    if postulacion_existente is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya te postulaste a esta vacante",
        )

    estado_postulado = db.scalar(
        select(Estado).where(
            Estado.nombre == "Postulado"
        )
    )

    if estado_postulado is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No está configurado el estado inicial Postulado",
        )

    nueva_postulacion = Postulacion(
        candidato_id=candidato.id,
        vacante_id=vacante.id,
    )

    try:
        db.add(nueva_postulacion)
        db.flush()

        historial_inicial = HistorialEstado(
            postulacion_id=nueva_postulacion.id,
            estado_id=estado_postulado.id,
        )

        db.add(historial_inicial)
        db.commit()
        db.refresh(nueva_postulacion)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya te postulaste a esta vacante",
        )

    except Exception:
        db.rollback()
        raise

    return nueva_postulacion


@router.get(
    "",
    response_model=list[PostulacionSeguimientoRespuesta],
)
def listar_mis_postulaciones(
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    candidato = obtener_candidato_actual(
        usuario_actual,
        db,
    )

    postulaciones = db.scalars(
        select(Postulacion)
        .where(
            Postulacion.candidato_id == candidato.id
        )
        .order_by(
            Postulacion.fecha_postulacion.desc()
        )
    ).all()

    return [
        construir_seguimiento(postulacion, db)
        for postulacion in postulaciones
    ]


@router.get(
    "/{postulacion_id}",
    response_model=PostulacionSeguimientoRespuesta,
)
def obtener_mi_postulacion(
    postulacion_id: int,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    candidato = obtener_candidato_actual(
        usuario_actual,
        db,
    )

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

    return construir_seguimiento(
        postulacion,
        db,
    )
