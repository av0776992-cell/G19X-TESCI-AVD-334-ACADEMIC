"""Datos legibles para las listas de postulaciones de personal autorizado."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.candidato import Candidato
from app.models.postulacion import Postulacion
from app.models.usuario import Usuario
from app.models.vacante import Vacante


def listar_postulaciones_con_nombres(db: Session) -> list[dict]:
    filas = db.execute(
        select(Postulacion, Usuario.nombre, Vacante.titulo)
        .join(Candidato, Candidato.id == Postulacion.candidato_id)
        .join(Usuario, Usuario.id == Candidato.usuario_id)
        .join(Vacante, Vacante.id == Postulacion.vacante_id)
        .order_by(Postulacion.fecha_postulacion.desc(), Postulacion.id.desc())
    ).all()
    return [
        {
            "id": postulacion.id,
            "candidato_id": postulacion.candidato_id,
            "vacante_id": postulacion.vacante_id,
            "fecha_postulacion": postulacion.fecha_postulacion,
            "nombre_candidato": nombre,
            "titulo_vacante": titulo,
        }
        for postulacion, nombre, titulo in filas
    ]
