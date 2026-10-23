import { fechaLegible } from '../utils/candidatoPresentacion'

const TIPOS_DOCUMENTO = [
  { valor: 'CV', nombre: 'Currículum (CV)' },
  { valor: 'Identificación', nombre: 'Identificación' },
  {
    valor: 'Comprobante de estudios',
    nombre: 'Comprobante de estudios',
  },
  { valor: 'Certificación', nombre: 'Certificaciones' },
  { valor: 'Otro documento', nombre: 'Otro documento' },
]

export default function DocumentosCandidato({ postulaciones, controles }) {
  const {
    postulacionDocumento,
    setPostulacionDocumento,
    tipoDocumento,
    archivos,
    documentos,
    setDocumentos,
    cargandoDocumentos,
    setCargandoDocumentos,
    subiendo,
    descargandoId,
    reiniciarArchivo,
    cargarDocumentos,
    seleccionarArchivos,
    cambiarTipoDocumento,
    subirDocumentos,
    descargarDocumento,
    permiteVarios,
    setError,
    setMensaje,
  } = controles

  return (
    <section className="panel-seccion">
      <h2>Mis documentos</h2>

      <p>
        Adjunta los archivos PDF correspondientes
        a cada postulación.
      </p>

      {postulaciones.length === 0 ? (
        <p className="nota">
          Primero debes postularte a una vacante
          para poder subir documentos.
        </p>
      ) : (
        <>
          <div className="campo">
            <label htmlFor="postulacion-documento">
              Selecciona la postulación
            </label>

            <select
              id="postulacion-documento"
              value={postulacionDocumento}
              disabled={subiendo}
              onChange={(evento) => {
                setPostulacionDocumento(
                  evento.target.value
                )
                setDocumentos([])
                setCargandoDocumentos(true)
                setError('')
                setMensaje('')
              }}
            >
              {postulaciones.map((postulacion) => (
                <option
                  key={postulacion.id}
                  value={String(postulacion.id)}
                >
                  #{postulacion.id} —{' '}
                  {postulacion.titulo_vacante ||
                    `Vacante #${postulacion.vacante_id}`}
                </option>
              ))}
            </select>
          </div>

          <div className="panel-columnas">
            <div className="panel-seccion">
              <h3>Subir documentos</h3>

              <form onSubmit={subirDocumentos}>
                <div className="campo">
                  <label htmlFor="tipo-documento">
                    Tipo de documento
                  </label>

                  <select
                    id="tipo-documento"
                    value={tipoDocumento}
                    disabled={subiendo}
                    onChange={(evento) =>
                      cambiarTipoDocumento(
                        evento.target.value
                      )
                    }
                  >
                    {TIPOS_DOCUMENTO.map((tipo) => (
                      <option
                        key={tipo.valor}
                        value={tipo.valor}
                      >
                        {tipo.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="campo">
                  <label htmlFor="archivo-pdf">
                    Seleccionar PDF
                  </label>

                  <input
                    key={reiniciarArchivo}
                    id="archivo-pdf"
                    type="file"
                    accept=".pdf,application/pdf"
                    multiple={permiteVarios}
                    disabled={subiendo}
                    onChange={seleccionarArchivos}
                  />
                </div>

                <p className="nota">
                  Máximo 10 MB por archivo.
                  {permiteVarios
                    ? ' Puedes seleccionar varios PDF.'
                    : ' Selecciona un PDF a la vez.'}
                </p>

                {archivos.length > 0 && (
                  <div>
                    <strong>
                      Archivos seleccionados:
                    </strong>

                    <ul>
                      {archivos.map((archivo, indice) => (
                        <li
                          key={`${archivo.name}-${indice}`}
                        >
                          {archivo.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  type="submit"
                  className="boton"
                  disabled={
                    subiendo ||
                    !archivos.length ||
                    !postulacionDocumento
                  }
                >
                  {subiendo
                    ? 'Subiendo documentos...'
                    : archivos.length > 1
                      ? `Subir ${archivos.length} documentos`
                      : 'Subir documento'}
                </button>
              </form>
            </div>

            <div className="panel-seccion">
              <h3>Documentos cargados</h3>

              <button
                type="button"
                className="boton boton-secundario"
                onClick={() =>
                  cargarDocumentos(
                    postulacionDocumento
                  )
                }
                disabled={
                  cargandoDocumentos || subiendo
                }
              >
                Actualizar documentos
              </button>

              {cargandoDocumentos ? (
                <p>Cargando documentos...</p>
              ) : documentos.length === 0 ? (
                <p className="nota">
                  No hay documentos registrados
                  para esta postulación.
                </p>
              ) : (
                <div className="lista-postulaciones">
                  {documentos.map((documento) => (
                    <article
                      className="postulacion-item"
                      key={documento.id}
                    >
                      <h4>
                        {documento.nombre_archivo}
                      </h4>

                      <p>
                        <strong>Tipo:</strong>{' '}
                        {documento.tipo}
                      </p>

                      <p>
                        <strong>Fecha de subida:</strong>{' '}
                        {fechaLegible(
                          documento.fecha_subida
                        )}
                      </p>

                      <button
                        type="button"
                        className="boton"
                        disabled={
                          descargandoId === documento.id
                        }
                        onClick={() =>
                          descargarDocumento(
                            documento
                          )
                        }
                      >
                        {descargandoId === documento.id
                          ? 'Descargando...'
                          : 'Descargar PDF'}
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
