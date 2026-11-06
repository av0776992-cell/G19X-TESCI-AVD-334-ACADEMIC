# Sistema de Ranking Predictivo de Candidatos

Aplicación web para apoyar el proceso de reclutamiento y selección de personal. Permite gestionar perfiles de candidatos, vacantes, postulaciones, requisitos y evaluaciones, así como generar un ranking de compatibilidad con apoyo de un modelo de aprendizaje automático.

> **Alcance:** el ranking es una herramienta de apoyo para el personal de reclutamiento y administración; no sustituye la revisión humana ni debe utilizarse como criterio único para aceptar o rechazar personas.

## 1. Funcionalidades principales

- **Candidato:** registro e inicio de sesión; gestión de formación académica, experiencia laboral, habilidades, competencias y documentos; consulta de vacantes y postulaciones.
- **Reclutador:** gestión y revisión de vacantes, candidatos, requisitos y evaluaciones, de acuerdo con sus permisos.
- **Administrador:** administración y supervisión del proceso; consulta de resultados y recomendaciones del ranking, de acuerdo con sus permisos.
- **Ranking predictivo:** cálculo de puntuaciones de compatibilidad mediante un modelo Random Forest entrenado inicialmente con **datos sintéticos**.

Algunas funciones pueden requerir datos iniciales y permisos específicos. El funcionamiento completo debe comprobarse al ejecutar el proyecto.

## 2. Tecnologías

| Componente | Tecnología |
| --- | --- |
| Backend / API REST | Python, FastAPI, Uvicorn |
| Base de datos | PostgreSQL |
| Migraciones | Alembic |
| Frontend | React, Vite, JavaScript |
| Aprendizaje automático | Python, Random Forest; modelo serializado en `.joblib` |
| Control de versiones | Git y GitHub |

## 3. Estructura general

```text
Sistema-Ranking-Candidatos/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   └── services/
│   ├── alembic/
│   ├── scripts/
│   ├── tests/
│   ├── main.py
│   ├── alembic.ini
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   └── package.json
├── ml/
│   ├── entrenar_modelo.py
│   └── models/
├── .gitignore
└── README.md
```

Las carpetas locales de entornos virtuales, archivos `.env`, bases de datos privadas y modelos generados no deben subirse al repositorio salvo que exista una razón documentada para hacerlo.

## 4. Requisitos previos

- Python y `pip` (el desarrollo local se ha trabajado con Python 3.13).
- Node.js y `npm` (el desarrollo local se ha trabajado con Node.js 24).
- PostgreSQL instalado y en funcionamiento.
- Git.

Los ejemplos siguientes están escritos para **Windows PowerShell** y parten de la carpeta raíz del repositorio.

## 5. Preparar el backend

### 5.1. Crear y activar un entorno virtual

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r .\backend\requirements.txt
```

Si ya existe un entorno virtual funcional, puede reutilizarse y omitirse su creación. No es necesario subirlo a Git.

### 5.2. Crear la base de datos

En PostgreSQL, crea una base de datos vacía para el proyecto y un usuario con permisos adecuados. Anota el nombre de la base de datos, usuario, contraseña, servidor y puerto: se utilizarán en `backend/.env`.

No compartas credenciales reales ni las publiques en GitHub.

### 5.3. Configurar variables de entorno

El archivo `backend/.env.example` contiene las variables necesarias para configurar el backend. Cópialo a `backend/.env` y reemplaza los valores ficticios por los correspondientes a tu instalación local:

```powershell
Copy-Item .\backend\.env.example .\backend\.env
```

Variables requeridas:

| Variable | Propósito |
| --- | --- |
| `DB_HOST` | Servidor de PostgreSQL, por ejemplo `localhost` |
| `DB_PORT` | Puerto de PostgreSQL, por ejemplo `5432` |
| `DB_NAME` | Nombre de la base de datos |
| `DB_USER` | Usuario de la base de datos |
| `DB_PASSWORD` | Contraseña local de la base de datos |
| `JWT_SECRET_KEY` | Clave secreta para tokens, generada de forma segura |
| `JWT_ALGORITHM` | Algoritmo JWT utilizado por el backend |
| `JWT_EXPIRE_MINUTES` | Vigencia de los tokens en minutos |

**Importante:** el archivo `backend/.env` contiene secretos y debe permanecer fuera del control de versiones. El `.env.example` únicamente contendrá valores ficticios.

### 5.4. Ejecutar migraciones

Con PostgreSQL iniciado, las variables configuradas y desde la raíz del repositorio:

```powershell
cd backend
python -m alembic upgrade head
```

Alembic utiliza `backend/alembic/versions/` para preparar el esquema. La revisión `a52c67d901fe` completa las columnas `vacantes.experiencia_minima_meses` y `vacantes.nivel_estudios_requerido`, que el modelo SQLAlchemy necesita y las revisiones anteriores no creaban en una instalación nueva. **Asegúrate de que esa migración se encuentre incluida en el repositorio** antes de instalar desde cero.

**Seguridad:** verifica `DB_NAME` y la conexión real antes de ejecutar migraciones o scripts que escriben datos. No ejecutes instrucciones de demostración sobre una base que contenga información real. Ante un error de autenticación, comprueba las credenciales de `backend/.env` sin publicarlas ni compartirlas.

### 5.5. Inicializar catálogos y datos de ejemplo

Después de configurar PostgreSQL y ejecutar `alembic upgrade head`, inicializa los catálogos necesarios para el funcionamiento del sistema.

**Todos los comandos siguientes se ejecutan desde la carpeta `backend/`, con el entorno virtual activado.**

#### Inicialización de catálogos

```powershell
python -m scripts.crear_roles
python -m scripts.crear_estados
python -m scripts.crear_habilidades
python -m scripts.crear_competencias
```

Estos scripts registran los roles del sistema, los estados de postulación y los catálogos de habilidades y competencias. Comprueban la existencia de los registros antes de crearlos.

#### Datos de demostración (opcionales)

```powershell
python -m scripts.crear_administrador_prueba
python -m scripts.crear_reclutador_prueba
python -m scripts.crear_vacante_prueba
python -m scripts.asignar_requisitos_vacante
```

Los scripts de usuarios de prueba solicitan contraseñas de forma interactiva (**al menos 12 caracteres**). La asignación de requisitos debe ejecutarse después de crear la vacante y los catálogos; puede modificar los niveles de requisitos ya existentes.

El script `completar_perfil_prueba.py` es opcional y debe ejecutarse únicamente después de verificar que existe el candidato con ID 1 y que los identificadores de habilidades y competencias corresponden a los registros esperados:

```powershell
python -m scripts.completar_perfil_prueba
```

**Precaución:** estos scripts modifican datos de PostgreSQL. Utiliza una base de datos de demostración cuando prepares una instalación nueva. Los scripts de restablecimiento de contraseñas son herramientas de mantenimiento y no forman parte de la instalación inicial.

#### Demostración reproducible del corte 7 (recomendada)

Para evitar los **IDs fijos** y la vacante incompleta de los scripts anteriores, se añadió `backend/scripts/preparar_demo_corte7.py`. Prepara una vacante con **experiencia mínima de 6 meses, formación Técnica, cuatro habilidades y cuatro competencias**, junto con tres postulaciones de datos enteramente ficticios: **Ana (Maestría), Beto (Ingeniería) y Carla (Técnico)**, sus evaluaciones y documentos PDF de prueba. No genera puntajes ni decisiones: se calculan y revisan posteriormente en la interfaz.

- **Seguridad:** el script **solo admite** una conexión real a PostgreSQL cuyo nombre de base sea exactamente `ranking_corte7_demo`. Rechaza `ranking_candidatos` y otras bases. No hace falta crear ni modificar otra base para ejecutar las pruebas unitarias.
- **Repetibilidad:** busca los registros por campos identificables en vez de asumir IDs, y evita duplicar los datos que ya preparó.
- **Correos ficticios:** usa cuentas `demo.c7.*@example.com`; no utilices `@example.test`, que puede producir un error de validación 422.
- **Contraseña:** cuando se aplique en un entorno aislado, solicitará una contraseña de prueba de al menos 12 caracteres mediante entrada oculta. **No la registres en Git**.

Cuando exista voluntariamente esa base de demostración independiente, primero revisa la conexión **sin escribir datos**:

```powershell
python -m scripts.preparar_demo_corte7
```

La ejecución con `--aplicar` **es opcional** y debe hacerse solamente tras confirmar la base de demostración; consulta [`docs/guia_demo_corte7.md`](docs/guia_demo_corte7.md). No se necesita para usar la base original ni para las pruebas automatizadas del corte 7.

### 5.6. Iniciar la API

Desde la carpeta `backend/` con el entorno virtual activado:

```powershell
python -m uvicorn main:app --reload
```

Direcciones habituales de desarrollo:

- API: `http://127.0.0.1:8000`
- Documentación Swagger: `http://127.0.0.1:8000/docs`

El proceso debe mantenerse abierto mientras se utiliza el backend.

## 6. Preparar y ejecutar el frontend

En **otra terminal**, desde la raíz del repositorio:

```powershell
cd frontend
npm install
npm run dev
```

Vite mostrará la dirección local del frontend en la terminal (habitualmente `http://localhost:5173`). **Ese puerto es el permitido por defecto en CORS** (junto con `http://127.0.0.1:5173`); si Vite arranca en `5174` u otro puerto, agrégalo a `CORS_ORIGINS` en `backend/.env` y reinicia FastAPI. No es necesario modificar `DB_NAME` ni contraseñas. Consulta [`docs/configuracion_cors_corte7.md`](docs/configuracion_cors_corte7.md).

Otros comandos disponibles en `frontend/package.json`:

```powershell
npm run build
npm run lint
npm run preview
```

El backend y el frontend se ejecutan en terminales separadas durante el desarrollo.

Antes de iniciar Vite, copia `frontend/.env.example` a `frontend/.env` si necesitas personalizar `VITE_API_URL`. Por defecto, `frontend/src/api.js` usa `http://127.0.0.1:8000`.

Los roles administrador y reclutador pueden elegir la vacante por **título** y consultar la clasificación ordenada por el último puntaje registrado. En las listas autorizadas se muestran el **nombre del candidato y el título de su vacante**; los IDs siguen usándose internamente. En gestión de vacantes, las habilidades y competencias se seleccionan por nombre. El catálogo incluye vacantes abiertas y cerradas y muestra el ID para distinguir títulos repetidos. Pueden calcular el ranking de **todas las postulaciones de una vacante**; el sistema informa cuáles se calcularon, cuáles quedaron pendientes por indicadores y cuáles presentaron errores. El administrador también puede calcular una postulación individual desde su vista de revisión. Cada cálculo guarda nuevos resultados, por lo que debe ejecutarse con datos de demostración durante las pruebas. La clasificación es orientativa y requiere revisión humana.

Rutas de ranking para reclutador y administrador:

| Método | Ruta | Uso |
| --- | --- | --- |
| `GET` | `/api/v1/ranking/vacantes` | Catálogo de vacantes para seleccionar por título, incluidas cerradas |
| `GET` | `/api/v1/ranking/vacantes/{vacante_id}` | Consulta de clasificación según último puntaje |
| `POST` | `/api/v1/ranking/vacantes/{vacante_id}/calcular` | Cálculo masivo con resumen de resultados |
| `POST` | `/api/v1/ranking/postulaciones/{postulacion_id}/calcular` | Cálculo individual de una postulación |

El modelo `.joblib` debe haberse entrenado antes del cálculo.

## 7. Entrenar el modelo de ranking

El archivo del modelo `ranking_modelo.joblib` es un **artefacto generado** y está excluido del repositorio mediante `.gitignore`. Por eso es necesario generarlo localmente antes de utilizar las funciones que dependen de él.

Desde la **raíz** del proyecto, con el entorno virtual activado:

```powershell
python .\ml\entrenar_modelo.py
```

Después comprueba la existencia del modelo:

```powershell
Test-Path .\ml\models\ranking_modelo.joblib
```

Si la ruta o el nombre del archivo no coinciden, comprueba lo que escribe `ml/entrenar_modelo.py` y lo que espera `backend/app/services/ranking_ml_service.py` antes de usar el endpoint de ranking.

**Limitación del modelo:** el entrenamiento inicial emplea datos sintéticos. Sus predicciones son demostrativas y no deben presentarse como una validación de eficacia con datos reales de contratación. Los resultados requieren supervisión y evaluación humana.

## 8. Pruebas y verificación

Desde `backend/`:

```powershell
python -m pytest tests -q
```

Desde la raíz del repositorio:

```powershell
npm --prefix .\frontend run lint
npm --prefix .\frontend run build
git diff --check
```

**Corte 7 — ejecución local del 6 de noviembre de 2026, commit base `e5607d3`:** el backend completó **92 pruebas automatizadas aprobadas** (`92 passed in 3.85s`); ESLint terminó sin errores y Vite compiló correctamente (39 módulos). También se ejecutó `git diff --check` sin errores. Este resultado incluye las correcciones del ranking con normalización de niveles, requisitos opcionales, CORS configurable y presentación de nombres en las listas. **Son verificaciones del código, no una demostración manual integral de la versión nueva.**

**Prueba funcional externa del 1 de noviembre de 2026 (informada en la retroalimentación del corte 7):** el equipo revisor reportó que instaló una copia limpia siguiendo el README, ejecutó migraciones, `alembic check`, las **37 pruebas que existían en esa revisión**, lint, build y el entrenamiento del modelo, y recorrió registro, PDF, evaluación, ranking y decisión en los tres roles. Esa ejecución identificó problemas de niveles académicos y requisitos incompletos que motivaron los cambios posteriores. **No debe confundirse con haber repetido ya el recorrido integral sobre el código del 6 de noviembre.**

**Corte 5 (26–27 de octubre de 2026):** se verificaron 37 pruebas, se corrigió la migración `a52c67d901fe`, y se realizaron pruebas puntuales del ranking y los roles en la base de desarrollo. La evidencia histórica está en [`docs/evidencias/bitacora_prueba_integral_corte5.md`](docs/evidencias/bitacora_prueba_integral_corte5.md).

**Indicadores y requisitos para calcular el ranking:**

| Indicador | Requisito definido por la vacante | Dato necesario en el candidato/postulación | Si la vacante no exige ese requisito |
| --- | --- | --- | --- |
| Experiencia | Meses mínimos mayores que cero | Una o más experiencias con fechas válidas | Compatibilidad 100; no acredita experiencia |
| Habilidades | Habilidades con nivel requerido | Niveles del candidato para las habilidades solicitadas | Compatibilidad 100; no acredita habilidades |
| Formación | Nivel académico reconocido | Al menos una formación de nivel reconocido | Compatibilidad 100; no acredita un título |
| Competencias | Competencias con nivel requerido | Niveles del candidato para las competencias solicitadas | Compatibilidad 100; no acredita competencias |
| Evaluaciones | Se requiere una evaluación de la postulación | Al menos una puntuación válida (0–100) registrada por personal autorizado | **Sigue pendiente** si no hay evaluación |

Un requisito **definido** sin dato suficiente del candidato puede dejar el indicador `None` y la postulación «Pendiente». Los requisitos **no exigidos** por la vacante dejan de bloquear el cálculo y reciben **100 de compatibilidad con la exigencia**, no una certificación real. Los niveles académicos se comparan ignorando acentos, mayúsculas y espacios; «Ingeniería» usa el mismo rango que «Licenciatura» **solo como criterio interno del sistema**, no como equivalencia oficial. Más detalles: [`docs/criterios_requisitos_opcionales_corte7.md`](docs/criterios_requisitos_opcionales_corte7.md).

**Pendiente de comprobación de la nueva versión:** ejecución de `preparar_demo_corte7.py` en su base aislada, clasificación manual de **Ana, Beto y Carla** y prueba visual de los nombres y selectores del administrador/reclutador. Estas actividades **no se marcan como realizadas** por el solo hecho de aprobar las pruebas automatizadas.

La evidencia con fecha, commit y estado de cada paso está en [`docs/evidencias/bitacora_prueba_integral_corte7.md`](docs/evidencias/bitacora_prueba_integral_corte7.md).

## 8.1. Guion de demostración para la revisión

**Condiciones:** usa datos ficticios, verifica la base conectada y no ejecutes scripts que escriban en `ranking_candidatos`. El modelo `ml/models/ranking_modelo.joblib` debe haberse generado con `python .\ml\entrenar_modelo.py` desde la raíz. FastAPI se inicia en `backend/` y React en otra terminal; Vite debería usar `http://localhost:5173` o un origen incluido expresamente en `CORS_ORIGINS`.

1. **Preparación:** anota fecha y commit (`git rev-parse --short HEAD`); confirma conexión real, migraciones aplicadas, existencia del modelo y configuración de CORS. Para la demostración reproducible consulta la [guía de datos ficticios](docs/guia_demo_corte7.md). La preparación de la base aislada es opcional y **no se ha ejecutado todavía en la versión actual**.
2. **Administrador:** entra al panel y localiza la vacante por **título**. En «Requisitos de vacantes», selecciona habilidades y competencias por nombre y verifica los niveles exigidos.
3. **Candidatos:** utiliza los perfiles ficticios **Ana (Maestría), Beto (Ingeniería) y Carla (Técnico)**, con experiencia, formación, habilidades, competencias, postulaciones y PDF de demostración. Si la base no está preparada, no declares este paso como aprobado.
4. **Reclutador:** abre postulaciones por **nombre del candidato y título de la vacante**; verifica las evaluaciones y la descarga autorizada de PDF. Registra cualquier evaluación que aún falte.
5. **Ranking:** como reclutador o administrador, elige la vacante de demostración por título y pulsa «Calcular ranking de toda la vacante». Verifica **3 calculadas, 0 pendientes** como objetivo del guion (no resultado observado todavía), o documenta el motivo exacto de cualquier pendiente/error. Contrasta que los tres candidatos aparezcan ordenados por puntaje.
6. **Administrador y candidato:** revisa el orden y los cinco indicadores, registra una decisión humana de demostración y comprueba que el candidato correspondiente puede verla. No presentes el ranking como decisión automática ni como modelo validado con datos reales: se entrena con datos sintéticos.
7. **Evidencia:** captura el resultado visible (sin contraseñas ni datos reales), versión/commit, rol, acción, resultado esperado y resultado observado. Anota cualquier error en [`docs/evidencias/bitacora_prueba_integral_corte7.md`](docs/evidencias/bitacora_prueba_integral_corte7.md).

## 9. Seguridad y manejo de datos

- Mantener contraseñas, claves JWT y archivos `.env` fuera de Git.
- Utilizar datos ficticios para las cuentas de prueba.
- Respetar los permisos de candidato, reclutador y administrador.
- No utilizar puntajes automatizados como única base para tomar decisiones de contratación.
- Revisar la protección de archivos PDF e información personal antes de cualquier despliegue real.

## 10. Uso de herramientas de inteligencia artificial durante el desarrollo

Se utilizaron herramientas de asistencia con IA como apoyo para la planificación, documentación, propuestas de código, resolución de dudas técnicas y revisión de pruebas. Su uso no sustituye la revisión, integración, comprensión ni validación del proyecto por parte de quien lo desarrolla. Además, el sistema incorpora un componente propio de aprendizaje automático (Random Forest) para el cálculo experimental de rankings.

## 11. Estado del proyecto

**Estado al 6 de noviembre de 2026 (commit `e5607d3`):** el MVP académico implementa autenticación y permisos por tres roles, perfiles, vacantes, postulaciones, evaluaciones, documentos PDF y ranking individual y masivo. Las correcciones del corte 7 unifican los niveles de estudio (incluidos Maestría, Ingeniería y Técnico), permiten calcular indicadores cuando la vacante no exige requisitos opcionales, configuran CORS desde `.env`, preparan una demostración ficticia reproducible y muestran nombres/títulos en lugar de IDs en las pantallas principales.

- **Verificado en código:** 92 pruebas automatizadas aprobadas, ESLint y compilación React correctos el 6 de noviembre de 2026.
- **Verificado por revisión externa sobre una versión anterior:** el informe del corte 7 reporta instalación limpia y recorrido funcional de los tres roles el 1 de noviembre de 2026; se documentaron incidencias del ranking que motivaron las correcciones recientes.
- **Pendiente en la versión actual:** ejecutar la nueva demostración aislada de tres candidatos, comprobar manualmente el ranking y las pantallas por nombres, documentar resultados observados y adjuntar capturas no sensibles. Una prueba automatizada no reemplaza esta evidencia.

El modelo se entrenó con datos **sintéticos**; el ranking ofrece apoyo a la decisión y requiere siempre revisión humana. Véase [`docs/evidencias/bitacora_prueba_integral_corte7.md`](docs/evidencias/bitacora_prueba_integral_corte7.md).
