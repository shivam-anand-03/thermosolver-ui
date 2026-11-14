import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Download,
  FileJson,
  FileText,
  FlaskConical,
  PlayCircle,
  RotateCcw,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Signature } from '@/components/layout/Signature'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Tex } from '@/components/math/Tex'
import { EmptyState, LogoMark, SolvingLoader, SolvingPanel } from '@/components/svg'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Hint } from '@/components/ui/tooltip'
import { Callout } from '@/components/wizard/common'
import { downloadWorkflowPdf } from '@/lib/api'
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
import { LAST, PHASES } from './phases'
import { WorkflowSidebar } from './sidebar/WorkflowSidebar'


export function WorkflowPage() {
  const wf = useWorkflow()
  const [step, setStep] = useState(1)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
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

  const exportPdf = async () => {
    if (!wf.resultSetup) return
    setExporting(true)
    setExportError(null)
    try {
      downloadBlob(await downloadWorkflowPdf(wf.resultSetup), 'cfd-solver-workflow-report.pdf')
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'Could not create the PDF report.')
    } finally {
      setExporting(false)
    }
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
      <header className="sticky top-0 z-30 px-3 pt-3">
        <div className="mx-auto flex h-14 max-w-[1600px] min-[1900px]:max-w-[1840px] min-[2300px]:max-w-[2240px] items-center gap-3 rounded-full border border-slate-200 bg-white/85 pr-2 pl-4 shadow-[0_12px_32px_-16px_rgba(18,18,18,0.18)] backdrop-blur-md backdrop-saturate-150 sm:pl-5">
          <a href="#" className="flex min-w-0 shrink items-center gap-3" aria-label="CFD Solver home">
            <span className="flex items-center gap-2.5">
              <LogoMark size={34} decorative className="shrink-0" />
              <span className="text-[15px] font-bold tracking-tight whitespace-nowrap text-slate-900 max-[420px]:sr-only sm:text-[19px]">
                CFD <span className="text-[#eb6834]">Solver</span>
              </span>
            </span>
            <span className="hidden border-l border-slate-300 pl-3 text-[13px] leading-tight text-slate-600 md:block">
              Preprocessor → Solver → Post-processor
              <span className="block text-[11.5px] text-slate-400">1-D · 2-D · 3-D conduction and convection</span>
            </span>
          </a>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <a href="#classic" className="hidden text-[12.5px] text-slate-500 underline-offset-4 hover:text-slate-900 hover:underline lg:inline">
              Classic 1-D step-by-step
            </a>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" aria-label="Examples">
                  <BookOpen />
                  <span className="hidden sm:inline">Examples</span>
                  <ChevronDown className="hidden opacity-60 sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="scroll-thin max-h-[75vh] w-[min(92vw,420px)]">
                <DropdownMenuLabel>Worked examples</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {EXAMPLES.map((ex) => (
                  <DropdownMenuItem
                    key={ex.id}
                    onSelect={() => {
                      wf.load(ex.setup)
                      go(9)
                    }}
                    className="items-start gap-3 px-3 py-2"
                  >
                    <FlaskConical className="mt-0.5 size-4 shrink-0 text-primary-ink" />
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-foreground">{ex.title}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{ex.description}</span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        {ex.tags.map((t) => (
                          <Badge key={t} variant="neutral">
                            {t}
                          </Badge>
                        ))}
                      </span>
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Hint label="Reset all inputs">
              <Button
                variant="secondary"
                size="sm"
                aria-label="Reset"
                onClick={() => {
                  wf.load(defaultSetup())
                  go(1)
                }}
              >
                <RotateCcw />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            </Hint>
            <DropdownMenu>
              <Hint label={result ? 'Download a PDF report or the raw data' : 'Run a calculation to export results'}>
                {/* span wrapper so the tooltip still works while the button is disabled */}
                <span tabIndex={result ? undefined : 0} className="inline-flex">
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" disabled={!result || exporting} aria-label="Export">
                      {exporting ? <SolvingLoader /> : <Download />}
                      <span className="hidden sm:inline">{exporting ? 'Preparing PDF…' : 'Export'}</span>
                      {!exporting && <ChevronDown className="hidden opacity-60 sm:block" />}
                    </Button>
                  </DropdownMenuTrigger>
                </span>
              </Hint>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>Export results</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void exportPdf()} className="gap-3 px-3 py-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <span>
                    <span className="block text-[13px] font-medium">PDF report</span>
                    <span className="block text-[11px] text-muted-foreground">All three phases, charts and errors</span>
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => result && downloadBlob(new Blob([JSON.stringify({ setup: wf.resultSetup, result }, null, 1)], { type: 'application/json' }), 'cfd-solver-workflow.json')}
                  className="gap-3 px-3 py-2"
                >
                  <FileJson className="size-4 text-muted-foreground" />
                  <span>
                    <span className="block text-[13px] font-medium">JSON data</span>
                    <span className="block text-[11px] text-muted-foreground">Set-up and full results</span>
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* mobile progress */}
      <div className="mx-3 mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 lg:hidden">
        <div className="mb-2 text-xs text-slate-600">
          <span className="font-medium text-slate-900">
            {current.phase.name} · {current.roman}
          </span>{' '}
          {current.title}
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: LAST }, (_, i) => i + 1).map((id) => (
            <button
              key={id}
              type="button"
              aria-label={`Go to step ${id}`}
              disabled={locked(id)}
              onClick={() => go(id)}
              className={cn('h-1 flex-1 transition-colors duration-300 disabled:cursor-not-allowed', id <= step ? 'bg-primary' : 'bg-slate-200')}
            />
          ))}
        </div>
      </div>

      <div className="mx-auto flex max-w-[1600px] min-[1900px]:max-w-[1840px] min-[2300px]:max-w-[2240px]">
        <WorkflowSidebar step={step} hasResult={!!result} stale={wf.stale} locked={locked} onGo={go} />

        <main className="min-w-0 flex-1 px-4 pt-5 pb-6 sm:px-6 lg:px-8 lg:pt-7">
          <div className={step >= 10 ? 'mx-auto max-w-[1280px] min-[1900px]:max-w-[1520px] min-[2300px]:max-w-[1800px]' : 'mx-auto grid max-w-[1280px] min-[1900px]:max-w-[1520px] min-[2300px]:max-w-[1800px] gap-6 2xl:grid-cols-[minmax(0,1fr)_320px] min-[2300px]:grid-cols-[minmax(0,1fr)_380px]'}>
            <div className="min-w-0">
              {exportError && (
                <Callout tone="error" title="PDF export failed" className="mb-5">
                  {exportError}
                </Callout>
              )}
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
              {/* keyed so each step's content replays the rise-in animation */}
              <div key={step} className="step-enter">
                {step >= 10 && !result ? (
                  wf.status === 'solving' ? (
                    <Card className="grid place-items-center py-12">
                      <SolvingPanel label="Solving…" />
                    </Card>
                  ) : (
                    <EmptyState
                      variant={step === 10 ? 'results' : 'validation'}
                      title={step === 10 ? 'No results yet' : 'Nothing to validate yet'}
                      description="Run the calculation in Phase II to see the temperature field, charts and the comparison with the exact solution."
                      action={
                        <Button onClick={() => go(9)}>
                          <PlayCircle /> Go to Solve
                        </Button>
                      }
                    />
                  )
                ) : (
                  content
                )}
              </div>

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
                <div className="sticky top-[80px] rounded-2xl border border-slate-200 bg-white p-4">
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
                    <Tex
                      block
                      math={governingLatex(
                        setup.preprocessor.problem.physics,
                        setup.preprocessor.problem.time_mode === 'transient',
                        setup.preprocessor.problem.dimension,
                        setup.preprocessor.problem.source.expression != null,
                      )}
                    />
                  </div>
                  <Button className="mt-3 w-full" disabled={blocking.length > 0 || wf.status === 'solving'} onClick={run}>
                    {wf.status === 'solving' ? <SolvingLoader /> : <PlayCircle />} Run calculation
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
            className="group motion-surface flex flex-1 items-center gap-2.5 rounded-lg border bg-white px-3 py-2 text-left hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderColor: active ? th.accent : 'var(--color-slate-200)', background: active ? th.soft : undefined }}
          >
            <span
              className={cn('motion-surface grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold', active && 'radial-pop')}
              style={done || active ? { background: th.accent, color: 'var(--ui-on-accent)' } : { boxShadow: 'inset 0 0 0 1.5px var(--ui-rule)', color: 'var(--ui-muted)' }}
            >
              {done && !active ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-[10.5px] font-semibold tracking-wide uppercase" style={{ color: active || done ? th.text : 'var(--ui-faint)' }}>
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
