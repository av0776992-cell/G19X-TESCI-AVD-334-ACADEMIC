
import { useCallback, useEffect, useState } from 'react'

const API_URL = 'http://127.0.0.1:8000'

const FORMULARIO_VACIO = {
  institucion: '',
  titulo: '',
  nivel: '',
  fecha_inicio: '',
  fecha_fin: '',
}

export default function FormacionCandidato({ token }) {
  const [formaciones, setFormaciones] = useState([])
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

  async function cargarFormaciones() {
    setCargando(true)
    setError('')

    try {
      const datos = await solicitar('/api/v1/formaciones')
      setFormaciones(datos)
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
        const datos = await solicitar('/api/v1/formaciones')
        if (activo) setFormaciones(datos)
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

  function editarFormacion(formacion) {
    setEditandoId(formacion.id)
    setFormulario({
      institucion: formacion.institucion || '',
      titulo: formacion.titulo || '',
      nivel: formacion.nivel || '',
      fecha_inicio: formacion.fecha_inicio || '',
      fecha_fin: formacion.fecha_fin || '',
    })
    setError('')
    setMensaje('')
  }

  async function guardarFormacion(evento) {
    evento.preventDefault()
    setError('')
    setMensaje('')

    const institucion = formulario.institucion.trim()
    const titulo = formulario.titulo.trim()
    const nivel = formulario.nivel.trim()

    if (institucion.length < 2 || institucion.length > 150) {
      setError('La institución debe tener entre 2 y 150 caracteres.')
      return
    }

    if (titulo.length < 2 || titulo.length > 150) {
      setError('El título debe tener entre 2 y 150 caracteres.')
      return
    }

    if (nivel && (nivel.length < 2 || nivel.length > 50)) {
      setError('El nivel académico debe tener entre 2 y 50 caracteres.')
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
      institucion,
      titulo,
      nivel: nivel || null,
      fecha_inicio: formulario.fecha_inicio || null,
      fecha_fin: formulario.fecha_fin || null,
    }

    setGuardando(true)

    try {
      if (editandoId !== null) {
        await solicitar(`/api/v1/formaciones/${editandoId}`, {
          method: 'PATCH',
          body: JSON.stringify(datos),
        })
        setMensaje('Formación académica actualizada correctamente.')
      } else {
        await solicitar('/api/v1/formaciones', {
          method: 'POST',
          body: JSON.stringify(datos),
        })
        setMensaje('Formación académica registrada correctamente.')
      }

      limpiarFormulario()
      await cargarFormaciones()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function eliminarFormacion(formacion) {
    const confirmado = window.confirm(
      `¿Deseas eliminar la formación "${formacion.titulo}" de ${formacion.institucion}?`
    )

    if (!confirmado) return

    setError('')
    setMensaje('')
    setEliminandoId(formacion.id)

    try {
      await solicitar(`/api/v1/formaciones/${formacion.id}`, {
        method: 'DELETE',
      })

      if (editandoId === formacion.id) {
        limpiarFormulario()
      }

      await cargarFormaciones()
      setMensaje('Formación académica eliminada correctamente.')
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
      <h2>Mi formación académica</h2>
      <p>
        Registra tus estudios para mantener actualizado tu perfil
        y proporcionar información al sistema de ranking.
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
              ? 'Editar formación académica'
              : 'Agregar formación académica'}
          </h3>

          <form onSubmit={guardarFormacion}>
            <div className="campo">
              <label htmlFor="formacion-institucion">
                Institución educativa
              </label>
              <input
                id="formacion-institucion"
                name="institucion"
                type="text"
                value={formulario.institucion}
                onChange={cambiarCampo}
                placeholder="Ejemplo: Instituto Tecnológico"
                minLength={2}
                maxLength={150}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="formacion-titulo">
                Título o carrera
              </label>
              <input
                id="formacion-titulo"
                name="titulo"
                type="text"
                value={formulario.titulo}
                onChange={cambiarCampo}
                placeholder="Ejemplo: Ingeniería en Sistemas Computacionales"
                minLength={2}
                maxLength={150}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="formacion-nivel">
                Nivel académico (opcional)
              </label>
              <select
                id="formacion-nivel"
                name="nivel"
                value={formulario.nivel}
                onChange={cambiarCampo}
              >
                <option value="">Seleccionar nivel</option>
                <option value="Secundaria">Secundaria</option>
                <option value="Bachillerato">Bachillerato</option>
                <option value="Técnico">Técnico</option>
                <option value="Licenciatura">Licenciatura</option>
                <option value="Ingeniería">Ingeniería</option>
                <option value="Especialidad">Especialidad</option>
                <option value="Maestría">Maestría</option>
                <option value="Doctorado">Doctorado</option>
              </select>
            </div>

            <div className="campo">
              <label htmlFor="formacion-inicio">
                Fecha de inicio (opcional)
              </label>
              <input
                id="formacion-inicio"
                name="fecha_inicio"
                type="date"
                value={formulario.fecha_inicio}
                onChange={cambiarCampo}
              />
            </div>

            <div className="campo">
              <label htmlFor="formacion-fin">
                Fecha de finalización (opcional)
              </label>
              <input
                id="formacion-fin"
                name="fecha_fin"
                type="date"
                value={formulario.fecha_fin}
                onChange={cambiarCampo}
              />
              <p className="nota">
                Si todavía estás estudiando, deja esta fecha vacía.
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
                    : 'Agregar estudios'}
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
          <h3>Estudios registrados</h3>

          <button
            type="button"
            className="boton boton-secundario"
            onClick={cargarFormaciones}
            disabled={cargando || guardando}
          >
            Actualizar lista
          </button>

          {cargando ? (
            <p>Cargando estudios...</p>
          ) : formaciones.length === 0 ? (
            <p className="nota">
              Todavía no has registrado formación académica.
            </p>
          ) : (
            <div className="lista-postulaciones">
              {formaciones.map((formacion) => (
                <article
                  className="postulacion-item"
                  key={formacion.id}
                >
                  <h4>{formacion.titulo}</h4>

                  <p>
                    <strong>Institución:</strong>{' '}
                    {formacion.institucion}
                  </p>

                  <p>
                    <strong>Nivel:</strong>{' '}
                    {formacion.nivel || 'No especificado'}
                  </p>

                  <p>
                    <strong>Inicio:</strong>{' '}
                    {mostrarFecha(formacion.fecha_inicio)}
                  </p>

                  <p>
                    <strong>Finalización:</strong>{' '}
                    {formacion.fecha_fin
                      ? mostrarFecha(formacion.fecha_fin)
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
                      onClick={() => editarFormacion(formacion)}
                      disabled={guardando || eliminandoId !== null}
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      className="boton boton-secundario"
                      onClick={() => eliminarFormacion(formacion)}
                      disabled={guardando || eliminandoId !== null}
                    >
                      {eliminandoId === formacion.id
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
