"""Catálogo y normalización única de los niveles académicos del ranking.

Los rangos son ordinales para comparar requisitos, no equivalencias oficiales
entre títulos. Ingeniería se equipara a licenciatura para esta evaluación.
"""

import unicodedata


NIVELES_ESTUDIO = {
    "Secundaria": 1,
    "Bachillerato": 2,
    "Técnico": 3,
    "Licenciatura en curso": 4,
    "Licenciatura": 5,
    "Ingeniería": 5,
    "Especialidad": 6,
    "Maestría": 7,
    "Doctorado": 8,
}


def normalizar_nivel(texto: str) -> str:
    """Ignora acentos, mayúsculas y espacios al comparar nombres."""
    minusculas = unicodedata.normalize("NFKD", texto.casefold())
    sin_acentos = "".join(
        caracter for caracter in minusculas
        if not unicodedata.combining(caracter)
    )
    return " ".join(sin_acentos.split())


NIVELES_NORMALIZADOS = {
    normalizar_nivel(nombre): (nombre, rango)
    for nombre, rango in NIVELES_ESTUDIO.items()
}


def nombre_nivel_canonico(texto: str | None) -> str | None:
    """Devuelve la escritura oficial del catálogo o None si no existe."""
    if texto is None or not texto.strip():
        return None
    resultado = NIVELES_NORMALIZADOS.get(normalizar_nivel(texto))
    return resultado[0] if resultado else None


def rango_nivel(texto: str | None) -> int | None:
    """Reconoce tanto valores nuevos como niveles guardados anteriormente."""
    if texto is None or not texto.strip():
        return None
    resultado = NIVELES_NORMALIZADOS.get(normalizar_nivel(texto))
    return resultado[1] if resultado else None


def validar_nivel_estudios(texto: str | None) -> str | None:
    """Valida los datos nuevos; None/vacío significa requisito opcional."""
    if texto is None or not texto.strip():
        return None
    nombre = nombre_nivel_canonico(texto)
    if nombre is None:
        raise ValueError(
            "Nivel de estudios no reconocido. Selecciona un nivel del catálogo."
        )
    return nombre
