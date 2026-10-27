from datetime import datetime
from typing import Literal
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


class CandidatoRankingVacanteRespuesta(BaseModel):
    postulacion_id: int
    candidato_id: int
    candidato_nombre: str
    resultado_id: int | None
    puntaje: float | None
    metodo: str | None
    fecha_calculo: datetime | None


class RankingVacanteResumenRespuesta(BaseModel):
    id: int
    titulo: str
    estado: str

    model_config = ConfigDict(from_attributes=True)


class RankingVacanteRespuesta(BaseModel):
    vacante_id: int
    titulo_vacante: str
    candidatos: list[CandidatoRankingVacanteRespuesta]


class ResultadoCalculoVacanteRespuesta(BaseModel):
    postulacion_id: int
    estado: Literal["calculado", "pendiente", "error"]
    puntaje: float | None = None
    resultado_id: int | None = None
    indicadores_pendientes: list[str] = Field(default_factory=list)
    mensaje: str | None = None


class RankingVacanteCalculoRespuesta(BaseModel):
    vacante_id: int
    titulo_vacante: str
    total_postulaciones: int
    calculadas: int
    pendientes: int
    errores: int
    resultados: list[ResultadoCalculoVacanteRespuesta]
