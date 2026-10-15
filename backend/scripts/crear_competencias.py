from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.competencia import Competencia


COMPETENCIAS_INICIALES = [
    {
        "nombre": "Comunicación",
        "descripcion": "Capacidad para expresar ideas de forma clara y efectiva",
    },
    {
        "nombre": "Trabajo en equipo",
        "descripcion": "Capacidad para colaborar eficazmente con otras personas",
    },
    {
        "nombre": "Resolución de problemas",
        "descripcion": "Capacidad para analizar situaciones y encontrar soluciones",
    },
    {
        "nombre": "Adaptabilidad",
        "descripcion": "Capacidad para ajustarse a cambios y nuevas situaciones",
    },
    {
        "nombre": "Liderazgo",
        "descripcion": "Capacidad para orientar y coordinar a otras personas",
    },
    {
        "nombre": "Organización",
        "descripcion": "Capacidad para planificar y administrar tareas y recursos",
    },
    {
        "nombre": "Pensamiento crítico",
        "descripcion": "Capacidad para analizar información y tomar decisiones fundamentadas",
    },
    {
        "nombre": "Gestión del tiempo",
        "descripcion": "Capacidad para priorizar y completar actividades eficientemente",
    },
    {
        "nombre": "Proactividad",
        "descripcion": "Capacidad para tomar iniciativa y anticiparse a necesidades",
    },
    {
        "nombre": "Responsabilidad",
        "descripcion": "Capacidad para cumplir compromisos y asumir las consecuencias de las decisiones",
    },
]


def crear_competencias():
    db = SessionLocal()

    try:
        creadas = 0

        for datos in COMPETENCIAS_INICIALES:
            existente = db.scalar(
                select(Competencia).where(
                    Competencia.nombre == datos["nombre"]
                )
            )

            if existente is None:
                competencia = Competencia(**datos)
                db.add(competencia)
                creadas += 1

        db.commit()

        print(
            f"Catálogo de competencias listo. "
            f"Nuevas competencias creadas: {creadas}"
        )

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    crear_competencias()