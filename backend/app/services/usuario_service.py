from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import (
    crear_token_acceso,
    obtener_hash_password,
    verificar_password,
)
from app.models.candidato import Candidato
from app.models.rol import Rol
from app.models.usuario import Usuario
from app.schemas.login import LoginRequest
from app.schemas.usuario import UsuarioRegistro


def crear_usuario_candidato(
    db: Session,
    datos: UsuarioRegistro
) -> Usuario:
    correo = str(datos.correo).lower()

    usuario_existente = db.scalar(
        select(Usuario).where(Usuario.correo == correo)
    )

    if usuario_existente:
        raise ValueError("El correo ya está registrado")

    rol_candidato = db.scalar(
        select(Rol).where(Rol.nombre == "CANDIDATO")
    )

    if rol_candidato is None:
        raise ValueError("El rol CANDIDATO no existe")

    nuevo_usuario = Usuario(
        nombre=datos.nombre,
        correo=correo,
        password_hash=obtener_hash_password(datos.password),
        rol_id=rol_candidato.id,
        activo=True,
    )

    try:
        db.add(nuevo_usuario)

        # Necesitamos obtener el ID antes de crear el perfil.
        db.flush()

        nuevo_candidato = Candidato(
            usuario_id=nuevo_usuario.id
        )

        db.add(nuevo_candidato)

        # Guardamos usuario y candidato en una misma transacción.
        db.commit()
        db.refresh(nuevo_usuario)

    except Exception:
        db.rollback()
        raise

    return nuevo_usuario


def autenticar_usuario(
    db: Session,
    datos: LoginRequest
) -> tuple[Usuario, str]:
    correo = str(datos.correo).lower()

    usuario = db.scalar(
        select(Usuario).where(Usuario.correo == correo)
    )

    if usuario is None:
        raise ValueError("Correo o contraseña incorrectos")

    if not usuario.activo:
        raise ValueError("El usuario está desactivado")

    if not verificar_password(
        datos.password,
        usuario.password_hash
    ):
        raise ValueError("Correo o contraseña incorrectos")

    rol = db.scalar(
        select(Rol).where(Rol.id == usuario.rol_id)
    )

    if rol is None:
        raise ValueError("El rol del usuario no existe")

    token = crear_token_acceso(
        usuario.id,
        rol.nombre
    )

    return usuario, token