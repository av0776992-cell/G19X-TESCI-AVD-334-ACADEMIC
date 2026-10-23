
import { useCallback, useEffect, useState } from 'react'
import MenuLateral from './MenuLateral'
import PerfilCandidato from './PerfilCandidato'
import FormacionCandidato from './FormacionCandidato'
import ExperienciaCandidato from './ExperienciaCandidato'
import HabilidadesCandidato from './HabilidadesCandidato'
import CompetenciasCandidato from './CompetenciasCandidato'
import { API_URL } from '../api'


const TIPOS_DOCUMENTO = [
  { valor: 'CV', nombre: 'Currículum (CV)' },
  { valor: 'Identificación', nombre: 'Identificación' },
  {
    valor: 'Comprobante de estudios',
    nombre: 'Comprobante de estudios',
  },
  { valor: 'Certificación', nombre: 'Certificaciones' },
  { valor: 'Otro documento', nombre: 'Otro documento' },
]

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

  // Documentos
  const [postulacionDocumento, setPostulacionDocumento] =
    useState('')
  const [tipoDocumento, setTipoDocumento] = useState('CV')
  const [archivos, setArchivos] = useState([])
  const [documentos, setDocumentos] = useState([])
  const [cargandoDocumentos, setCargandoDocumentos] =
    useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [descargandoId, setDescargandoId] = useState(null)
  const [reiniciarArchivo, setReiniciarArchivo] = useState(0)

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
  }, [solicitar])

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

  const yaPostulado = (vacanteId) =>
    postulaciones.some(
      (p) => p.vacante_id === vacanteId
    )

  function fechaLegible(fecha) {
    if (!fecha) return 'No especificada'

    const convertida = new Date(fecha)

    if (Number.isNaN(convertida.getTime())) {
      return 'No especificada'
    }

    return convertida.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  function obtenerEstado(postulacion) {
    if (postulacion.decision_final === 'ACEPTADO') {
      return 'Aceptado'
    }

    if (postulacion.decision_final === 'RECHAZADO') {
      return 'Rechazado'
    }

    return postulacion.estado_actual || 'Postulado'
  }

  function obtenerColorEstado(estado) {
    const valor = estado.toLowerCase()

    if (valor === 'aceptado') return '#15803d'
    if (valor === 'rechazado') return '#dc2626'

    if (
      valor.includes('revisión') ||
      valor.includes('revision') ||
      valor.includes('evaluación') ||
      valor.includes('evaluacion')
    ) {
      return '#a16207'
    }

    return '#2563eb'
  }

  // Consulta de documentos
  async function cargarDocumentos(postulacionId) {
    if (!postulacionId) {
      setDocumentos([])
      return
    }

    setCargandoDocumentos(true)
    setError('')

    try {
      const lista = await solicitar(
        `/api/v1/documentos/postulacion/${postulacionId}`
      )

      setDocumentos(lista)
    } catch (err) {
      setError(err.message)
      setDocumentos([])
    } finally {
      setCargandoDocumentos(false)
    }
  }

  useEffect(() => {
    if (seccion !== 'documentos' || !postulacionDocumento) return

    let activo = true

    async function cargarDocumentosInicial() {
      try {
        const lista = await solicitar(
          `/api/v1/documentos/postulacion/${postulacionDocumento}`
        )
        if (activo) setDocumentos(lista)
      } catch (err) {
        if (activo) {
          setError(err.message)
          setDocumentos([])
        }
      } finally {
        if (activo) setCargandoDocumentos(false)
      }
    }

    cargarDocumentosInicial()
    return () => {
      activo = false
    }
  }, [seccion, postulacionDocumento, solicitar])

  function seleccionarArchivos(evento) {
    const seleccionados = Array.from(
      evento.target.files || []
    )

    setError('')
    setMensaje('')

    if (!seleccionados.length) {
      setArchivos([])
      return
    }

    const maximo = 10 * 1024 * 1024

    const archivoInvalido = seleccionados.find(
      (archivo) =>
        !archivo.name.toLowerCase().endsWith('.pdf') ||
        archivo.size > maximo
    )

    if (archivoInvalido) {
      setError(
        'Todos los archivos deben ser PDF y pesar máximo 10 MB cada uno.'
      )
      setArchivos([])
      setReiniciarArchivo((actual) => actual + 1)
      return
    }

    setArchivos(seleccionados)
  }

  function cambiarTipoDocumento(nuevoTipo) {
    setTipoDocumento(nuevoTipo)
    setArchivos([])
    setReiniciarArchivo((actual) => actual + 1)
    setError('')
    setMensaje('')
  }

  async function subirDocumentos(evento) {
    evento.preventDefault()
    setError('')
    setMensaje('')

    if (!postulacionDocumento) {
      setError('Selecciona una postulación.')
      return
    }

    if (!archivos.length) {
      setError('Selecciona al menos un archivo PDF.')
      return
    }

    setSubiendo(true)

    let subidos = 0

    try {
      for (const archivo of archivos) {
        const formulario = new FormData()

        formulario.append(
          'postulacion_id',
          postulacionDocumento
        )
        formulario.append('tipo', tipoDocumento)
        formulario.append('archivo', archivo)

        await solicitar('/api/v1/documentos', {
          method: 'POST',
          body: formulario,
        })

        subidos += 1
      }

      setMensaje(
        subidos === 1
          ? 'Documento subido correctamente.'
          : `${subidos} documentos subidos correctamente.`
      )

      setArchivos([])
      setReiniciarArchivo((actual) => actual + 1)
    } catch (err) {
      setError(
        subidos
          ? `Se subieron ${subidos} archivo(s), pero ocurrió un error: ${err.message}`
          : err.message
      )
    } finally {
      setSubiendo(false)
      await cargarDocumentos(postulacionDocumento)
    }
  }

  async function descargarDocumento(documento) {
    setError('')
    setDescargandoId(documento.id)

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
            : 'No fue posible descargar el documento.'
        )
      }

      const archivo = await respuesta.blob()
      const url = URL.createObjectURL(archivo)
      const enlace = document.createElement('a')

      enlace.href = url
      enlace.download = documento.nombre_archivo
      document.body.appendChild(enlace)
      enlace.click()
      enlace.remove()

      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      setError(err.message)
    } finally {
      setDescargandoId(null)
    }
  }

  const permiteVarios =
    tipoDocumento === 'Certificación' ||
    tipoDocumento === 'Otro documento'

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
          <div className="panel-columnas">
            <section className="panel-seccion">
              <h2>Vacantes abiertas</h2>

              {vacantes.length === 0 && !cargando ? (
                <p className="nota">
                  No hay vacantes abiertas por el momento.
                </p>
              ) : (
                <div className="lista-postulaciones">
                  {vacantes.map((vacante) => (
                    <article
                      className="postulacion-item"
                      key={vacante.id}
                    >
                      <h3>{vacante.titulo}</h3>
                      <p>{vacante.descripcion}</p>

                      <p>
                        <strong>Ubicación:</strong>{' '}
                        {vacante.ubicacion ||
                          'No especificada'}
                      </p>

                      <p>
                        <strong>Modalidad:</strong>{' '}
                        {vacante.modalidad ||
                          'No especificada'}
                      </p>

                      <p>
                        <strong>Fecha de cierre:</strong>{' '}
                        {fechaLegible(vacante.fecha_cierre)}
                      </p>

                      <button
                        type="button"
                        className="boton"
                        onClick={() => verDetalle(vacante.id)}
                        disabled={procesando}
                      >
                        Ver detalles
                      </button>

                      {yaPostulado(vacante.id) && (
                        <p className="nota">
                          Ya te postulaste a esta vacante.
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="panel-seccion">
              <h2>Detalles de la vacante</h2>

              {!detalle ? (
                <p className="nota">
                  Selecciona una vacante para conocer
                  sus requisitos.
                </p>
              ) : (
                <div className="detalle-revision">
                  <h3>{detalle.titulo}</h3>
                  <p>{detalle.descripcion}</p>

                  <p>
                    <strong>Ubicación:</strong>{' '}
                    {detalle.ubicacion ||
                      'No especificada'}
                  </p>

                  <p>
                    <strong>Modalidad:</strong>{' '}
                    {detalle.modalidad ||
                      'No especificada'}
                  </p>

                  <h3>Habilidades requeridas</h3>

                  {(detalle.habilidades || []).length === 0 ? (
                    <p>
                      No hay habilidades específicas
                      registradas.
                    </p>
                  ) : (
                    <ul>
                      {detalle.habilidades.map((habilidad) => (
                        <li key={habilidad.id}>
                          {habilidad.nombre}
                          {habilidad.nivel_requerido != null
                            ? ` — Nivel ${habilidad.nivel_requerido}`
                            : ''}
                        </li>
                      ))}
                    </ul>
                  )}

                  <h3>Competencias requeridas</h3>

                  {(detalle.competencias || []).length === 0 ? (
                    <p>
                      No hay competencias específicas
                      registradas.
                    </p>
                  ) : (
                    <ul>
                      {detalle.competencias.map((competencia) => (
                        <li key={competencia.id}>
                          {competencia.nombre}
                          {competencia.nivel_requerido != null
                            ? ` — Nivel ${competencia.nivel_requerido}`
                            : ''}
                        </li>
                      ))}
                    </ul>
                  )}

                  <button
                    type="button"
                    className="boton"
                    disabled={
                      procesando || yaPostulado(detalle.id)
                    }
                    onClick={() => postularme(detalle.id)}
                  >
                    {yaPostulado(detalle.id)
                      ? 'Ya te postulaste'
                      : procesando
                        ? 'Procesando...'
                        : 'Postularme'}
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        {seccion === 'postulaciones' && (
          <section className="panel-seccion">
            <h2>Mis postulaciones</h2>

            {postulaciones.length === 0 ? (
              <p className="nota">
                Todavía no has realizado ninguna postulación.
              </p>
            ) : (
              <div className="lista-postulaciones">
                {postulaciones.map((postulacion) => {
                  const estado = obtenerEstado(postulacion)

                  return (
                    <article
                      className="postulacion-item"
                      key={postulacion.id}
                    >
                      <h3>
                        {postulacion.titulo_vacante ||
                          `Vacante #${postulacion.vacante_id}`}
                      </h3>

                      <p>
                        <strong>Postulación:</strong>{' '}
                        #{postulacion.id}
                      </p>

                      <p>
                        <strong>Fecha de postulación:</strong>{' '}
                        {fechaLegible(
                          postulacion.fecha_postulacion
                        )}
                      </p>

                      <p>
                        <strong>Estado actual:</strong>{' '}
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '6px 12px',
                            borderRadius: '999px',
                            backgroundColor:
                              obtenerColorEstado(estado),
                            color: '#ffffff',
                            fontWeight: '600',
                          }}
                        >
                          {estado}
                        </span>
                      </p>

                      {postulacion.fecha_estado && (
                        <p>
                          <strong>
                            Último cambio registrado:
                          </strong>{' '}
                          {fechaLegible(
                            postulacion.fecha_estado
                          )}
                        </p>
                      )}

                      {postulacion.decision_final ? (
                        <div>
                          <p>
                            <strong>Decisión final:</strong>{' '}
                            {estado}
                          </p>

                          <p>
                            <strong>Fecha de decisión:</strong>{' '}
                            {fechaLegible(
                              postulacion.fecha_decision
                            )}
                          </p>

                          <p className="nota">
                            Esta decisión fue registrada
                            por el administrador.
                          </p>
                        </div>
                      ) : (
                        <p className="nota">
                          Tu postulación continúa en proceso.
                        </p>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {seccion === 'documentos' && (
          <section className="panel-seccion">
            <h2>Mis documentos</h2>

            <p>
              Adjunta los archivos PDF correspondientes
              a cada postulación.
            </p>

            {postulaciones.length === 0 ? (
              <p className="nota">
                Primero debes postularte a una vacante
                para poder subir documentos.
              </p>
            ) : (
              <>
                <div className="campo">
                  <label htmlFor="postulacion-documento">
                    Selecciona la postulación
                  </label>

                  <select
                    id="postulacion-documento"
                    value={postulacionDocumento}
                    disabled={subiendo}
                    onChange={(evento) => {
                      setPostulacionDocumento(
                        evento.target.value
                      )
                      setDocumentos([])
                      setCargandoDocumentos(true)
                      setError('')
                      setMensaje('')
                    }}
                  >
                    {postulaciones.map((postulacion) => (
                      <option
                        key={postulacion.id}
                        value={String(postulacion.id)}
                      >
                        #{postulacion.id} —{' '}
                        {postulacion.titulo_vacante ||
                          `Vacante #${postulacion.vacante_id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="panel-columnas">
                  <div className="panel-seccion">
                    <h3>Subir documentos</h3>

                    <form onSubmit={subirDocumentos}>
                      <div className="campo">
                        <label htmlFor="tipo-documento">
                          Tipo de documento
                        </label>

                        <select
                          id="tipo-documento"
                          value={tipoDocumento}
                          disabled={subiendo}
                          onChange={(evento) =>
                            cambiarTipoDocumento(
                              evento.target.value
                            )
                          }
                        >
                          {TIPOS_DOCUMENTO.map((tipo) => (
                            <option
                              key={tipo.valor}
                              value={tipo.valor}
                            >
                              {tipo.nombre}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="campo">
                        <label htmlFor="archivo-pdf">
                          Seleccionar PDF
                        </label>

                        <input
                          key={reiniciarArchivo}
                          id="archivo-pdf"
                          type="file"
                          accept=".pdf,application/pdf"
                          multiple={permiteVarios}
                          disabled={subiendo}
                          onChange={seleccionarArchivos}
                        />
                      </div>

                      <p className="nota">
                        Máximo 10 MB por archivo.
                        {permiteVarios
                          ? ' Puedes seleccionar varios PDF.'
                          : ' Selecciona un PDF a la vez.'}
                      </p>

                      {archivos.length > 0 && (
                        <div>
                          <strong>
                            Archivos seleccionados:
                          </strong>

                          <ul>
                            {archivos.map((archivo, indice) => (
                              <li
                                key={`${archivo.name}-${indice}`}
                              >
                                {archivo.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="boton"
                        disabled={
                          subiendo ||
                          !archivos.length ||
                          !postulacionDocumento
                        }
                      >
                        {subiendo
                          ? 'Subiendo documentos...'
                          : archivos.length > 1
                            ? `Subir ${archivos.length} documentos`
                            : 'Subir documento'}
                      </button>
                    </form>
                  </div>

                  <div className="panel-seccion">
                    <h3>Documentos cargados</h3>

                    <button
                      type="button"
                      className="boton boton-secundario"
                      onClick={() =>
                        cargarDocumentos(
                          postulacionDocumento
                        )
                      }
                      disabled={
                        cargandoDocumentos || subiendo
                      }
                    >
                      Actualizar documentos
                    </button>

                    {cargandoDocumentos ? (
                      <p>Cargando documentos...</p>
                    ) : documentos.length === 0 ? (
                      <p className="nota">
                        No hay documentos registrados
                        para esta postulación.
                      </p>
                    ) : (
                      <div className="lista-postulaciones">
                        {documentos.map((documento) => (
                          <article
                            className="postulacion-item"
                            key={documento.id}
                          >
                            <h4>
                              {documento.nombre_archivo}
                            </h4>

                            <p>
                              <strong>Tipo:</strong>{' '}
                              {documento.tipo}
                            </p>

                            <p>
                              <strong>Fecha de subida:</strong>{' '}
                              {fechaLegible(
                                documento.fecha_subida
                              )}
                            </p>

                            <button
                              type="button"
                              className="boton"
                              disabled={
                                descargandoId === documento.id
                              }
                              onClick={() =>
                                descargarDocumento(
                                  documento
                                )
                              }
                            >
                              {descargandoId === documento.id
                                ? 'Descargando...'
                                : 'Descargar PDF'}
                            </button>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        )}
      </section>
    </main>
  )
}
