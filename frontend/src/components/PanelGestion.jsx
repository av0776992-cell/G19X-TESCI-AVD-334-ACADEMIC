import AppearanceControls from '../theme/AppearanceControls'
import RankingVacante from './RankingVacante'
import DashboardGestion from './DashboardGestion'
import MenuLateral from './MenuLateral'
import PanelAdministrador from './PanelAdministrador'
import PanelReclutador from './PanelReclutador'

function PanelGestion({
  usuario, seccionPanel, setSeccionPanel, cerrarSesion, error, mensaje,
  postulaciones, token, cargandoPanel, actualizarPostulaciones,
  verRevision, verPostulacionReclutador,
  datosVacantes, datosRevision, datosReclutador,
}) {
  const esAdministrador = usuario.rol === 'ADMINISTRADOR'
  const datosComunes = {
    postulaciones, cargandoPanel, actualizarPostulaciones,
    verRevision, verPostulacionReclutador,
  }

  return (
      <main className={`pagina pagina-panel ${esAdministrador ? "pagina-administrador" : "pagina-reclutador"}`}>
        <MenuLateral
          rol={usuario.rol}
          seccionActiva={seccionPanel}
          onSeleccionar={(opcion) => {
            setSeccionPanel(opcion)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          onCerrarSesion={cerrarSesion}
        />
        <section className="panel-admin">
          <header className="panel-encabezado">
            <div>
              <p className="etiqueta">
                Develop Talent & Technology
              </p>

              <h1>
                {seccionPanel === 'inicio'
                  ? `Panel de ${esAdministrador ? 'administrador' : 'reclutador'}`
                  : seccionPanel === 'vacantes'
                    ? 'Gestión de vacantes'
                    : esAdministrador ? 'Postulaciones y ranking IA' : 'Postulaciones y evaluaciones'}
              </h1>

              <p>{seccionPanel === 'inicio' ? `Bienvenido, ${usuario.nombre}` : 'Gestiona tus procesos de reclutamiento en un solo lugar.'}</p>
            </div>
            <div className="panel-header-tools">
              <span className="panel-role-pill">{esAdministrador ? 'ADMINISTRACIÓN' : 'RECLUTAMIENTO'}</span>
              <AppearanceControls />
            </div>
          </header>

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

          {seccionPanel === 'inicio' ? (
            <DashboardGestion
              esAdministrador={esAdministrador}
              usuario={usuario}
              postulaciones={postulaciones}
              token={token}
              actualizarPostulaciones={actualizarPostulaciones}
              verRevision={verRevision}
              verPostulacionReclutador={verPostulacionReclutador}
              onNavegar={(opcion) => {
                setSeccionPanel(opcion)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
          ) : esAdministrador ? (
            <PanelAdministrador
              seccionPanel={seccionPanel}
              datosComunes={datosComunes}
              datosVacantes={datosVacantes}
              datosRevision={datosRevision}
            />
          ) : (
            <PanelReclutador
              datosComunes={datosComunes}
              datosReclutador={datosReclutador}
            />
          )}
          {seccionPanel === 'postulaciones' && (
            <RankingVacante token={token} postulaciones={postulaciones} />
          )}
        </section>
      </main>
  )
}

export default PanelGestion
