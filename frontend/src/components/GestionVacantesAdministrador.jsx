import { useEffect, useState } from 'react'
import { solicitarAPI } from '../api'
import { NIVELES_ESTUDIO } from '../nivelesEstudio'
// Interfaz extraida de App.jsx; conserva estilos y funciones existentes.
function GestionVacantesAdministrador({
  token,
  revisionCatalogos,
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
  const [vacantes, setVacantes] = useState([])
  const [habilidades, setHabilidades] = useState([])
  const [competencias, setCompetencias] = useState([])
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true)
  const [errorCatalogos, setErrorCatalogos] = useState('')
  const [revisionLocal, setRevisionLocal] = useState(0)

  useEffect(() => {
    const controlador = new AbortController()
    Promise.all([
      solicitarAPI('/api/v1/ranking/vacantes', token, { signal: controlador.signal }),
      solicitarAPI('/api/v1/habilidades/catalogo', token, { signal: controlador.signal }),
      solicitarAPI('/api/v1/competencias/catalogo', token, { signal: controlador.signal }),
    ]).then(([listaVacantes, listaHabilidades, listaCompetencias]) => {
      if (controlador.signal.aborted) return
      setVacantes(listaVacantes.filter((item) => item.estado === 'ABIERTA'))
      setHabilidades(listaHabilidades)
      setCompetencias(listaCompetencias)
      setErrorCatalogos('')
    }).catch((error) => {
      if (!controlador.signal.aborted) {
        setErrorCatalogos(`No se pudieron cargar las opciones: ${error.message}`)
      }
    }).finally(() => {
      if (!controlador.signal.aborted) setCargandoCatalogos(false)
    })
    return () => controlador.abort()
  }, [token, revisionCatalogos, revisionLocal])

  const requisitos = requisitoVacante.tipo === 'habilidades' ? habilidades : competencias

  function actualizarListas() {
    setCargandoCatalogos(true)
    setErrorCatalogos('')
    setRevisionLocal((anterior) => anterior + 1)
  }

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
                    <option value="Híbrida">Híbrida</option>
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
                  <select
                    id="vacante-estudios"
                    value={nuevaVacante.nivel_estudios_requerido}
                    onChange={(evento) =>
                      setNuevaVacante({
                        ...nuevaVacante,
                        nivel_estudios_requerido: evento.target.value,
                      })
                    }
                  >
                    <option value="">Sin requisito académico</option>
                    {NIVELES_ESTUDIO.map((nivel) => (
                      <option key={nivel} value={nivel}>{nivel}</option>
                    ))}
                  </select>
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

              <button type="button" className="boton boton-secundario" onClick={actualizarListas} disabled={cargandoCatalogos}>
                Actualizar listas de opciones
              </button>
              {cargandoCatalogos && <p className="nota" role="status">Cargando vacantes y requisitos...</p>}
              {errorCatalogos && <p className="mensaje-error" role="alert">{errorCatalogos}</p>}
              <form onSubmit={guardarRequisitoVacante}>
                <div className="campo">
                  <label htmlFor="requisito-vacante-id">Vacante</label>
                  <select
                    id="requisito-vacante-id"
                    required
                    disabled={cargandoCatalogos || vacantes.length === 0}
                    value={requisitoVacante.vacante_id}
                    onChange={(evento) =>
                      setRequisitoVacante({
                        ...requisitoVacante,
                        vacante_id: evento.target.value,
                      })
                    }
                  >
                    <option value="">Selecciona una vacante</option>
                    {vacantes.map((vacante) => (
                      <option key={vacante.id} value={String(vacante.id)}>{vacante.titulo}</option>
                    ))}
                  </select>
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
                  <label htmlFor="requisito-id">
                    {requisitoVacante.tipo === 'habilidades' ? 'Habilidad' : 'Competencia'}
                  </label>
                  <select
                    id="requisito-id"
                    required
                    disabled={cargandoCatalogos || requisitos.length === 0}
                    value={requisitoVacante.requisito_id}
                    onChange={(evento) =>
                      setRequisitoVacante({
                        ...requisitoVacante,
                        requisito_id: evento.target.value,
                      })
                    }
                  >
                    <option value="">Selecciona un requisito por nombre</option>
                    {requisitos.map((requisito) => (
                      <option key={requisito.id} value={String(requisito.id)}>{requisito.nombre}</option>
                    ))}
                  </select>
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
              <p>Selecciona una vacante abierta por su título para consultar o actualizar sus datos.</p>

              <div className="campo">
                <label htmlFor="editar-vacante-id">Vacante</label>
                <select
                  id="editar-vacante-id"
                  value={edicionVacante.vacante_id}
                  disabled={cargandoCatalogos || vacantes.length === 0}
                  onChange={(evento) =>
                    setEdicionVacante({
                      ...edicionVacante,
                      vacante_id: evento.target.value,
                      titulo: '',
                    })
                  }
                >
                  <option value="">Selecciona una vacante</option>
                  {vacantes.map((vacante) => (
                    <option key={vacante.id} value={String(vacante.id)}>{vacante.titulo}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="boton boton-secundario"
                onClick={cargarVacanteParaEditar}
                disabled={cargandoCatalogos || !edicionVacante.vacante_id}
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
                    <select
                      id="editar-vacante-estudios"
                      value={edicionVacante.nivel_estudios_requerido}
                      onChange={(evento) =>
                        setEdicionVacante({
                          ...edicionVacante,
                          nivel_estudios_requerido: evento.target.value,
                        })
                      }
                    >
                      <option value="">Sin requisito académico</option>
                      {NIVELES_ESTUDIO.map((nivel) => (
                        <option key={nivel} value={nivel}>{nivel}</option>
                      ))}
                    </select>
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
