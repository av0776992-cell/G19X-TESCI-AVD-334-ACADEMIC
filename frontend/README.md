# Frontend — Sistema de Ranking Predictivo de Candidatos

Interfaz web desarrollada con **React, JavaScript y Vite** para apoyar la gestión de vacantes, postulaciones y evaluaciones dentro del Sistema de Ranking Predictivo de Candidatos.

## Roles y funciones

- **Candidato:** consulta vacantes y postulaciones; administra perfil, formación académica, experiencia, habilidades, competencias y documentos PDF.
- **Reclutador:** consulta postulaciones y registra evaluaciones y recomendaciones.
- **Administrador:** supervisa vacantes y postulaciones, revisa evaluaciones y consulta los resultados del ranking predictivo.

## Requisitos

- Node.js y npm.
- API del backend configurada y en ejecución para probar funcionalidades que consultan datos.

## Instalación

Desde la carpeta `frontend/`:

```powershell
npm ci
```

## Desarrollo

```powershell
npm run dev
```

Vite mostrará la dirección local en la terminal. El frontend necesita acceso a la API del backend para cargar y guardar información.

## Validaciones

```powershell
npm run lint
npm run build
```

## Documentación principal

Consulta el [`README.md` de la raíz](../README.md) para configurar Python, FastAPI, PostgreSQL, Alembic, los datos iniciales y el entrenamiento del modelo Random Forest.

## Configuración de la API

La URL del backend se centraliza en `src/api.js` y puede establecerse mediante `VITE_API_URL` en un archivo `.env` local. Copia `frontend/.env.example` a `frontend/.env` y modifica la URL cuando sea necesario. No subas el `.env` con datos privados.

## Ranking por vacante

Los roles administrador y reclutador pueden consultar la clasificación de candidatos por vacante. El administrador también puede calcular el puntaje de una postulación desde la vista de revisión. Si faltan indicadores, el sistema los muestra para que puedan completarse. La clasificación utiliza el último resultado almacenado y no toma decisiones de contratación automáticamente.