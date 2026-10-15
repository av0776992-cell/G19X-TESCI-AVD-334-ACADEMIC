
from pydantic import BaseModel, Field, ConfigDict


class RankingPrediccionEntrada(BaseModel):
    experiencia: float = Field(ge=0, le=100)
    habilidades: float = Field(ge=0, le=100)
    formacion: float = Field(ge=0, le=100)
    competencias: float = Field(ge=0, le=100)
    evaluaciones: float = Field(ge=0, le=100)


class RankingPrediccionRespuesta(BaseModel):
    puntaje: float = Field(ge=0, le=100)
    metodo: str
    version_modelo: str
    indicadores: dict[str, float]
    explicacion: str


class ResultadoRankingRespuesta(BaseModel):
    id: int
    postulacion_id: int
    puntaje: float
    metodo: str
    version_modelo: str | None
    explicacion: str | None

    model_config = ConfigDict(from_attributes=True)
