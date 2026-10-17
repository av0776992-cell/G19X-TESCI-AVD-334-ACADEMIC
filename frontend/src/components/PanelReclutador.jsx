import ListaPostulaciones from './ListaPostulaciones'
import EvaluacionReclutador from './EvaluacionReclutador'

function PanelReclutador({ datosComunes, datosReclutador }) {
  return (
    <div className="panel-columnas">
      <ListaPostulaciones {...datosComunes} esAdministrador={false} />
      <EvaluacionReclutador {...datosReclutador} cargandoPanel={datosComunes.cargandoPanel} />
    </div>
  )
}

export default PanelReclutador
