
from getpass import getpass

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import obtener_hash_password
from app.models.rol import Rol
from app.models.usuario import Usuario


def main():
    print("=== Crear administrador de prueba ===")

    nombre = input("Nombre: ").strip()
    correo = input("Correo: ").strip().lower()
    password = getpass("Contraseña: ")
    confirmar_password = getpass("Confirmar contraseña: ")

    if not nombre or not correo or not password:
        print("Error: todos los campos son obligatorios.")
        return

    if password != confirmar_password:
        print("Error: las contraseñas no coinciden.")
        return

    if len(password) < 12:
        print("Error: utiliza una contraseña de al menos 12 caracteres.")
        return

    db = SessionLocal()

    try:
        rol_administrador = db.scalar(
            select(Rol).where(Rol.nombre == "ADMINISTRADOR")
        )

        if rol_administrador is None:
            print("Error: el rol ADMINISTRADOR no existe.")
            return

        usuario_existente = db.scalar(
            select(Usuario).where(Usuario.correo == correo)
        )

        if usuario_existente is not None:
            print("Error: el correo ya está registrado.")
            return

        nuevo_usuario = Usuario(
            nombre=nombre,
            correo=correo,
            password_hash=obtener_hash_password(password),
            rol_id=rol_administrador.id,
            activo=True,
        )

        db.add(nuevo_usuario)
        db.commit()
        db.refresh(nuevo_usuario)

        print("Administrador creado correctamente.")
        print(f"ID: {nuevo_usuario.id}")
        print(f"Rol: {rol_administrador.nombre}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
