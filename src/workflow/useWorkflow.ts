import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiRequestError, refineWorkflow, simulateWorkflow, validateWorkflow } from '@/lib/api'
import type { ApiError } from '@/types/solver'
import { defaultSetup } from './defaults'
import type { RefinementResult, Setup, WorkflowResult } from './types'

const STORAGE_KEY = 'thermosolve.workflow.setup.v1'

function loadStored(): Setup {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const base = defaultSetup()
      const s = JSON.parse(raw) as Setup
      // shallow-merge each section so older stored setups pick up new fields
      return {
        preprocessor: { ...base.preprocessor, ...s.preprocessor, boundaries: { ...base.preprocessor.boundaries, ...s.preprocessor?.boundaries } },
        solver: { ...base.solver, ...s.solver },
      }
    }
  } catch {
    /* storage unavailable or corrupt: fall back to defaults */
  }
  return defaultSetup()
}

export type Updater = (fn: (draft: Setup) => void) => void

export function useWorkflow() {
  const [setup, setSetup] = useState<Setup>(loadStored)
  const [result, setResult] = useState<WorkflowResult | null>(null)
  const [resultSetup, setResultSetup] = useState<Setup | null>(null)
  const [status, setStatus] = useState<'idle' | 'solving'>('idle')
  const [error, setError] = useState<ApiError | null>(null)
  const [check, setCheck] = useState<{ errors: string[]; warnings: string[] } | null>(null)
  const [refinement, setRefinement] = useState<RefinementResult | null>(null)
  const [refining, setRefining] = useState(false)
  const [refineError, setRefineError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  /** Immutable update through a mutable draft (structuredClone keeps it simple and safe). */
  const update: Updater = useCallback((fn) => {
    setSetup((prev) => {
      const next = structuredClone(prev)
      fn(next)
      return next
    })
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(setup))
    } catch {
      /* ignore */
    }
  }, [setup])

  // live server-side validation of the whole setup (debounced)
  useEffect(() => {
    const ctrl = new AbortController()
    const id = window.setTimeout(() => {
      validateWorkflow(setup, ctrl.signal)
        .then((r) => setCheck({ errors: r.errors, warnings: r.warnings }))
        .catch((e) => {
          if (ctrl.signal.aborted) return
          if (e instanceof ApiRequestError && e.payload.kind === 'schema') setCheck({ errors: e.payload.details.length ? e.payload.details : [e.payload.error], warnings: [] })
          else setCheck(null)
        })
    }, 250)
    return () => {
      ctrl.abort()
      window.clearTimeout(id)
    }
  }, [setup])

  const run = useCallback(async (): Promise<WorkflowResult | null> => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setStatus('solving')
    setError(null)
    const snapshot = structuredClone(setup)
    try {
      const r = await simulateWorkflow(snapshot, ctrl.signal)
      setResult(r)
      setResultSetup(snapshot)
      setRefinement(null)
      setRefineError(null)
      return r
    } catch (e) {
      if (ctrl.signal.aborted) return null
      setError(e instanceof ApiRequestError ? e.payload : { success: false, kind: 'internal', error: String(e), details: [] })
      return null
    } finally {
      if (abortRef.current === ctrl) setStatus('idle')
    }
  }, [setup])

  const refine = useCallback(async () => {
    if (!resultSetup) return
    setRefining(true)
    setRefineError(null)
    try {
      setRefinement(await refineWorkflow(resultSetup))
    } catch (e) {
      setRefineError(e instanceof ApiRequestError ? e.payload.error : String(e))
    } finally {
      setRefining(false)
    }
  }, [resultSetup])

  const load = useCallback((s: Setup) => {
    setSetup(structuredClone(s))
    setResult(null)
    setResultSetup(null)
    setError(null)
    setRefinement(null)
  }, [])

  const stale = !!resultSetup && JSON.stringify(resultSetup) !== JSON.stringify(setup)

  return { setup, update, load, result, resultSetup, status, error, check, run, stale, refine, refinement, refining, refineError }
}

export type Workflow = ReturnType<typeof useWorkflow>
