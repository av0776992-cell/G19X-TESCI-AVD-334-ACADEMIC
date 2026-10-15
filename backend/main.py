
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.auth import router as auth_router
from app.routers.candidatos import router as candidatos_router
from app.routers.formaciones import router as formaciones_router
from app.routers.experiencias import router as experiencias_router
from app.routers.habilidades import router as habilidades_router
from app.routers.competencias import router as competencias_router
from app.routers.vacantes import router as vacantes_router
from app.routers.postulaciones import router as postulaciones_router
from app.routers.documentos import router as documentos_router
from app.routers.reclutadores import router as reclutadores_router
from app.routers.ranking import router as ranking_router
from app.routers.evaluaciones import router as evaluaciones_router
from app.routers.administradores import router as administradores_router


app = FastAPI(
    title="Sistema de Ranking Predictivo de Candidatos",
    description=(
        "API para la gestión y evaluación de candidatos "
        "de Develop Talent & Technology"
    ),
    version="1.0.0",
)

# Permitir solicitudes desde React durante el desarrollo local.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth_router)
app.include_router(candidatos_router)
app.include_router(formaciones_router)
app.include_router(experiencias_router)
app.include_router(habilidades_router)
app.include_router(competencias_router)
app.include_router(vacantes_router)
app.include_router(postulaciones_router)
app.include_router(documentos_router)
app.include_router(reclutadores_router)
app.include_router(ranking_router)
app.include_router(evaluaciones_router)
app.include_router(administradores_router)


@app.get("/")
def inicio():
    return {
        "mensaje": "Sistema de Ranking Predictivo de Candidatos",
        "estado": "API funcionando correctamente",
    }
