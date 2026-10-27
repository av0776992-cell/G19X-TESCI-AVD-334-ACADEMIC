import { useEffect, useState } from 'react'
import { solicitarAPI } from '../api'

function RankingVacante({ token }) {
  const [vacanteId, setVacanteId] = useState('')
  const [vacantes, setVacantes] = useState([])
  const [cargandoVacantes, setCargandoVacantes] = useState(true)
  const [errorVacantes, setErrorVacantes] = useState('')
  const [revisionCatalogo, setRevisionCatalogo] = useState(0)
  const [ranking, setRanking] = useState(null)
  const [resumen, setResumen] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  // El catálogo incluye también vacantes cerradas para poder revisar su historial.
  useEffect(() => {
    const controlador = new AbortController()
    solicitarAPI('/api/v1/ranking/vacantes', token, {
      signal: controlador.signal,
    })
      .then((datos) => {
        if (controlador.signal.aborted) return
        setVacantes(datos)
        setErrorVacantes('')
      })
      .catch((err) => {
        if (controlador.signal.aborted) return
        setVacantes([])
        setErrorVacantes(err instanceof TypeError
          ? 'No se pudo conectar con FastAPI para cargar las vacantes.'
          : err.message)
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargandoVacantes(false)
      })
    return () => controlador.abort()
  }, [token, revisionCatalogo])

  const vacanteSeleccionada = vacantes.find(
    (vacante) => String(vacante.id) === vacanteId
  )

  function actualizarCatalogo() {
    setErrorVacantes('')
    setCargandoVacantes(true)
    setRevisionCatalogo((anterior) => anterior + 1)
  }

  function obtenerVacanteId() {
    if (!vacanteSeleccionada) {
      setError('Selecciona una vacante de la lista.')
      return null
    }
    return vacanteSeleccionada.id
  }

  async function consultar(evento) {
    evento.preventDefault()
    const id = obtenerVacanteId()
    if (id === null) return
    setError('')
    setResumen(null)
    setRanking(null)
    setCargando(true)
    try {
      setRanking(await solicitarAPI(`/api/v1/ranking/vacantes/${id}`, token))
    } catch (err) {
      setError(err instanceof TypeError
        ? 'No se pudo conectar con FastAPI.' : err.message)
    } finally {
      setCargando(false)
    }
  }

  async function calcularTodaVacante() {
    const id = obtenerVacanteId()
    if (id === null) return
    const confirmado = window.confirm(
      `¿Calcular y guardar un nuevo puntaje para todas las postulaciones de "${vacanteSeleccionada.titulo}" (vacante #${id})?`
    )
    if (!confirmado) return

    setError('')
    setResumen(null)
    setCargando(true)
    try {
      const datos = await solicitarAPI(
        `/api/v1/ranking/vacantes/${id}/calcular`, token, { method: 'POST' }
      )
      setResumen(datos)
      // La clasificación debe reflejar los resultados almacenados más recientes.
      setRanking(await solicitarAPI(`/api/v1/ranking/vacantes/${id}`, token))
    } catch (err) {
      setError(err instanceof TypeError
        ? 'No se pudo conectar con FastAPI.' : err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <section className="panel-seccion" id="panel-ranking-vacante">
      <h2>Clasificación de candidatos por vacante</h2>
      <p className="nota">Consulta el último puntaje de cada postulación. Quienes aún no tienen ranking aparecen al final. La clasificación es orientativa y requiere revisión humana.</p>
      <form onSubmit={consultar}>
        <div className="campo">
          <label htmlFor="vacante-ranking-id">Vacante</label>
          <select
            id="vacante-ranking-id"
            value={vacanteId}
            disabled={cargando || cargandoVacantes || vacantes.length === 0}
            onChange={(evento) => {
              setVacanteId(evento.target.value)
              setResumen(null)
              setRanking(null)
              setError('')
            }}
            required
          >
            <option value="">Selecciona una vacante por su título</option>
            {vacantes.map((vacante) => (
              <option key={vacante.id} value={String(vacante.id)}>
                {vacante.titulo} (#{vacante.id} · {vacante.estado === 'CERRADA' ? 'Cerrada' : 'Abierta'})
              </option>
            ))}
          </select>
          {cargandoVacantes && <p className="nota" role="status">Cargando vacantes...</p>}
          {!cargandoVacantes && !errorVacantes && vacantes.length === 0 && (
            <p className="nota">No hay vacantes registradas.</p>
          )}
          {errorVacantes && <p className="mensaje-error" role="alert">{errorVacantes}</p>}
          <button
            type="button"
            className="boton boton-secundario"
            disabled={cargando || cargandoVacantes}
            onClick={actualizarCatalogo}
          >
            Actualizar lista de vacantes
          </button>
        </div>
        <div className="acciones-ranking-vacante">
          <button type="submit" className="boton" disabled={cargando || !vacanteSeleccionada}>
            {cargando ? 'Procesando...' : 'Consultar / actualizar clasificación'}
          </button>
          <button
            type="button"
            className="boton"
            disabled={cargando || !vacanteSeleccionada}
            onClick={calcularTodaVacante}
          >
            {cargando ? 'Procesando...' : 'Calcular ranking de toda la vacante'}
          </button>
        </div>
      </form>
      {error && <p className="mensaje-error" role="alert">{error}</p>}
      {resumen && (
        <div className="informacion" role="status">
          <h3>Resultado del cálculo: {resumen.titulo_vacante}</h3>
          <p>
            Total: <strong>{resumen.total_postulaciones}</strong> ·
            {' '}Calculadas: <strong>{resumen.calculadas}</strong> ·
            {' '}Pendientes: <strong>{resumen.pendientes}</strong> ·
            {' '}Errores: <strong>{resumen.errores}</strong>
          </p>
          {resumen.total_postulaciones === 0 && <p>Esta vacante aún no tiene postulaciones.</p>}
          {resumen.pendientes > 0 && (
            <p>Las postulaciones con indicadores pendientes no se recalcularon. Si tenían un puntaje anterior, permanecerá visible en la clasificación.</p>
          )}
          {resumen.resultados.some((fila) => fila.estado !== 'calculado') && (
            <ul>
              {resumen.resultados.filter((fila) => fila.estado !== 'calculado').map((fila) => (
                <li key={fila.postulacion_id}>
                  Postulación #{fila.postulacion_id}: {fila.estado === 'pendiente'
                    ? `indicadores pendientes: ${fila.indicadores_pendientes.join(', ')}`
                    : fila.mensaje}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {ranking && (
        <div className="informacion">
          <h3>{ranking.titulo_vacante} (vacante #{ranking.vacante_id})</h3>
          {ranking.candidatos.length === 0 ? (
            <p>No hay postulaciones para esta vacante.</p>
          ) : (
            <div className="tabla-ranking-contenedor">
              <table className="tabla-ranking-vacante">
                <thead><tr>
                  <th>Posición</th><th>Candidato</th><th>Postulación</th>
                  <th>Puntaje</th><th>Último cálculo</th>
                </tr></thead>
                <tbody>
                  {ranking.candidatos.map((fila, indice) => (
                    <tr key={fila.postulacion_id}>
                      <td>{fila.puntaje == null ? '—' : indice + 1}</td>
                      <td>{fila.candidato_nombre} (#{fila.candidato_id})</td>
                      <td>#{fila.postulacion_id}</td>
                      <td>{fila.puntaje == null ? 'Pendiente' : `${Number(fila.puntaje).toFixed(2)}/100`}</td>
                      <td>{fila.fecha_calculo
                        ? new Date(fila.fecha_calculo).toLocaleString()
                        : 'Sin cálculo'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default RankingVacante
