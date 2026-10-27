import { useState } from 'react'
import { solicitarAPI } from '../api'

function RankingVacante({ token, postulaciones }) {
  const [vacanteId, setVacanteId] = useState('')
  const [ranking, setRanking] = useState(null)
  const [resumen, setResumen] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const vacantesConPostulaciones = [...new Set(
    postulaciones.map((postulacion) => Number(postulacion.vacante_id))
      .filter((id) => Number.isInteger(id) && id > 0)
  )].sort((a, b) => a - b)

  function obtenerVacanteId() {
    const id = Number(vacanteId)
    if (!Number.isInteger(id) || id <= 0) {
      setError('Selecciona un ID de vacante válido.')
      return null
    }
    return id
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
      `¿Calcular y guardar un nuevo puntaje para todas las postulaciones de la vacante #${id}?`
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
          <label htmlFor="vacante-ranking-id">ID de la vacante</label>
          <input
            id="vacante-ranking-id"
            type="number"
            min="1"
            step="1"
            list="vacantes-ranking-disponibles"
            value={vacanteId}
            disabled={cargando}
            onChange={(evento) => {
              setVacanteId(evento.target.value)
              setResumen(null)
              setRanking(null)
              setError('')
            }}
            placeholder="Ej. 1"
            required
          />
          <datalist id="vacantes-ranking-disponibles">
            {vacantesConPostulaciones.map((id) => <option key={id} value={id} />)}
          </datalist>
        </div>
        <div className="acciones-ranking-vacante">
          <button type="submit" className="boton" disabled={cargando}>
            {cargando ? 'Procesando...' : 'Consultar / actualizar clasificación'}
          </button>
          <button
            type="button"
            className="boton"
            disabled={cargando || !vacanteId}
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
