from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class HistorialEstado(Base):
    __tablename__ = "historial_estados"

    id: Mapped[int] = mapped_column(primary_key=True)

    postulacion_id: Mapped[int] = mapped_column(
        ForeignKey("postulaciones.id"),
        nullable=False
    )

    estado_id: Mapped[int] = mapped_column(
        ForeignKey("estados.id"),
        nullable=False
    )

    fecha_cambio: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    postulacion: Mapped["Postulacion"] = relationship()

    estado: Mapped["Estado"] = relationship()