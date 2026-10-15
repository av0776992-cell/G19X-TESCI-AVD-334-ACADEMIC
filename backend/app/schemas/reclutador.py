
from datetime import datetime

from pydantic import BaseModel, EmailStr


class PostulacionDetalleReclutador(BaseModel):
    id: int
    candidato_id: int
    vacante_id: int
    fecha_postulacion: datetime

    nombre_candidato: str
    correo_candidato: EmailStr
    ciudad_candidato: str | None

    titulo_vacante: str
