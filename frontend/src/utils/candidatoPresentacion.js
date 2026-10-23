export function fechaLegible(fecha) {
    if (!fecha) return 'No especificada'

    const convertida = new Date(fecha)

    if (Number.isNaN(convertida.getTime())) {
      return 'No especificada'
    }

    return convertida.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

export function obtenerEstado(postulacion) {
    if (postulacion.decision_final === 'ACEPTADO') {
      return 'Aceptado'
    }

    if (postulacion.decision_final === 'RECHAZADO') {
      return 'Rechazado'
    }

    return postulacion.estado_actual || 'Postulado'
  }

export function obtenerColorEstado(estado) {
    const valor = estado.toLowerCase()

    if (valor === 'aceptado') return '#15803d'
    if (valor === 'rechazado') return '#dc2626'

    if (
      valor.includes('revisión') ||
      valor.includes('revision') ||
      valor.includes('evaluación') ||
      valor.includes('evaluacion')
    ) {
      return '#a16207'
    }

    return '#2563eb'
  }

