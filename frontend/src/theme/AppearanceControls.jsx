import { useAppearance } from './context'

const MODES = [
  { id: 'light', label: 'Claro' },
  { id: 'dark', label: 'Oscuro' },
  { id: 'auto', label: 'Auto' },
]
const ACCENTS = [
  { id: 'violet', label: 'Violeta' },
  { id: 'blue', label: 'Azul' },
  { id: 'teal', label: 'Turquesa' },
  { id: 'rose', label: 'Rosa' },
]

export default function AppearanceControls() {
  const { mode, accent, style, setMode, setAccent, setStyle } = useAppearance()

  return (
    <details className="appearance-menu">
      <summary className="appearance-trigger" aria-label="Personalizar apariencia">
        <span aria-hidden="true">◐</span> Apariencia <span className="appearance-chevron" aria-hidden="true">⌄</span>
      </summary>
      <div className="appearance-popover">
        <div className="appearance-popover-heading">
          <strong>Personaliza tu espacio</strong>
          <span>Estética Nebula</span>
        </div>
        <div className="appearance-group">
          <span className="appearance-label">Tema</span>
          <div className="appearance-segments" role="group" aria-label="Tema de color">
            {MODES.map((option) => (
              <button key={option.id} type="button"
                className={mode === option.id ? 'seleccionado' : ''}
                aria-pressed={mode === option.id}
                onClick={() => setMode(option.id)}>{option.label}</button>
            ))}
          </div>
        </div>
        <div className="appearance-group">
          <span className="appearance-label">Color de acento</span>
          <div className="appearance-swatches" role="group" aria-label="Color de acento">
            {ACCENTS.map((option) => (
              <button key={option.id} type="button"
                className={`appearance-swatch appearance-swatch-${option.id} ${accent === option.id ? 'seleccionado' : ''}`}
                onClick={() => setAccent(option.id)}
                aria-pressed={accent === option.id}
                aria-label={option.label} title={option.label}>
                {accent === option.id ? '✓' : ''}
              </button>
            ))}
          </div>
        </div>
        <div className="appearance-group">
          <span className="appearance-label">Estilo visual</span>
          <div className="appearance-segments" role="group" aria-label="Estilo visual">
            <button type="button" className={style === 'tech' ? 'seleccionado' : ''}
              aria-pressed={style === 'tech'} onClick={() => setStyle('tech')}>Tecnológico</button>
            <button type="button" className={style === 'minimal' ? 'seleccionado' : ''}
              aria-pressed={style === 'minimal'} onClick={() => setStyle('minimal')}>Minimalista</button>
          </div>
        </div>
        <p className="appearance-footnote">Las preferencias se guardan en este navegador.</p>
      </div>
    </details>
  )
}
