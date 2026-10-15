from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Decision(Base):
    __tablename__ = "decisiones"

    __table_args__ = (
        UniqueConstraint(
            "postulacion_id",
            name="uq_decision_postulacion"
        ),
        CheckConstraint(
            "decision IN ('ACEPTADO', 'RECHAZADO')",
            name="ck_decision_resultado"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    postulacion_id: Mapped[int] = mapped_column(
        ForeignKey("postulaciones.id"),
        nullable=False
    )

    administrador_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id"),
        nullable=False
    )

    decision: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    justificacion: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    fecha_decision: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    postulacion: Mapped["Postulacion"] = relationship()

    administrador: Mapped["Usuario"] = relationship()