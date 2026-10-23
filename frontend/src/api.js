// URL base del backend FastAPI. Se puede configurar con frontend/.env.
// Vite expone las variables VITE_* al navegador; nunca incluir secretos.
export const API_URL = (
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
).trim().replace(/\/+$/, '')
