"""Ranking por vacante con SQLite temporal; no usa PostgreSQL."""

from datetime import datetime, timezone
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.models.candidato import Candidato
from app.models.postulacion import Postulacion
from app.models.resultado_ranking import ResultadoRanking
from app.models.rol import Rol
from app.models.usuario import Usuario
from app.models.vacante import Vacante
from app.routers.ranking import consultar_ranking_vacante


@pytest.fixture
def sesion_ranking_vacante():
    engine = create_engine("sqlite+pysqlite:///:memory:")
    tablas = [
        Rol.__table__, Usuario.__table__, Candidato.__table__,
        Vacante.__table__, Postulacion.__table__, ResultadoRanking.__table__,
    ]
    Rol.metadata.create_all(engine, tables=tablas)
    try:
        with Session(engine) as db:
            rol = Rol(nombre="CANDIDATO")
            db.add(rol)
            db.flush()
            usuarios = [
                Usuario(nombre=nombre, correo=f"prueba{i}@example.test",
                        password_hash="ficticio", rol_id=rol.id)
                for i, nombre in enumerate(["Ana", "Beto", "Carla", "Otro"])
            ]
            db.add_all(usuarios)
            db.flush()
            candidatos = [Candidato(usuario_id=usuario.id) for usuario in usuarios]
            db.add_all(candidatos)
            vacante = Vacante(titulo="Vacante de prueba", descripcion="Prueba de orden")
            otra_vacante = Vacante(titulo="Otra vacante", descripcion="Control")
            db.add_all([vacante, otra_vacante])
            db.flush()
            postulaciones = [
                Postulacion(candidato_id=candidatos[i].id, vacante_id=vacante.id)
                for i in range(3)
            ]
            postulaciones.append(
                Postulacion(candidato_id=candidatos[3].id, vacante_id=otra_vacante.id)
            )
            db.add_all(postulaciones)
            db.flush()
            db.add_all([
                # Aunque Ana tuvo 98 puntos anteriormente, su ÚLTIMO cálculo es 70.
                ResultadoRanking(postulacion_id=postulaciones[0].id, puntaje=98,
                                 metodo="random_forest", fecha_calculo=datetime(2026, 1, 1, tzinfo=timezone.utc)),
                ResultadoRanking(postulacion_id=postulaciones[0].id, puntaje=70,
                                 metodo="random_forest", fecha_calculo=datetime(2026, 1, 2, tzinfo=timezone.utc)),
                ResultadoRanking(postulacion_id=postulaciones[1].id, puntaje=88,
                                 metodo="random_forest", fecha_calculo=datetime(2026, 1, 3, tzinfo=timezone.utc)),
                ResultadoRanking(postulacion_id=postulaciones[3].id, puntaje=100,
                                 metodo="random_forest", fecha_calculo=datetime(2026, 1, 4, tzinfo=timezone.utc)),
            ])
            db.commit()
            yield db, vacante.id, [p.id for p in postulaciones]
    finally:
        engine.dispose()


def test_ranking_vacante_usa_ultimo_resultado_y_orden_descendente(sesion_ranking_vacante):
    db, vacante_id, ids = sesion_ranking_vacante
    respuesta = consultar_ranking_vacante(
        vacante_id, db=db, usuario_actual=SimpleNamespace()
    )
    assert respuesta["vacante_id"] == vacante_id
    filas = respuesta["candidatos"]
    assert [fila["postulacion_id"] for fila in filas] == [ids[1], ids[0], ids[2]]
    assert [fila["puntaje"] for fila in filas] == [88, 70, None]
    assert [fila["candidato_nombre"] for fila in filas] == ["Beto", "Ana", "Carla"]
    assert filas[2]["resultado_id"] is None


def test_ranking_vacante_inexistente_devuelve_404(sesion_ranking_vacante):
    db, _, _ = sesion_ranking_vacante
    with pytest.raises(HTTPException) as error:
        consultar_ranking_vacante(99999, db=db, usuario_actual=SimpleNamespace())
    assert error.value.status_code == 404
