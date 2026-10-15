from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.vacante import Vacante


TITULO_VACANTE = "Desarrollador Backend Jr."


def crear_vacante_prueba():
    db = SessionLocal()

    try:
        vacante_existente = db.scalar(
            select(Vacante).where(
                Vacante.titulo == TITULO_VACANTE
            )
        )

        if vacante_existente is not None:
            print(
                f"La vacante de prueba ya existe. "
                f"ID: {vacante_existente.id}"
            )
            return

        nueva_vacante = Vacante(
            titulo=TITULO_VACANTE,
            descripcion=(
                "Vacante para desarrollador backend junior con conocimientos "
                "en Python, FastAPI, PostgreSQL y Git."
            ),
            ubicacion="Ciudad de México",
            modalidad="Remota",
            estado="ABIERTA",
            fecha_cierre=None,
        )

        db.add(nueva_vacante)
        db.commit()
        db.refresh(nueva_vacante)

        print("Vacante de prueba creada correctamente.")
        print(f"ID: {nueva_vacante.id}")
        print(f"Título: {nueva_vacante.titulo}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    crear_vacante_prueba()