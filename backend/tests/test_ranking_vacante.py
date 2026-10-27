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


def test_catalogo_de_ranking_incluye_cerradas_y_titulos_duplicados(sesion_ranking_vacante):
    from app.routers.ranking import listar_vacantes_para_ranking

    db, vacante_id, _ = sesion_ranking_vacante
    cerrada = db.get(Vacante, vacante_id)
    cerrada.estado = "CERRADA"
    duplicada = Vacante(titulo=cerrada.titulo, descripcion="Sin postulaciones")
    db.add(duplicada)
    db.commit()

    catalogo = listar_vacantes_para_ranking(db=db, usuario_actual=SimpleNamespace())
    ids = [vacante.id for vacante in catalogo]
    assert vacante_id in ids
    assert duplicada.id in ids
    assert [v.id for v in catalogo if v.titulo == cerrada.titulo] == [vacante_id, duplicada.id]
    assert next(v for v in catalogo if v.id == vacante_id).estado == "CERRADA"
    assert [v.titulo for v in catalogo] == sorted(v.titulo for v in catalogo)


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


def test_calculo_masivo_continua_ante_indicadores_pendientes(
    sesion_ranking_vacante, monkeypatch
):
    """SQLite temporal: los incompletos no bloquean cálculos válidos."""
    from sqlalchemy import func, select
    from app.routers import ranking as rutas

    db, vacante_id, ids = sesion_ranking_vacante
    total_antes = db.scalar(select(func.count()).select_from(ResultadoRanking))
    pendientes_id = db.get(Postulacion, ids[1]).candidato_id

    monkeypatch.setattr(rutas, "calcular_indicador_experiencia", lambda *_: 80.0)
    monkeypatch.setattr(rutas, "calcular_compatibilidad_habilidades",
                        lambda _db, candidato, _vacante: None if candidato == pendientes_id else 90.0)
    monkeypatch.setattr(rutas, "calcular_indicador_formacion", lambda *_: 75.0)
    monkeypatch.setattr(rutas, "calcular_compatibilidad_competencias", lambda *_: 85.0)
    monkeypatch.setattr(rutas, "calcular_indicador_evaluaciones", lambda *_: 80.0)
    monkeypatch.setattr(rutas, "predecir_compatibilidad", lambda **_: {
        "puntaje": 83.5,
        "metodo": "random_forest",
        "version_modelo": "prueba",
        "explicacion": "Predicción simulada para prueba.",
    })

    respuesta = rutas.calcular_ranking_vacante(
        vacante_id, db=db, usuario_actual=SimpleNamespace()
    )
    assert respuesta["total_postulaciones"] == 3
    assert (respuesta["calculadas"], respuesta["pendientes"], respuesta["errores"]) == (2, 1, 0)
    assert [fila["postulacion_id"] for fila in respuesta["resultados"]] == ids[:3]
    assert [fila["estado"] for fila in respuesta["resultados"]] == [
        "calculado", "pendiente", "calculado"
    ]
    assert respuesta["resultados"][1]["indicadores_pendientes"] == ["habilidades"]
    assert db.scalar(select(func.count()).select_from(ResultadoRanking)) == total_antes + 2
    # La postulación incompleta mantiene su puntaje anterior; no se insertó otro.
    assert db.scalar(select(func.count()).select_from(ResultadoRanking)
                     .where(ResultadoRanking.postulacion_id == ids[1])) == 1
    # Otra vacante queda intacta.
    assert db.scalar(select(func.count()).select_from(ResultadoRanking)
                     .where(ResultadoRanking.postulacion_id == ids[3])) == 1


def test_calculo_masivo_vacante_inexistente_devuelve_404(sesion_ranking_vacante):
    from app.routers.ranking import calcular_ranking_vacante

    db, _, _ = sesion_ranking_vacante
    with pytest.raises(HTTPException) as error:
        calcular_ranking_vacante(99999, db=db, usuario_actual=SimpleNamespace())
    assert error.value.status_code == 404


def test_calculo_masivo_sin_postulaciones(sesion_ranking_vacante):
    from app.routers.ranking import calcular_ranking_vacante

    db, _, _ = sesion_ranking_vacante
    vacante = Vacante(titulo="Vacante sin candidaturas", descripcion="Sin postulaciones")
    db.add(vacante)
    db.commit()
    respuesta = calcular_ranking_vacante(vacante.id, db=db, usuario_actual=SimpleNamespace())
    assert respuesta["total_postulaciones"] == 0
    assert respuesta["resultados"] == []


def test_calculo_masivo_error_no_bloquea_resto(sesion_ranking_vacante, monkeypatch):
    from sqlalchemy import func, select
    from app.routers import ranking as rutas

    db, vacante_id, ids = sesion_ranking_vacante
    total_antes = db.scalar(select(func.count()).select_from(ResultadoRanking))

    def simular_calculo(db_sesion, postulacion):
        if postulacion.id == ids[1]:
            raise RuntimeError("Error de prueba, no debe exponerse al cliente")
        registro = ResultadoRanking(postulacion_id=postulacion.id, puntaje=65,
                                    metodo="prueba", version_modelo="test")
        db_sesion.add(registro)
        db_sesion.commit()
        db_sesion.refresh(registro)
        return registro

    monkeypatch.setattr(rutas, "_calcular_y_guardar_postulacion", simular_calculo)
    respuesta = rutas.calcular_ranking_vacante(vacante_id, db=db,
                                               usuario_actual=SimpleNamespace())
    assert respuesta["calculadas"] == 2
    assert respuesta["errores"] == 1
    assert respuesta["pendientes"] == 0
    assert respuesta["resultados"][1]["estado"] == "error"
    assert "Error de prueba" not in respuesta["resultados"][1]["mensaje"]
    assert db.scalar(select(func.count()).select_from(ResultadoRanking)) == total_antes + 2
