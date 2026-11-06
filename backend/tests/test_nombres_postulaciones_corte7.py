"""Nombres en paneles del personal: SQLite aislado, sin PostgreSQL."""

from datetime import datetime, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.core.database import Base
import app.models  # noqa: F401  asegura el registro de todas las tablas
from app.models.candidato import Candidato
from app.models.postulacion import Postulacion
from app.models.rol import Rol
from app.models.usuario import Usuario
from app.models.vacante import Vacante
from app.routers.administradores import listar_postulaciones, revisar_postulacion
from app.routers.reclutadores import listar_postulaciones_recibidas
from app.schemas.postulacion import PostulacionPersonalRespuesta


@pytest.fixture
def datos_ejemplo():
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        rol = Rol(nombre="CANDIDATO")
        db.add(rol)
        db.flush()
        persona = Usuario(
            nombre="Ana López",
            correo="ana.corte7@example.com",
            password_hash="no-es-una-contraseña-real",
            rol_id=rol.id,
        )
        vacante = Vacante(titulo="Analista de Datos", descripcion="Prueba sin datos reales")
        db.add_all([persona, vacante])
        db.flush()
        candidato = Candidato(usuario_id=persona.id)
        db.add(candidato)
        db.flush()
        postulacion = Postulacion(candidato_id=candidato.id, vacante_id=vacante.id)
        db.add(postulacion)
        db.commit()
        yield db, postulacion.id, candidato.id, vacante.id
    engine.dispose()


def test_lista_administrador_muestra_nombres_sin_ocultar_ids(datos_ejemplo):
    db, id_postulacion, id_candidato, id_vacante = datos_ejemplo
    datos = listar_postulaciones(usuario_actual=object(), db=db)
    assert datos == [{
        "id": id_postulacion,
        "candidato_id": id_candidato,
        "vacante_id": id_vacante,
        "fecha_postulacion": datos[0]["fecha_postulacion"],
        "nombre_candidato": "Ana López",
        "titulo_vacante": "Analista de Datos",
    }]


def test_lista_reclutador_valida_con_esquema(datos_ejemplo):
    db, _, _, _ = datos_ejemplo
    datos = listar_postulaciones_recibidas(usuario_actual=object(), db=db)
    respuesta = PostulacionPersonalRespuesta.model_validate(datos[0])
    assert respuesta.nombre_candidato == "Ana López"
    assert respuesta.titulo_vacante == "Analista de Datos"


def test_revision_administrador_devuelve_nombre_y_titulo(datos_ejemplo):
    db, id_postulacion, _, _ = datos_ejemplo
    datos = revisar_postulacion(
        postulacion_id=id_postulacion, usuario_actual=object(), db=db
    )
    assert datos["nombre_candidato"] == "Ana López"
    assert datos["titulo_vacante"] == "Analista de Datos"
    assert datos["postulacion_id"] == id_postulacion
    assert datos["ranking"] is None
