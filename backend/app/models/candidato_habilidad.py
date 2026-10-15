
from sqlalchemy import ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CandidatoHabilidad(Base):
    __tablename__ = "candidato_habilidades"

    __table_args__ = (
        UniqueConstraint(
            "candidato_id",
            "habilidad_id",
            name="uq_candidato_habilidad",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    candidato_id: Mapped[int] = mapped_column(
        ForeignKey("candidatos.id"),
        nullable=False,
    )

    habilidad_id: Mapped[int] = mapped_column(
        ForeignKey("habilidades.id"),
        nullable=False,
    )

    nivel: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    candidato: Mapped["Candidato"] = relationship()

    habilidad: Mapped["Habilidad"] = relationship()
