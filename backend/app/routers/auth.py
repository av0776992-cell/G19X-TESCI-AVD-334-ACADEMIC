from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import obtener_usuario_actual

from app.models.rol import Rol

from app.schemas.usuario import UsuarioRegistro, UsuarioRespuesta
from app.schemas.login import LoginRequest
from app.schemas.token import TokenResponse

from app.services.usuario_service import (
    crear_usuario_candidato,
    autenticar_usuario,
)


router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Autenticación"],
)


@router.post(
    "/registro",
    response_model=UsuarioRespuesta,
    status_code=status.HTTP_201_CREATED,
)
def registrar_candidato(
    datos: UsuarioRegistro,
    db: Session = Depends(get_db),
):
    try:
        usuario = crear_usuario_candidato(db, datos)
        return usuario

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        )


@router.post(
    "/login",
    response_model=TokenResponse,
)
def iniciar_sesion(
    datos: LoginRequest,
    db: Session = Depends(get_db),
):
    try:
        usuario, token = autenticar_usuario(db, datos)

        rol = db.get(Rol, usuario.rol_id)

        return TokenResponse(
            access_token=token,
            token_type="bearer",
            usuario_id=usuario.id,
            rol=rol.nombre,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error),
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.get(
    "/me",
    response_model=UsuarioRespuesta,
)
def obtener_perfil_actual(
    usuario_actual=Depends(obtener_usuario_actual),
):
    return usuario_actual