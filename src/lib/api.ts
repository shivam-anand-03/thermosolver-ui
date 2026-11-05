import type { RefinementResult, Setup, WorkflowResult } from '@/workflow/types'
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

/**
 * Client-side ceiling for one request. The server stops any calculation at its own 30 s budget,
 * so this only fires when the server never answers, typically a free-tier host that was asleep
 * and is still booting (that can take up to a minute).
 */
const REQUEST_TIMEOUT_MS = 90_000

/** True while the API has not answered yet in this page load, so slowness can be explained as a cold start. */
let serverAwake = false

/**
 * Fire-and-forget ping so a sleeping (free-tier) API starts booting while the user is still
 * reading the first step, instead of on their first Run.
 */
export function warmUpApi(): void {
  fetch(`${BASE}/api/health`, { cache: 'no-store' })
    .then((r) => {
      if (r.ok) serverAwake = true
    })
    .catch(() => {})
}

async function request<T>(path: string, init?: RequestInit): Promise<Response> {
  const timeout = new AbortController()
  const timer = setTimeout(() => timeout.abort(), REQUEST_TIMEOUT_MS)
  // abort on either the caller's signal (stale request) or our timeout
  const signal = init?.signal ? anySignal([init.signal, timeout.signal]) : timeout.signal
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      signal,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    })
    serverAwake = true
  } catch {
    const timedOut = timeout.signal.aborted && !init?.signal?.aborted
    throw new ApiRequestError({
      success: false,
      kind: 'network',
      error: timedOut
        ? serverAwake
          ? 'The server did not respond in time. Please try again.'
          : 'The server is taking too long to respond. If it was asleep (free hosting), it needs up to a minute to wake up; please try again.'
        : 'Cannot reach the CFD Solver API. Make sure the backend is running on port 8000.',
      details: [],
    })
  } finally {
    clearTimeout(timer)
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

function anySignal(signals: AbortSignal[]): AbortSignal {
  if ('any' in AbortSignal) return AbortSignal.any(signals)
  const ctrl = new AbortController()
  for (const sg of signals) {
    if (sg.aborted) {
      ctrl.abort()
      break
    }
    sg.addEventListener('abort', () => ctrl.abort(), { once: true })
  }
  return ctrl.signal
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

// ------------------------------------------------ three-phase workflow (v2)

/** PDF report for a workflow set-up (re-solved on the server). Returns the file; save it with downloadBlob. */
export async function downloadWorkflowPdf(setup: Setup): Promise<Blob> {
  const res = await request<Blob>('/api/v2/report/pdf', { method: 'POST', body: JSON.stringify(setup) })
  return res.blob()
}

export async function simulateWorkflow(setup: Setup, signal?: AbortSignal): Promise<WorkflowResult> {
  const res = await request<WorkflowResult>('/api/v2/simulate', { method: 'POST', body: JSON.stringify(setup), signal })
  return res.json()
}

export async function validateWorkflow(setup: Setup, signal?: AbortSignal): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
  const res = await request('/api/v2/validate', { method: 'POST', body: JSON.stringify(setup), signal })
  return res.json()
}

export async function refineWorkflow(setup: Setup): Promise<RefinementResult> {
  const res = await request<RefinementResult>('/api/v2/refine', { method: 'POST', body: JSON.stringify(setup) })
  return res.json()
}
