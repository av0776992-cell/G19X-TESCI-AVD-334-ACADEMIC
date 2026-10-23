"""Pruebas HTTP del ranking con un usuario simulado, sin acceso a PostgreSQL.

Se envían peticiones ASGI directamente a FastAPI para no agregar
una dependencia externa exclusiva de pruebas (httpx).
"""

import asyncio
import json
from types import SimpleNamespace

import pytest

from app.core.database import get_db
from app.core.security import crear_token_acceso
from app.routers import ranking as ranking_router
from main import app


INDICADORES = {
    "experiencia": 80,
    "habilidades": 90,
    "formacion": 75,
    "competencias": 85,
    "evaluaciones": 80,
}


async def _peticion_asgi(metodo, ruta, token=None, datos=None):
    """Ejecuta una petición HTTP directamente contra la aplicación ASGI."""
    cuerpo = json.dumps(datos).encode("utf-8") if datos is not None else b""
    cabeceras = [(b"content-type", b"application/json")]
    if token:
        cabeceras.append((b"authorization", f"Bearer {token}".encode("ascii")))

    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": metodo,
        "scheme": "http",
        "path": ruta,
        "raw_path": ruta.encode("ascii"),
        "root_path": "",
        "query_string": b"",
        "headers": cabeceras,
        "client": ("127.0.0.1", 12345),
        "server": ("testserver", 80),
    }
    respuesta = {"estado": None, "cuerpo": []}
    enviada = False

    async def recibir():
        nonlocal enviada
        if not enviada:
            enviada = True
            return {"type": "http.request", "body": cuerpo, "more_body": False}
        return {"type": "http.disconnect"}

    async def enviar(mensaje):
        if mensaje["type"] == "http.response.start":
            respuesta["estado"] = mensaje["status"]
        elif mensaje["type"] == "http.response.body":
            respuesta["cuerpo"].append(mensaje.get("body", b""))

    await app(scope, recibir, enviar)
    contenido = b"".join(respuesta["cuerpo"])
    return respuesta["estado"], json.loads(contenido) if contenido else None


def solicitar(metodo, ruta, token=None, datos=None):
    return asyncio.run(_peticion_asgi(metodo, ruta, token, datos))


@pytest.fixture
def usuario_en_memoria():
    """Sustituye exclusivamente get_db; nunca abre una sesión de PostgreSQL."""
    db_falso = SimpleNamespace(usuario=None)

    def consultar_usuario(_consulta):
        return db_falso.usuario

    db_falso.scalar = consultar_usuario
    app.dependency_overrides[get_db] = lambda: db_falso
    try:
        yield db_falso
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.parametrize(
    "metodo,ruta,datos",
    [
        ("POST", "/api/v1/ranking/predecir", INDICADORES),
        ("POST", "/api/v1/ranking/postulaciones/1/calcular", None),
        ("GET", "/api/v1/ranking/postulaciones/1", None),
    ],
)
def test_candidato_recibe_403_en_endpoints_ranking(usuario_en_memoria, metodo, ruta, datos):
    usuario_en_memoria.usuario = SimpleNamespace(
        id=5, activo=True, rol=SimpleNamespace(nombre="CANDIDATO")
    )
    token = crear_token_acceso(5, "CANDIDATO")

    estado, respuesta = solicitar(metodo, ruta, token=token, datos=datos)

    assert estado == 403
    assert "permisos" in respuesta["detail"]


def test_sin_token_no_puede_usar_ranking(usuario_en_memoria):
    estado, _ = solicitar("POST", "/api/v1/ranking/predecir", datos=INDICADORES)
    assert estado in (401, 403)


@pytest.mark.parametrize("rol", ["RECLUTADOR", "ADMINISTRADOR"])
def test_roles_permitidos_pueden_predecir(usuario_en_memoria, monkeypatch, rol):
    usuario_en_memoria.usuario = SimpleNamespace(
        id=12, activo=True, rol=SimpleNamespace(nombre=rol)
    )
    token = crear_token_acceso(12, rol)
    esperado = {
        "puntaje": 82.5,
        "metodo": "random_forest",
        "version_modelo": "prueba",
        "indicadores": INDICADORES,
        "explicacion": "Predicción simulada para prueba HTTP.",
    }
    monkeypatch.setattr(ranking_router, "predecir_compatibilidad", lambda **_: esperado)

    estado, respuesta = solicitar(
        "POST", "/api/v1/ranking/predecir", token=token, datos=INDICADORES
    )

    assert estado == 200
    assert respuesta["puntaje"] == 82.5
    assert respuesta["metodo"] == "random_forest"
