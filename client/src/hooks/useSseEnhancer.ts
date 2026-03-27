import { useCallback, useRef, useState } from 'react'

type StartOptions<TPayload> = {
  endpoint: string
  token?: string | null
  payload: TPayload
  onChunk: (delta: string) => void
  onDone?: (result: string, meta: { traceId?: string; fromFallback?: boolean }) => void
}

type SsePayload = {
  result?: string
  delta?: string
  message?: string
  traceId?: string
  fromFallback?: boolean
}

class SmoothTypewriter {
  private queue: string[] = []
  private isAnimating = false
  private rafId: number | null = null
  private drainResolvers: Array<() => void> = []
  private onRender: (delta: string) => void

  constructor(onRender: (delta: string) => void) {
    this.onRender = onRender
  }

  push(text: string) {
    if (!text) return
    this.queue.push(...Array.from(text))
    if (!this.isAnimating) {
      this.isAnimating = true
      this.rafId = window.requestAnimationFrame(this.animate)
    }
  }

  private animate = () => {
    if (this.queue.length === 0) {
      this.isAnimating = false
      this.rafId = null
      this.resolveDrain()
      return
    }

    const batchSize = Math.max(1, Math.floor(this.queue.length / 5))
    const charsToRender = this.queue.splice(0, batchSize).join('')
    this.onRender(charsToRender)
    this.rafId = window.requestAnimationFrame(this.animate)
  }

  async drain() {
    if (!this.isAnimating && this.queue.length === 0) return
    await new Promise<void>((resolve) => {
      this.drainResolvers.push(resolve)
    })
  }

  flushNow() {
    if (this.queue.length > 0) {
      const rest = this.queue.splice(0).join('')
      this.onRender(rest)
    }
    this.stopAnimation()
    this.resolveDrain()
  }

  stop() {
    this.queue = []
    this.stopAnimation()
    this.resolveDrain()
  }

  private stopAnimation() {
    this.isAnimating = false
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  private resolveDrain() {
    if (!this.drainResolvers.length) return
    const resolvers = [...this.drainResolvers]
    this.drainResolvers = []
    resolvers.forEach((resolve) => resolve())
  }
}

const rawBaseUrl = import.meta.env.VITE_BASE_URL as string | undefined
const normalizedBaseUrl = rawBaseUrl?.trim().replace(/^['"]|['"]$/g, '') || ''

const buildRequestUrl = (endpoint: string) => {
  if (!normalizedBaseUrl) return endpoint
  const base = normalizedBaseUrl.endsWith('/') ? normalizedBaseUrl.slice(0, -1) : normalizedBaseUrl
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${base}${path}`
}

const createTraceId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `trace-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
}


const parseSseBlock = (block: string): { event: string; data: SsePayload } | null => {
  const lines = block.split('\n').map((line) => line.trim())
  let event = 'message'
  const dataLines: string[] = []
  for (const line of lines) {
    if (!line || line.startsWith(':')) continue
    if (line.startsWith('event:')) {
      event = line.slice(6).trim()
      continue
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim())
    }
  }

  if (!dataLines.length) return null
  try {
    return { event, data: JSON.parse(dataLines.join('\n')) as SsePayload }
  } catch {
    return null
  }
}

export const useSseEnhancer = () => {
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const stop = useCallback(() => {

    abortRef.current?.abort()
    abortRef.current = null
    setIsStreaming(false)
  }, [])

  const start = useCallback(async <TPayload,>({
    endpoint,
    token,
    payload,
    onChunk,
    onDone,
  }: StartOptions<TPayload>) => {
    stop()
    const controller = new AbortController()
    abortRef.current = controller
    setIsStreaming(true)

    const traceId = createTraceId()
    const response = await fetch(buildRequestUrl(endpoint), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'x-trace-id': traceId,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(text || `Request failed: ${response.status}`)
    }
    if (!response.body) {
      throw new Error('Streaming response body is empty')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let assembledText = ''
    const typewriter = new SmoothTypewriter(onChunk)

    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        while (buffer.includes('\n\n')) {
          const idx = buffer.indexOf('\n\n')
          const block = buffer.slice(0, idx)
          buffer = buffer.slice(idx + 2)
          const parsed = parseSseBlock(block)
          if (!parsed) continue

          const { event, data } = parsed
          if (event === 'chunk' && data.delta) {
            assembledText += data.delta
            typewriter.push(data.delta)
            continue
          }

          if (event === 'done') {
            await typewriter.drain()
            onDone?.(data.result || assembledText, { traceId: data.traceId, fromFallback: data.fromFallback })
            return
          }

          if (event === 'error') {
            typewriter.flushNow()
            throw new Error(data.message || 'SSE stream error')
          }
        }
      }
    } finally {
      typewriter.stop()
      abortRef.current = null
      setIsStreaming(false)
      reader.releaseLock()
    }
  }, [stop])

  return {
    isStreaming,
    start,
    stop,
  }
}
