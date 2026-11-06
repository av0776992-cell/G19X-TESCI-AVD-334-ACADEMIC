# Preparación de datos ficticios — corte 7

Esta mejora incorpora `backend/scripts/preparar_demo_corte7.py` y pruebas aisladas.
**No hay que crear ni modificar bases de datos para validar el código y sus tests.**

## Qué hace

- Prepara una vacante reservada: `[DEMO C7] Desarrollador Backend Jr.` con experiencia mínima de **6 meses**, nivel académico **Técnico**, cuatro habilidades y cuatro competencias.
- Crea, si no existen, un administrador ficticio, un reclutador ficticio y tres candidatos (**Ana/Maestría**, **Beto/Ingeniería**, **Carla/Técnico**) con perfiles, experiencia, habilidades, competencias, evaluación técnica, postulación y PDF ficticio.
- No usa IDs fijos ni correos `.test` y no duplica registros al volver a ejecutarse. Los correos de prueba son `demo.c7.*@example.com`.
- No genera puntajes ni decisiones: se calculan desde la interfaz para mostrar los tres roles y que las decisiones sean humanas.
- **No toca `ranking_candidatos`**: verifica la base a través de la conexión PostgreSQL real y únicamente acepta `ranking_corte7_demo`.

## Verificar ahora, sin cambiar PostgreSQL

Desde la carpeta principal del proyecto:

```powershell
cd .\backend
..\.venv\Scripts\python.exe -m pytest tests -q
```

## Ejecución posterior en un entorno de demostración

Sólo cuando se decida hacer una prueba completa en una **base independiente** creada y migrada con Alembic:

1. Configurar la conexión desde el `.env` o la variable `DB_NAME` para que apunte a **`ranking_corte7_demo`**; no cambiar la contraseña de PostgreSQL ni reemplazar la base original.
2. Desde `backend`, ejecutar `python -m scripts.preparar_demo_corte7` para comprobar la conexión **sin escribir**.
3. Si identifica la base correcta, ejecutar `python -m scripts.preparar_demo_corte7 --aplicar`; confirmar por escrito el nombre y proporcionar una contraseña nueva de al menos 12 caracteres para las cuentas ficticias (no aparece en pantalla). Este comando crea datos ficticios solo en la base demo.
4. Iniciar la API y el frontend conectados a esa base, elegir la vacante DEMO C7 desde el rol reclutador y pulsar «Calcular ranking de toda la vacante». Resultado esperado de los indicadores: **3 postulaciones completas**, sin datos faltantes. Los puntajes exactos dependen del modelo cargado.
5. Abrir la clasificación con reclutador/administrador, confirmar que las tres personas tienen puntaje, revisar los PDF, realizar una decisión con administrador y consultarla con candidato.

**Precaución:** los datos y evaluaciones son inventados; no constituyen evidencia de validez de la IA para contratar personas reales.
