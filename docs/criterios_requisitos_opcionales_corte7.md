# Corte 7 — Cómo interpretar requisitos opcionales en el ranking

**Cambio:** El ranking no debe dejar todas las postulaciones en "pendiente"
solo porque la vacante no especifica algún requisito.

- **Experiencia:** `NULL` o `0` meses requeridos = `100` de compatibilidad con
  la vacante. Un valor negativo sigue siendo inválido (`None`).
- **Formación:** requisito de nivel no establecido (`NULL` o texto vacío) =
  `100` de compatibilidad. Si la vacante sí exige nivel, una formación ausente
  o irreconocible sigue siendo **pendiente** (`None`).
- **Habilidades y competencias:** sin requisitos asignados = `100` de
  compatibilidad; si sí existen requisitos y faltan datos, sigue **pendiente**.
- **Evaluación:** siempre necesita puntuación válida registrada por el
  reclutador. Sin evaluación el ranking permanece **pendiente**.

## Advertencia interpretativa

El valor `100` aquí representa **cumplimiento de un requisito no exigido**,
no prueba que el candidato tenga esas capacidades ni significa que su nivel
sea 100/100. Se mantiene el modelo Random Forest original, que requiere
cinco indicadores numéricos. Su puntuación continúa siendo **experimental**,
por usar datos de entrenamiento sintéticos, y no debe asumirse como evaluación
validada de aptitud laboral. Si se requiere una política distinta para los
indicadores "no aplicables", tendrá que justificarse y reentrenar el modelo.

## Prueba de regresión

Desde `backend`:

```powershell
..\.venv\Scripts\python.exe -m pytest tests -q
```

Los tests `test_requisitos_opcionales_corte7.py` usan **SQLite en memoria**:
ningún test cambia PostgreSQL o la base de trabajo.

Se cubren: vacante completamente sin requisitos, cálculo masivo con
reclutador evaluando, evaluación faltante, requisitos existentes y datos
faltantes, y requisitos históricos inválidos. **No ejecutar migraciones**
por este ajuste: no modifica tablas ni modelos SQLAlchemy.
