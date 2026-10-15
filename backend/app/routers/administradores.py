
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import requerir_roles
from app.models.decision import Decision
from app.models.evaluacion_reclutador import EvaluacionReclutador
from app.models.postulacion import Postulacion
from app.models.resultado_ranking import ResultadoRanking
from app.models.usuario import Usuario
from app.schemas.decision import DecisionCrear, DecisionRespuesta


router = APIRouter(
    prefix="/api/v1/administradores",
    tags=["Administradores"],
)

solo_administrador = requerir_roles("ADMINISTRADOR")


@router.get("/postulaciones")
def listar_postulaciones(
    usuario_actual: Usuario = Depends(solo_administrador),
    db: Session = Depends(get_db),
):
    postulaciones = db.scalars(
        select(Postulacion).order_by(
            Postulacion.fecha_postulacion.desc()
        )
    ).all()

    return [
        {
            "id": postulacion.id,
            "candidato_id": postulacion.candidato_id,
            "vacante_id": postulacion.vacante_id,
            "fecha_postulacion": postulacion.fecha_postulacion,
        }
        for postulacion in postulaciones
    ]


@router.get("/postulaciones/{postulacion_id}/revision")
def revisar_postulacion(
    postulacion_id: int,
    usuario_actual: Usuario = Depends(solo_administrador),
    db: Session = Depends(get_db),
):
    postulacion = db.get(Postulacion, postulacion_id)

    if postulacion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Postulacion no encontrada",
        )

    recomendacion = db.scalar(
        select(EvaluacionReclutador).where(
            EvaluacionReclutador.postulacion_id == postulacion_id
        )
    )

    ranking = db.scalar(
        select(ResultadoRanking)
        .where(ResultadoRanking.postulacion_id == postulacion_id)
        .order_by(
            ResultadoRanking.fecha_calculo.desc(),
            ResultadoRanking.id.desc(),
        )
    )

    decision = db.scalar(
        select(Decision).where(
            Decision.postulacion_id == postulacion_id
        )
    )

    return {
        "postulacion_id": postulacion.id,
        "candidato_id": postulacion.candidato_id,
        "vacante_id": postulacion.vacante_id,
        "ranking": (
            {
                "puntaje": ranking.puntaje,
                "metodo": ranking.metodo,
                "version_modelo": ranking.version_modelo,
                "explicacion": ranking.explicacion,
            }
            if ranking is not None
            else None
        ),
        "recomendacion_reclutador": (
            {
                "recomendacion": recomendacion.recomendacion,
                "resumen": recomendacion.resumen,
            }
            if recomendacion is not None
            else None
        ),
        "decision_final": (
            {
                "decision": decision.decision,
                "justificacion": decision.justificacion,
                "administrador_id": decision.administrador_id,
                "fecha_decision": decision.fecha_decision,
            }
            if decision is not None
            else None
        ),
    }


@router.post(
    "/postulaciones/{postulacion_id}/decision",
    response_model=DecisionRespuesta,
    status_code=status.HTTP_201_CREATED,
)
def registrar_decision(
    postulacion_id: int,
    datos: DecisionCrear,
    usuario_actual: Usuario = Depends(solo_administrador),
    db: Session = Depends(get_db),
):
    postulacion = db.get(Postulacion, postulacion_id)

    if postulacion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Postulacion no encontrada",
        )

    decision_existente = db.scalar(
        select(Decision).where(
            Decision.postulacion_id == postulacion_id
        )
    )

    if decision_existente is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Esta postulacion ya tiene una decision final",
        )

    nueva_decision = Decision(
        postulacion_id=postulacion_id,
        administrador_id=usuario_actual.id,
        decision=datos.decision,
        justificacion=datos.justificacion,
    )

    db.add(nueva_decision)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se pudo registrar la decision; verifica si ya existe",
        )

    db.refresh(nueva_decision)
    return nueva_decision


@router.get(
    "/postulaciones/{postulacion_id}/decision",
    response_model=DecisionRespuesta,
)
def consultar_decision(
    postulacion_id: int,
    usuario_actual: Usuario = Depends(solo_administrador),
    db: Session = Depends(get_db),
):
    postulacion = db.get(Postulacion, postulacion_id)

    if postulacion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Postulacion no encontrada",
        )

    decision = db.scalar(
        select(Decision).where(
            Decision.postulacion_id == postulacion_id
        )
    )

    if decision is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Esta postulacion todavia no tiene una decision",
        )

    return decision
