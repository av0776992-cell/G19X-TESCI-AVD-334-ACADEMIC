
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PostulacionCrear(BaseModel):
    vacante_id: int


class PostulacionRespuesta(BaseModel):
    id: int
    candidato_id: int
    vacante_id: int
    fecha_postulacion: datetime

    model_config = ConfigDict(from_attributes=True)


class PostulacionSeguimientoRespuesta(PostulacionRespuesta):
    titulo_vacante: str
    estado_actual: str
    fecha_estado: datetime | None = None
    decision_final: str | None = None
    fecha_decision: datetime | None = None
