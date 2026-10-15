from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import obtener_usuario_actual
from app.models.candidato import Candidato
from app.models.candidato_competencia import CandidatoCompetencia
from app.models.competencia import Competencia
from app.models.usuario import Usuario
from app.schemas.competencia import (
    CandidatoCompetenciaActualizar,
    CandidatoCompetenciaCrear,
    CandidatoCompetenciaRespuesta,
    CompetenciaRespuesta,
)


router = APIRouter(
    prefix="/api/v1/competencias",
    tags=["Competencias"],
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
    response_model=list[CompetenciaRespuesta],
)
def listar_catalogo_competencias(
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    competencias = db.scalars(
        select(Competencia).order_by(Competencia.nombre)
    ).all()

    return competencias


@router.post(
    "",
    response_model=CandidatoCompetenciaRespuesta,
    status_code=status.HTTP_201_CREATED,
)
def agregar_competencia(
    datos: CandidatoCompetenciaCrear,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    candidato = obtener_candidato_actual(
        usuario_actual,
        db,
    )

    competencia = db.get(
        Competencia,
        datos.competencia_id,
    )

    if competencia is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Competencia no encontrada",
        )

    competencia_existente = db.scalar(
        select(CandidatoCompetencia).where(
            CandidatoCompetencia.candidato_id == candidato.id,
            CandidatoCompetencia.competencia_id == datos.competencia_id,
        )
    )

    if competencia_existente is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El candidato ya tiene registrada esta competencia",
        )

    nueva_competencia = CandidatoCompetencia(
        candidato_id=candidato.id,
        competencia_id=datos.competencia_id,
        nivel=datos.nivel,
    )

    try:
        db.add(nueva_competencia)
        db.commit()
        db.refresh(nueva_competencia)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El candidato ya tiene registrada esta competencia",
        )

    return nueva_competencia


@router.get(
    "",
    response_model=list[CandidatoCompetenciaRespuesta],
)
def listar_competencias_candidato(
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    candidato = obtener_candidato_actual(
        usuario_actual,
        db,
    )

    competencias = db.scalars(
        select(CandidatoCompetencia)
        .where(
            CandidatoCompetencia.candidato_id == candidato.id
        )
        .order_by(CandidatoCompetencia.id)
    ).all()

    return competencias


@router.get(
    "/{candidato_competencia_id}",
    response_model=CandidatoCompetenciaRespuesta,
)
def obtener_competencia_candidato(
    candidato_competencia_id: int,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    candidato = obtener_candidato_actual(
        usuario_actual,
        db,
    )

    candidato_competencia = db.scalar(
        select(CandidatoCompetencia).where(
            CandidatoCompetencia.id == candidato_competencia_id,
            CandidatoCompetencia.candidato_id == candidato.id,
        )
    )

    if candidato_competencia is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Competencia del candidato no encontrada",
        )

    return candidato_competencia


@router.patch(
    "/{candidato_competencia_id}",
    response_model=CandidatoCompetenciaRespuesta,
)
def actualizar_competencia(
    candidato_competencia_id: int,
    datos: CandidatoCompetenciaActualizar,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    candidato = obtener_candidato_actual(
        usuario_actual,
        db,
    )

    candidato_competencia = db.scalar(
        select(CandidatoCompetencia).where(
            CandidatoCompetencia.id == candidato_competencia_id,
            CandidatoCompetencia.candidato_id == candidato.id,
        )
    )

    if candidato_competencia is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Competencia del candidato no encontrada",
        )

    candidato_competencia.nivel = datos.nivel

    try:
        db.commit()
        db.refresh(candidato_competencia)

    except Exception:
        db.rollback()
        raise

    return candidato_competencia


@router.delete(
    "/{candidato_competencia_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def eliminar_competencia(
    candidato_competencia_id: int,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    candidato = obtener_candidato_actual(
        usuario_actual,
        db,
    )

    candidato_competencia = db.scalar(
        select(CandidatoCompetencia).where(
            CandidatoCompetencia.id == candidato_competencia_id,
            CandidatoCompetencia.candidato_id == candidato.id,
        )
    )

    if candidato_competencia is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Competencia del candidato no encontrada",
        )

    try:
        db.delete(candidato_competencia)
        db.commit()

    except Exception:
        db.rollback()
        raise