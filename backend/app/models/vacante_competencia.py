
from sqlalchemy import ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class VacanteCompetencia(Base):
    __tablename__ = "vacante_competencias"

    __table_args__ = (
        UniqueConstraint(
            "vacante_id",
            "competencia_id",
            name="uq_vacante_competencia",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    vacante_id: Mapped[int] = mapped_column(
        ForeignKey("vacantes.id"),
        nullable=False,
    )

    competencia_id: Mapped[int] = mapped_column(
        ForeignKey("competencias.id"),
        nullable=False,
    )

    nivel_requerido: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    vacante: Mapped["Vacante"] = relationship()

    competencia: Mapped["Competencia"] = relationship()
