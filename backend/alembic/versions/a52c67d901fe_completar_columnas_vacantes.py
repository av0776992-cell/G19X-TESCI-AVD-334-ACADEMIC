"""Completar columnas de vacantes para nuevas instalaciones.

Revision ID: a52c67d901fe
Revises: f1ffe31f4824

Las columnas aparecen en el modelo SQLAlchemy, pero no se creaban
mediante las revisiones previas. IF NOT EXISTS permite actualizar
instalaciones que hayan agregado estas columnas manualmente.
"""

from alembic import op

revision = "a52c67d901fe"
down_revision = "f1ffe31f4824"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # El proyecto usa PostgreSQL. La operación no modifica valores existentes.
    op.execute(
        "ALTER TABLE vacantes "
        "ADD COLUMN IF NOT EXISTS experiencia_minima_meses INTEGER"
    )
    op.execute(
        "ALTER TABLE vacantes "
        "ADD COLUMN IF NOT EXISTS nivel_estudios_requerido VARCHAR(100)"
    )


def downgrade() -> None:
    # No podemos saber si estas columnas ya existían con datos de negocio
    # antes de aplicar la revisión. Bloqueamos un borrado automático.
    raise RuntimeError(
        "Downgrade bloqueado: retirar estas columnas puede borrar "
        "informacion existente. Hacer una migracion reversible "
        "tras revisar el historial de la base."
    )
