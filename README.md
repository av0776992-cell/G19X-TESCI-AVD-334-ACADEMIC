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

Variables requeridas según la revisión del proyecto:

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

Con PostgreSQL iniciado y las variables configuradas:

```powershell
cd backend
alembic upgrade head
```

Alembic utilizará las migraciones almacenadas en `backend/alembic/versions/` para preparar el esquema de la base de datos. Si aparecen errores de conexión, comprueba primero `backend/.env` y PostgreSQL.

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

Verificación manual recomendada:

- La API inicia sin errores y Swagger abre correctamente.
- Es posible iniciar sesión con los roles y permisos que correspondan.
- Se pueden registrar o consultar candidatos, vacantes y postulaciones.
- Los documentos PDF se cargan y recuperan correctamente.
- La base de datos tiene sus migraciones aplicadas.
- El modelo `.joblib` existe y el ranking responde cuando se usa con datos válidos.
- El frontend carga y se comunica con la API.

**Verificaciones realizadas en una copia limpia del repositorio (octubre de 2026):** instalación de dependencias del backend y del frontend, seis pruebas unitarias de compatibilidad aprobadas, comprobación de ESLint, compilación de Vite y entrenamiento local del modelo con datos sintéticos. Para ejecutar las pruebas unitarias sin configurar una base de datos real se agregó `backend/tests/conftest.py`. Estas comprobaciones no sustituyen una prueba integral con PostgreSQL y los tres roles en funcionamiento.

## 9. Seguridad y manejo de datos

- Mantener contraseñas, claves JWT y archivos `.env` fuera de Git.
- Utilizar datos ficticios para las cuentas de prueba.
- Respetar los permisos de candidato, reclutador y administrador.
- No utilizar puntajes automatizados como única base para tomar decisiones de contratación.
- Revisar la protección de archivos PDF e información personal antes de cualquier despliegue real.

## 10. Uso de herramientas de inteligencia artificial durante el desarrollo

Se utilizaron herramientas de asistencia con IA como apoyo para la planificación, documentación, propuestas de código, resolución de dudas técnicas y revisión de pruebas. Su uso no sustituye la revisión, integración, comprensión ni validación del proyecto por parte de quien lo desarrolla. Además, el sistema incorpora un componente propio de aprendizaje automático (Random Forest) para el cálculo experimental de rankings.

## 11. Estado del proyecto

Proyecto académico en desarrollo. Incluye un MVP con backend, frontend, esquema de datos, autenticación por roles y un módulo de ranking. Ya se comprobó la instalación de dependencias, las pruebas unitarias de compatibilidad, la compilación del frontend y el entrenamiento del modelo desde una copia limpia. Antes de la entrega final todavía debe verificarse el flujo integral con una base PostgreSQL de pruebas y confirmar el funcionamiento de los roles y las rutas principales.
