"""Pruebas del servicio predictivo sin entrenar ni cargar modelos reales."""

import pytest

from app.services import ranking_ml_service


INDICADORES = {
    "experiencia": 80.0,
    "habilidades": 90.0,
    "formacion": 75.0,
    "competencias": 85.0,
    "evaluaciones": 80.0,
}


def test_sin_archivo_modelo_informa_que_falta(monkeypatch, tmp_path):
    ruta_inexistente = tmp_path / "ranking_modelo_inexistente.joblib"
    # Evita reutilizar un modelo que el proceso haya cargado antes.
    ranking_ml_service.cargar_modelo.cache_clear()
    monkeypatch.setattr(ranking_ml_service, "RUTA_MODELO", ruta_inexistente)

    try:
        with pytest.raises(FileNotFoundError, match="No se encontró el modelo de IA") as error:
            ranking_ml_service.predecir_compatibilidad(**INDICADORES)
        assert str(ruta_inexistente) in str(error.value)
    finally:
        ranking_ml_service.cargar_modelo.cache_clear()


@pytest.mark.parametrize("valor", [-1.0, 101.0, float("nan")])
def test_rechaza_indicadores_invalidos_sin_cargar_modelo(monkeypatch, valor):
    def no_debe_cargar():
        raise AssertionError("No debe cargar el modelo con datos inválidos")

    monkeypatch.setattr(ranking_ml_service, "cargar_modelo", no_debe_cargar)

    with pytest.raises(ValueError, match="entre 0 y 100"):
        ranking_ml_service.predecir_compatibilidad(
            **{**INDICADORES, "experiencia": valor}
        )
