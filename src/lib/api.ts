import type {
  ApiError,
  Example,
  InputValidation,
  ProblemType,
  SimulationResult,
  SteadyRequest,
  TransientRequest,
} from '@/types/solver'

const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export class ApiRequestError extends Error {
  readonly payload: ApiError
  constructor(payload: ApiError) {
    super(payload.error)
    this.payload = payload
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<Response> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    })
  } catch {
    throw new ApiRequestError({
      success: false,
      kind: 'network',
      error: 'Cannot reach the ThermoSolve API. Make sure the backend is running on port 8000.',
      details: [],
    })
  }
  if (!res.ok) {
    let payload: ApiError
    try {
      const body = await res.json()
      payload = {
        success: false,
        kind: body.kind ?? 'internal',
        error: body.error ?? (typeof body.detail === 'string' ? body.detail : 'Request failed.'),
        details: body.details ?? [],
      }
    } catch {
      payload = { success: false, kind: 'internal', error: `Request failed (HTTP ${res.status}).`, details: [] }
    }
    throw new ApiRequestError(payload)
  }
  return res as Response & { json(): Promise<T> }
}

export async function solve(type: ProblemType, body: SteadyRequest | TransientRequest): Promise<SimulationResult> {
  const res = await request<SimulationResult>(`/api/solve/${type}`, { method: 'POST', body: JSON.stringify(body) })
  return res.json()
}

export async function validateInputs(type: ProblemType, body: SteadyRequest | TransientRequest): Promise<InputValidation> {
  const res = await request<InputValidation>('/api/validate', {
    method: 'POST',
    body: JSON.stringify({ problem_type: type, [type]: body }),
  })
  return res.json()
}

export async function fetchExamples(): Promise<Example[]> {
  const res = await request<Example[]>('/api/examples')
  return res.json()
}

export async function downloadPdfReport(type: ProblemType, body: SteadyRequest | TransientRequest): Promise<Blob> {
  const res = await request<Blob>('/api/report/pdf', {
    method: 'POST',
    body: JSON.stringify({ problem_type: type, [type]: body }),
  })
  return res.blob()
}
