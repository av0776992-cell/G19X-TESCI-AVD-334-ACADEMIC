from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import obtener_usuario_actual, requerir_roles
from app.models.competencia import Competencia
from app.models.habilidad import Habilidad
from app.models.usuario import Usuario
from app.models.vacante import Vacante
from app.models.vacante_competencia import VacanteCompetencia
from app.models.vacante_habilidad import VacanteHabilidad
from app.schemas.vacante import (
    VacanteCompetenciaRespuesta,
    VacanteDetalleRespuesta,
    VacanteHabilidadRespuesta,
    VacanteRespuesta,
    VacanteCrear,
    VacanteActualizar,
    VacanteHabilidadAsignar,
    VacanteCompetenciaAsignar,
)


router = APIRouter(
    prefix="/api/v1/vacantes",
    tags=["Vacantes"],
)


@router.get(
    "",
    response_model=list[VacanteRespuesta],
)
def listar_vacantes(
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    vacantes = db.scalars(
        select(Vacante)
        .where(Vacante.estado == "ABIERTA")
        .order_by(Vacante.fecha_publicacion.desc())
    ).all()

    return vacantes


@router.get(
    "/{vacante_id}",
    response_model=VacanteDetalleRespuesta,
)
def obtener_vacante(
    vacante_id: int,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    vacante = db.scalar(
        select(Vacante).where(
            Vacante.id == vacante_id,
            Vacante.estado == "ABIERTA",
        )
    )

    if vacante is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vacante no encontrada o no disponible",
        )

    requisitos_habilidades = db.execute(
        select(VacanteHabilidad, Habilidad)
        .join(
            Habilidad,
            Habilidad.id == VacanteHabilidad.habilidad_id,
        )
        .where(VacanteHabilidad.vacante_id == vacante.id)
        .order_by(Habilidad.nombre)
    ).all()

    requisitos_competencias = db.execute(
        select(VacanteCompetencia, Competencia)
        .join(
            Competencia,
            Competencia.id == VacanteCompetencia.competencia_id,
        )
        .where(VacanteCompetencia.vacante_id == vacante.id)
        .order_by(Competencia.nombre)
    ).all()

    habilidades = [
        VacanteHabilidadRespuesta(
            id=requisito.id,
            habilidad_id=habilidad.id,
            nombre=habilidad.nombre,
            nivel_requerido=requisito.nivel_requerido,
        )
        for requisito, habilidad in requisitos_habilidades
    ]

    competencias = [
        VacanteCompetenciaRespuesta(
            id=requisito.id,
            competencia_id=competencia.id,
            nombre=competencia.nombre,
            nivel_requerido=requisito.nivel_requerido,
        )
        for requisito, competencia in requisitos_competencias
    ]

    return VacanteDetalleRespuesta(
        id=vacante.id,
        titulo=vacante.titulo,
        descripcion=vacante.descripcion,
        ubicacion=vacante.ubicacion,
        modalidad=vacante.modalidad,
        estado=vacante.estado,
        fecha_publicacion=vacante.fecha_publicacion,
        fecha_cierre=vacante.fecha_cierre,
        experiencia_minima_meses=vacante.experiencia_minima_meses,
        nivel_estudios_requerido=vacante.nivel_estudios_requerido,
        habilidades=habilidades,
        competencias=competencias,
    )

@router.post(
    "",
    response_model=VacanteRespuesta,
    status_code=status.HTTP_201_CREATED,
)
def crear_vacante(
    datos: VacanteCrear,
    usuario_actual: Usuario = Depends(requerir_roles("ADMINISTRADOR")),
    db: Session = Depends(get_db),
):
    vacante = Vacante(
        titulo=datos.titulo.strip(),
        descripcion=datos.descripcion.strip(),
        ubicacion=datos.ubicacion,
        modalidad=datos.modalidad,
        estado="ABIERTA",
        experiencia_minima_meses=datos.experiencia_minima_meses,
        nivel_estudios_requerido=datos.nivel_estudios_requerido,
    )

    if not vacante.titulo or not vacante.descripcion:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El tÃ­tulo y la descripciÃ³n no pueden estar vacÃ­os",
        )

    db.add(vacante)
    db.commit()
    db.refresh(vacante)

    return vacante



@router.put(
    "/{vacante_id}/habilidades",
    response_model=VacanteHabilidadRespuesta,
)
def asignar_habilidad_vacante(
    vacante_id: int,
    datos: VacanteHabilidadAsignar,
    usuario_actual: Usuario = Depends(requerir_roles("ADMINISTRADOR")),
    db: Session = Depends(get_db),
):
    vacante = db.get(Vacante, vacante_id)
    if vacante is None or vacante.estado != "ABIERTA":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vacante no encontrada o no disponible",
        )

    habilidad = db.get(Habilidad, datos.habilidad_id)
    if habilidad is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habilidad no encontrada",
        )

    requisito = db.scalar(
        select(VacanteHabilidad).where(
            VacanteHabilidad.vacante_id == vacante_id,
            VacanteHabilidad.habilidad_id == datos.habilidad_id,
        )
    )

    if requisito is None:
        requisito = VacanteHabilidad(
            vacante_id=vacante_id,
            habilidad_id=datos.habilidad_id,
            nivel_requerido=datos.nivel_requerido,
        )
        db.add(requisito)
    else:
        requisito.nivel_requerido = datos.nivel_requerido

    db.commit()
    db.refresh(requisito)

    return VacanteHabilidadRespuesta(
        id=requisito.id,
        habilidad_id=habilidad.id,
        nombre=habilidad.nombre,
        nivel_requerido=requisito.nivel_requerido,
    )


@router.put(
    "/{vacante_id}/competencias",
    response_model=VacanteCompetenciaRespuesta,
)
def asignar_competencia_vacante(
    vacante_id: int,
    datos: VacanteCompetenciaAsignar,
    usuario_actual: Usuario = Depends(requerir_roles("ADMINISTRADOR")),
    db: Session = Depends(get_db),
):
    vacante = db.get(Vacante, vacante_id)

    if vacante is None or vacante.estado != "ABIERTA":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vacante no encontrada o no disponible",
        )

    competencia = db.get(Competencia, datos.competencia_id)

    if competencia is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Competencia no encontrada",
        )

    requisito = db.scalar(
        select(VacanteCompetencia).where(
            VacanteCompetencia.vacante_id == vacante_id,
            VacanteCompetencia.competencia_id == datos.competencia_id,
        )
    )

    if requisito is None:
        requisito = VacanteCompetencia(
            vacante_id=vacante_id,
            competencia_id=datos.competencia_id,
            nivel_requerido=datos.nivel_requerido,
        )
        db.add(requisito)
    else:
        requisito.nivel_requerido = datos.nivel_requerido

    db.commit()
    db.refresh(requisito)

    return VacanteCompetenciaRespuesta(
        id=requisito.id,
        competencia_id=competencia.id,
        nombre=competencia.nombre,
        nivel_requerido=requisito.nivel_requerido,
    )


@router.patch(
    "/{vacante_id}",
    response_model=VacanteRespuesta,
)
def actualizar_vacante(
    vacante_id: int,
    datos: VacanteActualizar,
    usuario_actual: Usuario = Depends(requerir_roles("ADMINISTRADOR")),
    db: Session = Depends(get_db),
):
    vacante = db.get(Vacante, vacante_id)

    if vacante is None or vacante.estado != "ABIERTA":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vacante no encontrada o no disponible",
        )

    cambios = datos.model_dump(exclude_unset=True)

    for campo in ("titulo", "descripcion"):
        if campo in cambios:
            valor = cambios[campo]
            if valor is None or not valor.strip():
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"El campo {campo} no puede estar vac?o",
                )
            cambios[campo] = valor.strip()

    for campo, valor in cambios.items():
        setattr(vacante, campo, valor)

    db.commit()
    db.refresh(vacante)

    return vacante


@router.patch(
    "/{vacante_id}/cerrar",
    response_model=VacanteRespuesta,
)
def cerrar_vacante(
    vacante_id: int,
    usuario_actual: Usuario = Depends(requerir_roles("ADMINISTRADOR")),
    db: Session = Depends(get_db),
):
    vacante = db.get(Vacante, vacante_id)

    if vacante is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vacante no encontrada",
        )

    if vacante.estado != "ABIERTA":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La vacante ya no est? abierta",
        )

    vacante.estado = "CERRADA"
    vacante.fecha_cierre = datetime.now(timezone.utc)

    db.commit()
    db.refresh(vacante)

    return vacante
