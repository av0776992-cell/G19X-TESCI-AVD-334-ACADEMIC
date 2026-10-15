
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class EvaluacionCrear(BaseModel):
    tipo: str = Field(
        min_length=1,
        max_length=100,
    )

    puntuacion: int = Field(
        ge=0,
        le=100,
    )

    observaciones: str | None = None


class EvaluacionRespuesta(BaseModel):
    id: int
    postulacion_id: int
    reclutador_id: int
    tipo: str
    puntuacion: int | None
    observaciones: str | None
    fecha_evaluacion: datetime

    model_config = ConfigDict(from_attributes=True)
