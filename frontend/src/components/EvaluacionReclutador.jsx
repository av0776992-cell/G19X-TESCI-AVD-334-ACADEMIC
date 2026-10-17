// Interfaz extraida de App.jsx; conserva estilos y funciones existentes.
function EvaluacionReclutador({
  cargandoPanel,
  detalleReclutador,
  documentosReclutador,
  descargarDocumentoReclutador,
  evaluaciones,
  tipoEvaluacion,
  setTipoEvaluacion,
  puntuacion,
  setPuntuacion,
  observaciones,
  setObservaciones,
  registrarEvaluacion,
  recomendacionExistente,
  recomendacion,
  setRecomendacion,
  resumen,
  setResumen,
  registrarRecomendacion,
}) {
  return (
    <>
            <section className="panel-seccion">
              <h2>
                Evaluación de candidato
              </h2>

              {cargandoPanel && (
                <p>Cargando información...</p>
              )}
              {!detalleReclutador &&
                !cargandoPanel && (
                  <p className="nota">
                    Selecciona una postulación para
                    revisar al candidato.
                  </p>
                )}

              {detalleReclutador && (
                <div className="detalle-revision">
                  <h3>
                    Postulación #{detalleReclutador.id}
                  </h3>

                  <div className="informacion">
                    <p>
                      <strong>Nombre:</strong>{' '}
                      {detalleReclutador.nombre_candidato}
                    </p>

                    <p>
                      <strong>Correo:</strong>{' '}
                      {detalleReclutador.correo_candidato}
                    </p>

                    <p>
                      <strong>Ciudad:</strong>{' '}
                      {detalleReclutador.ciudad_candidato ||
                        'No registrada'}
                    </p>

                    <p>
                      <strong>Vacante:</strong>{' '}
                      {detalleReclutador.titulo_vacante}
                    </p>
                  </div>

                  <h3>Documentos del candidato</h3>

              {documentosReclutador.length === 0 ? (
                <p className="nota">
                  Este candidato todavía no ha subido documentos.
                </p>
              ) : (
                <div className="lista-postulaciones">
                  {documentosReclutador.map((documento) => (
                    <div className="postulacion-item" key={documento.id}>
                      <div>
                        <strong>{documento.tipo}</strong>
                        <p>{documento.nombre_archivo}</p>
                      </div>

                      <button
                        type="button"
                        className="boton boton-secundario"
                        onClick={() =>
                          descargarDocumentoReclutador(documento)
                        }
                      >
                        Descargar PDF
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <h3>Evaluaciones técnicas</h3>

                  {evaluaciones.length === 0 ? (
                    <p className="nota">
                      Todavía no hay evaluaciones.
                    </p>
                  ) : (
                    <div className="lista-postulaciones">
                      {evaluaciones.map((evaluacion) => (
                        <article
                          className="postulacion-item"
                          key={evaluacion.id}
                        >
                          <strong>
                            {evaluacion.tipo}
                          </strong>

                          <p>
                            Puntuación:{' '}
                            {evaluacion.puntuacion}/100
                          </p>

                          <p>
                            {evaluacion.observaciones ||
                              'Sin observaciones'}
                          </p>
                        </article>
                      ))}
                    </div>
                  )}

                  <h3>
                    Registrar evaluación técnica
                  </h3>

                  <form onSubmit={registrarEvaluacion}>
                    <div className="campo">
                      <label htmlFor="tipo-evaluacion">
                        Tipo de evaluación
                      </label>

                      <input
                        id="tipo-evaluacion"
                        type="text"
                        maxLength={100}
                        required
                        placeholder="Ejemplo: Prueba de Python"
                        value={tipoEvaluacion}
                        onChange={(evento) =>
                          setTipoEvaluacion(
                            evento.target.value
                          )
                        }
                      />
                    </div>

                    <div className="campo">
                      <label htmlFor="puntuacion">
                        Puntuación (0 a 100)
                      </label>

                      <input
                        id="puntuacion"
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        required
                        value={puntuacion}
                        onChange={(evento) =>
                          setPuntuacion(evento.target.value)
                        }
                      />
                    </div>

                    <div className="campo">
                      <label htmlFor="observaciones">
                        Observaciones
                      </label>

                      <textarea
                        id="observaciones"
                        rows={3}
                        value={observaciones}
                        onChange={(evento) =>
                          setObservaciones(
                            evento.target.value
                          )
                        }
                      />
                    </div>

                    <button
                      className="boton"
                      type="submit"
                      disabled={cargandoPanel}
                    >
                      Guardar evaluación
                    </button>
                  </form>

                  <h3>
                    Recomendación del reclutador
                  </h3>

                  {recomendacionExistente ? (
                    <div className="informacion">
                      <p>
                        <strong>Calificación:</strong>{' '}
                        {
                          recomendacionExistente
                            .recomendacion
                        }
                        /5
                      </p>

                      <p>
                        {recomendacionExistente.resumen ||
                          'Sin resumen'}
                      </p>

                      <p className="nota">
                        Esta postulación ya tiene una
                        recomendación registrada.
                      </p>
                    </div>
                  ) : (
                    <form
                      onSubmit={registrarRecomendacion}
                    >
                      <div className="campo">
                        <label htmlFor="recomendacion">
                          Recomendación (1 a 5)
                        </label>

                        <select
                          id="recomendacion"
                          value={recomendacion}
                          onChange={(evento) =>
                            setRecomendacion(
                              evento.target.value
                            )
                          }
                        >
                          {[1, 2, 3, 4, 5].map(
                            (valor) => (
                              <option
                                key={valor}
                                value={valor}
                              >
                                {valor}/5
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div className="campo">
                        <label htmlFor="resumen">
                          Resumen de la recomendación
                        </label>

                        <textarea
                          id="resumen"
                          rows={4}
                          maxLength={2000}
                          value={resumen}
                          onChange={(evento) =>
                            setResumen(evento.target.value)
                          }
                          placeholder="Describe tu valoración del candidato"
                        />
                      </div>

                      <button
                        className="boton"
                        type="submit"
                        disabled={cargandoPanel}
                      >
                        Registrar recomendación
                      </button>
                    </form>
                  )}
                </div>
              )}
            </section>
    </>
  )
}

export default EvaluacionReclutador
