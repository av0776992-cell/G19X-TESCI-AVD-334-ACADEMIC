
from datetime import date
from calendar import monthrange

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.candidato_habilidad import CandidatoHabilidad
from app.models.vacante_habilidad import VacanteHabilidad
from app.models.candidato_competencia import CandidatoCompetencia
from app.models.vacante_competencia import VacanteCompetencia
from app.models.evaluacion import Evaluacion
from app.models.experiencia import Experiencia
from app.models.formacion import Formacion
from app.models.vacante import Vacante


def calcular_compatibilidad(
    requisitos,
    niveles_candidato: dict[int, int | None],
    campo_identificador: str,
) -> float | None:
    if not requisitos:
        return None

    compatibilidades = []

    for requisito in requisitos:
        identificador = getattr(requisito, campo_identificador)
        nivel_requerido = requisito.nivel_requerido
        nivel_candidato = niveles_candidato.get(identificador)

        if nivel_requerido is None or nivel_candidato is None:
            return None

        if nivel_requerido <= 0 or nivel_candidato < 0:
            return None

        compatibilidades.append(
            min(nivel_candidato / nivel_requerido, 1.0) * 100
        )

    return round(sum(compatibilidades) / len(compatibilidades), 2)


def calcular_compatibilidad_habilidades(
    db: Session,
    candidato_id: int,
    vacante_id: int,
) -> float | None:
    requisitos = db.scalars(
        select(VacanteHabilidad).where(
            VacanteHabilidad.vacante_id == vacante_id
        )
    ).all()

    habilidades = db.scalars(
        select(CandidatoHabilidad).where(
            CandidatoHabilidad.candidato_id == candidato_id
        )
    ).all()

    niveles = {
        habilidad.habilidad_id: habilidad.nivel
        for habilidad in habilidades
    }

    return calcular_compatibilidad(
        requisitos, niveles, "habilidad_id"
    )


def calcular_compatibilidad_competencias(
    db: Session,
    candidato_id: int,
    vacante_id: int,
) -> float | None:
    requisitos = db.scalars(
        select(VacanteCompetencia).where(
            VacanteCompetencia.vacante_id == vacante_id
        )
    ).all()

    competencias = db.scalars(
        select(CandidatoCompetencia).where(
            CandidatoCompetencia.candidato_id == candidato_id
        )
    ).all()

    niveles = {
        competencia.competencia_id: competencia.nivel
        for competencia in competencias
    }

    return calcular_compatibilidad(
        requisitos, niveles, "competencia_id"
    )


def calcular_indicador_evaluaciones(
    db: Session,
    postulacion_id: int,
) -> float | None:
    evaluaciones = db.scalars(
        select(Evaluacion).where(
            Evaluacion.postulacion_id == postulacion_id
        )
    ).all()

    puntuaciones = [
        evaluacion.puntuacion
        for evaluacion in evaluaciones
        if evaluacion.puntuacion is not None
        and 0 <= evaluacion.puntuacion <= 100
    ]

    if not puntuaciones:
        return None

    return round(sum(puntuaciones) / len(puntuaciones), 2)


def calcular_indicador_experiencia(
    db: Session,
    candidato_id: int,
    vacante_id: int,
) -> float | None:
    vacante = db.get(Vacante, vacante_id)

    if vacante is None:
        return None

    meses_requeridos = vacante.experiencia_minima_meses

    if meses_requeridos is None or meses_requeridos < 0:
        return None

    if meses_requeridos == 0:
        return 100.0

    experiencias = db.scalars(
        select(Experiencia).where(
            Experiencia.candidato_id == candidato_id
        )
    ).all()

    if not experiencias:
        return None

    periodos = []
    hoy = date.today()

    for experiencia in experiencias:
        inicio = experiencia.fecha_inicio
        fin = experiencia.fecha_fin or hoy

        if inicio is None or fin < inicio or inicio > hoy:
            return None

        fin = min(fin, hoy)
        periodos.append((inicio, fin))

    periodos.sort()
    combinados = []

    for inicio, fin in periodos:
        if not combinados:
            combinados.append([inicio, fin])
        elif inicio <= date.fromordinal(
            combinados[-1][1].toordinal() + 1
        ):
            combinados[-1][1] = max(combinados[-1][1], fin)
        else:
            combinados.append([inicio, fin])

    dias_totales = sum(
        (fin - inicio).days + 1
        for inicio, fin in combinados
    )

    # Aproximación de meses a partir de días naturales.
    meses_trabajados = dias_totales / (365.2425 / 12)

    return round(
        min(meses_trabajados / meses_requeridos, 1.0) * 100,
        2,
    )


def calcular_indicador_formacion(
    db: Session,
    candidato_id: int,
    vacante_id: int,
) -> float | None:
    vacante = db.get(Vacante, vacante_id)

    if vacante is None or not vacante.nivel_estudios_requerido:
        return None

    formaciones = db.scalars(
        select(Formacion).where(
            Formacion.candidato_id == candidato_id
        )
    ).all()

    if not formaciones:
        return None

    niveles = {
        "secundaria": 1,
        "bachillerato": 2,
        "tecnico": 3,
        "licenciatura en curso": 4,
        "licenciatura": 5,
        "maestria": 6,
        "doctorado": 7,
    }

    requerido = vacante.nivel_estudios_requerido.strip().casefold()
    nivel_requerido = niveles.get(requerido)

    if nivel_requerido is None:
        return None

    niveles_candidato = [
        niveles.get(formacion.nivel.strip().casefold())
        for formacion in formaciones
        if formacion.nivel
    ]

    niveles_validos = [
        nivel for nivel in niveles_candidato
        if nivel is not None
    ]

    if not niveles_validos:
        return None

    mejor_nivel = max(niveles_validos)

    return round(
        min(mejor_nivel / nivel_requerido, 1.0) * 100,
        2,
    )
