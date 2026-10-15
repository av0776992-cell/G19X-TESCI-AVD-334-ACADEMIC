const opcionesPorRol = {
  CANDIDATO: [
    { id: 'vacantes', nombre: 'Vacantes disponibles', icono: '▣' },
    { id: 'postulaciones', nombre: 'Mis postulaciones', icono: '✓' },
    { id: 'documentos', nombre: 'Mis documentos', icono: '▤' },
    { id: 'perfil', nombre: 'Mi perfil', icono: '◉' },
    { id: 'formacion', nombre: 'Formación académica', icono: '▤' },
    { id: 'experiencia', nombre: 'Experiencia laboral', icono: '▣' },
    { id: 'habilidades', nombre: 'Mis habilidades', icono: '✓' },
    { id: 'competencias', nombre: 'Mis competencias', icono: '◉' },
  ],
  RECLUTADOR: [
    { id: 'inicio', nombre: 'Panel principal', icono: '⌂' },
    { id: 'postulaciones', nombre: 'Postulaciones y evaluaciones', icono: '▣' },
  ],
  ADMINISTRADOR: [
    { id: 'inicio', nombre: 'Panel principal', icono: '⌂' },
    { id: 'vacantes', nombre: 'Gestión de vacantes', icono: '▣' },
    { id: 'postulaciones', nombre: 'Postulaciones y ranking IA', icono: '◉' },
  ],
}

export default function MenuLateral({
  rol,
  seccionActiva = 'inicio',
  onSeleccionar,
  onCerrarSesion,
}) {
  const opciones = opcionesPorRol[rol] || []

  return (
    <aside className="menu-lateral">
      <div className="menu-lateral-marca">
        <span className="menu-lateral-logo">DTT</span>
        <div>
          <strong>Ranking IA</strong>
          <small>Develop Talent & Technology</small>
        </div>
      </div>

      <nav className="menu-lateral-navegacion" aria-label="Navegación principal">
        {opciones.map((opcion) => (
          <button
            key={opcion.id}
            type="button"
            className={`menu-lateral-enlace ${
              seccionActiva === opcion.id ? 'activo' : ''
            }`}
            onClick={() => onSeleccionar?.(opcion.id)}
          >
            <span className="menu-lateral-icono" aria-hidden="true">
              {opcion.icono}
            </span>
            {opcion.nombre}
          </button>
        ))}
      </nav>

      <button
        type="button"
        className="menu-lateral-salir"
        onClick={onCerrarSesion}
      >
        Cerrar sesión
      </button>
    </aside>
  )
}
