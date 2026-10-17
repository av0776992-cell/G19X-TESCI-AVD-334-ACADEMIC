
import { useCallback, useEffect, useState } from 'react'

const API_URL = 'http://127.0.0.1:8000'

const FORMULARIO_VACIO = {
  empresa: '',
  puesto: '',
  descripcion: '',
  fecha_inicio: '',
  fecha_fin: '',
}

export default function ExperienciaCandidato({ token }) {
  const [experiencias, setExperiencias] = useState([])
  const [formulario, setFormulario] = useState({
    ...FORMULARIO_VACIO,
  })
  const [editandoId, setEditandoId] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [eliminandoId, setEliminandoId] = useState(null)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const solicitar = useCallback(async (ruta, opciones = {}) => {
    const respuesta = await fetch(`${API_URL}${ruta}`, {
      ...opciones,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(opciones.body
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...opciones.headers,
      },
    })

    if (respuesta.status === 204) {
      return null
    }

    const datos = await respuesta.json().catch(() => ({}))

    if (!respuesta.ok) {
      if (typeof datos.detail === 'string') {
        throw new Error(datos.detail)
      }

      if (Array.isArray(datos.detail)) {
        throw new Error(
          datos.detail
            .map((item) => item.msg || 'Dato no válido')
            .join('. ')
        )
      }

      throw new Error(`Error del servidor (${respuesta.status})`)
    }

    return datos
  }, [token])

  async function cargarExperiencias() {
    setCargando(true)
    setError('')

    try {
      const datos = await solicitar('/api/v1/experiencias')
      setExperiencias(datos)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    // Evita actualizar el estado si el token cambia o se desmonta el componente.
    let activo = true

    async function cargarInicial() {
      try {
        const datos = await solicitar('/api/v1/experiencias')
        if (activo) setExperiencias(datos)
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

  function cambiarCampo(evento) {
    const { name, value } = evento.target

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }))
  }

  function limpiarFormulario() {
    setFormulario({ ...FORMULARIO_VACIO })
    setEditandoId(null)
  }

  function editarExperiencia(experiencia) {
    setEditandoId(experiencia.id)
    setFormulario({
      empresa: experiencia.empresa || '',
      puesto: experiencia.puesto || '',
      descripcion: experiencia.descripcion || '',
      fecha_inicio: experiencia.fecha_inicio || '',
      fecha_fin: experiencia.fecha_fin || '',
    })
    setError('')
    setMensaje('')
  }

  async function guardarExperiencia(evento) {
    evento.preventDefault()
    setError('')
    setMensaje('')

    const empresa = formulario.empresa.trim()
    const puesto = formulario.puesto.trim()
    const descripcion = formulario.descripcion.trim()

    if (empresa.length < 2 || empresa.length > 150) {
      setError('La empresa debe tener entre 2 y 150 caracteres.')
      return
    }

    if (puesto.length < 2 || puesto.length > 150) {
      setError('El puesto debe tener entre 2 y 150 caracteres.')
      return
    }

    if (descripcion && descripcion.length < 2) {
      setError(
        'La descripción debe tener al menos 2 caracteres.'
      )
      return
    }

    if (
      formulario.fecha_inicio &&
      formulario.fecha_fin &&
      formulario.fecha_fin < formulario.fecha_inicio
    ) {
      setError(
        'La fecha de finalización no puede ser anterior a la fecha de inicio.'
      )
      return
    }

    const datos = {
      empresa,
      puesto,
      descripcion: descripcion || null,
      fecha_inicio: formulario.fecha_inicio || null,
      fecha_fin: formulario.fecha_fin || null,
    }

    setGuardando(true)

    try {
      if (editandoId !== null) {
        await solicitar(`/api/v1/experiencias/${editandoId}`, {
          method: 'PATCH',
          body: JSON.stringify(datos),
        })

        setMensaje('Experiencia laboral actualizada correctamente.')
      } else {
        await solicitar('/api/v1/experiencias', {
          method: 'POST',
          body: JSON.stringify(datos),
        })

        setMensaje('Experiencia laboral registrada correctamente.')
      }

      limpiarFormulario()
      await cargarExperiencias()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function eliminarExperiencia(experiencia) {
    const confirmado = window.confirm(
      `¿Deseas eliminar la experiencia "${experiencia.puesto}" en ${experiencia.empresa}?`
    )

    if (!confirmado) return

    setError('')
    setMensaje('')
    setEliminandoId(experiencia.id)

    try {
      await solicitar(`/api/v1/experiencias/${experiencia.id}`, {
        method: 'DELETE',
      })

      if (editandoId === experiencia.id) {
        limpiarFormulario()
      }

      await cargarExperiencias()
      setMensaje('Experiencia laboral eliminada correctamente.')
    } catch (err) {
      setError(err.message)
    } finally {
      setEliminandoId(null)
    }
  }

  function mostrarFecha(fecha) {
    if (!fecha) return 'No especificada'

    const [anio, mes, dia] = fecha.split('-')

    if (!anio || !mes || !dia) return fecha

    return `${dia}/${mes}/${anio}`
  }

  return (
    <section className="panel-seccion">
      <h2>Mi experiencia laboral</h2>

      <p>
        Registra tu experiencia profesional para mantener
        actualizado tu perfil de candidato.
      </p>

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

      <div className="panel-columnas">
        <section className="panel-seccion">
          <h3>
            {editandoId !== null
              ? 'Editar experiencia laboral'
              : 'Agregar experiencia laboral'}
          </h3>

          <form onSubmit={guardarExperiencia}>
            <div className="campo">
              <label htmlFor="experiencia-empresa">
                Empresa
              </label>
              <input
                id="experiencia-empresa"
                name="empresa"
                type="text"
                value={formulario.empresa}
                onChange={cambiarCampo}
                placeholder="Ejemplo: Empresa de Tecnología"
                minLength={2}
                maxLength={150}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="experiencia-puesto">
                Puesto desempeñado
              </label>
              <input
                id="experiencia-puesto"
                name="puesto"
                type="text"
                value={formulario.puesto}
                onChange={cambiarCampo}
                placeholder="Ejemplo: Desarrollador Backend"
                minLength={2}
                maxLength={150}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="experiencia-descripcion">
                Descripción de actividades (opcional)
              </label>
              <textarea
                id="experiencia-descripcion"
                name="descripcion"
                value={formulario.descripcion}
                onChange={cambiarCampo}
                placeholder="Describe tus principales actividades y responsabilidades"
                rows={4}
              />
            </div>

            <div className="campo">
              <label htmlFor="experiencia-inicio">
                Fecha de inicio (opcional)
              </label>
              <input
                id="experiencia-inicio"
                name="fecha_inicio"
                type="date"
                value={formulario.fecha_inicio}
                onChange={cambiarCampo}
              />
            </div>

            <div className="campo">
              <label htmlFor="experiencia-fin">
                Fecha de finalización (opcional)
              </label>
              <input
                id="experiencia-fin"
                name="fecha_fin"
                type="date"
                value={formulario.fecha_fin}
                onChange={cambiarCampo}
              />
              <p className="nota">
                Si todavía trabajas en esta empresa,
                deja esta fecha vacía.
              </p>
            </div>

            <div
              className="panel-acciones"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <button
                type="submit"
                className="boton"
                disabled={guardando || eliminandoId !== null}
              >
                {guardando
                  ? 'Guardando...'
                  : editandoId !== null
                    ? 'Guardar cambios'
                    : 'Agregar experiencia'}
              </button>

              {editandoId !== null && (
                <button
                  type="button"
                  className="boton boton-secundario"
                  onClick={limpiarFormulario}
                  disabled={guardando}
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="panel-seccion">
          <h3>Experiencias registradas</h3>

          <button
            type="button"
            className="boton boton-secundario"
            onClick={cargarExperiencias}
            disabled={cargando || guardando}
          >
            Actualizar lista
          </button>

          {cargando ? (
            <p>Cargando experiencias...</p>
          ) : experiencias.length === 0 ? (
            <p className="nota">
              Todavía no has registrado experiencia laboral.
            </p>
          ) : (
            <div className="lista-postulaciones">
              {experiencias.map((experiencia) => (
                <article
                  className="postulacion-item"
                  key={experiencia.id}
                >
                  <h4>{experiencia.puesto}</h4>

                  <p>
                    <strong>Empresa:</strong>{' '}
                    {experiencia.empresa}
                  </p>

                  <p>
                    <strong>Descripción:</strong>{' '}
                    {experiencia.descripcion ||
                      'No especificada'}
                  </p>

                  <p>
                    <strong>Inicio:</strong>{' '}
                    {mostrarFecha(experiencia.fecha_inicio)}
                  </p>

                  <p>
                    <strong>Finalización:</strong>{' '}
                    {experiencia.fecha_fin
                      ? mostrarFecha(experiencia.fecha_fin)
                      : 'No especificada / En curso'}
                  </p>

                  <div
                    className="panel-acciones"
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}
                  >
                    <button
                      type="button"
                      className="boton boton-secundario"
                      onClick={() => editarExperiencia(experiencia)}
                      disabled={guardando || eliminandoId !== null}
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      className="boton boton-secundario"
                      onClick={() => eliminarExperiencia(experiencia)}
                      disabled={guardando || eliminandoId !== null}
                    >
                      {eliminandoId === experiencia.id
                        ? 'Eliminando...'
                        : 'Eliminar'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  )
}
