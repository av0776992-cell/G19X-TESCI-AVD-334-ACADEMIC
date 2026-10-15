
import { useEffect, useState } from 'react'

const API_URL = 'http://127.0.0.1:8000'

export default function PerfilCandidato({ token }) {
  const [perfil, setPerfil] = useState(null)
  const [formulario, setFormulario] = useState({
    telefono: '',
    ciudad: '',
    fecha_nacimiento: '',
  })
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  async function solicitar(ruta, opciones = {}) {
    const respuesta = await fetch(`${API_URL}${ruta}`, {
      ...opciones,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(opciones.body
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...opciones.headers,
      },
    })

    const datos = await respuesta.json().catch(() => ({}))

    if (!respuesta.ok) {
      const detalle = datos.detail

      if (typeof detalle === 'string') {
        throw new Error(detalle)
      }

      if (Array.isArray(detalle)) {
        throw new Error(
          detalle
            .map((item) => item.msg || 'Dato no válido')
            .join('. ')
        )
      }

      throw new Error(`Error del servidor (${respuesta.status})`)
    }

    return datos
  }

  function actualizarFormulario(datos) {
    setFormulario({
      telefono: datos.telefono ?? '',
      ciudad: datos.ciudad ?? '',
      fecha_nacimiento: datos.fecha_nacimiento ?? '',
    })
  }

  useEffect(() => {
    let activo = true

    async function cargarPerfil() {
      setCargando(true)
      setError('')

      try {
        const datos = await solicitar('/api/v1/candidatos/me')

        if (activo) {
          setPerfil(datos)
          actualizarFormulario(datos)
        }
      } catch (err) {
        if (activo) setError(err.message)
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargarPerfil()

    return () => {
      activo = false
    }
  }, [token])

  function cambiarCampo(evento) {
    const { name, value } = evento.target

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }))
  }

  async function guardarPerfil(evento) {
    evento.preventDefault()
    setError('')
    setMensaje('')

    const telefono = formulario.telefono.trim()
    const ciudad = formulario.ciudad.trim()

    if (telefono && !/^\+?\d{7,20}$/.test(telefono)) {
      setError(
        'El teléfono debe contener entre 7 y 20 números, con un + inicial opcional.'
      )
      return
    }

    if (ciudad && (ciudad.length < 2 || ciudad.length > 100)) {
      setError('La ciudad debe contener entre 2 y 100 caracteres.')
      return
    }

    if (
      formulario.fecha_nacimiento &&
      formulario.fecha_nacimiento >
        new Date().toLocaleDateString('en-CA')
    ) {
      setError('La fecha de nacimiento no puede estar en el futuro.')
      return
    }

    setGuardando(true)

    try {
      const datos = await solicitar('/api/v1/candidatos/me', {
        method: 'PATCH',
        body: JSON.stringify({
          telefono: telefono || null,
          ciudad: ciudad || null,
          fecha_nacimiento: formulario.fecha_nacimiento || null,
        }),
      })

      setPerfil(datos)
      actualizarFormulario(datos)
      setMensaje('Tu perfil se actualizó correctamente.')
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return (
      <section className="panel-seccion">
        <h2>Mi perfil</h2>
        <p>Cargando información del candidato...</p>
      </section>
    )
  }

  return (
    <section className="panel-seccion">
      <h2>Mi perfil</h2>
      <p>
        Consulta tus datos personales y mantén actualizada
        tu información de contacto.
      </p>

      {error && (
        <p className="mensaje-error" role="alert">
          {error}
        </p>
      )}

      {mensaje && (
        <p className="mensaje-exito" role="status">
          {mensaje}
        </p>
      )}

      {perfil && (
        <form onSubmit={guardarPerfil}>
          <div style={{ marginBottom: '18px' }}>
            <label htmlFor="perfil-nombre">
              <strong>Nombre completo</strong>
            </label>
            <input
              id="perfil-nombre"
              type="text"
              value={perfil.nombre}
              disabled
              style={{ display: 'block', width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label htmlFor="perfil-correo">
              <strong>Correo electrónico</strong>
            </label>
            <input
              id="perfil-correo"
              type="email"
              value={perfil.correo}
              disabled
              style={{ display: 'block', width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label htmlFor="perfil-telefono">
              <strong>Teléfono</strong>
            </label>
            <input
              id="perfil-telefono"
              type="tel"
              name="telefono"
              value={formulario.telefono}
              onChange={cambiarCampo}
              placeholder="Ejemplo: +525512345678"
              maxLength={20}
              style={{ display: 'block', width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label htmlFor="perfil-ciudad">
              <strong>Ciudad</strong>
            </label>
            <input
              id="perfil-ciudad"
              type="text"
              name="ciudad"
              value={formulario.ciudad}
              onChange={cambiarCampo}
              placeholder="Ejemplo: Ciudad de México"
              maxLength={100}
              style={{ display: 'block', width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label htmlFor="perfil-fecha">
              <strong>Fecha de nacimiento</strong>
            </label>
            <input
              id="perfil-fecha"
              type="date"
              name="fecha_nacimiento"
              value={formulario.fecha_nacimiento}
              onChange={cambiarCampo}
              style={{ display: 'block', width: '100%' }}
            />
          </div>

          <p className="nota">
            Estado de la cuenta:{' '}
            <strong>
              {perfil.activo ? 'Activa' : 'Inactiva'}
            </strong>
          </p>

          <button
            type="submit"
            className="boton"
            disabled={guardando}
          >
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      )}
    </section>
  )
}
