import { useCallback, useEffect, useMemo, useState } from 'react'
import { solicitarAPI } from '../api'

const ICONOS = {
  vacantes: <><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/></>,
  postulaciones: <><circle cx="9" cy="8" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2M17 8h4M19 6v4M17 16h4M17 20h4"/></>,
  ranking: <><path d="M4 20V11M10 20V4M16 20v-8M22 20v-5" strokeWidth="3"/></>,
  decisiones: <><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M9 13l2.5 2.5L16 11"/></>,
  personas: <><circle cx="9" cy="7" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2M17 9a3 3 0 0 1 0 6M17 18a4 4 0 0 1 4 3"/></>,
  flecha: <><path d="M5 12h14m-6-6 6 6-6 6"/></>,
  actualizar: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 9a7 7 0 0 1 12-2l2 5M4 12l2 5a7 7 0 0 0 12-2"/></>,
}

function Icono({ tipo, tamano = 22 }) {
  return <svg aria-hidden="true" width={tamano} height={tamano} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">{ICONOS[tipo]}</svg>
}

function formatearFecha(fecha) {
  if (!fecha) return 'Fecha no disponible'
  const objeto = new Date(fecha)
  if (Number.isNaN(objeto.getTime())) return 'Fecha no disponible'
  return objeto.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function TarjetaEstadistica({ titulo, numero, descripcion, tipo, tono, cargando }) {
  return (
    <article className={`nebula-kpi nebula-kpi--${tono}`}>
      <div className="nebula-kpi-top">
        <span className="nebula-kpi-icon"><Icono tipo={tipo} /></span>
        <span className="nebula-kpi-mark" aria-hidden="true">↗</span>
      </div>
      <p className="nebula-kpi-value" aria-label={`${titulo}: ${numero === null ? 'No disponible' : numero}`}>{cargando ? '…' : numero ?? '—'}</p>
      <h3>{titulo}</h3>
      <p className="nebula-kpi-caption">{descripcion}</p>
    </article>
  )
}

/** Panel informativo. Todas las consultas son de lectura; no calcula ni guarda rankings. */
export default function DashboardGestion({
  esAdministrador, usuario, postulaciones, token, onNavegar,
  verRevision, verPostulacionReclutador, actualizarPostulaciones,
}) {
  const [vacantes, setVacantes] = useState([])
  const [rankingCount, setRankingCount] = useState(null)
  const [decisionesCount, setDecisionesCount] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)

  const cargarResumen = useCallback(() => setRevision((valor) => valor + 1), [])

  useEffect(() => {
    const controlador = new AbortController()
    let vigente = true
    async function consultar() {
      try {
        const lista = await solicitarAPI('/api/v1/ranking/vacantes', token, { signal: controlador.signal })
        if (!vigente) return
        setVacantes(lista)
        setError('')
        setRankingCount(null)
        setDecisionesCount(null)
        const vacantesConPostulacion = [...new Set(postulaciones.map((fila) => fila.vacante_id))]
        // Evitar generar decenas de peticiones de detalle en instalaciones grandes.
        // Nunca mostrar cifras parciales como si fueran totales.
        if (vacantesConPostulacion.length <= 20) {
          const rankings = await Promise.allSettled(vacantesConPostulacion.map((id) =>
            solicitarAPI(`/api/v1/ranking/vacantes/${id}`, token, { signal: controlador.signal })
          ))
          if (!vigente) return
          if (rankings.every((resultado) => resultado.status === 'fulfilled')) {
            setRankingCount(rankings.reduce((total, resultado) => total + resultado.value.candidatos.filter((fila) => fila.puntaje != null).length, 0))
          }
        }
        if (esAdministrador && postulaciones.length <= 25) {
          const revisiones = await Promise.allSettled(postulaciones.map((fila) =>
            solicitarAPI(`/api/v1/administradores/postulaciones/${fila.id}/revision`, token, { signal: controlador.signal })
          ))
          if (!vigente) return
          if (revisiones.every((resultado) => resultado.status === 'fulfilled')) {
            setDecisionesCount(revisiones.filter((resultado) => resultado.value.decision_final != null).length)
          }
        }
      } catch (err) {
        if (vigente && !controlador.signal.aborted) {
          setError(`No se pudieron actualizar los indicadores: ${err.message}`)
          setVacantes([])
        }
      } finally {
        if (vigente) setCargando(false)
      }
    }
    consultar()
    return () => { vigente = false; controlador.abort() }
  }, [token, postulaciones, esAdministrador, revision])

  const recientes = useMemo(() => [...postulaciones].sort((a, b) =>
    (Date.parse(b.fecha_postulacion) || 0) - (Date.parse(a.fecha_postulacion) || 0)
  ).slice(0, 5), [postulaciones])

  const barras = useMemo(() => {
    const porVacante = new Map()
    postulaciones.forEach((postulacion) => {
      const id = postulacion.vacante_id
      const actual = porVacante.get(id) || { id, titulo: postulacion.titulo_vacante || `Vacante #${id}`, total: 0 }
      actual.total += 1
      porVacante.set(id, actual)
    })
    return [...porVacante.values()].sort((a, b) => b.total - a.total).slice(0, 5)
  }, [postulaciones])
  const maximoBarras = Math.max(1, ...barras.map((fila) => fila.total))

  async function refrescar() {
    setCargando(true)
    setError('')
    try {
      await actualizarPostulaciones()
    } finally {
      cargarResumen()
    }
  }

  function abrirPostulacion(id) {
    onNavegar('postulaciones')
    if (esAdministrador) verRevision(id)
    else verPostulacionReclutador(id)
  }

  return (
    <section className="nebula-dashboard" aria-label="Resumen del sistema">
      <div className="nebula-dashboard-hero">
        <div className="nebula-dashboard-hero-content">
          <span className="nebula-eyebrow"><span className="nebula-live-dot" /> CENTRO DE CONTROL · RANKING IA</span>
          <h2>Tu espacio de talento, <span>en perspectiva.</span></h2>
          <p>Hola, {usuario.nombre}. Consulta el estado del reclutamiento y accede a tus tareas sin perder de vista a los candidatos.</p>
          <div className="nebula-hero-actions">
            <button type="button" className="nebula-primary-action" onClick={() => onNavegar(esAdministrador ? 'vacantes' : 'postulaciones')}>
              {esAdministrador ? 'Gestionar vacantes' : 'Ver postulaciones'} <Icono tipo="flecha" tamano={17} />
            </button>
            <button type="button" className="nebula-outline-action" onClick={() => onNavegar('postulaciones')}>
              Consultar ranking
            </button>
          </div>
        </div>
        <div className="nebula-hero-art" aria-hidden="true"><span className="nebula-orbit nebula-orbit-a"/><span className="nebula-orbit nebula-orbit-b"/><span className="nebula-hero-core">✦</span></div>
      </div>

      <div className="nebula-section-heading">
        <div><span className="nebula-eyebrow">VISTA GENERAL</span><h2>Indicadores del sistema</h2><p>Datos de tu cuenta y de las vacantes registradas.</p></div>
        <button type="button" className="nebula-refresh" onClick={refrescar} disabled={cargando}><Icono tipo="actualizar" tamano={16} /> {cargando ? 'Actualizando…' : 'Actualizar'}</button>
      </div>
      {error && <p className="mensaje-error" role="alert">{error}</p>}
      <div className="nebula-kpi-grid">
        <TarjetaEstadistica titulo="Vacantes activas" numero={error ? null : vacantes.filter((fila) => fila.estado === 'ABIERTA').length} descripcion="Oportunidades abiertas" tipo="vacantes" tono="violet" cargando={cargando}/>
        <TarjetaEstadistica titulo="Postulaciones" numero={postulaciones.length} descripcion="Registradas en el sistema" tipo="postulaciones" tono="cyan" cargando={false}/>
        <TarjetaEstadistica titulo="Rankings calculados" numero={rankingCount} descripcion="Puntajes actuales disponibles" tipo="ranking" tono="pink" cargando={cargando}/>
        {esAdministrador ? (
          <TarjetaEstadistica titulo="Decisiones finales" numero={decisionesCount} descripcion="Revisiones con decisión" tipo="decisiones" tono="green" cargando={cargando}/>
        ) : (
          <TarjetaEstadistica titulo="Candidatos únicos" numero={new Set(postulaciones.map((fila) => fila.candidato_id)).size} descripcion="Personas con postulación" tipo="personas" tono="green" cargando={false}/>
        )}
      </div>
      <p className="nebula-indicadores-nota">Los guiones indican datos no disponibles; para evitar consultas excesivas, el resumen limita la carga de detalles en instalaciones grandes. El ranking mostrado es informativo y nunca se recalcula automáticamente aquí.</p>

      <div className="nebula-dashboard-details">
        <section className="nebula-data-panel">
          <div className="nebula-data-header"><div><span className="nebula-eyebrow">MOVIMIENTO</span><h3>Actividad reciente</h3></div><button type="button" className="nebula-text-button" onClick={() => onNavegar('postulaciones')}>Ver todas <Icono tipo="flecha" tamano={15}/></button></div>
          {recientes.length === 0 ? <p className="nebula-dashboard-empty">No hay postulaciones todavía. Cuando lleguen, aparecerán aquí.</p> : (
            <div className="nebula-activity-list">{recientes.map((fila) => (
              <div className="nebula-activity-item" key={fila.id}>
                <span className="nebula-activity-avatar" aria-hidden="true">{(fila.nombre_candidato || 'C').slice(0,1).toUpperCase()}</span>
                <div className="nebula-activity-info"><strong>{fila.nombre_candidato || `Candidato #${fila.candidato_id}`}</strong><span>{fila.titulo_vacante || `Vacante #${fila.vacante_id}`}</span><small>{formatearFecha(fila.fecha_postulacion)} · Postulación #{fila.id}</small></div>
                <button type="button" className="nebula-activity-open" onClick={() => abrirPostulacion(fila.id)}>Revisar <Icono tipo="flecha" tamano={14}/></button>
              </div>
            ))}</div>
          )}
        </section>
        <section className="nebula-data-panel">
          <div className="nebula-data-header"><div><span className="nebula-eyebrow">ANÁLISIS</span><h3>Postulaciones por vacante</h3></div><span className="nebula-panel-label">Top 5</span></div>
          {barras.length === 0 ? <p className="nebula-dashboard-empty">Aún no hay datos para mostrar la distribución.</p> : (
            <div className="nebula-bar-list" aria-label="Postulaciones agrupadas por vacante">{barras.map((fila) => (
              <div className="nebula-bar-item" key={fila.id}>
                <div className="nebula-bar-meta"><span title={fila.titulo}>{fila.titulo}</span><strong>{fila.total}</strong></div>
                <div className="nebula-bar-track"><div className="nebula-bar-fill" style={{ width: `${(fila.total / maximoBarras) * 100}%` }}/></div>
              </div>
            ))}</div>
          )}
          <div className="nebula-analysis-footer"><span className="nebula-live-dot"/> El orden y los gráficos se basan en registros reales.</div>
        </section>
      </div>
    </section>
  )
}
