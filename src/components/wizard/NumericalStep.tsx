import { Tex } from '@/components/math/Tex'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import { Segmented } from '@/components/ui/segmented'
import type { Simulation } from '@/hooks/useSimulation'
import { formatTime, fmt } from '@/lib/format'
import { TEMP_SYMBOL } from '@/lib/units'
import { cn } from '@/lib/utils'
import type { BoundaryScheme } from '@/types/solver'
import { Callout, Stat, StepHeader } from './common'

const SCHEMES: { id: BoundaryScheme; title: string; text: string; badge?: string }[] = [
  {
    id: 'first_order',
    title: 'First-order one-sided',
    text: '(T₂ − T₁)/Δx for derivative BCs. The method used in the course solutions (MST-1).',
    badge: 'Default',
  },
  {
    id: 'ghost_node',
    title: 'Second-order ghost node',
    text: 'Eliminates a fictitious node using a central difference. Equivalent to a half control-volume energy balance.',
  },
]

export function NumericalStep({ sim }: { sim: Simulation }) {
  const { form, derived, errors } = sim
  const transient = form.problemType === 'transient'
  const unit = TEMP_SYMBOL[form.tempUnit]
  const foOk = Number.isFinite(derived.fo) && derived.fo > 0
  const dtOk = Number.isFinite(derived.dt) && derived.dt > 0
  const hasDerivBc = form.left.type !== 'temperature' || form.right.type !== 'temperature'

  return (
    <div>
      <StepHeader
        step={5}
        title="Numerical method"
        description={
          transient
            ? 'Fully implicit (backward Euler) time marching with central differences in space. Each time step is a linear system solved by Gaussian elimination.'
            : 'Central differences for d²T/dx², assembled into [A]{T} = {b} and solved by Gaussian elimination with partial pivoting.'
        }
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spatial discretisation</CardTitle>
            <CardDescription>Second-order central difference scheme (CDS) at interior nodes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded bg-slate-50 px-3 py-1.5">
              <Tex block math={String.raw`\left.\frac{\partial^2 T}{\partial x^2}\right|_i \approx \frac{T_{i+1} - 2T_i + T_{i-1}}{(\Delta x)^2}`} />
              {transient ? (
                <Tex block math={String.raw`-Fo\,T_{i-1}^{n+1} + (1+2Fo)\,T_i^{n+1} - Fo\,T_{i+1}^{n+1} = T_i^{n}`} />
              ) : (
                <Tex block math={String.raw`-T_{i-1} + 2T_i - T_{i+1} = \frac{q'''}{k}(\Delta x)^2`} />
              )}
            </div>
            <div className="mt-4">
              <Label>Derivative boundary treatment</Label>
              <div className="mt-2 grid gap-2">
                {SCHEMES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => sim.update({ scheme: s.id })}
                    aria-pressed={form.scheme === s.id}
                    className={cn(
                      'rounded border px-3.5 py-2.5 text-left transition-colors',
                      form.scheme === s.id ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500/30' : 'border-slate-200 hover:border-slate-300',
                    )}
                  >
                    <div className="flex items-center gap-2 text-[13px] font-medium text-slate-900">
                      {s.title}
                      {s.badge && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">{s.badge}</span>}
                    </div>
                    <div className="mt-0.5 text-xs leading-relaxed text-slate-500">{s.text}</div>
                  </button>
                ))}
              </div>
              {!hasDerivBc && <p className="mt-2 text-xs text-slate-500">Both boundaries are Dirichlet, so this choice has no effect.</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Linear solver</CardTitle>
            <CardDescription>Hand-written; no library solve() call</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2.5 text-[13px] text-slate-700">
              {[
                ['Augment', 'Form [A | b].'],
                ['Pivot', 'Partial pivoting: pick the largest |aᵢₖ| on/below the diagonal; zero and near-zero pivots are detected.'],
                ['Forward elimination', 'Rᵢ → Rᵢ − (aᵢₖ/aₖₖ)·Rₖ to zero the entries below each pivot.'],
                ['Backward substitution', 'xₙ = bₙ/aₙₙ, then xᵢ = (bᵢ − Σ aᵢⱼxⱼ)/aᵢᵢ upward.'],
                ['Validate', 'Residual r = A·T − b and boundary-condition errors are checked.'],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">{i + 1}</span>
                  <span>
                    <span className="font-medium text-slate-900">{t}.</span> {d}
                  </span>
                </li>
              ))}
            </ol>
            {transient && (
              <p className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
                [A] is identical at every time step, so its elimination multipliers are computed once and re-applied to each new right-hand side (which holds Tⁿ).
              </p>
            )}
          </CardContent>
        </Card>

        {transient && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Initial condition</CardTitle>
                <CardDescription>T(x, 0) at every node</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Segmented
                  ariaLabel="Initial condition type"
                  value={form.initialType}
                  onChange={(v) => sim.update({ initialType: v })}
                  options={[
                    { value: 'uniform', label: 'Uniform' },
                    { value: 'custom', label: 'Custom nodal values' },
                  ]}
                />
                {form.initialType === 'uniform' ? (
                  <Field id="t0" label="Initial temperature" symbol="T(x,0)" unit={unit} value={form.initialValue} onChange={(v) => sim.update({ initialValue: v })} error={errors.initialValue} />
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="t0-list">
                      T₁⁰ … T<sub>{derived.N}</sub>⁰ [{unit}], separated by commas or spaces
                    </Label>
                    <textarea
                      id="t0-list"
                      rows={3}
                      value={form.initialValues}
                      aria-invalid={!!errors.initialValues}
                      onChange={(e) => sim.update({ initialValues: e.target.value })}
                      placeholder={Array.from({ length: Math.min(derived.N || 0, 8) }, () => form.initialValue || '30').join(', ')}
                      className="rounded-md border border-slate-300 px-3 py-2 font-mono text-[13px] focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:outline-none aria-invalid:border-red-400"
                    />
                    {errors.initialValues && <p className="text-xs text-red-600">{errors.initialValues}</p>}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Time stepping</CardTitle>
                <CardDescription>Choose Δt directly, or let it follow from a Fourier number</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Segmented
                  ariaLabel="Time step mode"
                  value={form.timeStepMode}
                  onChange={(v) => sim.update({ timeStepMode: v })}
                  options={[
                    { value: 'fourier', label: 'Automatic (from Fo)' },
                    { value: 'manual', label: 'Manual Δt' },
                  ]}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  {form.timeStepMode === 'fourier' ? (
                    <Field id="fo" label="Fourier number" symbol="Fo" value={form.fourier} onChange={(v) => sim.update({ fourier: v })} error={errors.fourier} />
                  ) : (
                    <Field id="dt" label="Time step" symbol="Δt" unit="s" value={form.timeStep} onChange={(v) => sim.update({ timeStep: v })} error={errors.timeStep} />
                  )}
                  {form.runMode === 'steps' ? (
                    <Field id="nsteps" label="Number of time steps" inputMode="numeric" value={form.numSteps} onChange={(v) => sim.update({ numSteps: v })} error={errors.numSteps ?? errors.steps} />
                  ) : (
                    <Field id="tend" label="Final simulation time" unit="s" value={form.finalTime} onChange={(v) => sim.update({ finalTime: v })} error={errors.finalTime ?? errors.steps} />
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Segmented
                    size="sm"
                    ariaLabel="Run length"
                    value={form.runMode}
                    onChange={(v) => sim.update({ runMode: v })}
                    options={[
                      { value: 'steps', label: 'By steps' },
                      { value: 'time', label: 'By end time' },
                    ]}
                  />
                  <Field
                    id="oi"
                    className="w-44"
                    label="Store every k-th step"
                    inputMode="numeric"
                    value={form.outputInterval}
                    onChange={(v) => sim.update({ outputInterval: v })}
                    error={errors.outputInterval}
                    hint="blank = automatic"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Stat label="Fo" value={foOk ? fmt(derived.fo, 4) : '—'} accent />
                  <Stat label="Δt" value={dtOk ? formatTime(derived.dt) : '—'} />
                  <Stat label="t_end" value={dtOk && derived.steps > 0 ? formatTime(derived.steps * derived.dt) : '—'} sub={Number.isFinite(derived.steps) ? `${derived.steps} steps` : undefined} />
                </div>
                <div className="rounded bg-slate-50 px-3 py-1">
                  <Tex block math={String.raw`Fo = \frac{\alpha\,\Delta t}{(\Delta x)^2}\quad\Rightarrow\quad \Delta t = \frac{Fo\,(\Delta x)^2}{\alpha}`} />
                </div>
                {foOk && derived.fo > 0.5 && (
                  <Callout tone={derived.fo > 10 ? 'warning' : 'info'}>
                    Fo = {fmt(derived.fo, 4)} &gt; 0.5 would be unstable for an explicit scheme, but the <b>fully implicit method is unconditionally stable</b>.
                    {derived.fo > 10 && ' Such a large Fo can smear fast early-time transients. Reduce Δt for accuracy.'}
                  </Callout>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
