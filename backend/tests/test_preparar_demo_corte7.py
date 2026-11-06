"""Datos de demostración: tests aislados con SQLite en memoria."""

import pytest
from sqlalchemy import create_engine, select, func
from sqlalchemy.orm import Session

import app.models  # noqa: F401 - todas las tablas para relaciones
from app.core.database import Base
from app.models.candidato import Candidato
from app.models.documento import Documento
from app.models.evaluacion import Evaluacion
from app.models.postulacion import Postulacion
from app.models.usuario import Usuario
from app.models.vacante import Vacante
from app.services.indicadores_ranking_service import (
    calcular_indicador_experiencia,
    calcular_compatibilidad_habilidades,
    calcular_indicador_formacion,
    calcular_compatibilidad_competencias,
    calcular_indicador_evaluaciones,
)
from scripts.preparar_demo_corte7 import preparar_datos, pdf_ficticio, comprobar_base_demo


@pytest.fixture
def db():
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)
    try:
        with Session(engine, autoflush=False) as session:
            yield session
    finally:
        engine.dispose()


def test_demo_es_repetible_y_3_candidatos_completos(db, tmp_path):
    v1, posts1, docs1 = preparar_datos(db, "hash-de-prueba", tmp_path)
    db.commit()
    v2, posts2, docs2 = preparar_datos(db, "hash-de-prueba", tmp_path)
    db.commit()
    assert v1.id == v2.id
    assert [p.id for p in posts1] == [p.id for p in posts2]
    assert db.scalar(select(func.count()).select_from(Usuario)) == 5
    assert db.scalar(select(func.count()).select_from(Candidato)) == 3
    assert db.scalar(select(func.count()).select_from(Vacante)) == 1
    assert db.scalar(select(func.count()).select_from(Postulacion)) == 3
    assert db.scalar(select(func.count()).select_from(Evaluacion)) == 3
    assert db.scalar(select(func.count()).select_from(Documento)) == 3
    for post in posts2:
        indicadores = (
            calcular_indicador_experiencia(db, post.candidato_id, v2.id),
            calcular_compatibilidad_habilidades(db, post.candidato_id, v2.id),
            calcular_indicador_formacion(db, post.candidato_id, v2.id),
            calcular_compatibilidad_competencias(db, post.candidato_id, v2.id),
            calcular_indicador_evaluaciones(db, post.id),
        )
        assert all(valor is not None for valor in indicadores), indicadores
    assert len({d.ruta_archivo for d, _, _ in docs1}) == 3


def test_guardia_rechaza_base_no_postgresql(db):
    with pytest.raises(RuntimeError, match="solo permite PostgreSQL"):
        comprobar_base_demo(db)


def test_pdf_demo_tiene_estructura_valida():
    datos = pdf_ficticio("Ana")
    assert datos.startswith(b"%PDF-1.4")
    assert b"%%EOF" in datos
    assert b"Candidato: Ana" in datos
