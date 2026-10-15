from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import obtener_usuario_actual
from app.models.candidato import Candidato
from app.models.experiencia import Experiencia
from app.models.usuario import Usuario
from app.schemas.experiencia import (
    ExperienciaActualizar,
    ExperienciaCrear,
    ExperienciaRespuesta,
)


router = APIRouter(
    prefix="/api/v1/experiencias",
    tags=["Experiencia laboral"],
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


@router.post(
    "",
    response_model=ExperienciaRespuesta,
    status_code=status.HTTP_201_CREATED,
)
def crear_experiencia(
    datos: ExperienciaCrear,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    candidato = obtener_candidato_actual(
        usuario_actual,
        db,
    )

    nueva_experiencia = Experiencia(
        candidato_id=candidato.id,
        empresa=datos.empresa,
        puesto=datos.puesto,
        descripcion=datos.descripcion,
        fecha_inicio=datos.fecha_inicio,
        fecha_fin=datos.fecha_fin,
    )

    try:
        db.add(nueva_experiencia)
        db.commit()
        db.refresh(nueva_experiencia)

    except Exception:
        db.rollback()
        raise

    return nueva_experiencia


@router.get(
    "",
    response_model=list[ExperienciaRespuesta],
)
def listar_experiencias(
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    candidato = obtener_candidato_actual(
        usuario_actual,
        db,
    )

    experiencias = db.scalars(
        select(Experiencia)
        .where(Experiencia.candidato_id == candidato.id)
        .order_by(Experiencia.id)
    ).all()

    return experiencias


@router.get(
    "/{experiencia_id}",
    response_model=ExperienciaRespuesta,
)
def obtener_experiencia(
    experiencia_id: int,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    candidato = obtener_candidato_actual(
        usuario_actual,
        db,
    )

    experiencia = db.scalar(
        select(Experiencia).where(
            Experiencia.id == experiencia_id,
            Experiencia.candidato_id == candidato.id,
        )
    )

    if experiencia is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experiencia laboral no encontrada",
        )

    return experiencia


@router.patch(
    "/{experiencia_id}",
    response_model=ExperienciaRespuesta,
)
def actualizar_experiencia(
    experiencia_id: int,
    datos: ExperienciaActualizar,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    candidato = obtener_candidato_actual(
        usuario_actual,
        db,
    )

    experiencia = db.scalar(
        select(Experiencia).where(
            Experiencia.id == experiencia_id,
            Experiencia.candidato_id == candidato.id,
        )
    )

    if experiencia is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experiencia laboral no encontrada",
        )

    datos_actualizar = datos.model_dump(exclude_unset=True)

    fecha_inicio_final = datos_actualizar.get(
        "fecha_inicio",
        experiencia.fecha_inicio,
    )

    fecha_fin_final = datos_actualizar.get(
        "fecha_fin",
        experiencia.fecha_fin,
    )

    if (
        fecha_inicio_final is not None
        and fecha_fin_final is not None
        and fecha_fin_final < fecha_inicio_final
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="La fecha de fin no puede ser anterior a la fecha de inicio",
        )

    for campo, valor in datos_actualizar.items():
        setattr(experiencia, campo, valor)

    try:
        db.commit()
        db.refresh(experiencia)

    except Exception:
        db.rollback()
        raise

    return experiencia


@router.delete(
    "/{experiencia_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def eliminar_experiencia(
    experiencia_id: int,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    candidato = obtener_candidato_actual(
        usuario_actual,
        db,
    )

    experiencia = db.scalar(
        select(Experiencia).where(
            Experiencia.id == experiencia_id,
            Experiencia.candidato_id == candidato.id,
        )
    )

    if experiencia is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experiencia laboral no encontrada",
        )

    try:
        db.delete(experiencia)
        db.commit()

    except Exception:
        db.rollback()
        raise