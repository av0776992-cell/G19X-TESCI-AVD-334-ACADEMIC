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

Los scripts de usuarios de prueba solicitan contraseñas de forma interactiva. La asignación de requisitos debe ejecutarse después de crear la vacante y los catálogos; puede modificar los niveles de requisitos ya existentes.

El script `completar_perfil_prueba.py` es opcional y debe ejecutarse únicamente después de verificar que existe el candidato con ID 1 y que los identificadores de habilidades y competencias corresponden a los registros esperados:

```powershell
python -m scripts.completar_perfil_prueba
```

**Precaución:** estos scripts modifican datos de PostgreSQL. Utiliza una base de datos de demostración cuando prepares una instalación nueva. Los scripts de restablecimiento de contraseñas son herramientas de mantenimiento y no forman parte de la instalación inicial.

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

Vite mostrará la dirección local del frontend en la terminal (habitualmente `http://localhost:5173`; puede cambiar si el puerto está ocupado).

Otros comandos disponibles en `frontend/package.json`:

```powershell
npm run build
npm run lint
npm run preview
```

El backend y el frontend se ejecutan en terminales separadas durante el desarrollo.

Antes de iniciar Vite, copia `frontend/.env.example` a `frontend/.env` si necesitas personalizar `VITE_API_URL`. Por defecto, `frontend/src/api.js` usa `http://127.0.0.1:8000`.

Los roles administrador y reclutador pueden elegir la vacante por **título** y consultar la clasificación ordenada por el último puntaje registrado. El catálogo incluye vacantes abiertas y cerradas y muestra el ID para distinguir títulos repetidos. Pueden calcular el ranking de **todas las postulaciones de una vacante**; el sistema informa cuáles se calcularon, cuáles quedaron pendientes por indicadores y cuáles presentaron errores. El administrador también puede calcular una postulación individual desde su vista de revisión. Cada cálculo guarda nuevos resultados, por lo que debe ejecutarse con datos de demostración durante las pruebas. La clasificación es orientativa y requiere revisión humana.

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
python -m pytest tests
```

**Validación local del corte 5 (26–27 de octubre de 2026):** **37 pruebas automatizadas aprobadas** (`37 passed in 2.86s`). Incluyen compatibilidad, autenticación, permisos, clasificación por último resultado, cálculo masivo, pendientes/errores parciales y catálogo de vacantes (incluidas cerradas y títulos repetidos). También finalizaron sin errores `npm run lint`, `npm run build` y `git diff --check`. Estas pruebas automatizadas no equivalen por sí solas a la validación integral con PostgreSQL.

**Prueba manual confirmada:** en una vacante ficticia con una postulación, el cálculo masivo produjo 1 calculada, 0 pendientes, 0 errores y mantuvo el puntaje de 86.97/100; después se probó el selector por título y la consulta de clasificación.

**Instalación de base vacía:** en una base independiente se aplicaron las revisiones de Alembic y se crearon 21 tablas (incluida `alembic_version`). La primera carga de vacantes reveló dos columnas ausentes en las migraciones. Tras agregar la revisión `a52c67d901fe`, la comprobación del esquema fue correcta y se cargaron 3 roles, 8 estados, 10 habilidades, 10 competencias y una vacante de demostración con 4 habilidades y 4 competencias. También se crearon las cuentas de administrador y reclutador de demostración.

**Todavía pendiente:** registrar y usar un candidato en esa misma instalación, completar su postulación y evaluación, verificar los tres roles de inicio a fin, probar ordenación real con múltiples postulaciones y dejar evidencia del flujo completo. Se volvió a la base local original para el trabajo cotidiano. Consulta [`docs/bitacora_prueba_integral_corte5.md`](docs/bitacora_prueba_integral_corte5.md) para los resultados y límites de la verificación.

Verificación manual recomendada:

- La API inicia sin errores y Swagger abre correctamente.
- Es posible iniciar sesión con los roles y permisos que correspondan.
- Se pueden registrar o consultar candidatos, vacantes y postulaciones.
- Los documentos PDF se cargan y recuperan correctamente.
- La base de datos tiene sus migraciones aplicadas.
- El modelo `.joblib` existe y el ranking responde cuando se usa con datos válidos.
- El frontend carga y se comunica con la API.

**Verificación previa en copia limpia (octubre de 2026):** se instalaron dependencias, se aprobaron seis pruebas unitarias de compatibilidad, se verificó ESLint/Vite y se entrenó el modelo con datos sintéticos. El archivo `backend/tests/conftest.py` permite ejecutar pruebas unitarias sin una base real. Estas verificaciones son distintas de las 37 pruebas posteriores y no deben sumarse a ellas.

## 8.1. Guion de demostración para la revisión

Usa **datos ficticios**, el backend conectado a la base de datos elegida para la demo y dos terminales (FastAPI y Vite). No crees cuentas o vacantes duplicadas si ya existen.

1. **Preparación:** verifica en la configuración del backend el `DB_NAME`, confirma que PostgreSQL está disponible, las migraciones están al día y el archivo `ml/models/ranking_modelo.joblib` existe.
2. **Administrador:** inicia sesión y presenta las vacantes; verifica que se pueden consultar y gestionar según los permisos.
3. **Candidato:** si la cuenta no existe, regístrala desde `POST /api/v1/auth/registro` en `http://127.0.0.1:8000/docs` con un correo ficticio. Inicia sesión en React, completa el perfil y registra una postulación a la vacante de prueba.
4. **Reclutador:** revisa la postulación, descarga el PDF de prueba si lo hay y registra la evaluación y recomendación correspondientes.
5. **Administrador o reclutador:** en «Clasificación de candidatos por vacante», elige la vacante por título y consulta sus postulaciones. Ejecuta «Calcular ranking de toda la vacante» **solo si es una vacante de demostración** y revisa calculadas, pendientes y errores.
6. **Administrador:** revisa el puntaje actualizado y la clasificación. Explica que el sistema utiliza cinco indicadores (experiencia, habilidades, formación, competencias y evaluaciones), que el modelo se entrenó con datos sintéticos y que la decisión de contratación no es automática.
7. **Evidencias:** registra fecha, base utilizada (sin credenciales), rol, acción, resultado esperado, resultado observado y captura o mensaje de error. Marca como «no ejecutado» todo lo que falte comprobar.

## 9. Seguridad y manejo de datos

- Mantener contraseñas, claves JWT y archivos `.env` fuera de Git.
- Utilizar datos ficticios para las cuentas de prueba.
- Respetar los permisos de candidato, reclutador y administrador.
- No utilizar puntajes automatizados como única base para tomar decisiones de contratación.
- Revisar la protección de archivos PDF e información personal antes de cualquier despliegue real.

## 10. Uso de herramientas de inteligencia artificial durante el desarrollo

Se utilizaron herramientas de asistencia con IA como apoyo para la planificación, documentación, propuestas de código, resolución de dudas técnicas y revisión de pruebas. Su uso no sustituye la revisión, integración, comprensión ni validación del proyecto por parte de quien lo desarrolla. Además, el sistema incorpora un componente propio de aprendizaje automático (Random Forest) para el cálculo experimental de rankings.

## 11. Estado del proyecto

Proyecto académico en desarrollo. El MVP implementa autenticación por roles, perfiles, vacantes, postulaciones, evaluaciones y ranking predictivo individual y masivo, con consulta por título de vacante. Se aprobaron 37 pruebas automatizadas y se validaron pasos relevantes de instalación en PostgreSQL desde una base vacía. La **prueba integral completa con candidato, reclutador y administrador en una misma base limpia sigue pendiente**, junto con una comparación manual de varios candidatos. El modelo utiliza datos sintéticos y sus puntuaciones requieren revisión humana.
