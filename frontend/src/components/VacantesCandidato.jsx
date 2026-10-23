import { fechaLegible } from '../utils/candidatoPresentacion'

export default function VacantesCandidato({
  vacantes,
  cargando,
  detalle,
  procesando,
  postulaciones,
  onVerDetalle,
  onPostularme,
}) {
  const yaPostulado = (vacanteId) =>
    postulaciones.some((p) => p.vacante_id === vacanteId)

  return (
    <div className="panel-columnas">
      <section className="panel-seccion">
        <h2>Vacantes abiertas</h2>

        {vacantes.length === 0 && !cargando ? (
          <p className="nota">
            No hay vacantes abiertas por el momento.
          </p>
        ) : (
          <div className="lista-postulaciones">
            {vacantes.map((vacante) => (
              <article
                className="postulacion-item"
                key={vacante.id}
              >
                <h3>{vacante.titulo}</h3>
                <p>{vacante.descripcion}</p>

                <p>
                  <strong>Ubicación:</strong>{' '}
                  {vacante.ubicacion ||
                    'No especificada'}
                </p>

                <p>
                  <strong>Modalidad:</strong>{' '}
                  {vacante.modalidad ||
                    'No especificada'}
                </p>

                <p>
                  <strong>Fecha de cierre:</strong>{' '}
                  {fechaLegible(vacante.fecha_cierre)}
                </p>

                <button
                  type="button"
                  className="boton"
                  onClick={() => onVerDetalle(vacante.id)}
                  disabled={procesando}
                >
                  Ver detalles
                </button>

                {yaPostulado(vacante.id) && (
                  <p className="nota">
                    Ya te postulaste a esta vacante.
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel-seccion">
        <h2>Detalles de la vacante</h2>

        {!detalle ? (
          <p className="nota">
            Selecciona una vacante para conocer
            sus requisitos.
          </p>
        ) : (
          <div className="detalle-revision">
            <h3>{detalle.titulo}</h3>
            <p>{detalle.descripcion}</p>

            <p>
              <strong>Ubicación:</strong>{' '}
              {detalle.ubicacion ||
                'No especificada'}
            </p>

            <p>
              <strong>Modalidad:</strong>{' '}
              {detalle.modalidad ||
                'No especificada'}
            </p>

            <h3>Habilidades requeridas</h3>

            {(detalle.habilidades || []).length === 0 ? (
              <p>
                No hay habilidades específicas
                registradas.
              </p>
            ) : (
              <ul>
                {detalle.habilidades.map((habilidad) => (
                  <li key={habilidad.id}>
                    {habilidad.nombre}
                    {habilidad.nivel_requerido != null
                      ? ` — Nivel ${habilidad.nivel_requerido}`
                      : ''}
                  </li>
                ))}
              </ul>
            )}

            <h3>Competencias requeridas</h3>

            {(detalle.competencias || []).length === 0 ? (
              <p>
                No hay competencias específicas
                registradas.
              </p>
            ) : (
              <ul>
                {detalle.competencias.map((competencia) => (
                  <li key={competencia.id}>
                    {competencia.nombre}
                    {competencia.nivel_requerido != null
                      ? ` — Nivel ${competencia.nivel_requerido}`
                      : ''}
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              className="boton"
              disabled={
                procesando || yaPostulado(detalle.id)
              }
              onClick={() => onPostularme(detalle.id)}
            >
              {yaPostulado(detalle.id)
                ? 'Ya te postulaste'
                : procesando
                  ? 'Procesando...'
                  : 'Postularme'}
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
