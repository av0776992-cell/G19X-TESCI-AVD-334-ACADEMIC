"""Verifica las dependencias reales de autorización de las rutas de ranking."""

from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from fastapi.routing import APIRoute

from app.core.dependencies import obtener_usuario_actual
from app.routers.ranking import router


def proteccion_de_ruta(ruta_buscada: str):
    ruta = next(
        r for r in router.routes
        if isinstance(r, APIRoute) and r.path == ruta_buscada
    )
    return next(
        dependencia.call for dependencia in ruta.dependant.dependencies
        if any(
            subdependencia.call is obtener_usuario_actual
            for subdependencia in dependencia.dependencies
        )
    )


RUTAS_RESTRINGIDAS = [
    "/api/v1/ranking/predecir",
    "/api/v1/ranking/postulaciones/{postulacion_id}/calcular",
    "/api/v1/ranking/postulaciones/{postulacion_id}",
]


@pytest.mark.parametrize("ruta", RUTAS_RESTRINGIDAS)
def test_candidato_no_tiene_permiso_en_ranking(ruta):
    verificar_rol = proteccion_de_ruta(ruta)
    candidato = SimpleNamespace(rol=SimpleNamespace(nombre="CANDIDATO"))

    with pytest.raises(HTTPException) as error:
        verificar_rol(usuario_actual=candidato)

    assert error.value.status_code == 403
    assert "permisos" in error.value.detail


@pytest.mark.parametrize("rol", ["RECLUTADOR", "ADMINISTRADOR"])
def test_roles_autorizados_pueden_pasar_la_proteccion(rol):
    verificar_rol = proteccion_de_ruta("/api/v1/ranking/predecir")
    usuario = SimpleNamespace(rol=SimpleNamespace(nombre=rol))

    assert verificar_rol(usuario_actual=usuario) is usuario
