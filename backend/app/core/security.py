import os
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv
from pwdlib import PasswordHash


load_dotenv()

password_hash = PasswordHash.recommended()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))

if not JWT_SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY no está configurada")


def obtener_hash_password(password: str) -> str:
    """
    Convierte una contraseña en texto plano en un hash seguro.
    """
    return password_hash.hash(password)


def verificar_password(password: str, password_guardado: str) -> bool:
    """
    Comprueba si una contraseña coincide con el hash almacenado.
    """
    return password_hash.verify(password, password_guardado)


def crear_token_acceso(usuario_id: int, rol: str) -> str:
    """
    Crea un token JWT para un usuario autenticado.
    """
    ahora = datetime.now(timezone.utc)
    expiracion = ahora + timedelta(minutes=JWT_EXPIRE_MINUTES)

    datos_token = {
        "sub": str(usuario_id),
        "rol": rol,
        "iat": ahora,
        "exp": expiracion,
    }

    return jwt.encode(
        datos_token,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM
    )
def decodificar_token(token: str) -> dict:
    """
    Valida y decodifica un token JWT.
    """
    return jwt.decode(
        token,
        JWT_SECRET_KEY,
        algorithms=[JWT_ALGORITHM]
    )