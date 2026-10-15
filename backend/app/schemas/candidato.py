from datetime import date, datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
)


class CandidatoPerfilRespuesta(BaseModel):
    id: int
    usuario_id: int
    nombre: str
    correo: EmailStr
    activo: bool
    telefono: str | None
    ciudad: str | None
    fecha_nacimiento: date | None
    fecha_actualizacion: datetime

    model_config = ConfigDict(from_attributes=True)


class CandidatoPerfilActualizar(BaseModel):
    telefono: str | None = Field(
        default=None,
        min_length=7,
        max_length=20,
    )

    ciudad: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    fecha_nacimiento: date | None = None

    @field_validator("telefono")
    @classmethod
    def validar_telefono(cls, valor: str | None) -> str | None:
        if valor is None:
            return None

        valor = valor.strip()

        if not valor.replace("+", "", 1).isdigit():
            raise ValueError(
                "El teléfono solo puede contener números y un signo + inicial"
            )

        return valor

    @field_validator("ciudad")
    @classmethod
    def validar_ciudad(cls, valor: str | None) -> str | None:
        if valor is None:
            return None

        valor = valor.strip()

        if len(valor) < 2:
            raise ValueError(
                "La ciudad debe contener al menos 2 caracteres"
            )

        return valor

    @field_validator("fecha_nacimiento")
    @classmethod
    def validar_fecha_nacimiento(
        cls,
        valor: date | None,
    ) -> date | None:
        if valor is None:
            return None

        if valor > date.today():
            raise ValueError(
                "La fecha de nacimiento no puede estar en el futuro"
            )

        return valor