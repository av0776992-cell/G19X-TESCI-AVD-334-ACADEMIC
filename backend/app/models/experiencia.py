
from datetime import date

from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Experiencia(Base):
    __tablename__ = "experiencias"

    id: Mapped[int] = mapped_column(primary_key=True)

    candidato_id: Mapped[int] = mapped_column(
        ForeignKey("candidatos.id"),
        nullable=False,
    )

    empresa: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    puesto: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    descripcion: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    fecha_inicio: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    fecha_fin: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    candidato: Mapped["Candidato"] = relationship()
