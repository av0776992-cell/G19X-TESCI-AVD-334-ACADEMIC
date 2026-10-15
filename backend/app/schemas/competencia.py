from pydantic import BaseModel, ConfigDict, Field


class CompetenciaRespuesta(BaseModel):
    id: int
    nombre: str
    descripcion: str | None

    model_config = ConfigDict(from_attributes=True)


class CandidatoCompetenciaCrear(BaseModel):
    competencia_id: int = Field(gt=0)
    nivel: int = Field(ge=1, le=5)


class CandidatoCompetenciaActualizar(BaseModel):
    nivel: int = Field(ge=1, le=5)


class CandidatoCompetenciaRespuesta(BaseModel):
    id: int
    candidato_id: int
    competencia_id: int
    nivel: int | None
    competencia: CompetenciaRespuesta

    model_config = ConfigDict(from_attributes=True)