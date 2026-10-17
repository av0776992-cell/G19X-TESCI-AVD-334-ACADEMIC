
import { useCallback, useEffect, useState } from 'react'

const API_URL = 'http://127.0.0.1:8000'

const NIVELES = [
  { valor: 1, nombre: 'Básico' },
  { valor: 2, nombre: 'Principiante' },
  { valor: 3, nombre: 'Intermedio' },
  { valor: 4, nombre: 'Avanzado' },
  { valor: 5, nombre: 'Experto' },
]

export default function CompetenciasCandidato({ token }) {
  const [catalogo, setCatalogo] = useState([])
  const [competencias, setCompetencias] = useState([])
  const [competenciaId, setCompetenciaId] = useState('')
  const [nivel, setNivel] = useState('3')
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

      throw new Error(
        `No se pudo completar la operación (${respuesta.status})`
      )
    }

    return datos
  }, [token])

  async function cargarDatos() {
    setCargando(true)
    setError('')

    try {
      const [catalogoDatos, competenciasDatos] = await Promise.all([
        solicitar('/api/v1/competencias/catalogo'),
          solicitar('/api/v1/competencias'),
        ])

        setCatalogo(catalogoDatos)
        setCompetencias(competenciasDatos)
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
        const [catalogoDatos, elementosDatos] = await Promise.all([
          solicitar('/api/v1/competencias/catalogo'),
          solicitar('/api/v1/competencias'),
        ])

        if (!activo) return
        setCatalogo(catalogoDatos)
        setCompetencias(elementosDatos)
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

  function limpiarFormulario() {
    setCompetenciaId('')
    setNivel('3')
    setEditandoId(null)
  }

  function editarCompetencia(competencia) {
    setEditandoId(competencia.id)
    setCompetenciaId(String(competencia.competencia_id))
    setNivel(String(competencia.nivel ?? 3))
    setError('')
    setMensaje('')
  }

  async function guardarCompetencia(evento) {
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

    if (editandoId === null && !competenciaId) {
      setError('Selecciona una competencia del catálogo.')
      return
    }

    if (
      editandoId === null &&
      competencias.some(
        (item) => item.competencia_id === Number(competenciaId)
      )
    ) {
      setError('Ya tienes registrada esta competencia.')
      return
    }

    setGuardando(true)

    try {
      if (editandoId !== null) {
        await solicitar(`/api/v1/competencias/${editandoId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            nivel: nivelNumero,
          }),
        })

        setMensaje('Nivel de competencia actualizado correctamente.')
      } else {
        await solicitar('/api/v1/competencias', {
          method: 'POST',
          body: JSON.stringify({
            competencia_id: Number(competenciaId),
            nivel: nivelNumero,
          }),
        })

        setMensaje('Competencia registrada correctamente.')
      }

      limpiarFormulario()
      await cargarDatos()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function eliminarCompetencia(competencia) {
    const nombre =
      competencia.competencia?.nombre || 'esta competencia'

    const confirmado = window.confirm(
      `¿Deseas eliminar la competencia "${nombre}" de tu perfil?`
    )

    if (!confirmado) return

    setError('')
    setMensaje('')
    setEliminandoId(competencia.id)

    try {
      await solicitar(`/api/v1/competencias/${competencia.id}`, {
        method: 'DELETE',
      })

      if (editandoId === competencia.id) {
        limpiarFormulario()
      }

      await cargarDatos()
      setMensaje('Competencia eliminada correctamente.')
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

  const competenciasDisponibles = catalogo.filter(
    (competencia) =>
      !competencias.some(
        (registrada) =>
          registrada.competencia_id === competencia.id
      )
  )

  return (
    <section className="panel-seccion">
      <h2>Mis competencias</h2>

      <p>
        Registra tus competencias profesionales y selecciona
        tu nivel de dominio. Esta información ayudará a
        evaluar tu compatibilidad con las vacantes.
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
              ? 'Editar nivel de competencia'
              : 'Agregar competencia'}
          </h3>

          <form onSubmit={guardarCompetencia}>
            <div className="campo">
              <label htmlFor="competencia-catalogo">
                Competencia
              </label>

              <select
                id="competencia-catalogo"
                value={competenciaId}
                onChange={(evento) =>
                  setCompetenciaId(evento.target.value)
                }
                disabled={editandoId !== null || cargando}
                required
              >
                <option value="">
                  Selecciona una competencia
                </option>

                {editandoId !== null ? (
                  catalogo
                    .filter(
                      (item) =>
                        item.id === Number(competenciaId)
                    )
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nombre}
                      </option>
                    ))
                ) : (
                  competenciasDisponibles.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="campo">
              <label htmlFor="competencia-nivel">
                Nivel de dominio
              </label>

              <select
                id="competencia-nivel"
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
                    competenciasDisponibles.length === 0)
                }
              >
                {guardando
                  ? 'Guardando...'
                  : editandoId !== null
                    ? 'Guardar cambios'
                    : 'Agregar competencia'}
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
                El catálogo de competencias está vacío.
                Será necesario registrar competencias
                desde el backend.
              </p>
            )}

          {!cargando &&
            catalogo.length > 0 &&
            competenciasDisponibles.length === 0 &&
            editandoId === null && (
              <p className="nota">
                Ya registraste todas las competencias
                disponibles en el catálogo.
              </p>
            )}
        </section>

        <section className="panel-seccion">
          <h3>Competencias registradas</h3>

          <button
            type="button"
            className="boton boton-secundario"
            onClick={cargarDatos}
            disabled={cargando || guardando}
          >
            Actualizar lista
          </button>

          {cargando ? (
            <p>Cargando competencias...</p>
          ) : competencias.length === 0 ? (
            <p className="nota">
              Todavía no has registrado competencias.
            </p>
          ) : (
            <div className="lista-postulaciones">
              {competencias.map((competencia) => (
                <article
                  className="postulacion-item"
                  key={competencia.id}
                >
                  <h4>
                    {competencia.competencia?.nombre ||
                      `Competencia ${competencia.competencia_id}`}
                  </h4>

                  {competencia.competencia?.descripcion && (
                    <p>
                      {competencia.competencia.descripcion}
                    </p>
                  )}

                  <p>
                    <strong>Nivel:</strong>{' '}
                    {nombreNivel(competencia.nivel)}
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
                        editarCompetencia(competencia)
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
                        eliminarCompetencia(competencia)
                      }
                      disabled={
                        guardando ||
                        eliminandoId !== null
                      }
                    >
                      {eliminandoId === competencia.id
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
