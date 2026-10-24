import { useState } from 'react'
import { API_URL } from '../api'

function RankingVacante({ token, postulaciones }) {
  const [vacanteId, setVacanteId] = useState('')
  const [ranking, setRanking] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const vacantesConPostulaciones = [...new Set(
    postulaciones.map((postulacion) => Number(postulacion.vacante_id))
      .filter((id) => Number.isInteger(id) && id > 0)
  )].sort((a, b) => a - b)

  async function consultar(evento) {
    evento.preventDefault()
    const id = Number(vacanteId)
    setError('')
    setRanking(null)
    if (!Number.isInteger(id) || id <= 0) {
      setError('Escribe un ID de vacante válido.')
      return
    }
    setCargando(true)
    try {
      const respuesta = await fetch(`${API_URL}/api/v1/ranking/vacantes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const datos = await respuesta.json().catch(() => ({}))
      if (!respuesta.ok) {
        throw new Error(typeof datos.detail === 'string'
          ? datos.detail : `Error del servidor (${respuesta.status}).`)
      }
      setRanking(datos)
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
      <p className="nota">Consulta el último puntaje calculado de cada postulación. Quienes aún no tienen ranking aparecen al final. La clasificación es orientativa y requiere revisión humana.</p>
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
            onChange={(evento) => setVacanteId(evento.target.value)}
            placeholder="Ej. 1"
            required
          />
          <datalist id="vacantes-ranking-disponibles">
            {vacantesConPostulaciones.map((id) => <option key={id} value={id} />)}
          </datalist>
        </div>
        <button type="submit" className="boton" disabled={cargando}>
          {cargando ? 'Consultando...' : 'Consultar / actualizar clasificación'}
        </button>
      </form>
      {error && <p className="mensaje-error" role="alert">{error}</p>}
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
