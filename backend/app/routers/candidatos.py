from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import obtener_usuario_actual
from app.models.candidato import Candidato
from app.models.usuario import Usuario
from app.schemas.candidato import (
    CandidatoPerfilActualizar,
    CandidatoPerfilRespuesta,
)


router = APIRouter(
    prefix="/api/v1/candidatos",
    tags=["Candidatos"],
)


@router.get(
    "/me",
    response_model=CandidatoPerfilRespuesta,
)
def obtener_perfil_candidato(
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
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

    return CandidatoPerfilRespuesta(
        id=candidato.id,
        usuario_id=candidato.usuario_id,
        nombre=usuario_actual.nombre,
        correo=usuario_actual.correo,
        activo=usuario_actual.activo,
        telefono=candidato.telefono,
        ciudad=candidato.ciudad,
        fecha_nacimiento=candidato.fecha_nacimiento,
        fecha_actualizacion=candidato.fecha_actualizacion,
    )


@router.patch(
    "/me",
    response_model=CandidatoPerfilRespuesta,
)
def actualizar_perfil_candidato(
    datos: CandidatoPerfilActualizar,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
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

    datos_actualizar = datos.model_dump(exclude_unset=True)

    for campo, valor in datos_actualizar.items():
        setattr(candidato, campo, valor)

    try:
        db.commit()
        db.refresh(candidato)

    except Exception:
        db.rollback()
        raise

    return CandidatoPerfilRespuesta(
        id=candidato.id,
        usuario_id=candidato.usuario_id,
        nombre=usuario_actual.nombre,
        correo=usuario_actual.correo,
        activo=usuario_actual.activo,
        telefono=candidato.telefono,
        ciudad=candidato.ciudad,
        fecha_nacimiento=candidato.fecha_nacimiento,
        fecha_actualizacion=candidato.fecha_actualizacion,
    )