import axios from 'axios'

const rawBaseUrl = import.meta.env.VITE_BASE_URL as string | undefined
const normalizedBaseUrl = rawBaseUrl?.trim().replace(/^['"]|['"]$/g, '') || undefined

const api = axios.create({
  // Fallback to same-origin requests when env is missing or malformed.
  baseURL: normalizedBaseUrl,
  timeout: 60000
})

const createTraceId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `trace-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
}

api.interceptors.request.use((config) => {
  const traceId = String(config.headers?.['x-trace-id'] || createTraceId())
  config.headers = config.headers || {}
  config.headers['x-trace-id'] = traceId
  ;(config as any).metadata = { startedAt: Date.now(), traceId }
  console.log(`[API][${traceId}] --> ${String(config.method || 'GET').toUpperCase()} ${config.baseURL || ''}${config.url || ''}`)
  return config
})

api.interceptors.response.use(
  (response) => {
    const meta = (response.config as any).metadata || {}
    const traceId = String(response.headers?.['x-trace-id'] || meta.traceId || 'trace-missing')
    const duration = meta.startedAt ? Date.now() - meta.startedAt : -1
    console.log(`[API][${traceId}] <-- ${response.status} ${response.config.url || ''} ${duration}ms`)
    return response
  },
  (error) => {
    const config = error.config || {}
    const meta = (config as any).metadata || {}
    const traceId = String(error.response?.headers?.['x-trace-id'] || meta.traceId || 'trace-missing')
    const duration = meta.startedAt ? Date.now() - meta.startedAt : -1
    const status = error.response?.status || 'NO_RESPONSE'
    console.error(`[API][${traceId}] xx ${status} ${config.url || ''} ${duration}ms`, error.message)
    return Promise.reject(error)
  }
)

export default api
