from types import SimpleNamespace

from app.services.indicadores_ranking_service import calcular_compatibilidad


def test_habilidad_cumple_nivel_requerido():
    requisitos = [
        SimpleNamespace(habilidad_id=1, nivel_requerido=3)
    ]
    niveles = {1: 5}

    resultado = calcular_compatibilidad(
        requisitos, niveles, "habilidad_id"
    )

    assert resultado == 100.0


def test_habilidad_con_nivel_insuficiente():
    requisitos = [
        SimpleNamespace(habilidad_id=1, nivel_requerido=4)
    ]
    niveles = {1: 2}

    resultado = calcular_compatibilidad(
        requisitos, niveles, "habilidad_id"
    )

    assert resultado == 50.0


def test_habilidad_sin_registrar():
    requisitos = [
        SimpleNamespace(habilidad_id=4, nivel_requerido=3)
    ]
    niveles = {}

    resultado = calcular_compatibilidad(
        requisitos, niveles, "habilidad_id"
    )

    assert resultado is None


def test_competencia_cumple_nivel_requerido():
    requisitos = [
        SimpleNamespace(competencia_id=2, nivel_requerido=3)
    ]
    niveles = {2: 4}

    resultado = calcular_compatibilidad(
        requisitos, niveles, "competencia_id"
    )

    assert resultado == 100.0


def test_sin_requisitos_definidos():
    resultado = calcular_compatibilidad(
        [], {1: 5}, "habilidad_id"
    )

    assert resultado is None


def test_varias_habilidades():
    requisitos = [
        SimpleNamespace(habilidad_id=1, nivel_requerido=4),
        SimpleNamespace(habilidad_id=2, nivel_requerido=4),
    ]
    niveles = {1: 4, 2: 2}

    resultado = calcular_compatibilidad(
        requisitos, niveles, "habilidad_id"
    )

    assert resultado == 75.0
