// Interfaz extraida de App.jsx; conserva estilos y funciones existentes.
function ListaPostulaciones({
  postulaciones,
  cargandoPanel,
  actualizarPostulaciones,
  esAdministrador,
  verRevision,
  verPostulacionReclutador,
}) {
  return (
    <>
            <section id="panel-postulaciones" className="panel-seccion">
              <h2>Postulaciones recibidas</h2>

              <button
                type="button"
                className="boton"
                onClick={actualizarPostulaciones}
                disabled={cargandoPanel}
              >
                Actualizar postulaciones
              </button>

              {postulaciones.length === 0 ? (
                <p className="nota">
                  No hay postulaciones disponibles.
                </p>
              ) : (
                <div className="lista-postulaciones">
                  {postulaciones.map((postulacion) => (
                    <article
                      className="postulacion-item"
                      key={postulacion.id}
                    >
                      <strong>
                        Postulación #{postulacion.id}
                      </strong>

                      <p>
                        Candidato: {postulacion.candidato_id}
                      </p>

                      <p>
                        Vacante: {postulacion.vacante_id}
                      </p>

                      <button
                        type="button"
                        className="boton"
                        disabled={cargandoPanel}
                        onClick={() =>
                          esAdministrador
                            ? verRevision(postulacion.id)
                            : verPostulacionReclutador(
                                postulacion.id
                              )
                        }
                      >
                        Revisar
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>
    </>
  )
}

export default ListaPostulaciones
