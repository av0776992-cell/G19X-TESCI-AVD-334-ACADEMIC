
from sqlalchemy import ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class VacanteHabilidad(Base):
    __tablename__ = "vacante_habilidades"

    __table_args__ = (
        UniqueConstraint(
            "vacante_id",
            "habilidad_id",
            name="uq_vacante_habilidad",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    vacante_id: Mapped[int] = mapped_column(
        ForeignKey("vacantes.id"),
        nullable=False,
    )

    habilidad_id: Mapped[int] = mapped_column(
        ForeignKey("habilidades.id"),
        nullable=False,
    )

    nivel_requerido: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    vacante: Mapped["Vacante"] = relationship()

    habilidad: Mapped["Habilidad"] = relationship()
