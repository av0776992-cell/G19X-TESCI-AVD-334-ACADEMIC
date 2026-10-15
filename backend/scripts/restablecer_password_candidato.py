
from getpass import getpass

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import obtener_hash_password
from app.models.usuario import Usuario
from app.models.rol import Rol


def main():
    print("=== Restablecer contraseña del candidato ===")

    correo = input("Correo del candidato: ").strip().lower()

    if not correo:
        print("Error: debes introducir un correo.")
        return

    db = SessionLocal()

    try:
        usuario = db.scalar(
            select(Usuario)
            .join(Rol, Usuario.rol_id == Rol.id)
            .where(
                Usuario.correo == correo,
                Rol.nombre == "CANDIDATO",
            )
        )

        if usuario is None:
            print("Error: no se encontró una cuenta de candidato con ese correo.")
            return

        print(f"Cuenta encontrada: {usuario.correo}")
        print(f"Usuario ID: {usuario.id}")

        nueva_password = getpass("Nueva contraseña: ")
        confirmar_password = getpass("Confirmar contraseña: ")

        if len(nueva_password) < 12:
            print("Error: utiliza al menos 12 caracteres.")
            return

        if nueva_password != confirmar_password:
            print("Error: las contraseñas no coinciden.")
            return

        usuario.password_hash = obtener_hash_password(nueva_password)
        db.commit()

        print("Contraseña actualizada correctamente.")
        print(f"Correo: {usuario.correo}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
