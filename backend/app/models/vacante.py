
from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Vacante(Base):
    __tablename__ = "vacantes"

    id: Mapped[int] = mapped_column(primary_key=True)

    titulo: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    descripcion: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    ubicacion: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    modalidad: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    estado: Mapped[str] = mapped_column(
        String(30),
        default="ABIERTA",
        nullable=False,
    )

    fecha_publicacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    fecha_cierre: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    experiencia_minima_meses: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    nivel_estudios_requerido: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
