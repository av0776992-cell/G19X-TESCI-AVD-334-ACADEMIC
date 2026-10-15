
from pathlib import Path
import json

import joblib
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split


# Carpeta donde se guardará el modelo entrenado
CARPETA_MODELOS = Path(__file__).resolve().parent / "models"
CARPETA_MODELOS.mkdir(parents=True, exist_ok=True)

RUTA_MODELO = CARPETA_MODELOS / "ranking_modelo.joblib"
RUTA_METADATOS = CARPETA_MODELOS / "ranking_modelo.json"

# Variables del sistema, normalizadas de 0 a 100
VARIABLES = [
    "experiencia",
    "habilidades",
    "formacion",
    "competencias",
    "evaluaciones",
]

# Pesos iniciales definidos para el MVP
PESOS = np.array([0.25, 0.30, 0.15, 0.15, 0.15])

SEMILLA = 42
VERSION = "prototipo-sintetico-v1"


def generar_datos_sinteticos(cantidad=5000):
    """
    Genera perfiles ficticios para comprobar
    el funcionamiento del entrenamiento.

    IMPORTANTE:
    Las etiquetas se calculan mediante reglas.
    No representan resultados reales de contratación.
    """
    generador = np.random.default_rng(SEMILLA)

    caracteristicas = generador.integers(
        low=0,
        high=101,
        size=(cantidad, len(VARIABLES)),
    ).astype(float)

    # Etiquetas creadas a partir de las reglas del MVP
    puntajes = caracteristicas @ PESOS

    return caracteristicas, puntajes


def entrenar():
    print("Preparando datos sintéticos...")

    X, y = generar_datos_sinteticos()

    X_entrenamiento, X_prueba, y_entrenamiento, y_prueba = (
        train_test_split(
            X,
            y,
            test_size=0.20,
            random_state=SEMILLA,
        )
    )

    print("Entrenando Random Forest...")

    modelo = RandomForestRegressor(
        n_estimators=150,
        max_depth=12,
        min_samples_leaf=3,
        random_state=SEMILLA,
        n_jobs=-1,
    )

    modelo.fit(X_entrenamiento, y_entrenamiento)

    predicciones = np.clip(
        modelo.predict(X_prueba),
        0,
        100,
    )

    mae = mean_absolute_error(y_prueba, predicciones)
    r2 = r2_score(y_prueba, predicciones)

    joblib.dump(modelo, RUTA_MODELO)

    metadatos = {
        "version": VERSION,
        "algoritmo": "RandomForestRegressor",
        "variables": VARIABLES,
        "origen_datos": "sinteticos",
        "cantidad_registros": len(X),
        "mae_sintetico": round(float(mae), 4),
        "r2_sintetico": round(float(r2), 4),
        "advertencia": (
            "Modelo experimental entrenado con etiquetas "
            "generadas por reglas. No validado para "
            "predecir resultados reales de contratación."
        ),
    }

    RUTA_METADATOS.write_text(
        json.dumps(metadatos, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print("\nEntrenamiento finalizado.")
    print(f"Registros sintéticos: {len(X)}")
    print(f"Error absoluto medio (MAE): {mae:.4f}")
    print(f"Coeficiente R2: {r2:.4f}")
    print(f"Modelo guardado en: {RUTA_MODELO}")
    print(f"Metadatos guardados en: {RUTA_METADATOS}")

    ejemplo = np.array([[80, 90, 75, 85, 80]])
    resultado = float(np.clip(modelo.predict(ejemplo)[0], 0, 100))

    print(f"\nPredicción de ejemplo: {resultado:.2f}/100")


if __name__ == "__main__":
    entrenar()
