from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.habilidad import Habilidad


HABILIDADES_INICIALES = [
    {
        "nombre": "Python",
        "descripcion": "Programación y desarrollo con Python",
    },
    {
        "nombre": "JavaScript",
        "descripcion": "Programación y desarrollo con JavaScript",
    },
    {
        "nombre": "SQL",
        "descripcion": "Consulta y gestión de bases de datos relacionales",
    },
    {
        "nombre": "React",
        "descripcion": "Desarrollo de interfaces web con React",
    },
    {
        "nombre": "FastAPI",
        "descripcion": "Desarrollo de APIs con FastAPI",
    },
    {
        "nombre": "Git",
        "descripcion": "Control de versiones con Git",
    },
    {
        "nombre": "PostgreSQL",
        "descripcion": "Gestión de bases de datos PostgreSQL",
    },
    {
        "nombre": "HTML",
        "descripcion": "Estructuración de contenido web con HTML",
    },
    {
        "nombre": "CSS",
        "descripcion": "Diseño y estilos de interfaces web con CSS",
    },
    {
        "nombre": "Docker",
        "descripcion": "Contenedores y despliegue de aplicaciones con Docker",
    },
]


def crear_habilidades():
    db = SessionLocal()

    try:
        creadas = 0

        for datos in HABILIDADES_INICIALES:
            existente = db.scalar(
                select(Habilidad).where(
                    Habilidad.nombre == datos["nombre"]
                )
            )

            if existente is None:
                habilidad = Habilidad(**datos)
                db.add(habilidad)
                creadas += 1

        db.commit()

        print(
            f"Catálogo de habilidades listo. "
            f"Nuevas habilidades creadas: {creadas}"
        )

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    crear_habilidades()