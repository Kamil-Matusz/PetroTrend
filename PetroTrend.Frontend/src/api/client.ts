// Relative by default, so the Vite dev proxy handles it. Deployments where the frontend and the
// backend sit on different origins set `VITE_API_BASE_URL` at build time - it is baked into the
// bundle, so changing it means rebuilding.
const BASE = ((import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api').replace(/\/$/, '')

/** Mirrors the backend `ApiError`; `reasonCode` is the stable part of the contract. */
export class ApiError extends Error {
  readonly status: number
  readonly reasonCode: string | null

  constructor(status: number, message: string, reasonCode: string | null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.reasonCode = reasonCode
  }
}

type ErrorBody = {
  message?: string
  reasonCode?: string
  detail?: string
  errors?: { defaultMessage?: string; field?: string }[]
}

async function readError(response: Response): Promise<ApiError> {
  let body: ErrorBody = {}
  try {
    body = (await response.json()) as ErrorBody
  } catch {
    // Empty or non-JSON body - fall through to the status-only message.
  }

  // Bean Validation failures bypass GlobalExceptionHandler and arrive in Spring's own shape.
  const fieldMessage = body.errors?.map((e) => e.defaultMessage).filter(Boolean).join('; ')
  const message = body.message || fieldMessage || body.detail || `Błąd ${response.status}`
  return new ApiError(response.status, message, body.reasonCode ?? null)
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE}${path}`, {
      ...init,
      headers: init?.body ? { 'Content-Type': 'application/json', ...init?.headers } : init?.headers,
    })
  } catch {
    throw new ApiError(0, 'Brak połączenia z API. Sprawdź, czy backend działa na porcie 8080.', 'NETWORK_UNREACHABLE')
  }

  if (!response.ok) {
    throw await readError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
