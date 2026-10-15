from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.competencia import Competencia
from app.models.habilidad import Habilidad
from app.models.vacante import Vacante
from app.models.vacante_competencia import VacanteCompetencia
from app.models.vacante_habilidad import VacanteHabilidad


TITULO_VACANTE = "Desarrollador Backend Jr."


HABILIDADES_REQUERIDAS = {
    "Python": 4,
    "FastAPI": 3,
    "PostgreSQL": 3,
    "Git": 3,
}


COMPETENCIAS_REQUERIDAS = {
    "Comunicación": 3,
    "Trabajo en equipo": 4,
    "Resolución de problemas": 4,
    "Adaptabilidad": 3,
}


def asignar_requisitos():
    db = SessionLocal()

    try:
        vacante = db.scalar(
            select(Vacante).where(
                Vacante.titulo == TITULO_VACANTE
            )
        )

        if vacante is None:
            print("No se encontró la vacante de prueba.")
            return

        habilidades_creadas = 0
        habilidades_actualizadas = 0

        for nombre_habilidad, nivel_requerido in HABILIDADES_REQUERIDAS.items():
            habilidad = db.scalar(
                select(Habilidad).where(
                    Habilidad.nombre == nombre_habilidad
                )
            )

            if habilidad is None:
                print(
                    f"No se encontró la habilidad: {nombre_habilidad}"
                )
                continue

            requisito_existente = db.scalar(
                select(VacanteHabilidad).where(
                    VacanteHabilidad.vacante_id == vacante.id,
                    VacanteHabilidad.habilidad_id == habilidad.id,
                )
            )

            if requisito_existente is None:
                nuevo_requisito = VacanteHabilidad(
                    vacante_id=vacante.id,
                    habilidad_id=habilidad.id,
                    nivel_requerido=nivel_requerido,
                )

                db.add(nuevo_requisito)
                habilidades_creadas += 1

            else:
                requisito_existente.nivel_requerido = nivel_requerido
                habilidades_actualizadas += 1

        competencias_creadas = 0
        competencias_actualizadas = 0

        for nombre_competencia, nivel_requerido in COMPETENCIAS_REQUERIDAS.items():
            competencia = db.scalar(
                select(Competencia).where(
                    Competencia.nombre == nombre_competencia
                )
            )

            if competencia is None:
                print(
                    f"No se encontró la competencia: {nombre_competencia}"
                )
                continue

            requisito_existente = db.scalar(
                select(VacanteCompetencia).where(
                    VacanteCompetencia.vacante_id == vacante.id,
                    VacanteCompetencia.competencia_id == competencia.id,
                )
            )

            if requisito_existente is None:
                nuevo_requisito = VacanteCompetencia(
                    vacante_id=vacante.id,
                    competencia_id=competencia.id,
                    nivel_requerido=nivel_requerido,
                )

                db.add(nuevo_requisito)
                competencias_creadas += 1

            else:
                requisito_existente.nivel_requerido = nivel_requerido
                competencias_actualizadas += 1

        db.commit()

        print("Requisitos de la vacante asignados correctamente.")
        print(f"Vacante: {vacante.titulo}")
        print(
            f"Habilidades nuevas: {habilidades_creadas} | "
            f"actualizadas: {habilidades_actualizadas}"
        )
        print(
            f"Competencias nuevas: {competencias_creadas} | "
            f"actualizadas: {competencias_actualizadas}"
        )

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    asignar_requisitos()