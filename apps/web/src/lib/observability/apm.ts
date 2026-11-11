import { logger } from '@/lib/logger'
import { fetchWithCircuitBreaker } from '@/lib/resilience/circuit-breaker'

type ApmProvider = 'disabled' | 'http'

export interface ApmRequestSpan {
  correlationId: string
  durationMs: number
  method: string
  path: string
  routeName: string
  statusCode: number
  errorName?: string
}

interface ApmConfig {
  provider: ApmProvider
  endpoint?: string
  apiKey?: string
  sampleRate: number
  serviceName: string
  environment: string
}

const DEFAULT_SAMPLE_RATE = 1

function readSampleRate() {
  const raw = process.env.OBSERVABILITY_APM_SAMPLE_RATE
  if (!raw) return DEFAULT_SAMPLE_RATE

  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) return DEFAULT_SAMPLE_RATE

  return Math.min(1, Math.max(0, parsed))
}

function resolveApmConfig(): ApmConfig {
  const endpoint = process.env.OBSERVABILITY_APM_ENDPOINT?.trim()
  const configuredProvider = process.env.OBSERVABILITY_APM_PROVIDER?.trim().toLowerCase()
  const provider: ApmProvider =
    configuredProvider === 'http' || endpoint ? 'http' : 'disabled'

  return {
    provider,
    endpoint,
    apiKey: process.env.OBSERVABILITY_APM_API_KEY?.trim(),
    sampleRate: readSampleRate(),
    serviceName: process.env.OBSERVABILITY_SERVICE_NAME || 'soflia-academy-web',
    environment: process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || 'unknown',
  }
}

export function isApmConfigured() {
  const config = resolveApmConfig()
  return config.provider === 'http' && Boolean(config.endpoint)
}

export function emitApmRequestSpan(span: ApmRequestSpan): void {
  const config = resolveApmConfig()
  if (config.provider === 'disabled' || !config.endpoint) return
  if (Math.random() > config.sampleRate) return

  const payload = {
    type: 'http.server.request',
    service: config.serviceName,
    environment: config.environment,
    timestamp: new Date().toISOString(),
    span,
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`
  }

  void fetchWithCircuitBreaker('observability-apm-export', config.endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    keepalive: true,
  }, {
    timeoutMs: 2_000,
    errorThresholdPercentage: 50,
    resetTimeoutMs: 30_000,
    maxRetries: 0,
  }).catch((error: unknown) => {
    logger.warn('apm.emit.failed', {
      error: error instanceof Error ? error.message : 'APM_EMIT_FAILED',
      provider: config.provider,
    })
  })
}
