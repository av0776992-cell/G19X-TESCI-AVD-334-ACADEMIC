
from getpass import getpass

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import obtener_hash_password
from app.models.rol import Rol
from app.models.usuario import Usuario


def crear_reclutador_prueba():
    correo = "reclutador.prueba@example.com"

    db = SessionLocal()

    try:
        usuario_existente = db.scalar(
            select(Usuario).where(Usuario.correo == correo)
        )

        if usuario_existente is not None:
            print("El usuario de prueba ya existe.")
            return

        rol = db.scalar(
            select(Rol).where(Rol.nombre == "RECLUTADOR")
        )

        if rol is None:
            print("No existe el rol RECLUTADOR.")
            return

        password = getpass("Contraseña del reclutador: ")

        if len(password) < 12:
            print("La contraseña debe tener al menos 12 caracteres.")
            return

        nuevo_usuario = Usuario(
            nombre="Reclutador de Prueba",
            correo=correo,
            password_hash=obtener_hash_password(password),
            rol_id=rol.id,
            activo=True,
        )

        db.add(nuevo_usuario)
        db.commit()

        print("Reclutador de prueba creado correctamente.")
        print(f"Correo: {correo}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    crear_reclutador_prueba()
