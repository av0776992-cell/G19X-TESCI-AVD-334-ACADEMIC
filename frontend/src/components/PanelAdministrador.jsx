import GestionVacantesAdministrador from './GestionVacantesAdministrador'
import ListaPostulaciones from './ListaPostulaciones'
import RevisionAdministrador from './RevisionAdministrador'

function PanelAdministrador({ datosComunes, datosVacantes, datosRevision }) {
  return (
    <>
      <GestionVacantesAdministrador {...datosVacantes} />
      <div className="panel-columnas">
        <ListaPostulaciones {...datosComunes} esAdministrador={true} />
        <RevisionAdministrador {...datosRevision} cargandoPanel={datosComunes.cargandoPanel} />
      </div>
    </>
  )
}

export default PanelAdministrador
