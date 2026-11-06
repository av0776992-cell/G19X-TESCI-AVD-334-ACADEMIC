# Corte 7 — CORS configurable y texto de vacantes

## Orígenes de React permitidos por el backend

El backend lee `CORS_ORIGINS` desde `backend/.env` o desde una variable de
entorno del sistema. Es una lista de **orígenes**, separados por coma, con
esquema y puerto (cuando aplique), **sin rutas** ni diagonales al final.

Ejemplo para una instalación donde Vite utilice el puerto 5173:

```dotenv
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Si Vite inicia en 5174, agregarlo de forma explícita:

```dotenv
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174
```

Para un frontend desplegado con HTTPS:

```dotenv
CORS_ORIGINS=https://frontend.example.com
```

`example.com` es un nombre ilustrativo, no una dirección de producción.

**Compatibilidad:** Si la variable no se declara, se conservan los orígenes
anteriores `http://localhost:5173` y `http://127.0.0.1:5173`.
No cambies la contraseña o el nombre de la base de datos para configurar CORS.

Cualquier modificación a `CORS_ORIGINS` necesita reiniciar FastAPI.
Si se declara un origen inválido, el backend produce un error descriptivo al
iniciar, en vez de permitir todos los sitios con `*`.

El frontend usa encabezado `Authorization: Bearer`; las cookies de sesión
no están habilitadas (`allow_credentials=False`).

## Corrección de texto

Se corrigió el mensaje de validación en `backend/app/routers/vacantes.py`:
«El título y la descripción no pueden estar vacíos».

## Pruebas

`backend/tests/test_cors_corte7.py` comprueba configuración predeterminada,
lectura de la variable, eliminación de duplicados, rechazo de valores
inválidos y peticiones OPTIONS reales para orígenes permitidos y no permitidos.
Las pruebas no modifican ninguna base de datos.
