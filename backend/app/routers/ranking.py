from fastapi import APIRouter, Depends, HTTPException, status
import logging
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import requerir_roles
from app.models.candidato import Candidato
from app.models.postulacion import Postulacion
from app.models.vacante import Vacante
from app.models.resultado_ranking import ResultadoRanking
from app.models.usuario import Usuario
from app.schemas.ranking import (
    RankingPrediccionEntrada,
    RankingPrediccionRespuesta,
    RankingVacanteCalculoRespuesta,
    RankingVacanteResumenRespuesta,
    RankingVacanteRespuesta,
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


logger = logging.getLogger(__name__)
router = APIRouter(
    prefix="/api/v1/ranking",
    tags=["Ranking e Inteligencia Artificial"],
)


@router.get(
    "/vacantes",
    response_model=list[RankingVacanteResumenRespuesta],
)
def listar_vacantes_para_ranking(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(
        requerir_roles("RECLUTADOR", "ADMINISTRADOR")
    ),
):
    """Catálogo de títulos para el ranking, incluidas las vacantes cerradas."""
    return db.scalars(
        select(Vacante).order_by(Vacante.titulo.asc(), Vacante.id.asc())
    ).all()


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


def _calcular_y_guardar_postulacion(db: Session, postulacion: Postulacion):
    """Comparte el cálculo individual y por vacante; guarda solo resultados completos."""
    postulacion_id = postulacion.id
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
        nombre for nombre, valor in indicadores.items() if valor is None
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
        raise HTTPException(status_code=404, detail="La postulación no existe.")
    return _calcular_y_guardar_postulacion(db, postulacion)


@router.post(
    "/vacantes/{vacante_id}/calcular",
    response_model=RankingVacanteCalculoRespuesta,
)
def calcular_ranking_vacante(
    vacante_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(
        requerir_roles("RECLUTADOR", "ADMINISTRADOR")
    ),
):
    """Calcula cada postulación por separado; las incompletas no detienen al lote."""
    vacante = db.get(Vacante, vacante_id)
    if vacante is None:
        raise HTTPException(status_code=404, detail="La vacante no existe.")

    postulaciones = db.scalars(
        select(Postulacion)
        .where(Postulacion.vacante_id == vacante_id)
        .order_by(Postulacion.id.asc())
    ).all()

    resultados = []
    calculadas = pendientes = errores = 0
    for postulacion in postulaciones:
        postulacion_id = postulacion.id
        try:
            resultado = _calcular_y_guardar_postulacion(db, postulacion)
        except HTTPException as exc:
            if exc.status_code != 409:
                raise
            db.rollback()
            pendientes += 1
            resultados.append({
                "postulacion_id": postulacion_id,
                "estado": "pendiente",
                "indicadores_pendientes": exc.detail.get(
                    "indicadores_pendientes", []
                ) if isinstance(exc.detail, dict) else [],
                "mensaje": "Faltan indicadores para calcular el ranking.",
            })
        except Exception:
            # La falla de una postulación no impide procesar las demás.
            db.rollback()
            errores += 1
            logger.exception(
                "Error al calcular el ranking de la postulación %s",
                postulacion_id,
            )
            resultados.append({
                "postulacion_id": postulacion_id,
                "estado": "error",
                "mensaje": "No se pudo calcular; revisa el registro del servidor.",
            })
        else:
            calculadas += 1
            resultados.append({
                "postulacion_id": postulacion_id,
                "estado": "calculado",
                "puntaje": resultado.puntaje,
                "resultado_id": resultado.id,
            })

    return {
        "vacante_id": vacante.id,
        "titulo_vacante": vacante.titulo,
        "total_postulaciones": len(postulaciones),
        "calculadas": calculadas,
        "pendientes": pendientes,
        "errores": errores,
        "resultados": resultados,
    }


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


@router.get(
    "/vacantes/{vacante_id}",
    response_model=RankingVacanteRespuesta,
)
def consultar_ranking_vacante(
    vacante_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(
        requerir_roles("RECLUTADOR", "ADMINISTRADOR")
    ),
):
    """Clasifica postulaciones por su último puntaje (sin recalcular ni alterar datos)."""
    vacante = db.get(Vacante, vacante_id)
    if vacante is None:
        raise HTTPException(status_code=404, detail="La vacante no existe.")

    # Para cada postulación recuperamos un único resultado, el más reciente.
    ultimo_resultado_id = (
        select(ResultadoRanking.id)
        .where(ResultadoRanking.postulacion_id == Postulacion.id)
        .order_by(
            ResultadoRanking.fecha_calculo.desc(),
            ResultadoRanking.id.desc(),
        )
        .limit(1)
        .correlate(Postulacion)
        .scalar_subquery()
    )

    filas = db.execute(
        select(
            Postulacion.id.label("postulacion_id"),
            Postulacion.candidato_id,
            Usuario.nombre.label("candidato_nombre"),
            ResultadoRanking.id.label("resultado_id"),
            ResultadoRanking.puntaje,
            ResultadoRanking.metodo,
            ResultadoRanking.fecha_calculo,
        )
        .join(Candidato, Candidato.id == Postulacion.candidato_id)
        .join(Usuario, Usuario.id == Candidato.usuario_id)
        .outerjoin(ResultadoRanking, ResultadoRanking.id == ultimo_resultado_id)
        .where(Postulacion.vacante_id == vacante_id)
        .order_by(
            ResultadoRanking.puntaje.desc().nullslast(),
            Postulacion.id.asc(),
        )
    ).mappings().all()

    return {
        "vacante_id": vacante.id,
        "titulo_vacante": vacante.titulo,
        "candidatos": [dict(fila) for fila in filas],
    }
