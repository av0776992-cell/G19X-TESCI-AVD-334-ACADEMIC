
from functools import lru_cache
from pathlib import Path

import joblib
import numpy as np


# Ubicación del modelo entrenado
RAIZ_PROYECTO = Path(__file__).resolve().parents[3]

RUTA_MODELO = (
    RAIZ_PROYECTO
    / "ml"
    / "models"
    / "ranking_modelo.joblib"
)

VERSION_MODELO = "prototipo-sintetico-v1"

VARIABLES = [
    "experiencia",
    "habilidades",
    "formacion",
    "competencias",
    "evaluaciones",
]


@lru_cache(maxsize=1)
def cargar_modelo():
    """
    Carga el modelo entrenado una sola vez.

    El archivo debe haber sido generado
    previamente por nuestro entrenamiento.
    """
    if not RUTA_MODELO.is_file():
        raise FileNotFoundError(
            f"No se encontró el modelo de IA: {RUTA_MODELO}"
        )

    return joblib.load(RUTA_MODELO)


def predecir_compatibilidad(
    experiencia: float,
    habilidades: float,
    formacion: float,
    competencias: float,
    evaluaciones: float,
) -> dict:
    """
    Recibe cinco indicadores de 0 a 100
    y genera una predicción experimental.
    """

    valores = [
        experiencia,
        habilidades,
        formacion,
        competencias,
        evaluaciones,
    ]

    if any(
        not np.isfinite(valor) or valor < 0 or valor > 100
        for valor in valores
    ):
        raise ValueError(
            "Todos los indicadores deben estar entre 0 y 100"
        )

    modelo = cargar_modelo()

    datos = np.array([valores], dtype=float)

    prediccion = float(modelo.predict(datos)[0])

    puntaje = round(
        float(np.clip(prediccion, 0, 100)),
        2,
    )

    return {
        "puntaje": puntaje,
        "metodo": "random_forest",
        "version_modelo": VERSION_MODELO,
        "indicadores": dict(zip(VARIABLES, valores)),
        "explicacion": (
            "Puntuación experimental generada mediante "
            "Random Forest entrenado con datos sintéticos "
            "etiquetados por reglas. No representa una "
            "predicción validada del desempeño laboral."
        ),
    }
