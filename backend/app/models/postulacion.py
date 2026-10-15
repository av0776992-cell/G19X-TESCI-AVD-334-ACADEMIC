
from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Postulacion(Base):
    __tablename__ = "postulaciones"

    __table_args__ = (
        UniqueConstraint(
            "candidato_id",
            "vacante_id",
            name="uq_postulacion_candidato_vacante",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    candidato_id: Mapped[int] = mapped_column(
        ForeignKey("candidatos.id"),
        nullable=False,
    )

    vacante_id: Mapped[int] = mapped_column(
        ForeignKey("vacantes.id"),
        nullable=False,
    )

    fecha_postulacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    candidato: Mapped["Candidato"] = relationship()

    vacante: Mapped["Vacante"] = relationship()
