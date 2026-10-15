from datetime import date

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class ExperienciaCrear(BaseModel):
    empresa: str = Field(
        min_length=2,
        max_length=150,
    )

    puesto: str = Field(
        min_length=2,
        max_length=150,
    )

    descripcion: str | None = None
    fecha_inicio: date | None = None
    fecha_fin: date | None = None

    @field_validator("empresa", "puesto", "descripcion")
    @classmethod
    def limpiar_texto(cls, valor: str | None) -> str | None:
        if valor is None:
            return None

        valor = valor.strip()

        if len(valor) < 2:
            raise ValueError(
                "El texto debe contener al menos 2 caracteres"
            )

        return valor

    @model_validator(mode="after")
    def validar_fechas(self):
        if (
            self.fecha_inicio is not None
            and self.fecha_fin is not None
            and self.fecha_fin < self.fecha_inicio
        ):
            raise ValueError(
                "La fecha de fin no puede ser anterior a la fecha de inicio"
            )

        return self


class ExperienciaActualizar(BaseModel):
    empresa: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    puesto: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    descripcion: str | None = None
    fecha_inicio: date | None = None
    fecha_fin: date | None = None

    @field_validator("empresa", "puesto", "descripcion")
    @classmethod
    def limpiar_texto(cls, valor: str | None) -> str | None:
        if valor is None:
            return None

        valor = valor.strip()

        if len(valor) < 2:
            raise ValueError(
                "El texto debe contener al menos 2 caracteres"
            )

        return valor


class ExperienciaRespuesta(BaseModel):
    id: int
    candidato_id: int
    empresa: str
    puesto: str
    descripcion: str | None
    fecha_inicio: date | None
    fecha_fin: date | None

    model_config = ConfigDict(from_attributes=True)