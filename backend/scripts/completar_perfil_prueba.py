
from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.candidato import Candidato
from app.models.candidato_habilidad import CandidatoHabilidad
from app.models.candidato_competencia import CandidatoCompetencia

CANDIDATO_ID = 1

HABILIDADES_PRUEBA = {
    5: 3,  # FastAPI
    7: 3,  # PostgreSQL
    6: 3,  # Git
}

COMPETENCIAS_PRUEBA = {
    2: 3,  # Trabajo en equipo
    3: 4,  # Resolución de problemas
    4: 3,  # Adaptabilidad
}


def main():
    with SessionLocal() as db:
        candidato = db.get(Candidato, CANDIDATO_ID)

        if candidato is None:
            print("No existe el candidato de prueba.")
            return

        nuevos = 0

        for habilidad_id, nivel in HABILIDADES_PRUEBA.items():
            existente = db.scalar(
                select(CandidatoHabilidad).where(
                    CandidatoHabilidad.candidato_id == CANDIDATO_ID,
                    CandidatoHabilidad.habilidad_id == habilidad_id,
                )
            )

            if existente is None:
                db.add(
                    CandidatoHabilidad(
                        candidato_id=CANDIDATO_ID,
                        habilidad_id=habilidad_id,
                        nivel=nivel,
                    )
                )
                nuevos += 1

        for competencia_id, nivel in COMPETENCIAS_PRUEBA.items():
            existente = db.scalar(
                select(CandidatoCompetencia).where(
                    CandidatoCompetencia.candidato_id == CANDIDATO_ID,
                    CandidatoCompetencia.competencia_id == competencia_id,
                )
            )

            if existente is None:
                db.add(
                    CandidatoCompetencia(
                        candidato_id=CANDIDATO_ID,
                        competencia_id=competencia_id,
                        nivel=nivel,
                    )
                )
                nuevos += 1

        db.commit()

        print("Datos ficticios de prueba registrados.")
        print(f"Nuevos registros: {nuevos}")
        print("Los registros existentes no fueron modificados.")


if __name__ == "__main__":
    main()
