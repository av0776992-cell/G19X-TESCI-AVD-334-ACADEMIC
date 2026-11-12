# Bitácora de verificación — corte 7

**Proyecto:** Sistema de Ranking Predictivo de Candidatos
**Fecha de registro:** 6 de noviembre de 2026
**Commit de referencia antes de actualizar documentación:** `e5607d3`
**Rama publicada:** `academico/main`
**Tipo de evidencia:** resultados enviados por la desarrolladora y retroalimentación del evaluador; los dos orígenes se identifican por separado.

> **Actualización del 6-nov-2026, `f9b8d2e`:** sí se ejecutó la demostración de tres candidatos sobre una base PostgreSQL nueva, pero **desde el directorio de desarrollo existente**, no en un clon nuevo. Posteriormente se comprobaron la decisión de la administradora y su consulta desde la cuenta de Ana (evidencia `b33db1f`); solo queda pendiente repetir la instalación de la versión final desde un clon limpio. No se incluyen contraseñas ni datos personales reales.

## 1. Referencias y alcance

- **Revisión funcional externa — 1 de noviembre de 2026:** el reporte del corte 7, fechado el 2 de noviembre, declara que se clonó el proyecto en otra computadora, se instaló desde cero, se ejecutaron migraciones y se probó el ciclo de los tres roles. Esa revisión se hizo **antes** de las correcciones del corte 7; observó que Ana (Maestría) y Carla (Ingeniería) quedaban pendientes por formación y que la vacante del script carecía de requisitos mínimos. La evidencia visual original está en la galería «De nuestra revisión» del SGPA, no adjunta aquí.
- **Validación local — 6 de noviembre de 2026:** la desarrolladora compartió resultados de Pytest, ESLint, Vite y Git en PowerShell para las mejoras publicadas hasta `e5607d3`.
- **Datos ficticios del nuevo guion:** Ana/Maestría, Beto/Ingeniería y Carla/Técnico. El script se ejecutó después, el 6-nov-2026, en una base nueva `ranking_corte7_demo`; ver resultados manuales y commit `f9b8d2e`.

## 2. Resultado de verificaciones registradas

| Fecha | Commit / versión | Acción | Resultado observado | Estado |
| --- | --- | --- | --- | --- |
| 1-nov-2026 | Versión revisada antes del corte 7 | Instalación independiente, Alembic, pruebas y recorrido de roles | Reportado por evaluador: instalación desde cero, `alembic check` sin diferencias, 37 pruebas, lint/build, registro, PDF, evaluación, decisión y permisos correctos | Verificado según informe externo |
| 1-nov-2026 | Versión revisada antes del corte 7 | Ranking con cuatro candidatos | Reportado por evaluador: dos puntuaciones calculadas y dos pendientes por niveles; vacante del script sin requisitos suficientes | Incidencias de revisión |
| 6-nov-2026 | `bc77383` | Normalización de niveles académicos | 65 pruebas aprobadas; ESLint y build sin errores | Correcto en validación automatizada |
| 6-nov-2026 | `84b15b4` | Preparador de datos ficticios, seguro e idempotente | 68 pruebas aprobadas | Correcto en validación automatizada; carga real realizada posteriormente (6-nov-2026, `f9b8d2e`) |
| 6-nov-2026 | `eae5ffd` | Requisitos opcionales del ranking | 73 pruebas aprobadas; `git diff --check` sin errores | Correcto en validación automatizada |
| 6-nov-2026 | `2dcb13a` | Configuración CORS y mensajes del backend | 89 pruebas aprobadas; `git diff --check` sin errores | Correcto en validación automatizada |
| 6-nov-2026 | `e5607d3` | Nombres en postulaciones y selectores | **92 pruebas aprobadas en 3.85 s**, `npm --prefix .\frontend run lint` sin errores, `npm --prefix .\frontend run build` exitoso (**39 módulos**); `git diff --check` sin errores | Correcto en validación automatizada |

Los conteos de pruebas son **sucesivos**, no acumulativos: el total más reciente es 92, no la suma de las filas.

## 3. Resultados de la demostración y comprobaciones pendientes

| Paso | Rol | Acción | Resultado esperado | Resultado observado |
| --- | --- | --- | --- | --- |
| 1 | Instalación | Preparar una base PostgreSQL independiente `ranking_corte7_demo`, aplicar migraciones y comprobar conexión real | Instalación limpia y verificable | Base `ranking_corte7_demo` creada y migraciones aplicadas hasta `a52c67d901fe` el 6-nov-2026. **No se usó un clon nuevo**. |
| 2 | Preparación | Ejecutar el preparador primero en modo revisión y luego, solo en base aislada, con `--aplicar` | Tres postulaciones ficticias con datos completos, sin duplicados | Modo revisión confirmado; `--aplicar` creó 3 postulaciones, 3 evaluaciones y 3 PDF ficticios; 5 de 5 indicadores completos. |
| 3 | Administrador | Seleccionar vacante y requisitos por título/nombre | Selectores correctos y datos correspondientes | Se observó en la interfaz la selección por título y por nombre de requisitos (sobre la base habitual). |
| 4 | Reclutador | Consultar postulaciones con nombres, evaluaciones y PDF | Nombres, títulos y descarga correcta | Se observaron nombres y títulos en las listas; descarga PDF y flujo completo aún sin repetir en la base nueva. |
| 5 | Reclutador/administrador | Calcular ranking masivo de Ana, Beto y Carla | **3 calculadas, 0 pendientes, 0 errores** | **3 calculadas, 0 pendientes, 0 errores**. Ranking observado en React: Ana 86.95, Beto 86.86, Carla 71.28; evidencia `f9b8d2e`. |
| 6 | Administrador | Comprobar tabla ordenada y registrar una decisión | Tres puntuaciones y decisión humana visible | Se comprobó la decisión final **Aceptado** para Ana, registrada por la administradora en `ranking_corte7_demo` el 6-nov-2026. Evidencia `b33db1f`. |
| 7 | Candidato | Consultar decisión con permisos de candidato | Resultado propio visible; datos ajenos protegidos | Ana inició sesión en su cuenta ficticia y consultó «Mis postulaciones»: estado **Aceptado**, decisión final **Aceptado**, fecha 6-nov-2026. Evidencia visual y commit `b33db1f`. **No se repitió en un clon nuevo.** |
| 8 | Documentación | Registrar capturas, commit definitivo y resultados reales | Evidencia trazable sin secretos | Ranking incorporado al commit `f9b8d2e`; decisión final documentada en `b33db1f`. Las capturas están organizadas en `docs/evidencias/capturas/`, con índice `docs/evidencias/indice_capturas_2026-11-06.md`. |

**Precaución:** el script `preparar_demo_corte7.py` rechaza cualquier base cuyo nombre real no sea `ranking_corte7_demo`. No se debe cambiar la configuración de la base de desarrollo `ranking_candidatos` para ejecutar las pruebas automatizadas.

## 4. Conclusión provisional

El corte 7 tiene **cinco correcciones publicadas** y **92 pruebas aprobadas**, además de compilación React y lint correctos. El informe externo confirmó la posibilidad de instalar y recorrer una versión anterior, y sus fallos de niveles y requisitos motivaron las correcciones actuales. El 6-nov-2026 se ejecutó la demostración en `ranking_corte7_demo` (base nueva, carpeta de desarrollo existente), y se observaron **3 calculadas, 0 pendientes, 0 errores**, con Ana, Beto y Carla ordenados. Evidencia `f9b8d2e`. También se comprobó la decisión final del administrador y su visibilidad para Ana, evidencia `b33db1f`. **Queda pendiente como principal comprobación repetir la instalación integral desde un clon limpio de la versión final.**

## Validacion funcional - 6 de noviembre de 2026

Commit probado: ed3a18d
Base: ranking_corte7_demo
Vacante: [DEMO C7] Desarrollador Backend Jr.

Resultado del ranking masivo:
- Total de postulaciones: 3
- Calculadas: 3
- Pendientes: 0
- Errores: 0
- Primer lugar: Ana, 86.95/100
- Segundo lugar: Beto, 86.86/100
- Tercer lugar: Carla, 71.28/100

Resultado: APROBADO.
Se comprobaron en React los tres puntajes y su orden.
La prueba utilizo datos ficticios sin modificar la base original.

## Validacion de decision final - 6 de noviembre de 2026

Commit probado: b151d6f
Base: ranking_corte7_demo
Vacante: [DEMO C7] Desarrollador Backend Jr.
Postulacion: #1 - Ana (DEMO C7)

Administrador:
- Registro la decision final "Aceptado".

Candidata Ana:
- Inicio sesion con su cuenta de demostracion.
- Consulto la seccion "Mis postulaciones".
- Estado observado: Aceptado.
- Decision final observada: Aceptado.
- Fecha de decision: 6 de noviembre de 2026.

Resultado: APROBADO.
Se comprobo visualmente que la candidata puede consultar
la decision registrada por el administrador.

Nota: prueba realizada con base nueva de demostracion,
sin repetir todo el proceso en un clon independiente.

## 5. Capturas adjuntas y alcance

Las capturas originales del 6-nov-2026 se organizan en [el índice de evidencias](indice_capturas_2026-11-06.md). Proceden de la ejecución local de la demostración en `ranking_corte7_demo` y de la comprobación visual de selectores. **No representan una nueva instalación limpia realizada el 12-nov-2026**.

## Validacion de instalacion limpia - 12 de noviembre de 2026

Commit probado: a100db5
Carpeta independiente: Sistema-Ranking-Candidatos-Validacion
Base nueva: ranking_validacion_final

Resultados:
- Dependencias Python: instalacion correcta.
- Dependencias React: npm ci correcto.
- Pytest: 92 pruebas aprobadas.
- ESLint: sin errores.
- Vite build: correcto.
- Alembic: a52c67d901fe (head).
- Alembic check: sin nuevas migraciones.
- Catalogos inicializados correctamente.
- Random Forest: MAE 1.7535, R2 0.9724.
- FastAPI /docs: HTTP 200.
- React: pantalla de inicio visible en localhost:5173.

Resultado: INSTALACION Y ARRANQUE APROBADOS.

Observacion:
El recorrido integral de tres roles se comprobo previamente
en ranking_corte7_demo, no en esta nueva base.

npm audit reporto cuatro alertas moderadas en dependencias
de desarrollo; no se aplicaron cambios automaticos.
