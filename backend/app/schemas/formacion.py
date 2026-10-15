from datetime import date

from pydantic import BaseModel, ConfigDict, Field, field_validator


class FormacionCrear(BaseModel):
    institucion: str = Field(
        min_length=2,
        max_length=150,
    )

    titulo: str = Field(
        min_length=2,
        max_length=150,
    )

    nivel: str | None = Field(
        default=None,
        min_length=2,
        max_length=50,
    )

    fecha_inicio: date | None = None
    fecha_fin: date | None = None

    @field_validator("institucion", "titulo", "nivel")
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


class FormacionActualizar(BaseModel):
    institucion: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    titulo: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    nivel: str | None = Field(
        default=None,
        min_length=2,
        max_length=50,
    )

    fecha_inicio: date | None = None
    fecha_fin: date | None = None

    @field_validator("institucion", "titulo", "nivel")
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


class FormacionRespuesta(BaseModel):
    id: int
    candidato_id: int
    institucion: str
    titulo: str
    nivel: str | None
    fecha_inicio: date | None
    fecha_fin: date | None

    model_config = ConfigDict(from_attributes=True)