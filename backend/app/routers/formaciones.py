from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import obtener_usuario_actual
from app.models.candidato import Candidato
from app.models.formacion import Formacion
from app.models.usuario import Usuario
from app.schemas.formacion import (
    FormacionActualizar,
    FormacionCrear,
    FormacionRespuesta,
)


router = APIRouter(
    prefix="/api/v1/formaciones",
    tags=["Formación académica"],
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
    response_model=FormacionRespuesta,
    status_code=status.HTTP_201_CREATED,
)
def crear_formacion(
    datos: FormacionCrear,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    candidato = obtener_candidato_actual(
        usuario_actual,
        db,
    )

    nueva_formacion = Formacion(
        candidato_id=candidato.id,
        institucion=datos.institucion,
        titulo=datos.titulo,
        nivel=datos.nivel,
        fecha_inicio=datos.fecha_inicio,
        fecha_fin=datos.fecha_fin,
    )

    try:
        db.add(nueva_formacion)
        db.commit()
        db.refresh(nueva_formacion)

    except Exception:
        db.rollback()
        raise

    return nueva_formacion


@router.get(
    "",
    response_model=list[FormacionRespuesta],
)
def listar_formaciones(
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    candidato = obtener_candidato_actual(
        usuario_actual,
        db,
    )

    formaciones = db.scalars(
        select(Formacion)
        .where(Formacion.candidato_id == candidato.id)
        .order_by(Formacion.id)
    ).all()

    return formaciones


@router.get(
    "/{formacion_id}",
    response_model=FormacionRespuesta,
)
def obtener_formacion(
    formacion_id: int,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    candidato = obtener_candidato_actual(
        usuario_actual,
        db,
    )

    formacion = db.scalar(
        select(Formacion).where(
            Formacion.id == formacion_id,
            Formacion.candidato_id == candidato.id,
        )
    )

    if formacion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Formación académica no encontrada",
        )

    return formacion


@router.patch(
    "/{formacion_id}",
    response_model=FormacionRespuesta,
)
def actualizar_formacion(
    formacion_id: int,
    datos: FormacionActualizar,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    candidato = obtener_candidato_actual(
        usuario_actual,
        db,
    )

    formacion = db.scalar(
        select(Formacion).where(
            Formacion.id == formacion_id,
            Formacion.candidato_id == candidato.id,
        )
    )

    if formacion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Formación académica no encontrada",
        )

    datos_actualizar = datos.model_dump(exclude_unset=True)

    for campo, valor in datos_actualizar.items():
        setattr(formacion, campo, valor)

    try:
        db.commit()
        db.refresh(formacion)

    except Exception:
        db.rollback()
        raise

    return formacion


@router.delete(
    "/{formacion_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def eliminar_formacion(
    formacion_id: int,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    candidato = obtener_candidato_actual(
        usuario_actual,
        db,
    )

    formacion = db.scalar(
        select(Formacion).where(
            Formacion.id == formacion_id,
            Formacion.candidato_id == candidato.id,
        )
    )

    if formacion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Formación académica no encontrada",
        )

    try:
        db.delete(formacion)
        db.commit()

    except Exception:
        db.rollback()
        raise