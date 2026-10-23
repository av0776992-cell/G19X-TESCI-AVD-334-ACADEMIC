
"""
Configuracion para ejecutar las pruebas unitarias
sin necesitar una conexion real a PostgreSQL.
"""

import os

CONFIGURACION_PRUEBAS = {
    "DB_HOST": "127.0.0.1",
    "DB_PORT": "5432",
    "DB_NAME": "bd_pruebas_ficticia",
    "DB_USER": "usuario_ficticio",
    "DB_PASSWORD": "clave_ficticia",
}

for variable, valor in CONFIGURACION_PRUEBAS.items():
    os.environ.setdefault(variable, valor)
