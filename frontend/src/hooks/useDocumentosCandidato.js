import { useEffect, useState } from 'react'
import { API_URL } from '../api'

// Mantiene el estado de documentos mientras el candidato cambia de sección.
export default function useDocumentosCandidato({
  seccion,
  token,
  solicitar,
  setError,
  setMensaje,
}) {
  // Documentos
  const [postulacionDocumento, setPostulacionDocumento] =
    useState('')
  const [tipoDocumento, setTipoDocumento] = useState('CV')
  const [archivos, setArchivos] = useState([])
  const [documentos, setDocumentos] = useState([])
  const [cargandoDocumentos, setCargandoDocumentos] =
    useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [descargandoId, setDescargandoId] = useState(null)
  const [reiniciarArchivo, setReiniciarArchivo] = useState(0)

  // Consulta de documentos
  async function cargarDocumentos(postulacionId) {
    if (!postulacionId) {
      setDocumentos([])
      return
    }

    setCargandoDocumentos(true)
    setError('')

    try {
      const lista = await solicitar(
        `/api/v1/documentos/postulacion/${postulacionId}`
      )

      setDocumentos(lista)
    } catch (err) {
      setError(err.message)
      setDocumentos([])
    } finally {
      setCargandoDocumentos(false)
    }
  }

  useEffect(() => {
    if (seccion !== 'documentos' || !postulacionDocumento) return

    let activo = true

    async function cargarDocumentosInicial() {
      try {
        const lista = await solicitar(
          `/api/v1/documentos/postulacion/${postulacionDocumento}`
        )
        if (activo) setDocumentos(lista)
      } catch (err) {
        if (activo) {
          setError(err.message)
          setDocumentos([])
        }
      } finally {
        if (activo) setCargandoDocumentos(false)
      }
    }

    cargarDocumentosInicial()
    return () => {
      activo = false
    }
  }, [seccion, postulacionDocumento, solicitar, setError])

  function seleccionarArchivos(evento) {
    const seleccionados = Array.from(
      evento.target.files || []
    )

    setError('')
    setMensaje('')

    if (!seleccionados.length) {
      setArchivos([])
      return
    }

    const maximo = 10 * 1024 * 1024

    const archivoInvalido = seleccionados.find(
      (archivo) =>
        !archivo.name.toLowerCase().endsWith('.pdf') ||
        archivo.size > maximo
    )

    if (archivoInvalido) {
      setError(
        'Todos los archivos deben ser PDF y pesar máximo 10 MB cada uno.'
      )
      setArchivos([])
      setReiniciarArchivo((actual) => actual + 1)
      return
    }

    setArchivos(seleccionados)
  }

  function cambiarTipoDocumento(nuevoTipo) {
    setTipoDocumento(nuevoTipo)
    setArchivos([])
    setReiniciarArchivo((actual) => actual + 1)
    setError('')
    setMensaje('')
  }

  async function subirDocumentos(evento) {
    evento.preventDefault()
    setError('')
    setMensaje('')

    if (!postulacionDocumento) {
      setError('Selecciona una postulación.')
      return
    }

    if (!archivos.length) {
      setError('Selecciona al menos un archivo PDF.')
      return
    }

    setSubiendo(true)

    let subidos = 0

    try {
      for (const archivo of archivos) {
        const formulario = new FormData()

        formulario.append(
          'postulacion_id',
          postulacionDocumento
        )
        formulario.append('tipo', tipoDocumento)
        formulario.append('archivo', archivo)

        await solicitar('/api/v1/documentos', {
          method: 'POST',
          body: formulario,
        })

        subidos += 1
      }

      setMensaje(
        subidos === 1
          ? 'Documento subido correctamente.'
          : `${subidos} documentos subidos correctamente.`
      )

      setArchivos([])
      setReiniciarArchivo((actual) => actual + 1)
    } catch (err) {
      setError(
        subidos
          ? `Se subieron ${subidos} archivo(s), pero ocurrió un error: ${err.message}`
          : err.message
      )
    } finally {
      setSubiendo(false)
      await cargarDocumentos(postulacionDocumento)
    }
  }

  async function descargarDocumento(documento) {
    setError('')
    setDescargandoId(documento.id)

    try {
      const respuesta = await fetch(
        `${API_URL}/api/v1/documentos/${documento.id}/descargar`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => ({}))

        throw new Error(
          typeof datos.detail === 'string'
            ? datos.detail
            : 'No fue posible descargar el documento.'
        )
      }

      const archivo = await respuesta.blob()
      const url = URL.createObjectURL(archivo)
      const enlace = document.createElement('a')

      enlace.href = url
      enlace.download = documento.nombre_archivo
      document.body.appendChild(enlace)
      enlace.click()
      enlace.remove()

      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      setError(err.message)
    } finally {
      setDescargandoId(null)
    }
  }

  const permiteVarios =
    tipoDocumento === 'Certificación' ||
    tipoDocumento === 'Otro documento'

  return {
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
  }
}
