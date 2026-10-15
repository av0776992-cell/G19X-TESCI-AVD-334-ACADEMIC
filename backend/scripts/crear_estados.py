from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.estado import Estado


ESTADOS = [
    {
        "nombre": "Postulado",
        "descripcion": "El candidato realizó su postulación a la vacante.",
    },
    {
        "nombre": "Documentación recibida",
        "descripcion": "La documentación requerida del candidato fue recibida.",
    },
    {
        "nombre": "En revisión",
        "descripcion": "La postulación está siendo revisada por reclutamiento.",
    },
    {
        "nombre": "Evaluado",
        "descripcion": "El candidato ya fue evaluado por reclutamiento.",
    },
    {
        "nombre": "Entrevista",
        "descripcion": "El candidato se encuentra en etapa de entrevista.",
    },
    {
        "nombre": "En decisión",
        "descripcion": "La postulación está en espera de la decisión final.",
    },
    {
        "nombre": "Aceptado",
        "descripcion": "El candidato fue aceptado para la vacante.",
    },
    {
        "nombre": "Rechazado",
        "descripcion": "El candidato fue rechazado para la vacante.",
    },
]


def crear_estados():
    db = SessionLocal()

    try:
        creados = 0
        existentes = 0

        for datos_estado in ESTADOS:
            estado_existente = db.scalar(
                select(Estado).where(
                    Estado.nombre == datos_estado["nombre"]
                )
            )

            if estado_existente is not None:
                existentes += 1
                continue

            nuevo_estado = Estado(
                nombre=datos_estado["nombre"],
                descripcion=datos_estado["descripcion"],
            )

            db.add(nuevo_estado)
            creados += 1

        db.commit()

        print("Catálogo de estados procesado correctamente.")
        print(f"Estados creados: {creados}")
        print(f"Estados existentes: {existentes}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    crear_estados()