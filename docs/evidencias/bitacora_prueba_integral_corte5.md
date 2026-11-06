# Bitácora de pruebas integrales — Corte 5

**Proyecto:** Sistema de Ranking Predictivo de Candidatos
**Periodo de evidencia:** 26–27 de octubre de 2026
**Tecnologías:** FastAPI, PostgreSQL 18.6, Alembic, React/Vite, scikit-learn
**Alcance:** pruebas automatizadas, interfaz de ranking, avance de instalación desde una base vacía y validación manual de los tres roles en la base de desarrollo. **No corresponde aún a una ejecución integral terminada sobre una única instalación nueva.**

## 1. Bases utilizadas

- **`ranking_candidatos`:** base original de desarrollo. Se volvió a usar para continuar el trabajo habitual. No se recreó ni se vació durante la prueba documentada.
- **`ranking_corte5_demo`:** base independiente creada para comprobar migraciones, catálogos y cuentas. Las operaciones de esta bitácora sobre instalación nueva se realizaron aquí.

No se incluyen contraseñas, claves JWT, correos privados ni cadenas de conexión con secretos.

## 2. Registro de resultados observados

| ID | Comprobación | Resultado observado | Estado |
| --- | --- | --- | --- |
| P01 | Servicio PostgreSQL y cliente | Servicio PostgreSQL 18 en ejecución; cliente `psql` 18.6 localizado en la carpeta de instalación | Correcto |
| P02 | Conexión a demo | `SELECT current_database()` devolvió `ranking_corte5_demo` | Correcto |
| P03 | Instalación con Alembic en base vacía | 0 tablas al inicio; 21 tras `upgrade head` hasta `f1ffe31f4824` | Correcto |
| P04 | Primera carga de vacantes | Error por columna ausente `vacantes.experiencia_minima_meses`; revisión detectó también `nivel_estudios_requerido` | Incidencia detectada |
| P05 | Corrección de migraciones | Migración `a52c67d901fe` aplicada en demo; verificador indicó que todas las columnas de los modelos existen | Corregido en demo |
| P06 | Catálogos | 3 roles, 8 estados, 10 habilidades y 10 competencias registrados | Correcto |
| P07 | Vacante demo | «Desarrollador Backend Jr.» creada, ID 1; 4 habilidades y 4 competencias asignadas | Correcto |
| P08 | Cuentas de prueba | Administrador y reclutador creados en la base demo | Correcto |
| P09 | Pruebas automatizadas | 37 pruebas aprobadas en 2.86 s | Correcto |
| P10 | Validación frontend | `npm run lint` sin errores; `npm run build` exitoso, 38 módulos | Correcto |
| P11 | Cálculo masivo en navegador | Vacante ficticia con una postulación: 1 calculada, 0 pendientes, 0 errores, puntaje 86.97/100 | Correcto en entorno de desarrollo previo |
| P12 | Selector por título | Vacante de prueba seleccionada por título y clasificación consultada | Correcto en entorno de desarrollo previo |
| P13 | Inicio de sesión de los tres roles en la base demo | No se completó el recorrido en la misma instalación nueva | Pendiente |
| P14 | Perfil, postulación, evaluación y ranking de extremo a extremo en demo | No ejecutado en su totalidad | Pendiente |
| P15 | Orden real con varias postulaciones en una vacante | No demostrado en navegador con varios candidatos; cubierto parcialmente por prueba automatizada | Pendiente manual |
| P16 | Acceso a los tres roles en la base original | La desarrolladora confirmó manualmente que funcionan las cuentas y los paneles de candidato, reclutador y administrador en `ranking_candidatos` | Correcto en base de desarrollo |

## 3. Incidencias y resolución

**INC-01 — Columnas faltantes en una instalación limpia.** La revisión previa de Alembic terminó sin error, pero el modelo SQLAlchemy de vacantes consultó columnas que no se habían creado. La revisión `a52c67d901fe` agregó de forma condicional `experiencia_minima_meses` y `nivel_estudios_requerido`; después se pudo crear la vacante y asignar requisitos. **Publicación:** la migración se incorporó al repositorio académico mediante el commit `84aa8e5`. **Pendiente:** repetir la instalación íntegra en una base vacía durante la revisión final.

**INC-02 — Contraseña del usuario PostgreSQL modificada durante la prueba.** Hubo errores de autenticación hasta actualizar `DB_PASSWORD` en el `.env` local. Se confirmó el acceso posteriormente con `psql` y el script de continuación. No se deben versionar secretos.

**INC-03 — Script ejecutado por ruta que no exponía el paquete `app`.** La ejecución directa produjo `ModuleNotFoundError: No module named 'app'`. Se corrigió la invocación desde `backend/` con `python -m scripts.continuar_demo_corte5`.

## 4. Prueba integral pendiente (guion verificable)

| Paso | Rol | Acción | Evidencia esperada |
| --- | --- | --- | --- |
| 1 | Administrador | Autenticarse y listar vacantes de demostración | Panel visible y vacante identificable por título |
| 2 | Candidato | Registrarse con cuenta ficticia e iniciar sesión | Perfil candidato disponible |
| 3 | Candidato | Completar perfil, PDF ficticio y realizar postulación | Postulación visible en el sistema |
| 4 | Reclutador | Abrir la postulación y registrar su evaluación | Evaluación guardada correctamente |
| 5 | Administrador/reclutador | Elegir vacante por título y calcular ranking masivo | Resumen de calculadas, pendientes y errores |
| 6 | Administrador | Consultar tabla final y revisión humana | Último puntaje y orden visibles |
| 7 | Evaluador | Repetir la instalación en una base realmente vacía | Migraciones, catálogos, cuentas y flujo reproducibles |

**Criterio de cierre:** registrar los resultados observados de los pasos 1–7 y capturas no sensibles; si un paso falla, documentar el error real antes de marcarlo como aprobado.

## 5. Conclusión provisional

Se verificaron la reproducibilidad estructural de PostgreSQL/Alembic, la carga de datos iniciales, las pruebas automatizadas, las funciones puntuales del ranking y el acceso a los tres roles en la base original, según comprobación manual de la desarrolladora. **No se afirma haber completado la prueba integral de los tres roles en la nueva base**. El resultado más importante fue detectar y corregir una migración que impedía la creación de vacantes en una instalación desde cero.


## 6. Actualización de la validación manual

**Fecha de registro:** 27 de octubre de 2026.

La desarrolladora confirmó que las cuentas y los paneles de **candidato, reclutador y administrador** funcionan en la base de desarrollo habitual, `ranking_candidatos`. Esta confirmación complementa las pruebas previas de clasificación y cálculo masivo en navegador.

**Alcance y límite:** esta validación no sustituye la prueba integral de extremo a extremo sobre `ranking_corte5_demo` (registrar candidato, completar perfil, postular, evaluar y calcular), ni la verificación visual con varios candidatos. Esas evidencias permanecen pendientes.
