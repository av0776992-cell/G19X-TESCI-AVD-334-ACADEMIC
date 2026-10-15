
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class DecisionCrear(BaseModel):
    decision: Literal["ACEPTADO", "RECHAZADO"]

    justificacion: str = Field(
        min_length=10,
        max_length=2000,
    )


class DecisionRespuesta(BaseModel):
    id: int
    postulacion_id: int
    administrador_id: int
    decision: str
    justificacion: str | None
    fecha_decision: datetime

    model_config = ConfigDict(from_attributes=True)
