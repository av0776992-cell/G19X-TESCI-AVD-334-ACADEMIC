from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.rol import Rol


ROLES_INICIALES = [
    "CANDIDATO",
    "RECLUTADOR",
    "ADMINISTRADOR",
]


def crear_roles():
    db = SessionLocal()

    try:
        for nombre_rol in ROLES_INICIALES:
            rol_existente = db.scalar(
                select(Rol).where(Rol.nombre == nombre_rol)
            )

            if rol_existente is None:
                db.add(Rol(nombre=nombre_rol))
                print(f"Rol creado: {nombre_rol}")
            else:
                print(f"Rol ya existente: {nombre_rol}")

        db.commit()
        print("Roles inicializados correctamente.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    crear_roles()