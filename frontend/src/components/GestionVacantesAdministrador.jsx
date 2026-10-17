// Interfaz extraida de App.jsx; conserva estilos y funciones existentes.
function GestionVacantesAdministrador({
  nuevaVacante,
  setNuevaVacante,
  creandoVacante,
  crearVacante,
  requisitoVacante,
  setRequisitoVacante,
  guardandoRequisito,
  guardarRequisitoVacante,
  edicionVacante,
  setEdicionVacante,
  cargarVacanteParaEditar,
  guardarEdicionVacante,
  guardandoEdicionVacante,
  cerrarVacanteDesdePanel,
  cerrandoVacante,
}) {
  return (
    <>
            <section id="panel-vacantes" className="panel-seccion">
              <h2>Crear nueva vacante</h2>
              <p className="nota">
                Registra una oportunidad laboral para los candidatos.
              </p>

              <form onSubmit={crearVacante}>
                <div className="campo">
                  <label htmlFor="vacante-titulo">Título *</label>
                  <input
                    id="vacante-titulo"
                    type="text"
                    maxLength={150}
                    required
                    value={nuevaVacante.titulo}
                    onChange={(evento) =>
                      setNuevaVacante({
                        ...nuevaVacante,
                        titulo: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="campo">
                  <label htmlFor="vacante-descripcion">Descripción *</label>
                  <textarea
                    id="vacante-descripcion"
                    required
                    rows={4}
                    value={nuevaVacante.descripcion}
                    onChange={(evento) =>
                      setNuevaVacante({
                        ...nuevaVacante,
                        descripcion: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="campo">
                  <label htmlFor="vacante-ubicacion">Ubicación</label>
                  <input
                    id="vacante-ubicacion"
                    type="text"
                    maxLength={150}
                    value={nuevaVacante.ubicacion}
                    onChange={(evento) =>
                      setNuevaVacante({
                        ...nuevaVacante,
                        ubicacion: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="campo">
                  <label htmlFor="vacante-modalidad">Modalidad</label>
                  <select
                    id="vacante-modalidad"
                    value={nuevaVacante.modalidad}
                    onChange={(evento) =>
                      setNuevaVacante({
                        ...nuevaVacante,
                        modalidad: evento.target.value,
                      })
                    }
                  >
                    <option value="">Seleccionar modalidad</option>
                    <option value="Presencial">Presencial</option>
                    <option value="H?brida">H?brida</option>
                    <option value="Remota">Remota</option>
                  </select>
                </div>

                <div className="campo">
                  <label htmlFor="vacante-experiencia">
                    Experiencia mínima (meses)
                  </label>
                  <input
                    id="vacante-experiencia"
                    type="number"
                    min="0"
                    required
                    value={nuevaVacante.experiencia_minima_meses}
                    onChange={(evento) =>
                      setNuevaVacante({
                        ...nuevaVacante,
                        experiencia_minima_meses: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="campo">
                  <label htmlFor="vacante-estudios">
                    Nivel de estudios requerido
                  </label>
                  <input
                    id="vacante-estudios"
                    type="text"
                    maxLength={100}
                    value={nuevaVacante.nivel_estudios_requerido}
                    onChange={(evento) =>
                      setNuevaVacante({
                        ...nuevaVacante,
                        nivel_estudios_requerido: evento.target.value,
                      })
                    }
                  />
                </div>

                <button
                  type="submit"
                  className="boton"
                  disabled={creandoVacante}
                >
                  {creandoVacante ? 'Guardando...' : 'Crear vacante'}
                </button>
              </form>
            </section>

            <section className="panel-seccion">
              <h2>Requisitos de vacantes</h2>
              <p className="nota">
                Asigna habilidades y competencias a una vacante abierta.
              </p>

              <form onSubmit={guardarRequisitoVacante}>
                <div className="campo">
                  <label htmlFor="requisito-vacante-id">ID de vacante</label>
                  <input
                    id="requisito-vacante-id"
                    type="number"
                    min="1"
                    required
                    value={requisitoVacante.vacante_id}
                    onChange={(evento) =>
                      setRequisitoVacante({
                        ...requisitoVacante,
                        vacante_id: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="campo">
                  <label htmlFor="requisito-tipo">Tipo de requisito</label>
                  <select
                    id="requisito-tipo"
                    value={requisitoVacante.tipo}
                    onChange={(evento) =>
                      setRequisitoVacante({
                        ...requisitoVacante,
                        tipo: evento.target.value,
                        requisito_id: '',
                      })
                    }
                  >
                    <option value="habilidades">Habilidad</option>
                    <option value="competencias">Competencia</option>
                  </select>
                </div>

                <div className="campo">
                  <label htmlFor="requisito-id">ID del requisito</label>
                  <input
                    id="requisito-id"
                    type="number"
                    min="1"
                    required
                    value={requisitoVacante.requisito_id}
                    onChange={(evento) =>
                      setRequisitoVacante({
                        ...requisitoVacante,
                        requisito_id: evento.target.value,
                      })
                    }
                  />
                </div>

                <div className="campo">
                  <label htmlFor="requisito-nivel">Nivel requerido (1 a 5)</label>
                  <input
                    id="requisito-nivel"
                    type="number"
                    min="1"
                    max="5"
                    required
                    value={requisitoVacante.nivel_requerido}
                    onChange={(evento) =>
                      setRequisitoVacante({
                        ...requisitoVacante,
                        nivel_requerido: evento.target.value,
                      })
                    }
                  />
                </div>

                <button
                  type="submit"
                  className="boton"
                  disabled={guardandoRequisito}
                >
                  {guardandoRequisito ? 'Guardando...' : 'Guardar requisito'}
                </button>
              </form>
            </section>

            <section className="panel-seccion">
              <h2>Editar o cerrar vacante</h2>
              <p>Introduce el ID de una vacante abierta y carga sus datos.</p>

              <div className="campo">
                <label htmlFor="editar-vacante-id">ID de vacante</label>
                <input
                  id="editar-vacante-id"
                  type="number"
                  min="1"
                  value={edicionVacante.vacante_id}
                  onChange={(evento) =>
                    setEdicionVacante({
                      ...edicionVacante,
                      vacante_id: evento.target.value,
                    })
                  }
                />
              </div>

              <button
                type="button"
                className="boton boton-secundario"
                onClick={cargarVacanteParaEditar}
              >
                Cargar vacante
              </button>

              {edicionVacante.titulo && (
                <form onSubmit={guardarEdicionVacante}>
                  <div className="campo">
                    <label htmlFor="editar-vacante-titulo">Título</label>
                    <input
                      id="editar-vacante-titulo"
                      required
                      value={edicionVacante.titulo}
                      onChange={(evento) =>
                        setEdicionVacante({
                          ...edicionVacante,
                          titulo: evento.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="campo">
                    <label htmlFor="editar-vacante-descripcion">Descripción</label>
                    <textarea
                      id="editar-vacante-descripcion"
                      required
                      value={edicionVacante.descripcion}
                      onChange={(evento) =>
                        setEdicionVacante({
                          ...edicionVacante,
                          descripcion: evento.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="campo">
                    <label htmlFor="editar-vacante-ubicacion">Ubicación</label>
                    <input
                      id="editar-vacante-ubicacion"
                      value={edicionVacante.ubicacion}
                      onChange={(evento) =>
                        setEdicionVacante({
                          ...edicionVacante,
                          ubicacion: evento.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="campo">
                    <label htmlFor="editar-vacante-modalidad">Modalidad</label>
                    <input
                      id="editar-vacante-modalidad"
                      value={edicionVacante.modalidad}
                      onChange={(evento) =>
                        setEdicionVacante({
                          ...edicionVacante,
                          modalidad: evento.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="campo">
                    <label htmlFor="editar-vacante-experiencia">
                      Experiencia mínima (meses)
                    </label>
                    <input
                      id="editar-vacante-experiencia"
                      type="number"
                      min="0"
                      value={edicionVacante.experiencia_minima_meses}
                      onChange={(evento) =>
                        setEdicionVacante({
                          ...edicionVacante,
                          experiencia_minima_meses: evento.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="campo">
                    <label htmlFor="editar-vacante-estudios">
                      Nivel de estudios requerido
                    </label>
                    <input
                      id="editar-vacante-estudios"
                      value={edicionVacante.nivel_estudios_requerido}
                      onChange={(evento) =>
                        setEdicionVacante({
                          ...edicionVacante,
                          nivel_estudios_requerido: evento.target.value,
                        })
                      }
                    />
                  </div>

                  <button
                    type="submit"
                    className="boton"
                    disabled={guardandoEdicionVacante}
                  >
                    {guardandoEdicionVacante
                      ? 'Guardando...'
                      : 'Guardar cambios'}
                  </button>

                  <button
                    type="button"
                    className="boton boton-secundario"
                    disabled={cerrandoVacante}
                    onClick={cerrarVacanteDesdePanel}
                  >
                    {cerrandoVacante ? 'Cerrando...' : 'Cerrar vacante'}
                  </button>
                </form>
              )}
            </section>
    </>
  )
}

export default GestionVacantesAdministrador
