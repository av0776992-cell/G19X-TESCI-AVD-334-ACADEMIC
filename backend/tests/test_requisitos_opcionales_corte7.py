"""Regresión de vacantes sin requisitos. SQLite en memoria, nunca PostgreSQL."""

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session

import app.models  # noqa: F401 - registrar las tablas y sus relaciones
from app.core.database import Base
from app.models.candidato import Candidato
from app.models.evaluacion import Evaluacion
from app.models.postulacion import Postulacion
from app.models.resultado_ranking import ResultadoRanking
from app.models.rol import Rol
from app.models.usuario import Usuario
from app.models.vacante import Vacante
from app.models.vacante_habilidad import VacanteHabilidad
from app.routers import ranking as rutas
from app.services.indicadores_ranking_service import (
    calcular_indicador_experiencia,
    calcular_compatibilidad_habilidades,
    calcular_indicador_formacion,
    calcular_compatibilidad_competencias,
)


@pytest.fixture
def db_con_postulacion():
    motor = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(motor)
    try:
        with Session(motor) as db:
            rol = Rol(nombre="CANDIDATO")
            db.add(rol)
            db.flush()
            usuario = Usuario(
                nombre="Candidato ficticio", correo="candidato@example.com",
                password_hash="ficticio", rol_id=rol.id,
            )
            db.add(usuario)
            db.flush()
            candidato = Candidato(usuario_id=usuario.id)
            db.add(candidato)
            db.flush()
            vacante = Vacante(
                titulo="Vacante sin requisitos", descripcion="Prueba de regresión",
                experiencia_minima_meses=None,
                nivel_estudios_requerido=None,
            )
            db.add(vacante)
            db.flush()
            post = Postulacion(candidato_id=candidato.id, vacante_id=vacante.id)
            db.add(post)
            db.commit()
            yield db, vacante.id, candidato.id, post.id, usuario.id
    finally:
        motor.dispose()


def test_compatibilidad_sin_ningun_requisito_es_completa(db_con_postulacion):
    db, vacante, candidato, _, _ = db_con_postulacion
    assert calcular_indicador_experiencia(db, candidato, vacante) == 100.0
    assert calcular_compatibilidad_habilidades(db, candidato, vacante) == 100.0
    assert calcular_indicador_formacion(db, candidato, vacante) == 100.0
    assert calcular_compatibilidad_competencias(db, candidato, vacante) == 100.0


def test_lote_sin_requisitos_se_calcula_si_hay_evaluacion(
    db_con_postulacion, monkeypatch
):
    db, vacante, _, postulacion, usuario = db_con_postulacion
    db.add(Evaluacion(
        postulacion_id=postulacion, reclutador_id=usuario,
        tipo="Prueba", puntuacion=78,
    ))
    db.commit()
    llamadas = []

    def predecir_ficticio(**indicadores):
        llamadas.append(indicadores)
        return {
            "puntaje": 87.0, "metodo": "prueba", "version_modelo": "prueba",
            "explicacion": "Predicción simulada; no se entrenó el modelo.",
        }

    monkeypatch.setattr(rutas, "predecir_compatibilidad", predecir_ficticio)
    respuesta = rutas.calcular_ranking_vacante(vacante, db=db, usuario_actual=usuario)
    assert (respuesta["calculadas"], respuesta["pendientes"], respuesta["errores"]) == (1, 0, 0)
    assert llamadas == [{
        "experiencia": 100.0, "habilidades": 100.0, "formacion": 100.0,
        "competencias": 100.0, "evaluaciones": 78.0,
    }]
    resultado = db.scalar(select(ResultadoRanking).where(
        ResultadoRanking.postulacion_id == postulacion
    ))
    assert resultado.puntaje == 87.0
    assert "no acredita" in resultado.explicacion


def test_sin_evaluacion_sigue_pendiente_y_no_guarda_ranking(db_con_postulacion):
    db, vacante, _, postulacion, usuario = db_con_postulacion
    respuesta = rutas.calcular_ranking_vacante(vacante, db=db, usuario_actual=usuario)
    assert (respuesta["calculadas"], respuesta["pendientes"], respuesta["errores"]) == (0, 1, 0)
    assert respuesta["resultados"][0]["indicadores_pendientes"] == ["evaluaciones"]
    assert db.scalar(select(func.count()).select_from(ResultadoRanking)) == 0
    with pytest.raises(HTTPException) as error:
        rutas.calcular_ranking_postulacion(postulacion, db=db, usuario_actual=usuario)
    assert error.value.status_code == 409
    assert error.value.detail["indicadores_pendientes"] == ["evaluaciones"]


def test_con_exigencias_validas_y_perfil_vacio_sigue_pendiente(db_con_postulacion):
    db, vacante_id, candidato, _, _ = db_con_postulacion
    vacante = db.get(Vacante, vacante_id)
    vacante.experiencia_minima_meses = 12
    vacante.nivel_estudios_requerido = "Licenciatura"
    db.add(VacanteHabilidad(
        vacante_id=vacante_id, habilidad_id=42, nivel_requerido=3,
    ))
    db.commit()
    assert calcular_indicador_experiencia(db, candidato, vacante_id) is None
    assert calcular_indicador_formacion(db, candidato, vacante_id) is None
    assert calcular_compatibilidad_habilidades(db, candidato, vacante_id) is None
    # Competencias no solicitadas sí cumplen.
    assert calcular_compatibilidad_competencias(db, candidato, vacante_id) == 100.0


def test_valores_configurados_invalidos_no_se_convierten_en_cien(db_con_postulacion):
    db, vacante_id, candidato, _, _ = db_con_postulacion
    vacante = db.get(Vacante, vacante_id)
    vacante.experiencia_minima_meses = -5  # Simula datos históricos mal guardados.
    vacante.nivel_estudios_requerido = "Nivel desconocido"
    db.commit()
    assert calcular_indicador_experiencia(db, candidato, vacante_id) is None
    assert calcular_indicador_formacion(db, candidato, vacante_id) is None
