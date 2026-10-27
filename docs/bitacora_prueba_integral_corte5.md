# Bitácora de pruebas integrales — Corte 5

**Proyecto:** Sistema de Ranking Predictivo de Candidatos  
**Periodo de evidencia:** 26–27 de octubre de 2026  
**Tecnologías:** FastAPI, PostgreSQL 18.6, Alembic, React/Vite, scikit-learn  
**Alcance:** pruebas automatizadas, interfaz de ranking y avance de instalación desde una base vacía. **No corresponde aún a una ejecución integral terminada.**

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

## 3. Incidencias y resolución

**INC-01 — Columnas faltantes en una instalación limpia.** La revisión previa de Alembic terminó sin error, pero el modelo SQLAlchemy de vacantes consultó columnas que no se habían creado. La revisión `a52c67d901fe` agregó de forma condicional `experiencia_minima_meses` y `nivel_estudios_requerido`; después se pudo crear la vacante y asignar requisitos. **Pendiente de publicar:** confirmar que esa migración esté versionada en GitHub académico y repetir `alembic upgrade head` sobre una base vacía en la revisión final.

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

Se verificaron la reproducibilidad estructural de PostgreSQL/Alembic, la carga de datos iniciales, pruebas automatizadas y funciones puntuales del ranking en el navegador. **No se afirma haber completado la prueba integral de los tres roles en la nueva base**. El resultado más importante fue detectar y corregir una migración que impedía la creación de vacantes en una instalación desde cero.
