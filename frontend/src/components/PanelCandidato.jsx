import { useCallback, useEffect, useState } from 'react'
import MenuLateral from './MenuLateral'
import PerfilCandidato from './PerfilCandidato'
import FormacionCandidato from './FormacionCandidato'
import ExperienciaCandidato from './ExperienciaCandidato'
import HabilidadesCandidato from './HabilidadesCandidato'
import CompetenciasCandidato from './CompetenciasCandidato'
import VacantesCandidato from './VacantesCandidato'
import PostulacionesCandidato from './PostulacionesCandidato'
import DocumentosCandidato from './DocumentosCandidato'
import useDocumentosCandidato from '../hooks/useDocumentosCandidato'
import { API_URL } from '../api'

export default function PanelCandidato({
  usuario,
  token,
  cerrarSesion,
}) {
  const [seccion, setSeccion] = useState('vacantes')
  const [vacantes, setVacantes] = useState([])
  const [postulaciones, setPostulaciones] = useState([])
  const [detalle, setDetalle] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const solicitar = useCallback(async (ruta, opciones = {}) => {
    const respuesta = await fetch(`${API_URL}${ruta}`, {
      ...opciones,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(opciones.body instanceof FormData
          ? {}
          : opciones.body
            ? { 'Content-Type': 'application/json' }
            : {}),
        ...opciones.headers,
      },
    })

    if (!respuesta.ok) {
      const datos = await respuesta.json().catch(() => ({}))

      throw new Error(
        typeof datos.detail === 'string'
          ? datos.detail
          : `Error del servidor (${respuesta.status})`
      )
    }

    if (respuesta.status === 204) return null

    return respuesta.json()
  }, [token])

  const gestionDocumentos = useDocumentosCandidato({
    seccion,
    token,
    solicitar,
    setError,
    setMensaje,
  })
  const {
    postulacionDocumento,
    setPostulacionDocumento,
    setCargandoDocumentos,
  } = gestionDocumentos

  async function cargarDatos() {
    setCargando(true)
    setError('')

    try {
      const [listaVacantes, listaPostulaciones] =
        await Promise.all([
          solicitar('/api/v1/vacantes'),
          solicitar('/api/v1/postulaciones'),
        ])

      setVacantes(listaVacantes)
      setPostulaciones(listaPostulaciones)

      setPostulacionDocumento((actual) => {
        if (
          actual &&
          listaPostulaciones.some(
            (p) => String(p.id) === actual
          )
        ) {
          return actual
        }

        return listaPostulaciones.length
          ? String(listaPostulaciones[0].id)
          : ''
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    let activo = true

    async function cargarInicial() {
      try {
        const [listaVacantes, listaPostulaciones] = await Promise.all([
          solicitar('/api/v1/vacantes'),
          solicitar('/api/v1/postulaciones'),
        ])

        if (!activo) return
        setVacantes(listaVacantes)
        setPostulaciones(listaPostulaciones)
        setPostulacionDocumento((actual) =>
          actual && listaPostulaciones.some((p) => String(p.id) === actual)
            ? actual
            : listaPostulaciones.length
              ? String(listaPostulaciones[0].id)
              : ''
        )
      } catch (err) {
        if (activo) setError(err.message)
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargarInicial()
    return () => {
      activo = false
    }
  }, [solicitar, setPostulacionDocumento])

  async function verDetalle(vacanteId) {
    setError('')
    setMensaje('')
    setDetalle(null)
    setProcesando(true)

    try {
      const datos = await solicitar(
        `/api/v1/vacantes/${vacanteId}`
      )

      setDetalle(datos)
    } catch (err) {
      setError(err.message)
    } finally {
      setProcesando(false)
    }
  }

  async function postularme(vacanteId) {
    setError('')
    setMensaje('')
    setProcesando(true)

    try {
      await solicitar('/api/v1/postulaciones', {
        method: 'POST',
        body: JSON.stringify({
          vacante_id: vacanteId,
        }),
      })

      const lista = await solicitar('/api/v1/postulaciones')
      setPostulaciones(lista)

      if (!postulacionDocumento && lista.length) {
        setPostulacionDocumento(String(lista[0].id))
      }

      setMensaje('¡Tu postulación se registró correctamente!')
    } catch (err) {
      setError(err.message)
    } finally {
      setProcesando(false)
    }
  }

  function cambiarSeccion(nuevaSeccion) {
    setSeccion(nuevaSeccion)
    setError('')
    setMensaje('')

    if (nuevaSeccion === 'documentos' && postulacionDocumento) {
      setCargandoDocumentos(true)
    }

    if (nuevaSeccion === 'vacantes') {
      setDetalle(null)
    }
  }


  return (
    <main className="pagina pagina-panel pagina-candidato">
      <MenuLateral
        rol="CANDIDATO"
        seccionActiva={seccion}
        onSeleccionar={cambiarSeccion}
        onCerrarSesion={cerrarSesion}
      />
      <section className="panel-admin">
        <header className="panel-encabezado">
          <div>
            <p className="etiqueta">
              Develop Talent & Technology
            </p>
            <h1>Panel de candidatos</h1>
            <p>Bienvenido, {usuario.nombre}</p>
          </div>
        </header>

        <section className="panel-seccion">
          <h2>{seccion === "vacantes" ? "Explora tus oportunidades" : "Mi espacio de candidato"}</h2>

          <p>
            Consulta vacantes, administra tus postulaciones,
            actualiza tu perfil académico y carga tus documentos PDF.
          </p>

          <div
            className="panel-acciones"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >


            <button
              type="button"
              className="boton boton-secundario"
              disabled={cargando}
              onClick={cargarDatos}
            >
              {cargando ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </section>

        {error && (
          <p className="mensaje-error" role="alert">
            {error}
          </p>
        )}

        {mensaje && (
          <p className="mensaje-exito" role="status">
            {mensaje}
          </p>
        )}

        {cargando && <p>Cargando información...</p>}

        {seccion === 'perfil' && (
          <PerfilCandidato token={token} />
        )}

        {seccion === 'formacion' && (
          <FormacionCandidato token={token} />
        )}

        {seccion === 'competencias' && (
          <CompetenciasCandidato token={token} />
        )}
        {seccion === 'habilidades' && (
          <HabilidadesCandidato token={token} />
        )}
        {seccion === 'experiencia' && (
          <ExperienciaCandidato token={token} />
        )}
        {seccion === 'vacantes' && (
          <VacantesCandidato
            vacantes={vacantes}
            cargando={cargando}
            detalle={detalle}
            procesando={procesando}
            postulaciones={postulaciones}
            onVerDetalle={verDetalle}
            onPostularme={postularme}
          />
        )}

        {seccion === 'postulaciones' && (
          <PostulacionesCandidato postulaciones={postulaciones} />
        )}

        {seccion === 'documentos' && (
          <DocumentosCandidato
            postulaciones={postulaciones}
            controles={gestionDocumentos}
          />
        )}
      </section>
    </main>
  )
}
