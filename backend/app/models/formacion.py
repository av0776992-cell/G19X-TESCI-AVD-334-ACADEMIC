
from datetime import date

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Formacion(Base):
    __tablename__ = "formaciones"

    id: Mapped[int] = mapped_column(primary_key=True)

    candidato_id: Mapped[int] = mapped_column(
        ForeignKey("candidatos.id"),
        nullable=False,
    )

    institucion: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    titulo: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    nivel: Mapped[str | None] = mapped_column(
        String(50),
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
