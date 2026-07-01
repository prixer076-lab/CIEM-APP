type ApiEnvelope<T> = {
  success: boolean
  message: string
  path: string
  timestamp: string
  data: T
}

type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  token?: string
  headers?: Record<string, string>
}

function normalizeApiBaseUrl(value?: string) {
  const fallback = 'http://localhost:4000/api/v1'
  const baseUrl = value?.trim() || fallback
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '')

  return cleanBaseUrl.endsWith('/api/v1') ? cleanBaseUrl : `${cleanBaseUrl}/api/v1`
}

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL)

export class ApiError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers ?? {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null

  if (!response.ok || !payload?.success) {
    throw new ApiError(payload?.message ?? 'No se pudo completar la solicitud.', response.status)
  }

  return payload.data
}
