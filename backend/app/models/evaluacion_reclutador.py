
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class EvaluacionReclutador(Base):
    __tablename__ = "evaluacion_reclutador"

    __table_args__ = (
        UniqueConstraint(
            "postulacion_id",
            name="uq_evaluacion_reclutador_postulacion",
        ),
        CheckConstraint(
            "recomendacion >= 1 AND recomendacion <= 5",
            name="ck_evaluacion_reclutador_recomendacion",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    postulacion_id: Mapped[int] = mapped_column(
        ForeignKey("postulaciones.id"),
        nullable=False,
    )

    reclutador_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id"),
        nullable=False,
    )

    recomendacion: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    resumen: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    fecha_evaluacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    postulacion: Mapped["Postulacion"] = relationship()

    reclutador: Mapped["Usuario"] = relationship()
