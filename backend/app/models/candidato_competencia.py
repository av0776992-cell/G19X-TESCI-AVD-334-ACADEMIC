
from sqlalchemy import ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CandidatoCompetencia(Base):
    __tablename__ = "candidato_competencias"

    __table_args__ = (
        UniqueConstraint(
            "candidato_id",
            "competencia_id",
            name="uq_candidato_competencia",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    candidato_id: Mapped[int] = mapped_column(
        ForeignKey("candidatos.id"),
        nullable=False,
    )

    competencia_id: Mapped[int] = mapped_column(
        ForeignKey("competencias.id"),
        nullable=False,
    )

    nivel: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    candidato: Mapped["Candidato"] = relationship()

    competencia: Mapped["Competencia"] = relationship()
