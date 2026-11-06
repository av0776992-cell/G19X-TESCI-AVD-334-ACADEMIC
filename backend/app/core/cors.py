"""Orígenes permitidos para CORS, configurables desde el .env del backend.

No se permite el comodín '*': el frontend usa autenticación con Bearer token.
"""

import os
from pathlib import Path
from urllib.parse import urlsplit

from dotenv import load_dotenv


# El .env del backend se lee independientemente del directorio de trabajo.
load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env", override=False)

ORIGENES_DESARROLLO = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
)


def obtener_origenes_cors(valor: str | None = None) -> list[str]:
    """Obtiene orígenes HTTP(S) separados por coma, sin rutas ni comodines.

    Si CORS_ORIGINS no está definida, conserva la configuración anterior.
    Si está definida pero es inválida, detiene el inicio en lugar de abrir
    acceso a cualquier origen sin advertirlo.
    """
    if valor is None:
        valor = os.getenv("CORS_ORIGINS")

    if valor is None:
        return list(ORIGENES_DESARROLLO)

    origenes = []
    for fragmento in valor.split(","):
        origen = fragmento.strip()
        if not origen or origen == "*":
            raise ValueError(
                "CORS_ORIGINS debe incluir orígenes concretos separados por coma; "
                "no se aceptan valores vacíos ni '*'."
            )

        try:
            partes = urlsplit(origen)
            puerto = partes.port  # Valida puertos numéricos y su rango.
        except ValueError as exc:
            raise ValueError(f"Origen CORS inválido: {origen!r}") from exc

        if (
            partes.scheme not in {"http", "https"}
            or not partes.hostname
            or not partes.netloc
            or partes.username is not None
            or partes.password is not None
            or partes.path
            or partes.query
            or partes.fragment
            or any(caracter.isspace() for caracter in origen)
        ):
            raise ValueError(
                f"Origen CORS inválido: {origen!r}. "
                "Usa únicamente esquema, dominio/IP y puerto opcional."
            )

        if origen not in origenes:
            origenes.append(origen)

    return origenes
