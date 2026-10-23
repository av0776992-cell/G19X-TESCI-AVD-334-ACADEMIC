import {
  fechaLegible,
  obtenerEstado,
  obtenerColorEstado,
} from '../utils/candidatoPresentacion'

export default function PostulacionesCandidato({ postulaciones }) {
  return (
    <section className="panel-seccion">
      <h2>Mis postulaciones</h2>

      {postulaciones.length === 0 ? (
        <p className="nota">
          Todavía no has realizado ninguna postulación.
        </p>
      ) : (
        <div className="lista-postulaciones">
          {postulaciones.map((postulacion) => {
            const estado = obtenerEstado(postulacion)

            return (
              <article
                className="postulacion-item"
                key={postulacion.id}
              >
                <h3>
                  {postulacion.titulo_vacante ||
                    `Vacante #${postulacion.vacante_id}`}
                </h3>

                <p>
                  <strong>Postulación:</strong>{' '}
                  #{postulacion.id}
                </p>

                <p>
                  <strong>Fecha de postulación:</strong>{' '}
                  {fechaLegible(
                    postulacion.fecha_postulacion
                  )}
                </p>

                <p>
                  <strong>Estado actual:</strong>{' '}
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '6px 12px',
                      borderRadius: '999px',
                      backgroundColor:
                        obtenerColorEstado(estado),
                      color: '#ffffff',
                      fontWeight: '600',
                    }}
                  >
                    {estado}
                  </span>
                </p>

                {postulacion.fecha_estado && (
                  <p>
                    <strong>
                      Último cambio registrado:
                    </strong>{' '}
                    {fechaLegible(
                      postulacion.fecha_estado
                    )}
                  </p>
                )}

                {postulacion.decision_final ? (
                  <div>
                    <p>
                      <strong>Decisión final:</strong>{' '}
                      {estado}
                    </p>

                    <p>
                      <strong>Fecha de decisión:</strong>{' '}
                      {fechaLegible(
                        postulacion.fecha_decision
                      )}
                    </p>

                    <p className="nota">
                      Esta decisión fue registrada
                      por el administrador.
                    </p>
                  </div>
                ) : (
                  <p className="nota">
                    Tu postulación continúa en proceso.
                  </p>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
