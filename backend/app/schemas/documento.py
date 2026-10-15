from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentoRespuesta(BaseModel):
    id: int
    postulacion_id: int
    tipo: str
    nombre_archivo: str
    fecha_subida: datetime

    model_config = ConfigDict(from_attributes=True)