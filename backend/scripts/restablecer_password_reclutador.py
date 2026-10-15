
from getpass import getpass

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import obtener_hash_password
from app.models.usuario import Usuario
from app.models.rol import Rol


def main():
    print("=== Restablecer contraseña del reclutador ===")

    nueva_password = getpass("Nueva contraseña: ")
    confirmar_password = getpass("Confirmar contraseña: ")

    if len(nueva_password) < 12:
        print("Error: utiliza al menos 12 caracteres.")
        return

    if nueva_password != confirmar_password:
        print("Error: las contraseñas no coinciden.")
        return

    db = SessionLocal()

    try:
        usuario = db.scalar(
            select(Usuario)
            .join(Rol, Usuario.rol_id == Rol.id)
            .where(
                Usuario.id == 4,
                Rol.nombre == "RECLUTADOR",
            )
        )

        if usuario is None:
            print("Error: no se encontró al reclutador de prueba.")
            return

        usuario.password_hash = obtener_hash_password(nueva_password)
        db.commit()

        print("Contraseña actualizada correctamente.")
        print(f"Usuario ID: {usuario.id}")
        print(f"Correo: {usuario.correo}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
