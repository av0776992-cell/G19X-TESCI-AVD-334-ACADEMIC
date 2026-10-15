
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class EvaluacionReclutadorCrear(BaseModel):
    recomendacion: int = Field(ge=1, le=5)
    resumen: str | None = Field(default=None, max_length=2000)


class EvaluacionReclutadorRespuesta(BaseModel):
    id: int
    postulacion_id: int
    reclutador_id: int
    recomendacion: int
    resumen: str | None
    fecha_evaluacion: datetime

    model_config = ConfigDict(from_attributes=True)
