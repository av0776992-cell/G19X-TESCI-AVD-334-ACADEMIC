"""Pruebas unitarias del inicio de sesión, sin conexión a la BD."""

from types import SimpleNamespace
from unittest.mock import Mock

import pytest
from fastapi import HTTPException

from app.routers import auth as auth_router
from app.schemas.login import LoginRequest
from app.services import usuario_service


def test_login_devuelve_token_y_rol(monkeypatch):
    usuario = SimpleNamespace(id=7, rol_id=2)
    db = Mock()
    db.get.return_value = SimpleNamespace(nombre="RECLUTADOR")
    monkeypatch.setattr(
        auth_router, "autenticar_usuario", lambda _db, _datos: (usuario, "token-ficticio")
    )

    respuesta = auth_router.iniciar_sesion(
        LoginRequest(correo="prueba@example.com", password="clave-ficticia"), db
    )

    assert respuesta.access_token == "token-ficticio"
    assert respuesta.token_type == "bearer"
    assert respuesta.usuario_id == 7
    assert respuesta.rol == "RECLUTADOR"
    db.get.assert_called_once()


def test_login_rechaza_credenciales_incorrectas(monkeypatch):
    def rechazar(_db, _datos):
        raise ValueError("Correo o contraseña incorrectos")

    monkeypatch.setattr(auth_router, "autenticar_usuario", rechazar)

    with pytest.raises(HTTPException) as error:
        auth_router.iniciar_sesion(
            LoginRequest(correo="prueba@example.com", password="clave-incorrecta"),
            Mock(),
        )

    assert error.value.status_code == 401
    assert error.value.headers["WWW-Authenticate"] == "Bearer"


def test_servicio_valida_password_correcto(monkeypatch):
    usuario = SimpleNamespace(
        id=7,
        rol_id=1,
        correo="prueba@example.com",
        password_hash="hash-ficticio",
        activo=True,
    )
    rol = SimpleNamespace(nombre="CANDIDATO")
    db = Mock()
    db.scalar.side_effect = [usuario, rol]
    monkeypatch.setattr(
        usuario_service, "verificar_password",
        lambda password, guardado: password == "clave-correcta" and guardado == "hash-ficticio",
    )
    monkeypatch.setattr(
        usuario_service, "crear_token_acceso",
        lambda usuario_id, nombre_rol: f"token-{usuario_id}-{nombre_rol}",
    )

    autenticado, token = usuario_service.autenticar_usuario(
        db, LoginRequest(correo="PRUEBA@example.com", password="clave-correcta")
    )

    assert autenticado is usuario
    assert token == "token-7-CANDIDATO"
    assert db.scalar.call_count == 2


def test_servicio_rechaza_password_incorrecto(monkeypatch):
    usuario = SimpleNamespace(
        id=7,
        rol_id=1,
        correo="prueba@example.com",
        password_hash="hash-ficticio",
        activo=True,
    )
    db = Mock()
    db.scalar.return_value = usuario
    monkeypatch.setattr(usuario_service, "verificar_password", lambda *_: False)

    with pytest.raises(ValueError, match="Correo o contraseña incorrectos"):
        usuario_service.autenticar_usuario(
            db, LoginRequest(correo="prueba@example.com", password="clave-incorrecta")
        )

    assert db.scalar.call_count == 1
