"""Datos ficticios para la demostración del corte 7.

SOLO permite escribir en PostgreSQL 'ranking_corte7_demo'. No cambia la base
original. Repetible: crea datos faltantes y conserva registros ya preparados.

Desde backend/:
    python -m scripts.preparar_demo_corte7              # solo revisión
    python -m scripts.preparar_demo_corte7 --aplicar    # escribir, tras confirmar
"""

import argparse
from datetime import date
from getpass import getpass
from pathlib import Path

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.models.candidato import Candidato
from app.models.candidato_competencia import CandidatoCompetencia
from app.models.candidato_habilidad import CandidatoHabilidad
from app.models.competencia import Competencia
from app.models.documento import Documento
from app.models.evaluacion import Evaluacion
from app.models.experiencia import Experiencia
from app.models.formacion import Formacion
from app.models.habilidad import Habilidad
from app.models.postulacion import Postulacion
from app.models.rol import Rol
from app.models.usuario import Usuario
from app.models.vacante import Vacante
from app.models.vacante_competencia import VacanteCompetencia
from app.models.vacante_habilidad import VacanteHabilidad

BASE_DEMO = "ranking_corte7_demo"
TITULO = "[DEMO C7] Desarrollador Backend Jr."
CORREOS = {
    "admin": "demo.c7.admin@example.com",
    "reclutador": "demo.c7.reclutador@example.com",
    "Ana": "demo.c7.ana@example.com",
    "Beto": "demo.c7.beto@example.com",
    "Carla": "demo.c7.carla@example.com",
}
REQUISITOS_HABILIDAD = {"Python": 3, "FastAPI": 3, "PostgreSQL": 3, "Git": 3}
REQUISITOS_COMPETENCIA = {
    "Comunicación": 3,
    "Trabajo en equipo": 3,
    "Resolución de problemas": 3,
    "Adaptabilidad": 3,
}
PERFILES = {
    "Ana": {
        "nivel": "Maestría", "titulo": "Maestría en Ingeniería de Software",
        "inicio": date(2020, 1, 1), "fin": date(2025, 1, 1),
        "habilidades": {"Python": 4, "FastAPI": 4, "PostgreSQL": 4, "Git": 4},
        "competencias": {"Comunicación": 4, "Trabajo en equipo": 4, "Resolución de problemas": 4, "Adaptabilidad": 4},
        "evaluacion": 97,
    },
    "Beto": {
        "nivel": "Ingeniería", "titulo": "Ingeniería en Sistemas",
        "inicio": date(2023, 1, 1), "fin": date(2025, 1, 1),
        "habilidades": {"Python": 3, "FastAPI": 3, "PostgreSQL": 3, "Git": 3},
        "competencias": {"Comunicación": 3, "Trabajo en equipo": 3, "Resolución de problemas": 3, "Adaptabilidad": 3},
        "evaluacion": 80,
    },
    "Carla": {
        "nivel": "Técnico", "titulo": "Técnico en Programación",
        "inicio": date(2024, 1, 1), "fin": date(2025, 1, 1),
        "habilidades": {"Python": 2, "FastAPI": 2, "PostgreSQL": 2, "Git": 2},
        "competencias": {"Comunicación": 2, "Trabajo en equipo": 2, "Resolución de problemas": 2, "Adaptabilidad": 2},
        "evaluacion": 55,
    },
}


def comprobar_base_demo(session: Session) -> str:
    """Comprueba PostgreSQL por la conexión REAL, nunca solo por .env."""
    if session.get_bind().dialect.name != "postgresql":
        raise RuntimeError("El preparador solo permite PostgreSQL de demostración.")
    nombre = session.execute(text("SELECT current_database()")).scalar_one()
    if nombre != BASE_DEMO:
        raise RuntimeError(
            f"SEGURIDAD: conectado a '{nombre}'. No se modificará nada; "
            f"solo se permite '{BASE_DEMO}'."
        )
    return nombre


def unico_por_nombre(db: Session, modelo, nombre: str, *, crear=True):
    filas = db.scalars(select(modelo).where(modelo.nombre == nombre)).all()
    if len(filas) > 1:
        raise RuntimeError(f"Catálogo ambiguo para {modelo.__name__}: {nombre}")
    if filas:
        return filas[0]
    if not crear:
        raise RuntimeError(f"Falta el catálogo {modelo.__name__}: {nombre}")
    objeto = modelo(nombre=nombre)
    db.add(objeto)
    db.flush()
    return objeto


def obtener_o_crear(db: Session, modelo, filtros: dict, datos: dict):
    encontrado = db.scalar(select(modelo).filter_by(**filtros))
    if encontrado is not None:
        return encontrado
    objeto = modelo(**filtros, **datos)
    db.add(objeto)
    db.flush()
    return objeto


def pdf_ficticio(nombre: str) -> bytes:
    """PDF de una página, usando solo Python estándar; sin información real."""
    lineas = ["CV DE DEMOSTRACION - DATOS FICTICIOS", f"Candidato: {nombre}",
              "Proyecto: Sistema de Ranking Predictivo de Candidatos",
              "Documento exclusivamente para prueba funcional."]
    contenido = b"BT /F1 12 Tf 48 765 Td 16 TL " + b" ".join(
        (b"(" + linea.encode("ascii") + b") Tj T* ") for linea in lineas
    ) + b"ET"
    objetos = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Length " + str(len(contenido)).encode() + b" >>\nstream\n" + contenido + b"\nendstream",
    ]
    resultado = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for i, cuerpo in enumerate(objetos, 1):
        offsets.append(len(resultado))
        resultado.extend(f"{i} 0 obj\n".encode() + cuerpo + b"\nendobj\n")
    inicio_xref = len(resultado)
    resultado.extend(f"xref\n0 {len(offsets)}\n".encode() + b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        resultado.extend(f"{offset:010d} 00000 n \n".encode())
    resultado.extend(
        b"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n"
        + str(inicio_xref).encode() + b"\n%%EOF\n"
    )
    return bytes(resultado)


def preparar_datos(db: Session, hash_password, destino_pdfs: Path):
    """Repetible: solo crea faltantes; no recalcula ni duplica puntuaciones."""
    roles = {nombre: unico_por_nombre(db, Rol, nombre) for nombre in
             ("CANDIDATO", "RECLUTADOR", "ADMINISTRADOR")}
    usuarios = {}
    for clave, correo in CORREOS.items():
        rol = "CANDIDATO" if clave in PERFILES else ("ADMINISTRADOR" if clave == "admin" else "RECLUTADOR")
        nombre = f"{clave} (DEMO C7)" if clave in PERFILES else f"{rol.title()} (DEMO C7)"
        usuarios[clave] = obtener_o_crear(db, Usuario, {"correo": correo}, {
            "nombre": nombre, "rol_id": roles[rol].id, "password_hash": hash_password,
        })
        if usuarios[clave].rol_id != roles[rol].id:
            raise RuntimeError(f"El correo de demo {correo} corresponde a otro rol.")

    existentes = db.scalars(select(Vacante).where(Vacante.titulo == TITULO)).all()
    if len(existentes) > 1:
        raise RuntimeError("Hay dos vacantes con el título reservado DEMO C7.")
    vacante = existentes[0] if existentes else Vacante(
        titulo=TITULO,
        descripcion="Vacante ficticia para prueba integral con tres postulaciones.",
        ubicacion="Ciudad de México", modalidad="Remota", estado="ABIERTA",
        experiencia_minima_meses=6, nivel_estudios_requerido="Técnico",
    )
    if not existentes:
        db.add(vacante)
        db.flush()
    if (vacante.experiencia_minima_meses != 6 or
            vacante.nivel_estudios_requerido != "Técnico"):
        raise RuntimeError("La vacante reservada DEMO C7 fue modificada; no se sobrescribirá.")

    habilidades = {nombre: unico_por_nombre(db, Habilidad, nombre)
                   for nombre in REQUISITOS_HABILIDAD}
    competencias = {nombre: unico_por_nombre(db, Competencia, nombre)
                    for nombre in REQUISITOS_COMPETENCIA}
    for nombre, nivel in REQUISITOS_HABILIDAD.items():
        objeto = obtener_o_crear(db, VacanteHabilidad,
                                {"vacante_id": vacante.id, "habilidad_id": habilidades[nombre].id},
                                {"nivel_requerido": nivel})
        if objeto.nivel_requerido != nivel:
            raise RuntimeError(f"Requisito DEMO C7 modificado: {nombre}")
    for nombre, nivel in REQUISITOS_COMPETENCIA.items():
        objeto = obtener_o_crear(db, VacanteCompetencia,
                                {"vacante_id": vacante.id, "competencia_id": competencias[nombre].id},
                                {"nivel_requerido": nivel})
        if objeto.nivel_requerido != nivel:
            raise RuntimeError(f"Requisito DEMO C7 modificado: {nombre}")

    documentos = []
    postulaciones = []
    for nombre, perfil in PERFILES.items():
        candidato = obtener_o_crear(db, Candidato, {"usuario_id": usuarios[nombre].id},
                                    {"ciudad": "Ciudad de México"})
        obtener_o_crear(db, Formacion,
                        {"candidato_id": candidato.id, "titulo": perfil["titulo"]},
                        {"institucion": "Institución ficticia", "nivel": perfil["nivel"]})
        obtener_o_crear(db, Experiencia,
                        {"candidato_id": candidato.id, "empresa": "Empresa ficticia C7"},
                        {"puesto": "Desarrollo de software", "fecha_inicio": perfil["inicio"],
                         "fecha_fin": perfil["fin"]})
        for habilidad, nivel in perfil["habilidades"].items():
            obtener_o_crear(db, CandidatoHabilidad,
                            {"candidato_id": candidato.id, "habilidad_id": habilidades[habilidad].id},
                            {"nivel": nivel})
        for competencia, nivel in perfil["competencias"].items():
            obtener_o_crear(db, CandidatoCompetencia,
                            {"candidato_id": candidato.id, "competencia_id": competencias[competencia].id},
                            {"nivel": nivel})
        post = obtener_o_crear(db, Postulacion,
                               {"candidato_id": candidato.id, "vacante_id": vacante.id}, {})
        postulaciones.append(post)
        obtener_o_crear(db, Evaluacion,
                        {"postulacion_id": post.id, "tipo": "Evaluación técnica DEMO C7"},
                        {"reclutador_id": usuarios["reclutador"].id,
                         "puntuacion": perfil["evaluacion"], "observaciones": "Datos simulados."})
        ruta = destino_pdfs / f"cv_demo_c7_{nombre.lower()}.pdf"
        doc = obtener_o_crear(db, Documento,
                              {"postulacion_id": post.id, "tipo": "CV"},
                              {"nombre_archivo": ruta.name, "ruta_archivo": str(ruta.resolve())})
        documentos.append((doc, ruta, nombre))

    return vacante, postulaciones, documentos


def revisar_indicadores(db: Session, vacante: Vacante, postulaciones):
    from app.services.indicadores_ranking_service import (
        calcular_indicador_experiencia, calcular_compatibilidad_habilidades,
        calcular_indicador_formacion, calcular_compatibilidad_competencias,
        calcular_indicador_evaluaciones,
    )
    for post in postulaciones:
        indicadores = {
            "experiencia": calcular_indicador_experiencia(db, post.candidato_id, vacante.id),
            "habilidades": calcular_compatibilidad_habilidades(db, post.candidato_id, vacante.id),
            "formacion": calcular_indicador_formacion(db, post.candidato_id, vacante.id),
            "competencias": calcular_compatibilidad_competencias(db, post.candidato_id, vacante.id),
            "evaluaciones": calcular_indicador_evaluaciones(db, post.id),
        }
        if any(valor is None for valor in indicadores.values()):
            raise RuntimeError(f"Postulación {post.id} con indicadores incompletos: {indicadores}")
        print(f"Postulación {post.id}: 5/5 indicadores completos -> {indicadores}")


def ejecutar():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--aplicar", action="store_true", help="Escribir en la base DEMO exclusivamente")
    argumentos = parser.parse_args()

    from app.core.database import SessionLocal
    with SessionLocal() as db:
        nombre = comprobar_base_demo(db)
        print(f"Conexión verificada: {nombre}")
        if not argumentos.aplicar:
            print("Modo REVISIÓN: no se escribió nada. Para cargar, usa --aplicar.")
            return
        confirmacion = input(f"Escribe {BASE_DEMO} para confirmar: ").strip()
        if confirmacion != BASE_DEMO:
            print("Cancelado; no se modificó nada.")
            return
        # Solo solicita clave cuando hay cuentas de demo por crear.
        faltan = any(db.scalar(select(Usuario.id).where(Usuario.correo == correo)) is None
                     for correo in CORREOS.values())
        if faltan:
            clave = getpass("Contraseña NUEVA de las cuentas ficticias (mín. 12 caracteres): ")
            if len(clave) < 12:
                raise RuntimeError("La clave debe tener al menos 12 caracteres.")
            from app.core.security import obtener_hash_password
            hash_password = obtener_hash_password(clave)
        else:
            hash_password = "sin-uso-cuentas-existentes"
        destino = Path(__file__).resolve().parents[1] / "storage" / "documentos" / "demo_corte7"
        try:
            vacante, postulaciones, documentos = preparar_datos(db, hash_password, destino)
            revisar_indicadores(db, vacante, postulaciones)
            db.commit()
        except Exception:
            db.rollback()
            raise
        # Los PDFs se crean solo después de que las transacciones se hayan confirmado.
        destino.mkdir(parents=True, exist_ok=True)
        for documento, ruta, nombre in documentos:
            if not ruta.is_file():
                ruta.write_bytes(pdf_ficticio(nombre))
        print(f"DEMO C7 LISTA: vacante ID {vacante.id}, {len(postulaciones)} postulaciones.")
        print("Tres perfiles, 3 evaluaciones técnicas y 3 PDF ficticios listos.")
        print("No se generaron rankings ni decisiones; pruébalos desde la interfaz por rol.")


if __name__ == "__main__":
    ejecutar()
