import RankingVacante from './RankingVacante'
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
            if (opcion === 'inicio') {
              window.scrollTo({ top: 0, behavior: 'smooth' })
            } else {
              document.getElementById(`panel-${opcion}`)?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              })
            }
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
                Panel de{' '}
                {esAdministrador
                  ? 'administrador'
                  : 'reclutador'}
              </h1>

              <p>Bienvenido, {usuario.nombre}</p>
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

          {esAdministrador ? (
            <PanelAdministrador
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
          <RankingVacante token={token} postulaciones={postulaciones} />
        </section>
      </main>
  )
}

export default PanelGestion
