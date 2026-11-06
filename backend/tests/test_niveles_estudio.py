"""Regresión de niveles académicos: no utiliza PostgreSQL ni escribe datos."""

from types import SimpleNamespace

import pytest
from pydantic import ValidationError

from app.core.niveles_estudio import (
    NIVELES_ESTUDIO,
    nombre_nivel_canonico,
    normalizar_nivel,
    rango_nivel,
)
from app.schemas.formacion import FormacionActualizar, FormacionCrear
from app.schemas.vacante import VacanteActualizar, VacanteCrear
from app.services.indicadores_ranking_service import calcular_indicador_formacion


class SesionFicticia:
    """Consulta simulada; construye la sentencia SQLAlchemy sin conectar a DB."""

    def __init__(self, requerido, niveles):
        self.vacante = SimpleNamespace(nivel_estudios_requerido=requerido)
        self.formaciones = [SimpleNamespace(nivel=nivel) for nivel in niveles]

    def get(self, modelo, identificador):
        return self.vacante

    def scalars(self, consulta):
        return SimpleNamespace(all=lambda: self.formaciones)


@pytest.mark.parametrize("texto, canonico", [
    (" Maestría  ", "Maestría"),
    (" MAESTRIA ", "Maestría"),
    ("ingenieria", "Ingeniería"),
    ("INGENIERÍA", "Ingeniería"),
    ("Técnico", "Técnico"),
    ("tecnico", "Técnico"),
    ("  Licenciatura  en   CURSO", "Licenciatura en curso"),
    ("ESPECIALIDAD", "Especialidad"),
])
def test_normalizar_y_recuperar_nivel(texto, canonico):
    assert nombre_nivel_canonico(texto) == canonico
    assert rango_nivel(texto) == NIVELES_ESTUDIO[canonico]


def test_ingenieria_equivale_a_licenciatura():
    assert rango_nivel("Ingeniería") == rango_nivel("Licenciatura")


@pytest.mark.parametrize("requerido, candidato", [
    ("Licenciatura", "Ingeniería"),
    ("licenciatura", "MAESTRÍA"),
    ("Técnico", "TECNICO"),
    ("Maestría", "maestria"),
    ("Especialidad", "Maestría"),
])
def test_formacion_aceptada_en_ranking(requerido, candidato):
    db = SesionFicticia(requerido, [candidato])
    assert calcular_indicador_formacion(db, 1, 2) == 100.0


def test_formacion_elige_el_nivel_mas_alto():
    db = SesionFicticia("Licenciatura", ["Bachillerato", "Maestría"])
    assert calcular_indicador_formacion(db, 1, 2) == 100.0


def test_formacion_no_finge_validez_para_nivel_desconocido():
    db = SesionFicticia("Licenciatura", ["Nivel inventado"])
    assert calcular_indicador_formacion(db, 1, 2) is None


def test_formacion_sin_registros_sigue_pendiente():
    db = SesionFicticia("Licenciatura", [])
    assert calcular_indicador_formacion(db, 1, 2) is None


def test_formacion_sin_requisito_es_compatible():
    db = SesionFicticia(None, [])
    assert calcular_indicador_formacion(db, 1, 2) == 100.0


def test_formacion_crear_acepta_nivel_con_acento_o_sin_acento():
    datos = FormacionCrear(
        institucion="Universidad de prueba", titulo="Maestría en informática",
        nivel=" maestria ",
    )
    assert datos.nivel == "Maestría"


def test_formacion_actualizar_normaliza_nivel():
    assert FormacionActualizar(nivel="INGENIERIA").nivel == "Ingeniería"


def test_vacante_crear_normaliza_nivel():
    datos = VacanteCrear(
        titulo="Puesto de prueba", descripcion="Vacante ficticia",
        nivel_estudios_requerido="tecnico",
    )
    assert datos.nivel_estudios_requerido == "Técnico"


def test_vacante_editar_normaliza_nivel():
    assert VacanteActualizar(nivel_estudios_requerido="MAESTRIA").nivel_estudios_requerido == "Maestría"


def test_vacante_sin_requisito_permanece_opcional():
    assert VacanteCrear(titulo="Puesto", descripcion="Descripcion", nivel_estudios_requerido="").nivel_estudios_requerido is None


@pytest.mark.parametrize("clase, campos", [
    (VacanteCrear, {"titulo": "Puesto", "descripcion": "Descripcion", "nivel_estudios_requerido": "Desconocido"}),
    (VacanteActualizar, {"nivel_estudios_requerido": "Desconocido"}),
    (FormacionCrear, {"institucion": "Universidad", "titulo": "Programa", "nivel": "Desconocido"}),
    (FormacionActualizar, {"nivel": "Desconocido"}),
])
def test_no_permitir_niveles_desconocidos_nuevos(clase, campos):
    with pytest.raises(ValidationError):
        clase(**campos)


def test_normalizacion_de_espacios_y_acentos():
    assert normalizar_nivel("  LICENCIATURA  EN    CURSO ") == "licenciatura en curso"
