// Interfaz extraida de App.jsx; conserva estilos y funciones existentes.
function RevisionAdministrador({
  cargandoPanel,
  revision,
  decision,
  setDecision,
  justificacion,
  setJustificacion,
  registrarDecision,
}) {
  return (
    <>
            <section className="panel-seccion">
              <h2>
                Revisión de candidato
              </h2>

              {cargandoPanel && (
                <p>Cargando información...</p>
              )}
              {!revision &&
                !cargandoPanel && (
                  <p className="nota">
                    Selecciona una postulación para
                    consultar sus evaluaciones.
                  </p>
                )}

              {revision && (
                <div className="detalle-revision">
                  <h3>
                    Postulación #{revision.postulacion_id}
                  </h3>

                  <div className="informacion">
                    <p>
                      <strong>Candidato:</strong>{' '}
                      {revision.candidato_id}
                    </p>

                    <p>
                      <strong>Vacante:</strong>{' '}
                      {revision.vacante_id}
                    </p>
                  </div>

                  <h3>Ranking de IA</h3>

                  {revision.ranking ? (
                    <div className="informacion">
                      <p className="puntaje-ranking">
                        {revision.ranking.puntaje}/100
                      </p>

                      <p>
                        <strong>Método:</strong>{' '}
                        {revision.ranking.metodo}
                      </p>

                      <p>
                        {revision.ranking.explicacion}
                      </p>
                    </div>
                  ) : (
                    <p>
                      Esta postulación aún no tiene ranking.
                    </p>
                  )}

                  <h3>
                    Recomendación del reclutador
                  </h3>

                  {revision.recomendacion_reclutador ? (
                    <div className="informacion">
                      <p>
                        <strong>Puntuación:</strong>{' '}
                        {
                          revision.recomendacion_reclutador
                            .recomendacion
                        }
                        /5
                      </p>

                      <p>
                        {
                          revision.recomendacion_reclutador
                            .resumen
                        }
                      </p>
                    </div>
                  ) : (
                    <p>Aún no hay recomendación.</p>
                  )}

                  <h3>Decisión final</h3>

                  {revision.decision_final ? (
                    <div className="informacion">
                      <p>
                        <strong>Resultado:</strong>{' '}
                        <span className={`estado-decision ${revision.decision_final.decision?.toUpperCase() === "ACEPTADO" ? "estado-aceptado" : "estado-rechazado"}`}>{revision.decision_final.decision}</span>
                      </p>

                      <p>
                        <strong>Justificación:</strong>{' '}
                        {
                          revision.decision_final
                            .justificacion
                        }
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={registrarDecision}>
                      <div className="campo">
                        <label htmlFor="decision">
                          Decisión
                        </label>

                        <select
                          id="decision"
                          value={decision}
                          onChange={(evento) =>
                            setDecision(evento.target.value)
                          }
                        >
                          <option value="ACEPTADO">
                            Aceptado
                          </option>

                          <option value="RECHAZADO">
                            Rechazado
                          </option>
                        </select>
                      </div>

                      <div className="campo">
                        <label htmlFor="justificacion">
                          Justificación
                        </label>

                        <textarea
                          id="justificacion"
                          value={justificacion}
                          minLength={10}
                          maxLength={2000}
                          required
                          rows={4}
                          onChange={(evento) =>
                            setJustificacion(
                              evento.target.value
                            )
                          }
                          placeholder="Explica el motivo de la decisión"
                        />
                      </div>

                      <button
                        type="submit"
                        className="boton"
                        disabled={cargandoPanel}
                      >
                        Registrar decisión final
                      </button>
                    </form>
                  )}
                </div>
              )}
            </section>
    </>
  )
}

export default RevisionAdministrador
