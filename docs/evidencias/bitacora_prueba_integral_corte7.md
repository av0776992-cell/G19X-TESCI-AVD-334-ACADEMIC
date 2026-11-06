# Bitácora de verificación — corte 7

**Proyecto:** Sistema de Ranking Predictivo de Candidatos
**Fecha de registro:** 6 de noviembre de 2026
**Commit de referencia antes de actualizar documentación:** `e5607d3`
**Rama publicada:** `academico/main`
**Tipo de evidencia:** resultados enviados por la desarrolladora y retroalimentación del evaluador; los dos orígenes se identifican por separado.

> Esta bitácora **no afirma** que la demostración de tres candidatos se haya ejecutado ya con las correcciones del 6 de noviembre. Tampoco contiene contraseñas ni datos personales de candidatos reales.

## 1. Referencias y alcance

- **Revisión funcional externa — 1 de noviembre de 2026:** el reporte del corte 7, fechado el 2 de noviembre, declara que se clonó el proyecto en otra computadora, se instaló desde cero, se ejecutaron migraciones y se probó el ciclo de los tres roles. Esa revisión se hizo **antes** de las correcciones del corte 7; observó que Ana (Maestría) y Carla (Ingeniería) quedaban pendientes por formación y que la vacante del script carecía de requisitos mínimos. La evidencia visual original está en la galería «De nuestra revisión» del SGPA, no adjunta aquí.
- **Validación local — 6 de noviembre de 2026:** la desarrolladora compartió resultados de Pytest, ESLint, Vite y Git en PowerShell para las mejoras publicadas hasta `e5607d3`.
- **Datos ficticios del nuevo guion:** Ana/Maestría, Beto/Ingeniería y Carla/Técnico. El script está incluido, pero **no se ejecutó** en una base nueva durante esta sesión.

## 2. Resultado de verificaciones registradas

| Fecha | Commit / versión | Acción | Resultado observado | Estado |
| --- | --- | --- | --- | --- |
| 1-nov-2026 | Versión revisada antes del corte 7 | Instalación independiente, Alembic, pruebas y recorrido de roles | Reportado por evaluador: instalación desde cero, `alembic check` sin diferencias, 37 pruebas, lint/build, registro, PDF, evaluación, decisión y permisos correctos | Verificado según informe externo |
| 1-nov-2026 | Versión revisada antes del corte 7 | Ranking con cuatro candidatos | Reportado por evaluador: dos puntuaciones calculadas y dos pendientes por niveles; vacante del script sin requisitos suficientes | Incidencias de revisión |
| 6-nov-2026 | `bc77383` | Normalización de niveles académicos | 65 pruebas aprobadas; ESLint y build sin errores | Correcto en validación automatizada |
| 6-nov-2026 | `84b15b4` | Preparador de datos ficticios, seguro e idempotente | 68 pruebas aprobadas | Correcto en validación automatizada; carga real no ejecutada |
| 6-nov-2026 | `eae5ffd` | Requisitos opcionales del ranking | 73 pruebas aprobadas; `git diff --check` sin errores | Correcto en validación automatizada |
| 6-nov-2026 | `2dcb13a` | Configuración CORS y mensajes del backend | 89 pruebas aprobadas; `git diff --check` sin errores | Correcto en validación automatizada |
| 6-nov-2026 | `e5607d3` | Nombres en postulaciones y selectores | **92 pruebas aprobadas en 3.85 s**, `npm --prefix .\frontend run lint` sin errores, `npm --prefix .\frontend run build` exitoso (**39 módulos**); `git diff --check` sin errores | Correcto en validación automatizada |

Los conteos de pruebas son **sucesivos**, no acumulativos: el total más reciente es 92, no la suma de las filas.

## 3. Criterios aún pendientes de evidencia manual

| Paso | Rol | Acción pendiente | Resultado esperado | Resultado observado |
| --- | --- | --- | --- | --- |
| 1 | Instalación | Preparar una base PostgreSQL independiente `ranking_corte7_demo`, aplicar migraciones y comprobar conexión real | Instalación limpia y verificable | **No ejecutado con la versión actual** |
| 2 | Preparación | Ejecutar el preparador primero en modo revisión y luego, solo en base aislada, con `--aplicar` | Tres postulaciones ficticias con datos completos, sin duplicados | **No ejecutado** |
| 3 | Administrador | Seleccionar vacante y requisitos por título/nombre | Selectores correctos y datos correspondientes | **No verificado manualmente** |
| 4 | Reclutador | Consultar postulaciones con nombres, evaluaciones y PDF | Nombres, títulos y descarga correcta | **No verificado manualmente** |
| 5 | Reclutador/administrador | Calcular ranking masivo de Ana, Beto y Carla | **3 calculadas, 0 pendientes, 0 errores** | **No ejecutado** |
| 6 | Administrador | Comprobar tabla ordenada y registrar una decisión | Tres puntuaciones y decisión humana visible | **No ejecutado** |
| 7 | Candidato | Consultar decisión con permisos de candidato | Resultado propio visible; datos ajenos protegidos | **No ejecutado en nueva demo** |
| 8 | Documentación | Registrar capturas, commit definitivo y resultados reales | Evidencia trazable sin secretos | Pendiente de las comprobaciones anteriores |

**Precaución:** el script `preparar_demo_corte7.py` rechaza cualquier base cuyo nombre real no sea `ranking_corte7_demo`. No se debe cambiar la configuración de la base de desarrollo `ranking_candidatos` para ejecutar las pruebas automatizadas.

## 4. Conclusión provisional

El corte 7 tiene **cinco correcciones publicadas** y **92 pruebas aprobadas**, además de compilación React y lint correctos. El informe externo confirmó la posibilidad de instalar y recorrer una versión anterior, y sus fallos de niveles y requisitos motivaron las correcciones actuales. Para cerrar la evidencia funcional en la versión publicada, aún es necesario observar el cálculo de tres candidatos reales de demostración sobre una **instalación independiente**, comprobar las nuevas listas y documentar capturas y resultados sin exponer secretos.
