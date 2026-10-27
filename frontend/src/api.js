// URL base del backend FastAPI. Se puede configurar con frontend/.env.
// Vite expone las variables VITE_* al navegador; nunca incluir secretos.
export const API_URL = (
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
).trim().replace(/\/+$/, '')

// Peticiones JSON autenticadas utilizadas por los paneles.
export async function solicitarAPI(ruta, tokenAcceso, opciones = {}) {
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    ...opciones,
    headers: {
      Authorization: `Bearer ${tokenAcceso}`,
      ...(opciones.body ? { 'Content-Type': 'application/json' } : {}),
      ...opciones.headers,
    },
  })

  const datos = await respuesta.json().catch(() => ({}))
  if (!respuesta.ok) {
    const detalle = datos.detail
    const errorAPI = new Error(
      typeof detalle === 'string'
        ? detalle
        : typeof detalle?.mensaje === 'string'
          ? detalle.mensaje
          : `Error del servidor (${respuesta.status}).`
    )
    errorAPI.indicadoresPendientes = Array.isArray(detalle?.indicadores_pendientes)
      ? detalle.indicadores_pendientes
      : []
    throw errorAPI
  }
  return datos
}
