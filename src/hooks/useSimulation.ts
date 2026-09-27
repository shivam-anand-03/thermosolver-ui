import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ApiRequestError, fetchExamples, solve } from '@/lib/api'
import {
  buildRequest,
  clientValidate,
  DEFAULT_STEADY,
  DEFAULT_TRANSIENT,
  derive,
  formFromExample,
  type FormState,
} from '@/lib/form'
import type { ApiError, Example, ProblemType, SimulationResult, SteadyRequest, TransientRequest } from '@/types/solver'

export type SolveStatus = 'idle' | 'solving' | 'done' | 'error'

/**
 * Central state for the solver page: wizard form, derived mesh values, the last result,
 * and a debounced live re-solve so that editing N, L, BCs… updates every view without a refresh.
 */
export function useSimulation() {
  const [form, setForm] = useState<FormState>(DEFAULT_STEADY)
  const [exampleId, setExampleId] = useState<string | null>(null)
  const [examples, setExamples] = useState<Example[]>([])
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [resultRequest, setResultRequest] = useState<SteadyRequest | TransientRequest | null>(null)
  const [status, setStatus] = useState<SolveStatus>('idle')
  const [error, setError] = useState<ApiError | null>(null)
  const [liveUpdate, setLiveUpdate] = useState(true)
  const seq = useRef(0)

  useEffect(() => {
    fetchExamples()
      .then(setExamples)
      .catch(() => setExamples([]))
  }, [])

  const errors = useMemo(() => clientValidate(form), [form])
  const derived = useMemo(() => derive(form), [form])
  const blocking = useMemo(() => Object.values(errors).filter((m): m is string => !!m), [errors])
  const request = useMemo(() => buildRequest(form), [form])
  const example = useMemo(() => examples.find((e) => e.id === exampleId) ?? null, [examples, exampleId])

  /** Update one or more form fields; any physical edit detaches the loaded reference example. */
  const update = useCallback((patch: Partial<FormState>) => {
    setForm((f) => ({ ...f, ...patch }))
    setExampleId(null)
  }, [])

  const setProblemType = useCallback((t: ProblemType) => {
    setForm((f) => (f.problemType === t ? f : t === 'steady' ? DEFAULT_STEADY : DEFAULT_TRANSIENT))
    setExampleId(null)
    setResult(null)
    setStatus('idle')
    setError(null)
  }, [])

  const run = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (blocking.length) return null
      const id = ++seq.current
      if (!opts.silent) setStatus('solving')
      try {
        const body = buildRequest(form)
        const res = await solve(form.problemType, body)
        if (id !== seq.current) return null
        setResult(res)
        setResultRequest(body)
        setError(null)
        setStatus('done')
        return res
      } catch (e) {
        if (id !== seq.current) return null
        const payload: ApiError =
          e instanceof ApiRequestError ? e.payload : { success: false, kind: 'internal', error: String(e), details: [] }
        setError(payload)
        setStatus('error')
        return null
      }
    },
    [form, blocking.length],
  )

  // live re-solve after edits once a result exists
  const stale = result !== null && JSON.stringify(resultRequest) !== JSON.stringify(request)
  useEffect(() => {
    if (!liveUpdate || !stale || blocking.length || result?.problem_type !== form.problemType) return
    const t = setTimeout(() => void run({ silent: true }), 450)
    return () => clearTimeout(t)
  }, [liveUpdate, stale, blocking.length, run, result?.problem_type, form.problemType])

  const loadExample = useCallback((ex: Example) => {
    setForm(formFromExample(ex))
    setExampleId(ex.id)
    setResult(null)
    setResultRequest(null)
    setStatus('idle')
    setError(null)
  }, [])

  const reset = useCallback(() => {
    setForm((f) => (f.problemType === 'steady' ? DEFAULT_STEADY : DEFAULT_TRANSIENT))
    setExampleId(null)
    setResult(null)
    setResultRequest(null)
    setStatus('idle')
    setError(null)
  }, [])

  return {
    form,
    update,
    setProblemType,
    derived,
    errors,
    blocking,
    request,
    result,
    resultRequest,
    stale,
    status,
    error,
    run,
    examples,
    example,
    loadExample,
    reset,
    liveUpdate,
    setLiveUpdate,
  }
}

export type Simulation = ReturnType<typeof useSimulation>
