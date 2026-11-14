import { ArrowLeft, ArrowRight, BarChart3, Box, Calculator, Layers, Loader2, PlayCircle, Ruler, Thermometer } from 'lucide-react'
import { EmptyState, SolvingLoader, SolvingPanel } from '@/components/svg'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { SlabDiagram } from '@/components/diagram/SlabDiagram'
import { Header } from '@/components/layout/Header'
import { SidebarShell } from '@/components/layout/SidebarShell'
import { Signature } from '@/components/layout/Signature'
import { MobileProgress, Stepper, type StepDef } from '@/components/layout/Stepper'
import { Tex } from '@/components/math/Tex'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { BoundaryStep } from '@/components/wizard/BoundaryStep'
import { Callout } from '@/components/wizard/common'
import { GeometryStep } from '@/components/wizard/GeometryStep'
import { MaterialStep } from '@/components/wizard/MaterialStep'
import { NumericalStep } from '@/components/wizard/NumericalStep'
import { ProblemStep } from '@/components/wizard/ProblemStep'
import { ReviewStep } from '@/components/wizard/ReviewStep'
import { useSidebarCollapsed } from '@/hooks/useSidebarCollapsed'
import { useSimulation } from '@/hooks/useSimulation'
import { downloadPdfReport } from '@/lib/api'
import { downloadBlob, exportCsv, exportJson } from '@/lib/export'
import { num } from '@/lib/form'
import { fmt, formatTime } from '@/lib/format'
import { fromMetres } from '@/lib/units'
import type { Example } from '@/types/solver'

const ResultsView = lazy(() => import('@/components/results/ResultsView').then((m) => ({ default: m.ResultsView })))

const STEPS: StepDef[] = [
  { id: 1, title: 'Problem type', subtitle: 'Steady or transient', icon: Box },
  { id: 2, title: 'Geometry and mesh', subtitle: 'L, N, Δx', icon: Ruler },
  { id: 3, title: 'Material', subtitle: "k, q''', ρ, Cp", icon: Layers },
  { id: 4, title: 'Boundary conditions', subtitle: 'x = 0 and x = L', icon: Thermometer },
  { id: 5, title: 'Numerical method', subtitle: 'Scheme and time step', icon: Calculator },
  { id: 6, title: 'Review and solve', subtitle: 'Check inputs, run', icon: PlayCircle },
  { id: 7, title: 'Results', subtitle: 'Tables, plots, algorithm', icon: BarChart3 },
]

const STEP_FIELDS: Record<number, string[]> = {
  2: ['length', 'nodes', 'dx'],
  3: ['k', 'qgen', 'rho', 'cp'],
  4: ['left', 'right', 'bcCombo'],
  5: ['fourier', 'timeStep', 'numSteps', 'finalTime', 'steps', 'outputInterval', 'initialValue', 'initialValues'],
}

export function SolverPage() {
  const sim = useSimulation()
  const sidebar = useSidebarCollapsed()
  const [step, setStep] = useState(1)
  const [maxVisited, setMaxVisited] = useState(1)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const mainRef = useRef<HTMLDivElement>(null)
  const { form, derived, result } = sim

  const go = (s: number) => {
    setStep(s)
    setMaxVisited((m) => Math.max(m, s))
    mainRef.current?.scrollTo({ top: 0 })
    window.scrollTo({ top: 0 })
  }

  const runSolver = async () => {
    const res = await sim.run()
    if (res) go(7)
  }

  const loadExample = (ex: Example) => {
    sim.loadExample(ex)
    setMaxVisited(6)
    go(6)
  }

  // keyboard shortcut: Ctrl/⌘ + Enter runs the solver
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') void runSolver()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const onExport = async (kind: 'csv' | 'json' | 'pdf') => {
    if (!result || !sim.resultRequest) return
    setExportError(null)
    if (kind === 'csv') return exportCsv(result)
    if (kind === 'json') return exportJson(sim.resultRequest, result)
    setExporting(true)
    try {
      const blob = await downloadPdfReport(result.problem_type, sim.resultRequest)
      downloadBlob(blob, `cfd-solver-${result.problem_type}-report.pdf`)
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'PDF export failed.')
    } finally {
      setExporting(false)
    }
  }

  const stepHasError = (id: number) => (STEP_FIELDS[id] ?? []).some((k) => sim.errors[k]) && maxVisited >= id
  const isLocked = (id: number) => id === 7 && !result
  const ok = Number.isFinite(derived.dx) && derived.N >= 2

  const content = (() => {
    switch (step) {
      case 1:
        return <ProblemStep sim={sim} />
      case 2:
        return <GeometryStep sim={sim} />
      case 3:
        return <MaterialStep sim={sim} />
      case 4:
        return <BoundaryStep sim={sim} />
      case 5:
        return <NumericalStep sim={sim} />
      case 6:
        return <ReviewStep sim={sim} onEdit={() => go(2)} onRun={runSolver} />
      default:
        return result ? (
          <Suspense fallback={<div className="grid place-items-center py-20 text-muted-foreground"><Loader2 className="animate-spin" /></div>}>
          <ResultsView
            result={result}
            example={sim.example}
            refreshing={sim.status === 'solving' || (sim.stale && sim.liveUpdate && sim.blocking.length === 0)}
            stale={sim.stale}
            liveUpdate={sim.liveUpdate}
            onLiveUpdate={sim.setLiveUpdate}
          />
          </Suspense>
        ) : null
    }
  })()

  return (
    <div className="min-h-screen">
      <Header
        examples={sim.examples}
        onLoadExample={loadExample}
        onReset={() => {
          sim.reset()
          setMaxVisited(1)
          go(1)
        }}
        canExport={!!result}
        onExport={onExport}
        exporting={exporting}
      />
      <MobileProgress steps={STEPS} current={step} onSelect={go} isLocked={isLocked} />

      <div className="mx-auto flex max-w-[1600px] min-[1900px]:max-w-[1840px] min-[2300px]:max-w-[2240px]">
        <SidebarShell
          collapsed={sidebar.collapsed}
          onToggle={sidebar.toggle}
          label={form.problemType === 'steady' ? 'Steady-state problem' : 'Transient problem'}
          className="bg-card py-3 shadow-[var(--ui-card-shadow)]"
        >
          <Stepper steps={STEPS} current={step} onSelect={go} isComplete={(id) => id < maxVisited || (id === 7 && !!result)} hasError={stepHasError} isLocked={isLocked} collapsed={sidebar.collapsed} />
          {!sidebar.collapsed && (
            <p className="mt-auto border-t px-4 pt-3 text-[11.5px] leading-relaxed text-muted-foreground">
              Central differences in space, fully implicit in time. Linear systems are solved by Gaussian elimination with partial pivoting.
            </p>
          )}
        </SidebarShell>

        <main ref={mainRef} className="min-w-0 flex-1 px-4 pt-5 pb-6 sm:px-6 lg:px-8 lg:pt-7">
          <div className={step === 7 ? 'mx-auto max-w-[1280px] min-[1900px]:max-w-[1520px] min-[2300px]:max-w-[1800px]' : 'mx-auto grid max-w-[1280px] min-[1900px]:max-w-[1520px] min-[2300px]:max-w-[1800px] gap-6 2xl:grid-cols-[minmax(0,1fr)_320px] min-[2300px]:grid-cols-[minmax(0,1fr)_380px]'}>
            <div className="min-w-0">
              {sim.error && (step === 6 || step === 7) && (
                <Callout tone="error" title="Solver error" className="mb-5">
                  {sim.error.error}
                  {sim.error.details.length > 1 && (
                    <ul className="mt-1 list-disc pl-4">
                      {sim.error.details.slice(1).map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  )}
                </Callout>
              )}
              {exportError && (
                <Callout tone="error" className="mb-5">
                  {exportError}
                </Callout>
              )}
              {sim.example?.is_reference && step !== 7 && (
                <Callout className="mb-5" title={`Reference example: ${sim.example.title}`}>
                  {sim.example.description} The solver computes every value itself. The printed reference is only shown next to it for comparison.
                </Callout>
              )}
              {content}

              {step < 7 && (
                <div className="mt-6 flex items-center justify-between border-t border-slate-300 pt-4">
                  <Button variant="secondary" disabled={step === 1} onClick={() => go(step - 1)}>
                    <ArrowLeft /> Back
                  </Button>
                  {step < 6 ? (
                    <Button onClick={() => go(step + 1)}>
                      Next <ArrowRight />
                    </Button>
                  ) : (
                    <Button variant="ghost" disabled={!result} onClick={() => go(7)}>
                      View results <ArrowRight />
                    </Button>
                  )}
                </div>
              )}
              <Signature name="Shivam" />
              {step === 7 && !result && (
                <div className="grid place-items-center py-12">
                  {sim.status === 'solving' ? <SolvingPanel label="Solving…" /> : <EmptyState variant="results" title="No results yet" description="Run the solver from the Review step to see the temperatures, matrices and every elimination step." className="w-full" />}
                </div>
              )}
            </div>

            {/* live preview (wide screens) */}
            {step < 7 && (
              <aside className="hidden 2xl:block">
                <Card className="sticky top-[80px] p-4">
                  <CardTitle className="mb-2 text-[13px] font-medium">Current setup</CardTitle>
                  <SlabDiagram
                    className="w-full"
                    nodes={derived.N}
                    lengthM={ok ? derived.L : 1}
                    lengthUnit={form.lengthUnit}
                    left={{ type: form.left.type, value: num(form.left.value) }}
                    right={{ type: form.right.type, value: num(form.right.value) }}
                    tempUnit={form.tempUnit}
                    temperatures={result && result.nodes.length === derived.N && !sim.stale ? result.solution : null}
                  />
                  <dl className="mt-3 space-y-1.5 text-[12.5px]">
                    {(
                      [
                        ['Mesh', ok ? `${derived.N} nodes · ${derived.N - 1} intervals` : '—'],
                        ['Δx', ok ? `${fmt(fromMetres(derived.dx, form.lengthUnit), 5)} ${form.lengthUnit}` : '—'],
                        ['System', ok ? `${derived.N} × ${derived.N} tridiagonal` : '—'],
                        ...(form.problemType === 'transient'
                          ? ([
                              ['α', `${fmt(derived.alpha, 4)} m²/s`],
                              ['Fo', fmt(derived.fo, 4)],
                              ['Δt', Number.isFinite(derived.dt) ? formatTime(derived.dt) : '—'],
                            ] as [string, string][])
                          : []),
                      ] as [string, string][]
                    ).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">{k}</dt>
                        <dd className="text-right font-mono text-foreground">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-3 border-t pt-1 text-[13px]">
                    <Tex
                      block
                      math={form.problemType === 'steady' ? String.raw`\frac{d^2T}{dx^2} + \frac{q'''}{k} = 0` : String.raw`\frac{\partial T}{\partial t} = \alpha \frac{\partial^2 T}{\partial x^2}`}
                    />
                  </div>
                  <Button className="mt-3 w-full" disabled={sim.blocking.length > 0 || sim.status === 'solving'} onClick={runSolver}>
                    {sim.status === 'solving' ? <SolvingLoader /> : <PlayCircle />} Solve
                  </Button>
                  {sim.blocking.length > 0 && <p className="mt-2 text-[11px] text-destructive">{sim.blocking[0]}</p>}
                </Card>
              </aside>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
