
import { useState } from 'react'
import PanelCandidato from './components/PanelCandidato'
import './App.css'

const API_URL = 'http://127.0.0.1:8000'

function App() {
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [cargandoPanel, setCargandoPanel] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const [usuario, setUsuario] = useState(null)
  const [token, setToken] = useState('')

  const [postulaciones, setPostulaciones] = useState([])
  const [postulacionSeleccionada, setPostulacionSeleccionada] = useState(null)

  // Administrador
  const [revision, setRevision] = useState(null)
  const [decision, setDecision] = useState('ACEPTADO')
  const [justificacion, setJustificacion] = useState('')

  // Gesti?n de vacantes (administrador)
  const [nuevaVacante, setNuevaVacante] = useState({
    titulo: '',
    descripcion: '',
    ubicacion: '',
    modalidad: '',
    experiencia_minima_meses: 0,
    nivel_estudios_requerido: '',
  })
  const [creandoVacante, setCreandoVacante] = useState(false)
  const [requisitoVacante, setRequisitoVacante] = useState({
    vacante_id: '',
    tipo: 'habilidades',
    requisito_id: '',
    nivel_requerido: 3,
  })
  const [guardandoRequisito, setGuardandoRequisito] = useState(false)
  const [edicionVacante, setEdicionVacante] = useState({
    vacante_id: '',
    titulo: '',
    descripcion: '',
    ubicacion: '',
    modalidad: '',
    experiencia_minima_meses: 0,
    nivel_estudios_requerido: '',
  })
  const [guardandoEdicionVacante, setGuardandoEdicionVacante] = useState(false)
  const [cerrandoVacante, setCerrandoVacante] = useState(false)



  // Reclutador
  const [detalleReclutador, setDetalleReclutador] = useState(null)
  const [evaluaciones, setEvaluaciones] = useState([])
  const [documentosReclutador, setDocumentosReclutador] = useState([])
  const [recomendacionExistente, setRecomendacionExistente] = useState(null)
  const [tipoEvaluacion, setTipoEvaluacion] = useState('')
  const [puntuacion, setPuntuacion] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [recomendacion, setRecomendacion] = useState('3')
  const [resumen, setResumen] = useState('')

  async function solicitarAPI(ruta, tokenAcceso, opciones = {}) {
    const respuesta = await fetch(`${API_URL}${ruta}`, {
      ...opciones,
      headers: {
        Authorization: `Bearer ${tokenAcceso}`,
        ...(opciones.body
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...opciones.headers,
      },
    })

    const datos = await respuesta.json().catch(() => ({}))

    if (!respuesta.ok) {
      throw new Error(
        typeof datos.detail === 'string'
          ? datos.detail
          : `Error del servidor (${respuesta.status}).`
      )
    }

    return datos
  }

  async function cerrarVacanteDesdePanel() {
    const vacanteId = Number(edicionVacante.vacante_id)

    if (!Number.isInteger(vacanteId) || vacanteId <= 0) {
      setError('Introduce un ID de vacante v?lido.')
      return
    }

    const confirmado = window.confirm(
      `?Est?s seguro de que deseas cerrar la vacante #${vacanteId}?`
    )

    if (!confirmado) return

    setError('')
    setMensaje('')
    setCerrandoVacante(true)

    try {
      await solicitarAPI(
        `/api/v1/vacantes/${vacanteId}/cerrar`,
        token,
        { method: 'PATCH' }
      )

      setMensaje(`Vacante #${vacanteId} cerrada correctamente.`)
      setEdicionVacante({
        vacante_id: '',
        titulo: '',
        descripcion: '',
        ubicacion: '',
        modalidad: '',
        experiencia_minima_meses: 0,
        nivel_estudios_requerido: '',
      })
    } catch (errorSolicitud) {
      setError(errorSolicitud.message)
    } finally {
      setCerrandoVacante(false)
    }
  }

  async function guardarEdicionVacante(evento) {
    evento.preventDefault()
    setError('')
    setMensaje('')

    const vacanteId = Number(edicionVacante.vacante_id)

    if (!Number.isInteger(vacanteId) || vacanteId <= 0) {
      setError('Selecciona una vacante v?lida.')
      return
    }

    setGuardandoEdicionVacante(true)

    try {
      await solicitarAPI(
        `/api/v1/vacantes/${vacanteId}`,
        token,
        {
          method: 'PATCH',
          body: JSON.stringify({
            titulo: edicionVacante.titulo,
            descripcion: edicionVacante.descripcion,
            ubicacion: edicionVacante.ubicacion,
            modalidad: edicionVacante.modalidad,
            experiencia_minima_meses: Number(
              edicionVacante.experiencia_minima_meses
            ),
            nivel_estudios_requerido:
              edicionVacante.nivel_estudios_requerido,
          }),
        }
      )

      setMensaje(`Vacante #${vacanteId} actualizada correctamente.`)
    } catch (errorSolicitud) {
      setError(errorSolicitud.message)
    } finally {
      setGuardandoEdicionVacante(false)
    }
  }

  async function cargarVacanteParaEditar() {
    const vacanteId = Number(edicionVacante.vacante_id)

    if (!Number.isInteger(vacanteId) || vacanteId <= 0) {
      setError('Introduce un ID de vacante v?lido.')
      return
    }

    setError('')
    setMensaje('')

    try {
      const datos = await solicitarAPI(
        `/api/v1/vacantes/${vacanteId}`,
        token
      )

      setEdicionVacante({
        vacante_id: String(datos.id),
        titulo: datos.titulo ?? '',
        descripcion: datos.descripcion ?? '',
        ubicacion: datos.ubicacion ?? '',
        modalidad: datos.modalidad ?? '',
        experiencia_minima_meses: datos.experiencia_minima_meses ?? 0,
        nivel_estudios_requerido: datos.nivel_estudios_requerido ?? '',
      })

      setMensaje(`Vacante #${vacanteId} cargada para edici?n.`)
    } catch (errorSolicitud) {
      setError(errorSolicitud.message)
    }
  }

  async function guardarRequisitoVacante(evento) {
    evento.preventDefault()
    setError('')
    setMensaje('')

    const vacanteId = Number(requisitoVacante.vacante_id)
    const requisitoId = Number(requisitoVacante.requisito_id)

    if (!vacanteId || !requisitoId) {
      setError('Selecciona una vacante y un requisito.')
      return
    }

    const esHabilidad = requisitoVacante.tipo === 'habilidades'
    const campoId = esHabilidad ? 'habilidad_id' : 'competencia_id'

    setGuardandoRequisito(true)

    try {
      const resultado = await solicitarAPI(
        `/api/v1/vacantes/${vacanteId}/${requisitoVacante.tipo}`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            [campoId]: requisitoId,
            nivel_requerido: Number(requisitoVacante.nivel_requerido),
          }),
        }
      )

      setMensaje(
        `${esHabilidad ? 'Habilidad' : 'Competencia'} "${resultado.nombre}" guardada en la vacante #${vacanteId}.`
      )

      setRequisitoVacante((anterior) => ({
        ...anterior,
        requisito_id: '',
      }))
    } catch (errorSolicitud) {
      setError(errorSolicitud.message)
    } finally {
      setGuardandoRequisito(false)
    }
  }

  async function crearVacante(evento) {
    evento.preventDefault()
    setError('')
    setMensaje('')
    setCreandoVacante(true)

    try {
      const datos = await solicitarAPI(
        '/api/v1/vacantes',
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            ...nuevaVacante,
            experiencia_minima_meses:
              Number(nuevaVacante.experiencia_minima_meses),
          }),
        }
      )

      setMensaje(`Vacante #${datos.id} creada correctamente.`)
      setNuevaVacante({
        titulo: '',
        descripcion: '',
        ubicacion: '',
        modalidad: '',
        experiencia_minima_meses: 0,
        nivel_estudios_requerido: '',
      })
    } catch (errorSolicitud) {
      setError(errorSolicitud.message)
    } finally {
      setCreandoVacante(false)
    }
  }

  async function cargarPostulaciones(tokenAcceso, rol) {
    const ruta =
      rol === 'ADMINISTRADOR'
        ? '/api/v1/administradores/postulaciones'
        : '/api/v1/reclutadores/postulaciones'

    const datos = await solicitarAPI(ruta, tokenAcceso)
    setPostulaciones(datos)
  }

  async function iniciarSesion(evento) {
    evento.preventDefault()
    setError('')
    setMensaje('')
    setCargando(true)

    try {
      const respuesta = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correo: correo.trim(),
          password,
        }),
      })

      const datos = await respuesta.json().catch(() => ({}))

      if (!respuesta.ok) {
        throw new Error(
          typeof datos.detail === 'string'
            ? datos.detail
            : 'No fue posible iniciar sesión.'
        )
      }

      const perfil = await solicitarAPI(
        '/api/v1/auth/me',
        datos.access_token
      )

      setUsuario({
        nombre: perfil.nombre,
        rol: datos.rol,
        usuarioId: datos.usuario_id,
      })

      setToken(datos.access_token)
      setPassword('')

      if (['ADMINISTRADOR', 'RECLUTADOR'].includes(datos.rol)) {
        try {
          await cargarPostulaciones(datos.access_token, datos.rol)
        } catch (errorPanel) {
          setError(errorPanel.message)
        }
      }
    } catch (errorInicio) {
      setError(
        errorInicio instanceof TypeError
          ? 'No se pudo conectar con FastAPI.'
          : errorInicio.message
      )
    } finally {
      setCargando(false)
    }
  }

  async function actualizarPostulaciones() {
    setError('')
    setCargandoPanel(true)

    try {
      await cargarPostulaciones(token, usuario.rol)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargandoPanel(false)
    }
  }

  async function verRevision(postulacionId) {
    setError('')
    setMensaje('')
    setRevision(null)
    setPostulacionSeleccionada(postulacionId)
    setCargandoPanel(true)

    try {
      const datos = await solicitarAPI(
        `/api/v1/administradores/postulaciones/${postulacionId}/revision`,
        token
      )
      setRevision(datos)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargandoPanel(false)
    }
  }

  async function registrarDecision(evento) {
    evento.preventDefault()
    setError('')
    setMensaje('')
    setCargandoPanel(true)

    try {
      await solicitarAPI(
        `/api/v1/administradores/postulaciones/${postulacionSeleccionada}/decision`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            decision,
            justificacion: justificacion.trim(),
          }),
        }
      )

      setMensaje('La decisión se registró correctamente.')
      setJustificacion('')

      const datos = await solicitarAPI(
        `/api/v1/administradores/postulaciones/${postulacionSeleccionada}/revision`,
        token
      )

      setRevision(datos)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargandoPanel(false)
    }
  }

  async function cargarDatosReclutador(postulacionId) {
    const base = `/api/v1/reclutadores/postulaciones/${postulacionId}`

    const [detalle, listaDocumentos, listaEvaluaciones, respuestaRecomendacion] =
      await Promise.all([
        solicitarAPI(base, token),
        solicitarAPI(
          `/api/v1/documentos/postulacion/${postulacionId}`,
          token
        ),
        solicitarAPI(
          `/api/v1/evaluaciones/postulaciones/${postulacionId}`,
          token
        ),
        fetch(`${API_URL}${base}/recomendacion`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ])

    let recomendacionActual = null

    if (respuestaRecomendacion.ok) {
      recomendacionActual = await respuestaRecomendacion.json()
    } else if (respuestaRecomendacion.status !== 404) {
      const datosError = await respuestaRecomendacion
        .json()
        .catch(() => ({}))

      throw new Error(
        typeof datosError.detail === 'string'
          ? datosError.detail
          : 'No se pudo consultar la recomendación.'
      )
    }

    setDetalleReclutador(detalle)
    setEvaluaciones(listaEvaluaciones)
    setDocumentosReclutador(listaDocumentos)
    setRecomendacionExistente(recomendacionActual)
  }

  async function descargarDocumentoReclutador(documento) {
    setError('')

    try {
      const respuesta = await fetch(
        `${API_URL}/api/v1/documentos/${documento.id}/descargar`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => ({}))

        throw new Error(
          typeof datos.detail === 'string'
            ? datos.detail
            : 'No se pudo descargar el documento.'
        )
      }

      const archivo = await respuesta.blob()
      const urlTemporal = URL.createObjectURL(archivo)

      const enlace = document.createElement('a')
      enlace.href = urlTemporal
      enlace.download = documento.nombre_archivo || 'documento.pdf'

      document.body.appendChild(enlace)
      enlace.click()
      enlace.remove()

      setTimeout(() => URL.revokeObjectURL(urlTemporal), 60000)
    } catch (err) {
      setError(err.message)
    }
  }
  async function verPostulacionReclutador(postulacionId) {
    setError('')
    setMensaje('')
    setDetalleReclutador(null)
    setEvaluaciones([])
    setRecomendacionExistente(null)
    setPostulacionSeleccionada(postulacionId)
    setCargandoPanel(true)

    try {
      await cargarDatosReclutador(postulacionId)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargandoPanel(false)
    }
  }

  async function registrarEvaluacion(evento) {
    evento.preventDefault()
    setError('')
    setMensaje('')
    setCargandoPanel(true)

    try {
      await solicitarAPI(
        `/api/v1/evaluaciones/postulaciones/${postulacionSeleccionada}`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            tipo: tipoEvaluacion.trim(),
            puntuacion: Number(puntuacion),
            observaciones: observaciones.trim() || null,
          }),
        }
      )

      setTipoEvaluacion('')
      setPuntuacion('')
      setObservaciones('')

      await cargarDatosReclutador(postulacionSeleccionada)

      setMensaje('La evaluación técnica se registró correctamente.')
    } catch (err) {
      setError(err.message)
    } finally {
      setCargandoPanel(false)
    }
  }

  async function registrarRecomendacion(evento) {
    evento.preventDefault()
    setError('')
    setMensaje('')
    setCargandoPanel(true)

    try {
      await solicitarAPI(
        `/api/v1/reclutadores/postulaciones/${postulacionSeleccionada}/recomendacion`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            recomendacion: Number(recomendacion),
            resumen: resumen.trim() || null,
          }),
        }
      )

      setResumen('')

      await cargarDatosReclutador(postulacionSeleccionada)

      setMensaje('La recomendación se registró correctamente.')
    } catch (err) {
      setError(err.message)
    } finally {
      setCargandoPanel(false)
    }
  }

  function cerrarSesion() {
    setUsuario(null)
    setToken('')
    setCorreo('')
    setPassword('')
    setError('')
    setMensaje('')
    setPostulaciones([])
    setPostulacionSeleccionada(null)
    setRevision(null)
    setDetalleReclutador(null)
    setEvaluaciones([])
    setRecomendacionExistente(null)
    setJustificacion('')
    setTipoEvaluacion('')
    setPuntuacion('')
    setObservaciones('')
    setResumen('')
  }

  // PANEL DE ADMINISTRADOR Y RECLUTADOR

  if (
    usuario?.rol === 'ADMINISTRADOR' ||
    usuario?.rol === 'RECLUTADOR'
  ) {
    const esAdministrador = usuario.rol === 'ADMINISTRADOR'

    return (
      <main className="pagina pagina-panel">
        <section className="panel-admin">
          <header className="panel-encabezado">
            <div>
              <p className="etiqueta">
                Develop Talent & Technology
              </p>

              <h1>
                Panel de{' '}
                {esAdministrador
                  ? 'administrador'
                  : 'reclutador'}
              </h1>

              <p>Bienvenido, {usuario.nombre}</p>
            </div>

            <button
              type="button"
              className="boton boton-secundario"
              onClick={cerrarSesion}
            >
              Cerrar sesión
            </button>
          </header>

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

          {esAdministrador && (
            <section className="panel-seccion">
              <h2>Crear nueva vacante</h2>
              <p className="nota">
                Registra una oportunidad laboral para los candidatos.
              </p>

              <form onSubmit={crearVacante}>
                <div className="campo">
                  <label htmlFor="vacante-titulo">T?tulo *</label>
                  <input
                    id="vacante-titulo"
                    type="text"
                    maxLength={150}
                    required
                    value={nuevaVacante.titulo}
                    onChange={(evento) =>
                      setNuevaVacante({
                        ...nuevaVacante,
                        titulo: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="campo">
                  <label htmlFor="vacante-descripcion">Descripci?n *</label>
                  <textarea
                    id="vacante-descripcion"
                    required
                    rows={4}
                    value={nuevaVacante.descripcion}
                    onChange={(evento) =>
                      setNuevaVacante({
                        ...nuevaVacante,
                        descripcion: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="campo">
                  <label htmlFor="vacante-ubicacion">Ubicaci?n</label>
                  <input
                    id="vacante-ubicacion"
                    type="text"
                    maxLength={150}
                    value={nuevaVacante.ubicacion}
                    onChange={(evento) =>
                      setNuevaVacante({
                        ...nuevaVacante,
                        ubicacion: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="campo">
                  <label htmlFor="vacante-modalidad">Modalidad</label>
                  <select
                    id="vacante-modalidad"
                    value={nuevaVacante.modalidad}
                    onChange={(evento) =>
                      setNuevaVacante({
                        ...nuevaVacante,
                        modalidad: evento.target.value,
                      })
                    }
                  >
                    <option value="">Seleccionar modalidad</option>
                    <option value="Presencial">Presencial</option>
                    <option value="H?brida">H?brida</option>
                    <option value="Remota">Remota</option>
                  </select>
                </div>

                <div className="campo">
                  <label htmlFor="vacante-experiencia">
                    Experiencia m?nima (meses)
                  </label>
                  <input
                    id="vacante-experiencia"
                    type="number"
                    min="0"
                    required
                    value={nuevaVacante.experiencia_minima_meses}
                    onChange={(evento) =>
                      setNuevaVacante({
                        ...nuevaVacante,
                        experiencia_minima_meses: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="campo">
                  <label htmlFor="vacante-estudios">
                    Nivel de estudios requerido
                  </label>
                  <input
                    id="vacante-estudios"
                    type="text"
                    maxLength={100}
                    value={nuevaVacante.nivel_estudios_requerido}
                    onChange={(evento) =>
                      setNuevaVacante({
                        ...nuevaVacante,
                        nivel_estudios_requerido: evento.target.value,
                      })
                    }
                  />
                </div>

                <button
                  type="submit"
                  className="boton"
                  disabled={creandoVacante}
                >
                  {creandoVacante ? 'Guardando...' : 'Crear vacante'}
                </button>
              </form>
            </section>
          )}

          {esAdministrador && (
            <section className="panel-seccion">
              <h2>Requisitos de vacantes</h2>
              <p className="nota">
                Asigna habilidades y competencias a una vacante abierta.
              </p>

              <form onSubmit={guardarRequisitoVacante}>
                <div className="campo">
                  <label htmlFor="requisito-vacante-id">ID de vacante</label>
                  <input
                    id="requisito-vacante-id"
                    type="number"
                    min="1"
                    required
                    value={requisitoVacante.vacante_id}
                    onChange={(evento) =>
                      setRequisitoVacante({
                        ...requisitoVacante,
                        vacante_id: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="campo">
                  <label htmlFor="requisito-tipo">Tipo de requisito</label>
                  <select
                    id="requisito-tipo"
                    value={requisitoVacante.tipo}
                    onChange={(evento) =>
                      setRequisitoVacante({
                        ...requisitoVacante,
                        tipo: evento.target.value,
                        requisito_id: '',
                      })
                    }
                  >
                    <option value="habilidades">Habilidad</option>
                    <option value="competencias">Competencia</option>
                  </select>
                </div>

                <div className="campo">
                  <label htmlFor="requisito-id">ID del requisito</label>
                  <input
                    id="requisito-id"
                    type="number"
                    min="1"
                    required
                    value={requisitoVacante.requisito_id}
                    onChange={(evento) =>
                      setRequisitoVacante({
                        ...requisitoVacante,
                        requisito_id: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="campo">
                  <label htmlFor="requisito-nivel">Nivel requerido (1 a 5)</label>
                  <input
                    id="requisito-nivel"
                    type="number"
                    min="1"
                    max="5"
                    required
                    value={requisitoVacante.nivel_requerido}
                    onChange={(evento) =>
                      setRequisitoVacante({
                        ...requisitoVacante,
                        nivel_requerido: evento.target.value,
                      })
                    }
                  />
                </div>

                <button
                  type="submit"
                  className="boton"
                  disabled={guardandoRequisito}
                >
                  {guardandoRequisito ? 'Guardando...' : 'Guardar requisito'}
                </button>
              </form>
            </section>
          )}

          {esAdministrador && (
            <section className="panel-seccion">
              <h2>Editar o cerrar vacante</h2>
              <p>Introduce el ID de una vacante abierta y carga sus datos.</p>

              <div className="campo">
                <label htmlFor="editar-vacante-id">ID de vacante</label>
                <input
                  id="editar-vacante-id"
                  type="number"
                  min="1"
                  value={edicionVacante.vacante_id}
                  onChange={(evento) =>
                    setEdicionVacante({
                      ...edicionVacante,
                      vacante_id: evento.target.value,
                    })
                  }
                />
              </div>

              <button
                type="button"
                className="boton boton-secundario"
                onClick={cargarVacanteParaEditar}
              >
                Cargar vacante
              </button>

              {edicionVacante.titulo && (
                <form onSubmit={guardarEdicionVacante}>
                  <div className="campo">
                    <label htmlFor="editar-vacante-titulo">T?tulo</label>
                    <input
                      id="editar-vacante-titulo"
                      required
                      value={edicionVacante.titulo}
                      onChange={(evento) =>
                        setEdicionVacante({
                          ...edicionVacante,
                          titulo: evento.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="campo">
                    <label htmlFor="editar-vacante-descripcion">Descripci?n</label>
                    <textarea
                      id="editar-vacante-descripcion"
                      required
                      value={edicionVacante.descripcion}
                      onChange={(evento) =>
                        setEdicionVacante({
                          ...edicionVacante,
                          descripcion: evento.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="campo">
                    <label htmlFor="editar-vacante-ubicacion">Ubicaci?n</label>
                    <input
                      id="editar-vacante-ubicacion"
                      value={edicionVacante.ubicacion}
                      onChange={(evento) =>
                        setEdicionVacante({
                          ...edicionVacante,
                          ubicacion: evento.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="campo">
                    <label htmlFor="editar-vacante-modalidad">Modalidad</label>
                    <input
                      id="editar-vacante-modalidad"
                      value={edicionVacante.modalidad}
                      onChange={(evento) =>
                        setEdicionVacante({
                          ...edicionVacante,
                          modalidad: evento.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="campo">
                    <label htmlFor="editar-vacante-experiencia">
                      Experiencia m?nima (meses)
                    </label>
                    <input
                      id="editar-vacante-experiencia"
                      type="number"
                      min="0"
                      value={edicionVacante.experiencia_minima_meses}
                      onChange={(evento) =>
                        setEdicionVacante({
                          ...edicionVacante,
                          experiencia_minima_meses: evento.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="campo">
                    <label htmlFor="editar-vacante-estudios">
                      Nivel de estudios requerido
                    </label>
                    <input
                      id="editar-vacante-estudios"
                      value={edicionVacante.nivel_estudios_requerido}
                      onChange={(evento) =>
                        setEdicionVacante({
                          ...edicionVacante,
                          nivel_estudios_requerido: evento.target.value,
                        })
                      }
                    />
                  </div>

                  <button
                    type="submit"
                    className="boton"
                    disabled={guardandoEdicionVacante}
                  >
                    {guardandoEdicionVacante
                      ? 'Guardando...'
                      : 'Guardar cambios'}
                  </button>

                  <button
                    type="button"
                    className="boton boton-secundario"
                    disabled={cerrandoVacante}
                    onClick={cerrarVacanteDesdePanel}
                  >
                    {cerrandoVacante ? 'Cerrando...' : 'Cerrar vacante'}
                  </button>
                </form>
              )}
            </section>
          )}

          <div className="panel-columnas">
            <section className="panel-seccion">
              <h2>Postulaciones recibidas</h2>

              <button
                type="button"
                className="boton"
                onClick={actualizarPostulaciones}
                disabled={cargandoPanel}
              >
                Actualizar postulaciones
              </button>

              {postulaciones.length === 0 ? (
                <p className="nota">
                  No hay postulaciones disponibles.
                </p>
              ) : (
                <div className="lista-postulaciones">
                  {postulaciones.map((postulacion) => (
                    <article
                      className="postulacion-item"
                      key={postulacion.id}
                    >
                      <strong>
                        Postulación #{postulacion.id}
                      </strong>

                      <p>
                        Candidato: {postulacion.candidato_id}
                      </p>

                      <p>
                        Vacante: {postulacion.vacante_id}
                      </p>

                      <button
                        type="button"
                        className="boton"
                        disabled={cargandoPanel}
                        onClick={() =>
                          esAdministrador
                            ? verRevision(postulacion.id)
                            : verPostulacionReclutador(
                                postulacion.id
                              )
                        }
                      >
                        Revisar
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="panel-seccion">
              <h2>
                {esAdministrador
                  ? 'Revisión de candidato'
                  : 'Evaluación de candidato'}
              </h2>

              {cargandoPanel && (
                <p>Cargando información...</p>
              )}

              {esAdministrador &&
                !revision &&
                !cargandoPanel && (
                  <p className="nota">
                    Selecciona una postulación para
                    consultar sus evaluaciones.
                  </p>
                )}

              {esAdministrador && revision && (
                <div className="detalle-revision">
                  <h3>
                    Postulación #{revision.postulacion_id}
                  </h3>

                  <div className="informacion">
                    <p>
                      <strong>Candidato:</strong>{' '}
                      {revision.candidato_id}
                    </p>

                    <p>
                      <strong>Vacante:</strong>{' '}
                      {revision.vacante_id}
                    </p>
                  </div>

                  <h3>Ranking de IA</h3>

                  {revision.ranking ? (
                    <div className="informacion">
                      <p className="puntaje-ranking">
                        {revision.ranking.puntaje}/100
                      </p>

                      <p>
                        <strong>Método:</strong>{' '}
                        {revision.ranking.metodo}
                      </p>

                      <p>
                        {revision.ranking.explicacion}
                      </p>
                    </div>
                  ) : (
                    <p>
                      Esta postulación aún no tiene ranking.
                    </p>
                  )}

                  <h3>
                    Recomendación del reclutador
                  </h3>

                  {revision.recomendacion_reclutador ? (
                    <div className="informacion">
                      <p>
                        <strong>Puntuación:</strong>{' '}
                        {
                          revision.recomendacion_reclutador
                            .recomendacion
                        }
                        /5
                      </p>

                      <p>
                        {
                          revision.recomendacion_reclutador
                            .resumen
                        }
                      </p>
                    </div>
                  ) : (
                    <p>Aún no hay recomendación.</p>
                  )}

                  <h3>Decisión final</h3>

                  {revision.decision_final ? (
                    <div className="informacion">
                      <p>
                        <strong>Resultado:</strong>{' '}
                        {revision.decision_final.decision}
                      </p>

                      <p>
                        <strong>Justificación:</strong>{' '}
                        {
                          revision.decision_final
                            .justificacion
                        }
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={registrarDecision}>
                      <div className="campo">
                        <label htmlFor="decision">
                          Decisión
                        </label>

                        <select
                          id="decision"
                          value={decision}
                          onChange={(evento) =>
                            setDecision(evento.target.value)
                          }
                        >
                          <option value="ACEPTADO">
                            Aceptado
                          </option>

                          <option value="RECHAZADO">
                            Rechazado
                          </option>
                        </select>
                      </div>

                      <div className="campo">
                        <label htmlFor="justificacion">
                          Justificación
                        </label>

                        <textarea
                          id="justificacion"
                          value={justificacion}
                          minLength={10}
                          maxLength={2000}
                          required
                          rows={4}
                          onChange={(evento) =>
                            setJustificacion(
                              evento.target.value
                            )
                          }
                          placeholder="Explica el motivo de la decisión"
                        />
                      </div>

                      <button
                        type="submit"
                        className="boton"
                        disabled={cargandoPanel}
                      >
                        Registrar decisión final
                      </button>
                    </form>
                  )}
                </div>
              )}

              {!esAdministrador &&
                !detalleReclutador &&
                !cargandoPanel && (
                  <p className="nota">
                    Selecciona una postulación para
                    revisar al candidato.
                  </p>
                )}

              {!esAdministrador && detalleReclutador && (
                <div className="detalle-revision">
                  <h3>
                    Postulación #{detalleReclutador.id}
                  </h3>

                  <div className="informacion">
                    <p>
                      <strong>Nombre:</strong>{' '}
                      {detalleReclutador.nombre_candidato}
                    </p>

                    <p>
                      <strong>Correo:</strong>{' '}
                      {detalleReclutador.correo_candidato}
                    </p>

                    <p>
                      <strong>Ciudad:</strong>{' '}
                      {detalleReclutador.ciudad_candidato ||
                        'No registrada'}
                    </p>

                    <p>
                      <strong>Vacante:</strong>{' '}
                      {detalleReclutador.titulo_vacante}
                    </p>
                  </div>

                  <h3>Documentos del candidato</h3>

              {documentosReclutador.length === 0 ? (
                <p className="nota">
                  Este candidato todavía no ha subido documentos.
                </p>
              ) : (
                <div className="lista-postulaciones">
                  {documentosReclutador.map((documento) => (
                    <div className="postulacion-item" key={documento.id}>
                      <div>
                        <strong>{documento.tipo}</strong>
                        <p>{documento.nombre_archivo}</p>
                      </div>

                      <button
                        type="button"
                        className="boton boton-secundario"
                        onClick={() =>
                          descargarDocumentoReclutador(documento)
                        }
                      >
                        Descargar PDF
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <h3>Evaluaciones técnicas</h3>

                  {evaluaciones.length === 0 ? (
                    <p className="nota">
                      Todavía no hay evaluaciones.
                    </p>
                  ) : (
                    <div className="lista-postulaciones">
                      {evaluaciones.map((evaluacion) => (
                        <article
                          className="postulacion-item"
                          key={evaluacion.id}
                        >
                          <strong>
                            {evaluacion.tipo}
                          </strong>

                          <p>
                            Puntuación:{' '}
                            {evaluacion.puntuacion}/100
                          </p>

                          <p>
                            {evaluacion.observaciones ||
                              'Sin observaciones'}
                          </p>
                        </article>
                      ))}
                    </div>
                  )}

                  <h3>
                    Registrar evaluación técnica
                  </h3>

                  <form onSubmit={registrarEvaluacion}>
                    <div className="campo">
                      <label htmlFor="tipo-evaluacion">
                        Tipo de evaluación
                      </label>

                      <input
                        id="tipo-evaluacion"
                        type="text"
                        maxLength={100}
                        required
                        placeholder="Ejemplo: Prueba de Python"
                        value={tipoEvaluacion}
                        onChange={(evento) =>
                          setTipoEvaluacion(
                            evento.target.value
                          )
                        }
                      />
                    </div>

                    <div className="campo">
                      <label htmlFor="puntuacion">
                        Puntuación (0 a 100)
                      </label>

                      <input
                        id="puntuacion"
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        required
                        value={puntuacion}
                        onChange={(evento) =>
                          setPuntuacion(evento.target.value)
                        }
                      />
                    </div>

                    <div className="campo">
                      <label htmlFor="observaciones">
                        Observaciones
                      </label>

                      <textarea
                        id="observaciones"
                        rows={3}
                        value={observaciones}
                        onChange={(evento) =>
                          setObservaciones(
                            evento.target.value
                          )
                        }
                      />
                    </div>

                    <button
                      className="boton"
                      type="submit"
                      disabled={cargandoPanel}
                    >
                      Guardar evaluación
                    </button>
                  </form>

                  <h3>
                    Recomendación del reclutador
                  </h3>

                  {recomendacionExistente ? (
                    <div className="informacion">
                      <p>
                        <strong>Calificación:</strong>{' '}
                        {
                          recomendacionExistente
                            .recomendacion
                        }
                        /5
                      </p>

                      <p>
                        {recomendacionExistente.resumen ||
                          'Sin resumen'}
                      </p>

                      <p className="nota">
                        Esta postulación ya tiene una
                        recomendación registrada.
                      </p>
                    </div>
                  ) : (
                    <form
                      onSubmit={registrarRecomendacion}
                    >
                      <div className="campo">
                        <label htmlFor="recomendacion">
                          Recomendación (1 a 5)
                        </label>

                        <select
                          id="recomendacion"
                          value={recomendacion}
                          onChange={(evento) =>
                            setRecomendacion(
                              evento.target.value
                            )
                          }
                        >
                          {[1, 2, 3, 4, 5].map(
                            (valor) => (
                              <option
                                key={valor}
                                value={valor}
                              >
                                {valor}/5
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div className="campo">
                        <label htmlFor="resumen">
                          Resumen de la recomendación
                        </label>

                        <textarea
                          id="resumen"
                          rows={4}
                          maxLength={2000}
                          value={resumen}
                          onChange={(evento) =>
                            setResumen(evento.target.value)
                          }
                          placeholder="Describe tu valoración del candidato"
                        />
                      </div>

                      <button
                        className="boton"
                        type="submit"
                        disabled={cargandoPanel}
                      >
                        Registrar recomendación
                      </button>
                    </form>
                  )}
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
    )
  }

  // PANEL DE CANDIDATOS

  if (usuario?.rol === 'CANDIDATO') {
    return (
      <PanelCandidato
        usuario={usuario}
        token={token}
        cerrarSesion={cerrarSesion}
      />
    )
  }

  // OTROS ROLES

  if (usuario) {
    return (
      <main className="pagina">
        <section className="tarjeta">
          <div className="marca">DTT</div>

          <p className="etiqueta">
            Sesión iniciada
          </p>

          <h1>¡Bienvenido!</h1>

          <div className="informacion">
            <p>
              <strong>Nombre:</strong> {usuario.nombre}
            </p>

            <p>
              <strong>Rol:</strong> {usuario.rol}
            </p>

            <p>
              <strong>ID de usuario:</strong>{' '}
              {usuario.usuarioId}
            </p>
          </div>

          <p className="nota">
            Próximamente mostraremos el panel de tu rol.
          </p>

          <button
            type="button"
            className="boton"
            onClick={cerrarSesion}
          >
            Cerrar sesión
          </button>
        </section>
      </main>
    )
  }

  // INICIO DE SESIÓN

  return (
    <main className="pagina">
      <section className="tarjeta">
        <div className="marca">DTT</div>

        <p className="etiqueta">
          Develop Talent & Technology
        </p>

        <h1>Bienvenido</h1>

        <p className="descripcion">
          Sistema de Ranking Predictivo de Candidatos
        </p>

        <form onSubmit={iniciarSesion}>
          <div className="campo">
            <label htmlFor="correo">
              Correo electrónico
            </label>

            <input
              id="correo"
              type="email"
              placeholder="ejemplo@correo.com"
              autoComplete="username"
              value={correo}
              onChange={(evento) =>
                setCorreo(evento.target.value)
              }
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="password">
              Contraseña
            </label>

            <input
              id="password"
              type={
                mostrarPassword
                  ? 'text'
                  : 'password'
              }
              placeholder="Ingresa tu contraseña"
              autoComplete="current-password"
              value={password}
              onChange={(evento) =>
                setPassword(evento.target.value)
              }
              required
            />

            <label className="mostrar-password">
              <input
                type="checkbox"
                checked={mostrarPassword}
                onChange={(evento) =>
                  setMostrarPassword(
                    evento.target.checked
                  )
                }
              />
              Mostrar contraseña
            </label>
          </div>

          {error && (
            <p
              className="mensaje-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            className="boton"
            type="submit"
            disabled={cargando}
          >
            {cargando
              ? 'Iniciando sesión...'
              : 'Iniciar sesión'}
          </button>
        </form>

        <p className="pie">
          Plataforma de gestión y evaluación de candidatos
        </p>
      </section>
    </main>
  )
}

export default App
