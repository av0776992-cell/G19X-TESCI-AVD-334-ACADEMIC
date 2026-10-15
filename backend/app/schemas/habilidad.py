from pydantic import BaseModel, ConfigDict, Field


class HabilidadRespuesta(BaseModel):
    id: int
    nombre: str
    descripcion: str | None

    model_config = ConfigDict(from_attributes=True)


class CandidatoHabilidadCrear(BaseModel):
    habilidad_id: int = Field(gt=0)
    nivel: int = Field(ge=1, le=5)


class CandidatoHabilidadActualizar(BaseModel):
    nivel: int = Field(ge=1, le=5)


class CandidatoHabilidadRespuesta(BaseModel):
    id: int
    candidato_id: int
    habilidad_id: int
    nivel: int | None
    habilidad: HabilidadRespuesta

    model_config = ConfigDict(from_attributes=True)