import axios from 'axios'

const rawBaseUrl = import.meta.env.VITE_BASE_URL as string | undefined
const normalizedBaseUrl = rawBaseUrl?.trim().replace(/^['"]|['"]$/g, '') || undefined

const api = axios.create({
  // Fallback to same-origin requests when env is missing or malformed.
  baseURL: normalizedBaseUrl
})

export default api
