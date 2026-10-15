
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ResultadoRanking(Base):
    __tablename__ = "resultados_ranking"

    __table_args__ = (
        CheckConstraint(
            "puntaje >= 0 AND puntaje <= 100",
            name="ck_resultado_ranking_puntaje",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    postulacion_id: Mapped[int] = mapped_column(
        ForeignKey("postulaciones.id"),
        nullable=False,
    )

    puntaje: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    metodo: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    version_modelo: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    explicacion: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    fecha_calculo: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    postulacion: Mapped["Postulacion"] = relationship()
