
import { useEffect, useState } from 'react'

const API_URL = 'http://127.0.0.1:8000'

const NIVELES = [
  { valor: 1, nombre: 'Básico' },
  { valor: 2, nombre: 'Principiante' },
  { valor: 3, nombre: 'Intermedio' },
  { valor: 4, nombre: 'Avanzado' },
  { valor: 5, nombre: 'Experto' },
]

export default function HabilidadesCandidato({ token }) {
  const [catalogo, setCatalogo] = useState([])
  const [habilidades, setHabilidades] = useState([])
  const [habilidadId, setHabilidadId] = useState('')
  const [nivel, setNivel] = useState('3')
  const [editandoId, setEditandoId] = useState(null)

  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [eliminandoId, setEliminandoId] = useState(null)

  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  async function solicitar(ruta, opciones = {}) {
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

      throw new Error(
        `No se pudo completar la operación (${respuesta.status})`
      )
    }

    return datos
  }

  async function cargarDatos() {
    setCargando(true)
    setError('')

    try {
      const [catalogoDatos, habilidadesDatos] = await Promise.all([
        solicitar('/api/v1/habilidades/catalogo'),
        solicitar('/api/v1/habilidades'),
      ])

      setCatalogo(catalogoDatos)
      setHabilidades(habilidadesDatos)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [token])

  function limpiarFormulario() {
    setHabilidadId('')
    setNivel('3')
    setEditandoId(null)
  }

  function editarHabilidad(habilidad) {
    setEditandoId(habilidad.id)
    setHabilidadId(String(habilidad.habilidad_id))
    setNivel(String(habilidad.nivel ?? 3))
    setError('')
    setMensaje('')
  }

  async function guardarHabilidad(evento) {
    evento.preventDefault()
    setError('')
    setMensaje('')

    const nivelNumero = Number(nivel)

    if (
      !Number.isInteger(nivelNumero) ||
      nivelNumero < 1 ||
      nivelNumero > 5
    ) {
      setError('Selecciona un nivel válido entre 1 y 5.')
      return
    }

    if (editandoId === null && !habilidadId) {
      setError('Selecciona una habilidad del catálogo.')
      return
    }

    if (
      editandoId === null &&
      habilidades.some(
        (item) => item.habilidad_id === Number(habilidadId)
      )
    ) {
      setError('Ya tienes registrada esta habilidad.')
      return
    }

    setGuardando(true)

    try {
      if (editandoId !== null) {
        await solicitar(`/api/v1/habilidades/${editandoId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            nivel: nivelNumero,
          }),
        })

        setMensaje('Nivel de habilidad actualizado correctamente.')
      } else {
        await solicitar('/api/v1/habilidades', {
          method: 'POST',
          body: JSON.stringify({
            habilidad_id: Number(habilidadId),
            nivel: nivelNumero,
          }),
        })

        setMensaje('Habilidad registrada correctamente.')
      }

      limpiarFormulario()
      await cargarDatos()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function eliminarHabilidad(habilidad) {
    const nombre = habilidad.habilidad?.nombre || 'esta habilidad'

    const confirmado = window.confirm(
      `¿Deseas eliminar la habilidad "${nombre}" de tu perfil?`
    )

    if (!confirmado) return

    setError('')
    setMensaje('')
    setEliminandoId(habilidad.id)

    try {
      await solicitar(`/api/v1/habilidades/${habilidad.id}`, {
        method: 'DELETE',
      })

      if (editandoId === habilidad.id) {
        limpiarFormulario()
      }

      await cargarDatos()
      setMensaje('Habilidad eliminada correctamente.')
    } catch (err) {
      setError(err.message)
    } finally {
      setEliminandoId(null)
    }
  }

  function nombreNivel(valor) {
    const encontrado = NIVELES.find(
      (item) => item.valor === Number(valor)
    )

    return encontrado
      ? `${encontrado.valor} - ${encontrado.nombre}`
      : 'No especificado'
  }

  const habilidadesDisponibles = catalogo.filter(
    (habilidad) =>
      !habilidades.some(
        (registrada) =>
          registrada.habilidad_id === habilidad.id
      )
  )

  return (
    <section className="panel-seccion">
      <h2>Mis habilidades</h2>

      <p>
        Registra tus habilidades técnicas y selecciona tu nivel
        de dominio. Esta información ayudará a evaluar tu
        compatibilidad con las vacantes.
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
              ? 'Editar nivel de habilidad'
              : 'Agregar habilidad'}
          </h3>

          <form onSubmit={guardarHabilidad}>
            <div className="campo">
              <label htmlFor="habilidad-catalogo">
                Habilidad
              </label>

              <select
                id="habilidad-catalogo"
                value={habilidadId}
                onChange={(evento) =>
                  setHabilidadId(evento.target.value)
                }
                disabled={editandoId !== null || cargando}
                required
              >
                <option value="">
                  Selecciona una habilidad
                </option>

                {editandoId !== null ? (
                  catalogo
                    .filter(
                      (item) =>
                        item.id === Number(habilidadId)
                    )
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nombre}
                      </option>
                    ))
                ) : (
                  habilidadesDisponibles.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="campo">
              <label htmlFor="habilidad-nivel">
                Nivel de dominio
              </label>

              <select
                id="habilidad-nivel"
                value={nivel}
                onChange={(evento) =>
                  setNivel(evento.target.value)
                }
                required
              >
                {NIVELES.map((item) => (
                  <option
                    key={item.valor}
                    value={item.valor}
                  >
                    {item.valor} - {item.nombre}
                  </option>
                ))}
              </select>
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
                disabled={
                  cargando ||
                  guardando ||
                  eliminandoId !== null ||
                  (editandoId === null &&
                    habilidadesDisponibles.length === 0)
                }
              >
                {guardando
                  ? 'Guardando...'
                  : editandoId !== null
                    ? 'Guardar cambios'
                    : 'Agregar habilidad'}
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

          {!cargando &&
            catalogo.length === 0 && (
              <p className="nota">
                El catálogo de habilidades está vacío.
                Será necesario registrar habilidades
                desde el backend.
              </p>
            )}

          {!cargando &&
            catalogo.length > 0 &&
            habilidadesDisponibles.length === 0 &&
            editandoId === null && (
              <p className="nota">
                Ya registraste todas las habilidades
                disponibles en el catálogo.
              </p>
            )}
        </section>

        <section className="panel-seccion">
          <h3>Habilidades registradas</h3>

          <button
            type="button"
            className="boton boton-secundario"
            onClick={cargarDatos}
            disabled={cargando || guardando}
          >
            Actualizar lista
          </button>

          {cargando ? (
            <p>Cargando habilidades...</p>
          ) : habilidades.length === 0 ? (
            <p className="nota">
              Todavía no has registrado habilidades.
            </p>
          ) : (
            <div className="lista-postulaciones">
              {habilidades.map((habilidad) => (
                <article
                  className="postulacion-item"
                  key={habilidad.id}
                >
                  <h4>
                    {habilidad.habilidad?.nombre ||
                      `Habilidad ${habilidad.habilidad_id}`}
                  </h4>

                  {habilidad.habilidad?.descripcion && (
                    <p>
                      {habilidad.habilidad.descripcion}
                    </p>
                  )}

                  <p>
                    <strong>Nivel:</strong>{' '}
                    {nombreNivel(habilidad.nivel)}
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
                      onClick={() =>
                        editarHabilidad(habilidad)
                      }
                      disabled={
                        guardando ||
                        eliminandoId !== null
                      }
                    >
                      Editar nivel
                    </button>

                    <button
                      type="button"
                      className="boton boton-secundario"
                      onClick={() =>
                        eliminarHabilidad(habilidad)
                      }
                      disabled={
                        guardando ||
                        eliminandoId !== null
                      }
                    >
                      {eliminandoId === habilidad.id
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
