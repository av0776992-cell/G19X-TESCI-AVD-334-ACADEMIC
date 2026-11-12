import { createContext, useContext } from 'react'

export const AppearanceContext = createContext(null)

export function useAppearance() {
  const context = useContext(AppearanceContext)
  if (!context) {
    throw new Error('useAppearance debe utilizarse dentro de AppearanceProvider')
  }
  return context
}
