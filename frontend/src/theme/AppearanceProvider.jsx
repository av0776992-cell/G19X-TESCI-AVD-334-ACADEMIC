import { useEffect, useMemo, useState } from 'react'
import { AppearanceContext } from './context'

const STORAGE_KEY = 'ranking-ia-apariencia-v1'
const DEFAULTS = { mode: 'dark', accent: 'violet', style: 'tech' }

function readPreferences() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}')
    return {
      mode: ['light', 'dark', 'auto'].includes(saved.mode) ? saved.mode : DEFAULTS.mode,
      accent: ['violet', 'blue', 'teal', 'rose'].includes(saved.accent) ? saved.accent : DEFAULTS.accent,
      style: ['tech', 'minimal'].includes(saved.style) ? saved.style : DEFAULTS.style,
    }
  } catch {
    return DEFAULTS
  }
}

export default function AppearanceProvider({ children }) {
  const [preferences, setPreferences] = useState(readPreferences)
  const [systemDark, setSystemDark] = useState(() =>
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true
  )

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!media) return undefined
    const onChange = (event) => setSystemDark(event.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const activeTheme = preferences.mode === 'auto'
      ? (systemDark ? 'dark' : 'light')
      : preferences.mode
    root.dataset.theme = activeTheme
    root.dataset.accent = preferences.accent
    root.dataset.style = preferences.style
    root.style.colorScheme = activeTheme
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    } catch {
      // Sigue funcionando aunque el navegador bloquee almacenamiento local.
    }
  }, [preferences, systemDark])

  const value = useMemo(() => ({
    ...preferences,
    setMode: (mode) => setPreferences((prev) => ({ ...prev, mode })),
    setAccent: (accent) => setPreferences((prev) => ({ ...prev, accent })),
    setStyle: (style) => setPreferences((prev) => ({ ...prev, style })),
  }), [preferences])

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  )
}
