from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class VacanteHabilidadRespuesta(BaseModel):
    id: int
    habilidad_id: int
    nombre: str
    nivel_requerido: int | None


class VacanteCompetenciaRespuesta(BaseModel):
    id: int
    competencia_id: int
    nombre: str
    nivel_requerido: int | None


class VacanteRespuesta(BaseModel):
    id: int
    titulo: str
    descripcion: str
    ubicacion: str | None
    modalidad: str | None
    estado: str
    fecha_publicacion: datetime
    fecha_cierre: datetime | None
    experiencia_minima_meses: int | None
    nivel_estudios_requerido: str | None

    model_config = ConfigDict(from_attributes=True)


class VacanteDetalleRespuesta(VacanteRespuesta):
    habilidades: list[VacanteHabilidadRespuesta]
    competencias: list[VacanteCompetenciaRespuesta]


class VacanteCrear(BaseModel):
    titulo: str = Field(min_length=1, max_length=150)
    descripcion: str = Field(min_length=1)
    ubicacion: str | None = None
    modalidad: str | None = None
    experiencia_minima_meses: int = Field(default=0, ge=0)
    nivel_estudios_requerido: str | None = None



class VacanteHabilidadAsignar(BaseModel):
    habilidad_id: int = Field(gt=0)
    nivel_requerido: int = Field(ge=1, le=5)


class VacanteCompetenciaAsignar(BaseModel):
    competencia_id: int = Field(gt=0)
    nivel_requerido: int = Field(ge=1, le=5)


class VacanteActualizar(BaseModel):
    titulo: str | None = Field(default=None, min_length=1, max_length=150)
    descripcion: str | None = Field(default=None, min_length=1)
    ubicacion: str | None = Field(default=None, max_length=150)
    modalidad: str | None = Field(default=None, max_length=50)
    experiencia_minima_meses: int | None = Field(default=None, ge=0)
    nivel_estudios_requerido: str | None = Field(default=None, max_length=100)
