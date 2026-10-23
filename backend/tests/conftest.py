"""Variables ficticias para pruebas; las pruebas nunca abren PostgreSQL."""

import os

# Se configuran antes de importar la API y los modelos de SQLAlchemy.
CONFIGURACION_PRUEBAS = {
    "DB_HOST": "127.0.0.1",
    "DB_PORT": "5432",
    "DB_NAME": "bd_pruebas_ficticia",
    "DB_USER": "usuario_ficticio",
    "DB_PASSWORD": "clave_ficticia",
    "JWT_SECRET_KEY": "solo-para-pruebas-unitarias-no-usar-en-produccion",
    "JWT_ALGORITHM": "HS256",
    "JWT_EXPIRE_MINUTES": "60",
}

for variable, valor in CONFIGURACION_PRUEBAS.items():
    os.environ.setdefault(variable, valor)
