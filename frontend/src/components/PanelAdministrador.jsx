import GestionVacantesAdministrador from './GestionVacantesAdministrador'
import ListaPostulaciones from './ListaPostulaciones'
import RevisionAdministrador from './RevisionAdministrador'

function PanelAdministrador({ seccionPanel, datosComunes, datosVacantes, datosRevision }) {
  return (
    <>
      {seccionPanel === 'vacantes' && <GestionVacantesAdministrador {...datosVacantes} />}
      {seccionPanel === 'postulaciones' && <div className="panel-columnas">
        <ListaPostulaciones {...datosComunes} esAdministrador={true} />
        <RevisionAdministrador {...datosRevision} cargandoPanel={datosComunes.cargandoPanel} />
      </div>}
    </>
  )
}

export default PanelAdministrador
