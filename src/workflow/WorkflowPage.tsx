import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Box,
  Calculator,
  Check,
  ChevronDown,
  Download,
  FlaskConical,
  Grid3x3,
  Layers,
  Loader2,
  PlayCircle,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Thermometer,
  Waves,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Signature } from '@/components/layout/Signature'
import { Tex } from '@/components/math/Tex'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/wizard/common'
import { downloadBlob } from '@/lib/export'
import { fmt } from '@/lib/format'
import { cn } from '@/lib/utils'
import { EXAMPLES, PHYSICS_INFO, defaultSetup, governingLatex, nodeCount, spacing } from './defaults'
import { DomainDiagram } from './DomainDiagram'
import { BoundaryStep, GeometryStep, MaterialStep, PhenomenaStep, ProblemStatementStep } from './steps/Phase1'
import { ConvergenceStep, MatrixSolverStep, MethodStep, RunStep } from './steps/Phase2'
import { ResultsStep, ValidationStep } from './steps/Phase3'
import { PHASE_THEME, type PhaseKey } from './theme'
import { useWorkflow } from './useWorkflow'

interface StepDef {
  id: number
  roman: string
  title: string
  icon: React.ComponentType<{ className?: string }>
}

const PHASES: { key: PhaseKey; name: string; title: string; steps: StepDef[] }[] = [
  {
    key: 'pre',
    name: 'Phase I',
    title: 'Preprocessor',
    steps: [
      { id: 1, roman: 'I', title: 'Problem statement', icon: Box },
      { id: 2, roman: 'II', title: 'Geometry and grid', icon: Grid3x3 },
      { id: 3, roman: 'III', title: 'Physical phenomena', icon: Waves },
      { id: 4, roman: 'IV', title: 'Material properties', icon: Layers },
      { id: 5, roman: 'V', title: 'Initial and boundary conditions', icon: Thermometer },
    ],
  },
  {
    key: 'solver',
    name: 'Phase II',
    title: 'Solver',
    steps: [
      { id: 6, roman: 'I', title: 'Numerical method', icon: Calculator },
      { id: 7, roman: 'II', title: 'Matrix inversion', icon: Grid3x3 },
      { id: 8, roman: 'III', title: 'Convergence and initialisation', icon: SlidersHorizontal },
      { id: 9, roman: 'IV', title: 'Solve: run calculation', icon: PlayCircle },
    ],
  },
  {
    key: 'post',
    name: 'Phase III',
    title: 'Post-processing',
    steps: [
      { id: 10, roman: 'I', title: 'Results', icon: BarChart3 },
      { id: 11, roman: 'II', title: 'Validation', icon: ShieldCheck },
    ],
  },
]
const LAST = 11

function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && close()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])
  return ref
}

export function WorkflowPage() {
  const wf = useWorkflow()
  const [step, setStep] = useState(1)
  const [exOpen, setExOpen] = useState(false)
  const exRef = useDismiss(exOpen, () => setExOpen(false))
  const { setup, result } = wf
  const blocking = wf.check?.errors ?? []

  const go = (s: number) => {
    setStep(s)
    window.scrollTo({ top: 0 })
  }

  const run = async () => {
    const r = await wf.run()
    if (r) go(10)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && blocking.length === 0) void run()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const locked = (id: number) => id >= 10 && !result
  const content = (() => {
    switch (step) {
      case 1:
        return <ProblemStatementStep wf={wf} />
      case 2:
        return <GeometryStep wf={wf} />
      case 3:
        return <PhenomenaStep wf={wf} />
      case 4:
        return <MaterialStep wf={wf} />
      case 5:
        return <BoundaryStep wf={wf} />
      case 6:
        return <MethodStep wf={wf} />
      case 7:
        return <MatrixSolverStep wf={wf} />
      case 8:
        return <ConvergenceStep wf={wf} />
      case 9:
        return <RunStep wf={wf} onRun={run} />
      case 10:
        return <ResultsStep wf={wf} />
      default:
        return <ValidationStep wf={wf} />
    }
  })()

  const current = PHASES.flatMap((p) => p.steps.map((s) => ({ ...s, phase: p }))).find((s) => s.id === step)!
  const h = spacing(setup)

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-300 bg-white">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4 sm:px-5">
          <a href="#" className="flex min-w-0 shrink items-center gap-3" aria-label="ThermoSolve home">
            <img src="/logo-wide.png" alt="ThermoSolve" className="h-9 w-auto sm:h-11" width={900} height={237} />
            <span className="hidden border-l border-slate-300 pl-3 text-[13px] leading-tight text-slate-600 md:block">
              Preprocessor → Solver → Post-processor
              <span className="block text-[11.5px] text-slate-400">1-D · 2-D · 3-D conduction and convection</span>
            </span>
          </a>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <a href="#classic" className="hidden text-[12.5px] text-slate-500 underline-offset-4 hover:text-slate-900 hover:underline lg:inline">
              Classic 1-D step-by-step
            </a>
            <div className="relative" ref={exRef}>
              <Button variant="secondary" size="sm" onClick={() => setExOpen((o) => !o)} aria-expanded={exOpen} aria-haspopup="menu" aria-label="Examples">
                <BookOpen />
                <span className="hidden sm:inline">Examples</span>
                <ChevronDown className="opacity-60" />
              </Button>
              {exOpen && (
                <div role="menu" className="scroll-thin absolute right-0 mt-2 max-h-[75vh] w-[min(92vw,420px)] overflow-auto rounded-md border border-slate-300 bg-white p-1 shadow-lg">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex.id}
                      role="menuitem"
                      onClick={() => {
                        wf.load(ex.setup)
                        setExOpen(false)
                        go(9)
                      }}
                      className="flex w-full items-start gap-3 rounded px-3 py-2 text-left hover:bg-slate-100"
                    >
                      <FlaskConical className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="min-w-0">
                        <span className="block text-[13px] font-medium text-slate-900">{ex.title}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{ex.description}</span>
                        <span className="mt-1 flex flex-wrap gap-1">
                          {ex.tags.map((t) => (
                            <Badge key={t} variant="neutral">
                              {t}
                            </Badge>
                          ))}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              variant="secondary"
              size="sm"
              title="Reset all inputs"
              aria-label="Reset"
              onClick={() => {
                wf.load(defaultSetup())
                go(1)
              }}
            >
              <RotateCcw />
              <span className="hidden sm:inline">Reset</span>
            </Button>
            <Button
              size="sm"
              disabled={!result}
              title="Download set-up and results as JSON"
              aria-label="Export"
              onClick={() => result && downloadBlob(new Blob([JSON.stringify({ setup: wf.resultSetup, result }, null, 1)], { type: 'application/json' }), 'thermosolve-workflow.json')}
            >
              <Download />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>
      </header>

      {/* mobile progress */}
      <div className="border-b border-slate-300 bg-white px-4 py-2.5 lg:hidden">
        <div className="mb-2 text-xs text-slate-600">
          <span className="font-medium text-slate-900">
            {current.phase.name} · {current.roman}
          </span>{' '}
          {current.title}
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: LAST }, (_, i) => i + 1).map((id) => (
            <button key={id} type="button" aria-label={`Go to step ${id}`} disabled={locked(id)} onClick={() => go(id)} className={cn('h-1 flex-1 disabled:cursor-not-allowed', id <= step ? 'bg-primary' : 'bg-slate-200')} />
          ))}
        </div>
      </div>

      <div className="mx-auto flex max-w-[1600px]">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white py-3 lg:flex">
          <nav aria-label="Workflow steps" className="px-2">
            {PHASES.map((ph) => {
              const th = PHASE_THEME[ph.key]
              return (
                <div key={ph.name} className="mb-3">
                  <div className="flex items-center gap-2 px-2 pt-2 pb-1.5">
                    <span className="size-2 rounded-full" style={{ background: th.accent }} />
                    <span className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: th.text }}>
                      {ph.name}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">{ph.title}</span>
                  </div>
                  <ol className="space-y-0.5">
                    {ph.steps.map((s) => {
                      const active = s.id === step
                      const done = !active && !!result && (s.id >= 10 || !wf.stale)
                      return (
                        <li key={s.id}>
                          <button
                            type="button"
                            disabled={locked(s.id)}
                            onClick={() => go(s.id)}
                            aria-current={active ? 'step' : undefined}
                            className={cn(
                              'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40',
                              active ? 'font-medium text-slate-900' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                            )}
                            style={active ? { background: th.soft, boxShadow: `inset 3px 0 0 ${th.accent}` } : undefined}
                          >
                            <span
                              className="grid h-5 min-w-7 shrink-0 place-items-center rounded px-1 font-mono text-[10.5px] font-semibold"
                              style={
                                active
                                  ? { background: th.accent, color: 'white' }
                                  : done
                                    ? { background: th.soft, color: th.text, boxShadow: `inset 0 0 0 1px ${th.ring}` }
                                    : { boxShadow: 'inset 0 0 0 1px #cbd5e1', color: '#64748b' }
                              }
                            >
                              {done ? <Check className="size-3" strokeWidth={3} /> : s.roman}
                            </span>
                            <span className="leading-tight">{s.title}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ol>
                </div>
              )
            })}
          </nav>
          <div className="mt-auto border-t border-slate-200 px-4 pt-3 text-[11.5px] leading-relaxed text-slate-500">
            <a href="#classic" className="text-primary hover:underline">
              Classic 1-D solver
            </a>{' '}
            shows every Gauss-elimination row operation for small 1-D problems.
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 pt-5 pb-6 sm:px-6 lg:px-8 lg:pt-7">
          <div className={step >= 10 ? 'mx-auto max-w-[1280px]' : 'mx-auto grid max-w-[1280px] gap-6 2xl:grid-cols-[minmax(0,1fr)_320px]'}>
            <div className="min-w-0">
              {wf.error && (step === 9 || step >= 10) && (
                <Callout tone="error" title="Calculation failed" className="mb-5">
                  {wf.error.error}
                  {wf.error.details.length > 1 && (
                    <ul className="mt-1 list-disc pl-4">
                      {wf.error.details.slice(1).map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  )}
                </Callout>
              )}
              <PhaseRail current={current.phase.key} step={step} hasResult={!!result} onGo={go} />
              {content}

              <div className="mt-6 flex items-center justify-between border-t border-slate-300 pt-4">
                <Button variant="secondary" disabled={step === 1} onClick={() => go(step - 1)}>
                  <ArrowLeft /> Back
                </Button>
                {step < LAST && (
                  <Button onClick={() => go(step + 1)} disabled={locked(step + 1)}>
                    Next <ArrowRight />
                  </Button>
                )}
              </div>
              <Signature name="Shivam" />
            </div>

            {step < 10 && (
              <aside className="hidden 2xl:block">
                <div className="sticky top-21 rounded-md border border-slate-300 bg-white p-4">
                  <div className="mb-2 text-[13px] font-medium text-slate-900">Current set-up</div>
                  <DomainDiagram setup={setup} compact className="w-full" />
                  <dl className="mt-3 space-y-1.5 text-[12.5px]">
                    {(
                      [
                        ['Mode', `${PHYSICS_INFO[setup.preprocessor.problem.physics].short}, ${setup.preprocessor.problem.dimension}-D`],
                        ['Time', setup.preprocessor.problem.time_mode === 'steady' ? 'Steady' : 'Unsteady'],
                        ['Nodes', nodeCount(setup).toLocaleString()],
                        ['Spacing', h.map((v) => fmt(v, 3)).join(', ') + ' m'],
                        ['Method', `${setup.solver.discretization.toUpperCase()} · ${{ gauss_seidel: 'Gauss–Seidel', gauss_elimination: 'Gauss elim.', lu: 'LU' }[setup.solver.linear_solver]}`],
                      ] as [string, string][]
                    ).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2">
                        <dt className="text-slate-500">{k}</dt>
                        <dd className="text-right font-mono text-slate-900">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-3 border-t border-slate-200 pt-1 text-[12px]">
                    <Tex block math={governingLatex(setup.preprocessor.problem.physics, setup.preprocessor.problem.time_mode === 'transient', setup.preprocessor.problem.dimension)} />
                  </div>
                  <Button className="mt-3 w-full" disabled={blocking.length > 0 || wf.status === 'solving'} onClick={run}>
                    {wf.status === 'solving' ? <Loader2 className="animate-spin" /> : <PlayCircle />} Run calculation
                  </Button>
                  {blocking.length > 0 && <p className="mt-2 text-[11px] text-red-600">{blocking[0]}</p>}
                </div>
              </aside>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

/** Pre → Solver → Post progress rail shown above every step. */
function PhaseRail({ current, step, hasResult, onGo }: { current: PhaseKey; step: number; hasResult: boolean; onGo: (s: number) => void }) {
  const order: PhaseKey[] = ['pre', 'solver', 'post']
  const first: Record<PhaseKey, number> = { pre: 1, solver: 6, post: 10 }
  const idx = order.indexOf(current)
  return (
    <div className="mb-6 hidden items-stretch gap-1.5 sm:flex" aria-label="Workflow phases">
      {order.map((k, i) => {
        const th = PHASE_THEME[k]
        const active = k === current
        const done = i < idx || (k !== 'post' && hasResult && step >= 10)
        const disabled = k === 'post' && !hasResult
        return (
          <button
            key={k}
            type="button"
            disabled={disabled}
            onClick={() => onGo(first[k])}
            className="group flex flex-1 items-center gap-2.5 rounded-lg border bg-white px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderColor: active ? th.accent : '#e2e8f0', background: active ? th.soft : undefined }}
          >
            <span
              className="grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold"
              style={done || active ? { background: th.accent, color: 'white' } : { boxShadow: 'inset 0 0 0 1.5px #cbd5e1', color: '#64748b' }}
            >
              {done && !active ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-[10.5px] font-semibold tracking-wide uppercase" style={{ color: active || done ? th.text : '#94a3b8' }}>
                {th.label}
              </span>
              <span className={cn('block truncate text-[13px] font-medium', active ? 'text-slate-900' : 'text-slate-600')}>{th.title}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
