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

> **Nota:** La URL del backend todavía se configura en el código del frontend. Está pendiente centralizarla con `VITE_API_URL` y añadir `frontend/.env.example`.