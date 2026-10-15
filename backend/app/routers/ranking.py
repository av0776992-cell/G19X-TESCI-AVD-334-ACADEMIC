
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import requerir_roles
from app.models.postulacion import Postulacion
from app.models.resultado_ranking import ResultadoRanking
from app.models.usuario import Usuario
from app.schemas.ranking import (
    RankingPrediccionEntrada,
    RankingPrediccionRespuesta,
    ResultadoRankingRespuesta,
)
from app.services.indicadores_ranking_service import (
    calcular_indicador_experiencia,
    calcular_compatibilidad_habilidades,
    calcular_indicador_formacion,
    calcular_compatibilidad_competencias,
    calcular_indicador_evaluaciones,
)
from app.services.ranking_ml_service import predecir_compatibilidad


router = APIRouter(
    prefix="/api/v1/ranking",
    tags=["Ranking e Inteligencia Artificial"],
)


@router.post(
    "/predecir",
    response_model=RankingPrediccionRespuesta,
)
def predecir_ranking(
    datos: RankingPrediccionEntrada,
    usuario_actual: Usuario = Depends(
        requerir_roles("RECLUTADOR", "ADMINISTRADOR")
    ),
):
    return predecir_compatibilidad(
        experiencia=datos.experiencia,
        habilidades=datos.habilidades,
        formacion=datos.formacion,
        competencias=datos.competencias,
        evaluaciones=datos.evaluaciones,
    )


@router.post(
    "/postulaciones/{postulacion_id}/calcular",
    response_model=ResultadoRankingRespuesta,
    status_code=status.HTTP_201_CREATED,
)
def calcular_ranking_postulacion(
    postulacion_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(
        requerir_roles("RECLUTADOR", "ADMINISTRADOR")
    ),
):
    postulacion = db.get(Postulacion, postulacion_id)

    if postulacion is None:
        raise HTTPException(
            status_code=404,
            detail="La postulación no existe.",
        )

    candidato_id = postulacion.candidato_id
    vacante_id = postulacion.vacante_id

    indicadores = {
        "experiencia": calcular_indicador_experiencia(
            db, candidato_id, vacante_id
        ),
        "habilidades": calcular_compatibilidad_habilidades(
            db, candidato_id, vacante_id
        ),
        "formacion": calcular_indicador_formacion(
            db, candidato_id, vacante_id
        ),
        "competencias": calcular_compatibilidad_competencias(
            db, candidato_id, vacante_id
        ),
        "evaluaciones": calcular_indicador_evaluaciones(
            db, postulacion_id
        ),
    }

    pendientes = [
        nombre
        for nombre, valor in indicadores.items()
        if valor is None
    ]

    if pendientes:
        raise HTTPException(
            status_code=409,
            detail={
                "mensaje": "No se puede calcular el ranking: faltan indicadores.",
                "indicadores_pendientes": pendientes,
            },
        )

    prediccion = predecir_compatibilidad(**indicadores)

    explicacion = (
        prediccion["explicacion"]
        + " Indicadores utilizados: "
        + ", ".join(
            f"{nombre}={valor:.2f}"
            for nombre, valor in indicadores.items()
        )
        + "."
    )

    resultado = ResultadoRanking(
        postulacion_id=postulacion_id,
        puntaje=prediccion["puntaje"],
        metodo=prediccion["metodo"],
        version_modelo=prediccion["version_modelo"],
        explicacion=explicacion,
    )

    db.add(resultado)
    db.commit()
    db.refresh(resultado)

    return resultado


@router.get(
    "/postulaciones/{postulacion_id}",
    response_model=list[ResultadoRankingRespuesta],
)
def consultar_ranking_postulacion(
    postulacion_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(
        requerir_roles("RECLUTADOR", "ADMINISTRADOR")
    ),
):
    postulacion = db.get(Postulacion, postulacion_id)

    if postulacion is None:
        raise HTTPException(
            status_code=404,
            detail="La postulación no existe.",
        )

    resultados = db.scalars(
        select(ResultadoRanking)
        .where(ResultadoRanking.postulacion_id == postulacion_id)
        .order_by(
            ResultadoRanking.fecha_calculo.desc(),
            ResultadoRanking.id.desc(),
        )
    ).all()

    return resultados
