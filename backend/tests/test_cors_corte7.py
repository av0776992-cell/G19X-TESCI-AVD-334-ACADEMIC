"""CORS configurable y preflight del navegador, sin conexión a PostgreSQL."""

import asyncio

import pytest

from app.core.cors import ORIGENES_DESARROLLO, obtener_origenes_cors
from main import app


async def _preflight(origen: str):
    """Realiza una petición OPTIONS al middleware ASGI real."""
    cabeceras = [
        (b"origin", origen.encode("ascii")),
        (b"access-control-request-method", b"POST"),
        (b"access-control-request-headers", b"authorization,content-type"),
    ]
    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": "OPTIONS",
        "scheme": "http",
        "path": "/api/v1/ranking/predecir",
        "raw_path": b"/api/v1/ranking/predecir",
        "root_path": "",
        "query_string": b"",
        "headers": cabeceras,
        "client": ("127.0.0.1", 12345),
        "server": ("testserver", 80),
    }
    respuesta = {"estado": None, "cabeceras": {}}

    async def recibir():
        return {"type": "http.request", "body": b"", "more_body": False}

    async def enviar(mensaje):
        if mensaje["type"] == "http.response.start":
            respuesta["estado"] = mensaje["status"]
            respuesta["cabeceras"] = {
                clave.decode("latin1").lower(): valor.decode("latin1")
                for clave, valor in mensaje.get("headers", [])
            }

    await app(scope, recibir, enviar)
    return respuesta


def test_origenes_por_defecto_sin_variable(monkeypatch):
    monkeypatch.delenv("CORS_ORIGINS", raising=False)
    assert obtener_origenes_cors() == list(ORIGENES_DESARROLLO)


def test_lee_origenes_desde_variable_entorno(monkeypatch):
    monkeypatch.setenv(
        "CORS_ORIGINS", " https://frontend.example.com , http://localhost:5175 "
    )
    assert obtener_origenes_cors() == [
        "https://frontend.example.com",
        "http://localhost:5175",
    ]


def test_elimina_duplicados():
    assert obtener_origenes_cors("http://localhost:5173, http://localhost:5173") == [
        "http://localhost:5173"
    ]


@pytest.mark.parametrize(
    "valor",
    [
        "",
        "*",
        "http://localhost:5173,",
        "ftp://example.com",
        "localhost:5173",
        "http://localhost:abc",
        "http://localhost:99999",
        "http://localhost:5173/ruta",
        "http://localhost:5173?clave=1",
        "http://usuario:clave@localhost:5173",
    ],
)
def test_no_acepta_origenes_invalidos(valor):
    with pytest.raises(ValueError, match="CORS_ORIGINS|Origen CORS inválido"):
        obtener_origenes_cors(valor)


@pytest.mark.parametrize("origen", ORIGENES_DESARROLLO)
def test_preflight_acepta_los_origenes_actuales(origen):
    respuesta = asyncio.run(_preflight(origen))
    assert respuesta["estado"] == 200
    assert respuesta["cabeceras"]["access-control-allow-origin"] == origen
    assert "authorization" in respuesta["cabeceras"]["access-control-allow-headers"].lower()


def test_preflight_rechaza_origen_no_autorizado():
    respuesta = asyncio.run(_preflight("http://sitio-desconocido.example.com"))
    assert respuesta["estado"] == 400
    assert "access-control-allow-origin" not in respuesta["cabeceras"]
