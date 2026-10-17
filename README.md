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
│   └── .env.example          # Se agrega en el siguiente cambio
├── frontend/
│   ├── src/
│   └── package.json
├── ml/
│   ├── entrenar_modelo.py
│   └── models/
├── database/
├── docs/
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

Cuando exista `backend/.env.example`, cópialo a `backend/.env` y reemplaza los valores de ejemplo por los de tu instalación local:

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

### 5.5. Preparar datos de ejemplo (opcional)

El proyecto contiene estos scripts en `backend/scripts/`. **El siguiente orden es una propuesta basada en sus nombres: aún debe validarse contra sus dependencias internas antes de declararlo definitivo.**

1. Catálogos básicos: `crear_roles.py`, `crear_estados.py`, `crear_habilidades.py`, `crear_competencias.py`.
2. Usuarios de prueba: `crear_administrador_prueba.py`, `crear_reclutador_prueba.py`.
3. Datos de vacante: `crear_vacante_prueba.py`, `asignar_requisitos_vacante.py`.
4. Datos adicionales: `completar_perfil_prueba.py` (requiere comprobar previamente a qué candidato modifica).

Desde `backend/`, el patrón para ejecutar un script es:

```powershell
python scripts/crear_roles.py
```

Los scripts `restablecer_password_candidato.py` y `restablecer_password_reclutador.py` son **operaciones de mantenimiento**, no pasos habituales de una instalación nueva. Algunos scripts solicitan contraseñas mediante `getpass`. Nunca publiques esas contraseñas.

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

Los comandos aquí descritos son instrucciones de instalación y **no constituyen evidencia de que la aplicación ya se haya ejecutado o probado en un entorno nuevo**.

## 9. Seguridad y manejo de datos

- Mantener contraseñas, claves JWT y archivos `.env` fuera de Git.
- Utilizar datos ficticios para las cuentas de prueba.
- Respetar los permisos de candidato, reclutador y administrador.
- No utilizar puntajes automatizados como única base para tomar decisiones de contratación.
- Revisar la protección de archivos PDF e información personal antes de cualquier despliegue real.

## 10. Uso de herramientas de inteligencia artificial durante el desarrollo

Se utilizaron herramientas de asistencia con IA como apoyo para la planificación, documentación, propuestas de código, resolución de dudas técnicas y revisión de pruebas. Su uso no sustituye la revisión, integración, comprensión ni validación del proyecto por parte de quien lo desarrolla. Además, el sistema incorpora un componente propio de aprendizaje automático (Random Forest) para el cálculo experimental de rankings.

## 11. Estado del proyecto

Proyecto académico en desarrollo. Incluye un MVP con backend, frontend, esquema de datos, autenticación por roles y un módulo de ranking. Antes de una entrega final se debe comprobar la instalación desde cero, las rutas principales, los scripts de inicialización y los resultados del modelo.
