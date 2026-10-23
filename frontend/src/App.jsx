
import { useState } from 'react'
import PanelCandidato from './components/PanelCandidato'
import PanelGestion from './components/PanelGestion'
import { API_URL } from './api'
import './App.css'

function App() {
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [cargandoPanel, setCargandoPanel] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const [usuario, setUsuario] = useState(null)
  const [seccionPanel, setSeccionPanel] = useState('inicio')
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

  // Paneles separados por rol. La lógica de API y los estados se conservan aquí.
  if (
    usuario?.rol === 'ADMINISTRADOR' ||
    usuario?.rol === 'RECLUTADOR'
  ) {
    return (
      <PanelGestion
        usuario={usuario}
        seccionPanel={seccionPanel}
        setSeccionPanel={setSeccionPanel}
        cerrarSesion={cerrarSesion}
        error={error}
        mensaje={mensaje}
        postulaciones={postulaciones}
        cargandoPanel={cargandoPanel}
        actualizarPostulaciones={actualizarPostulaciones}
        verRevision={verRevision}
        verPostulacionReclutador={verPostulacionReclutador}
        datosVacantes={{
          nuevaVacante, setNuevaVacante, creandoVacante, crearVacante,
          requisitoVacante, setRequisitoVacante, guardandoRequisito,
          guardarRequisitoVacante, edicionVacante, setEdicionVacante,
          cargarVacanteParaEditar, guardarEdicionVacante,
          guardandoEdicionVacante, cerrarVacanteDesdePanel, cerrandoVacante,
        }}
        datosRevision={{
          revision, decision, setDecision, justificacion,
          setJustificacion, registrarDecision,
        }}
        datosReclutador={{
          detalleReclutador, documentosReclutador,
          descargarDocumentoReclutador, evaluaciones,
          tipoEvaluacion, setTipoEvaluacion, puntuacion, setPuntuacion,
          observaciones, setObservaciones, registrarEvaluacion,
          recomendacionExistente, recomendacion, setRecomendacion,
          resumen, setResumen, registrarRecomendacion,
        }}
      />
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
