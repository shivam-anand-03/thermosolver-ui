import { CheckCircle2, PlayCircle, XCircle } from 'lucide-react'
import { Tex } from '@/components/math/Tex'
import { Badge } from '@/components/ui/badge'
import { SolvingLoader, SolvingPanel } from '@/components/svg'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Callout } from '@/components/wizard/common'
import { fmt, formatMs, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { BC_INFO, FACE_INFO, LIMITS, PHYSICS_INFO, activeMaterial, facesFor, nodeCount, spacing } from '../defaults'
import type { AdvectionScheme, Discretization, LinearSolver, TimeScheme } from '../types'
import { ChoiceCards, KV, NumField, PhaseStepHeader, Section, Select } from '../ui'
import type { Workflow } from '../useWorkflow'

const PHASE = 'Phase II · Solver'

// ------------------------------------------------------- I. Numerical method
export function MethodStep({ wf }: { wf: Workflow }) {
  const { setup, update } = wf
  const s = setup.solver
  const p = setup.preprocessor
  const conv = p.problem.physics !== 'conduction'
  const transient = p.problem.time_mode === 'transient'
  const mat = activeMaterial(setup)
  const h = spacing(setup)
  const alpha = p.problem.physics === 'convection' ? 0 : mat.k / (mat.rho * mat.cp)
  const vel = [p.velocity.u, p.velocity.v, p.velocity.w].slice(0, p.problem.dimension)
  const fo = alpha * s.time_step * h.reduce((a, x) => a + 1 / (x * x), 0)
  const co = conv ? s.time_step * vel.reduce((a, u, i) => a + Math.abs(u) / h[i], 0) : 0
  const dtMax = Math.min(alpha > 0 ? 1 / (2 * alpha * h.reduce((a, x) => a + 1 / (x * x), 0)) : Infinity, conv && co > 0 ? s.time_step / co : Infinity)

  return (
    <div className="space-y-5">
      <PhaseStepHeader phase={PHASE} roman="I" title="Numerical method: discretisation technique" description="Turn the governing equation into one algebraic equation per node, giving [A]{T} = {B}." />
      <Section title="Discretisation technique">
        <ChoiceCards<Discretization>
          label="Discretisation"
          value={s.discretization}
          onChange={(v) => update((d) => void (d.solver.discretization = v))}
          options={[
            {
              value: 'fdm',
              title: 'Finite difference method',
              description: 'Replace derivatives by Taylor-series differences at grid points. Ghost nodes at flux and convective faces.',
              math: String.raw`\frac{\partial^2 T}{\partial x^2}\Big|_i \approx \frac{T_{i+1}-2T_i+T_{i-1}}{\Delta x^2}`,
            },
            {
              value: 'fvm',
              title: 'Finite volume method',
              description: 'Integrate over control volumes: face fluxes balance generation. Conservative by construction.',
              math: String.raw`\sum_{f} \left(F_f T_f - D_f\,\Delta T_f\right) = (q_0+\beta T_P)\,\Delta V`,
            },
            {
              value: 'fem',
              title: 'Finite element method',
              description: 'Galerkin weak form with linear / bilinear / trilinear elements and Gauss quadrature.',
              math: String.raw`\int_\Omega k\nabla N_i\cdot\nabla T\,d\Omega - \int_\Omega N_i \beta T = \int_\Omega N_i q_0 + \oint N_i q''`,
              disabled: p.problem.physics === 'convection',
              badge: p.problem.physics === 'convection' ? <Badge variant="warning">Not for pure convection</Badge> : undefined,
            },
          ]}
        />
      </Section>

      {conv && (
        <Section title="Convection (advection) term" description={s.discretization === 'fem' ? 'FEM uses the Galerkin form for advection; this choice applies to FDM and FVM.' : 'How T is interpolated where the flow carries it.'}>
          <ChoiceCards<AdvectionScheme>
            label="Advection scheme"
            value={s.advection_scheme}
            onChange={(v) => update((d) => void (d.solver.advection_scheme = v))}
            options={[
              { value: 'upwind', title: 'First-order upwind', description: 'Always bounded and diagonally dominant; adds numerical diffusion.' },
              { value: 'central', title: 'Central differencing', description: 'Second-order; oscillates when cell Pe > 2.', disabled: p.problem.physics === 'convection' },
              { value: 'hybrid', title: 'Hybrid', description: 'Central where cell Pe ≤ 2, upwind elsewhere.', disabled: p.problem.physics === 'convection' },
            ]}
          />
        </Section>
      )}

      {transient && (
        <Section title="Time integration" description="θ-scheme: (C/Δt + θK) Tⁿ⁺¹ = (C/Δt − (1−θ)K) Tⁿ + F">
          <ChoiceCards<TimeScheme>
            label="Time scheme"
            value={s.time_scheme}
            onChange={(v) => update((d) => void (d.solver.time_scheme = v))}
            options={[
              { value: 'implicit', title: 'Fully implicit (θ = 1)', description: 'Unconditionally stable, first order in time.' },
              { value: 'crank_nicolson', title: 'Crank–Nicolson (θ = ½)', description: 'Second order in time; may oscillate for very large Δt.' },
              { value: 'explicit', title: 'Explicit (θ = 0)', description: 'Cheapest per step, but stable only below Δt_max.' },
            ]}
          />
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <NumField label="Time step" symbol="\Delta t" unit="s" min={0} value={s.time_step} onChange={(v) => update((d) => void (d.solver.time_step = v))} />
            <NumField label="Number of steps" integer min={1} value={s.num_steps} onChange={(v) => update((d) => void (d.solver.num_steps = v))} hint={`End time t = ${formatTime(s.time_step * s.num_steps)}`} />
            <KV
              className="self-center"
              rows={[
                ['Fourier (cell) αΔtΣ1/Δ²', fmt(fo, 4)],
                ...(conv ? ([['Courant ΣuΔt/Δ', fmt(co, 4)]] as [string, string][]) : []),
                ['Explicit Δt limit', Number.isFinite(dtMax) ? formatTime(dtMax) : '—'],
              ]}
            />
          </div>
          {s.time_scheme === 'explicit' && s.time_step > dtMax && (
            <Callout tone="error" className="mt-3">
              Δt exceeds the explicit stability limit ({formatTime(dtMax)}). The solution will blow up. Reduce Δt or use the implicit scheme.
            </Callout>
          )}
        </Section>
      )}
    </div>
  )
}

// -------------------------------------------------- II. Matrix inversion
export function MatrixSolverStep({ wf }: { wf: Workflow }) {
  const { setup, update } = wf
  const n = nodeCount(setup)
  const dim = setup.preprocessor.problem.dimension
  const g = setup.preprocessor.geometry
  const band = dim === 1 ? 1 : dim === 2 ? g.nx : g.nx * g.ny
  const transient = setup.preprocessor.problem.time_mode === 'transient'
  return (
    <div className="space-y-5">
      <PhaseStepHeader phase={PHASE} roman="II" title="Matrix inversion technique" description="Solve the assembled linear system [A]{T} = {B} for the nodal temperatures." />
      <Section title="System to solve">
        <div className="text-[15px]">
          <Tex block math={String.raw`[A]\{T\} = \{B\},\qquad [A] \in \mathbb{R}^{${n}\times ${n}}`} />
        </div>
        <p className="text-[12.5px] text-slate-600">
          With natural (x-fastest) node numbering the matrix is banded, with half-bandwidth ≈ <span className="font-mono">{band}</span>. Direct solvers only touch the band, so the cost is about
          n·b², not n³.
        </p>
      </Section>
      <Section title="Technique">
        <ChoiceCards<LinearSolver>
          label="Matrix solver"
          value={setup.solver.linear_solver}
          onChange={(v) => update((d) => void (d.solver.linear_solver = v))}
          options={[
            {
              value: 'gauss_seidel',
              title: 'Gauss–Seidel',
              description: `Iterative; uses the newest values immediately. Optional over-relaxation (SOR). Up to ${LIMITS.iterative.toLocaleString()} unknowns.`,
              math: String.raw`T_i^{(k+1)} = \frac{1}{a_{ii}}\Big(B_i - \sum_{j<i} a_{ij}T_j^{(k+1)} - \sum_{j>i} a_{ij}T_j^{(k)}\Big)`,
            },
            {
              value: 'gauss_elimination',
              title: 'Gauss elimination',
              description: `Direct: forward elimination of [A|B] with partial pivoting, then back substitution. Up to ${LIMITS.direct.toLocaleString()} unknowns.`,
              math: String.raw`R_i \leftarrow R_i - \frac{a_{ik}}{a_{kk}}R_k,\quad T_i = \frac{B_i' - \sum_{j>i}u_{ij}T_j}{u_{ii}}`,
            },
            {
              value: 'lu',
              title: 'LU decomposition',
              description: `Direct: factor PA = LU once, then forward/back substitution per right-hand side. Up to ${LIMITS.direct.toLocaleString()} unknowns.`,
              math: String.raw`PA = LU,\quad L\{y\} = P\{B\},\quad U\{T\} = \{y\}`,
            },
          ]}
        />
        {transient && (
          <Callout className="mt-3">
            Unsteady problems solve one system per time step with the same [A]. LU factorises once and reuses L and U; Gauss elimination repeats the elimination every step; Gauss–Seidel starts each step from the previous
            field.
          </Callout>
        )}
      </Section>
    </div>
  )
}

// ------------------------------------------ III. Convergence & initialisation
export function ConvergenceStep({ wf }: { wf: Workflow }) {
  const { setup, update } = wf
  const s = setup.solver
  const gs = s.linear_solver === 'gauss_seidel'
  const unit = setup.preprocessor.temperature_unit === 'C' ? '°C' : 'K'
  const g = setup.preprocessor.geometry
  const N = Math.max(...[g.nx, g.ny, g.nz].slice(0, setup.preprocessor.problem.dimension))
  const wOpt = 2 / (1 + Math.sin(Math.PI / Math.max(N - 1, 1)))
  return (
    <div className="space-y-5">
      <PhaseStepHeader phase={PHASE} roman="III" title="Convergence criteria and initialisation" description="When the iterative solver stops, and the field it starts from." />
      {!gs && (
        <Callout>
          The selected technique ({s.linear_solver === 'lu' ? 'LU decomposition' : 'Gauss elimination'}) is direct: it finishes in a fixed number of operations and needs no convergence criterion. The residual ‖B − AT‖ is still
          reported in Phase III. These settings take effect if you switch to Gauss–Seidel.
        </Callout>
      )}
      <Section title="Convergence criterion">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select
            label="Criterion"
            value={s.criterion}
            onChange={(v) => update((d) => void (d.solver.criterion = v))}
            options={[
              { value: 'residual', label: 'Relative residual ‖B − AT‖ / ‖B‖' },
              { value: 'max_change', label: 'Max change between iterations' },
            ]}
          />
          <NumField label="Tolerance" symbol="\varepsilon" min={0} value={s.tolerance} onChange={(v) => update((d) => void (d.solver.tolerance = v))} hint="Stop when the criterion < ε" />
          <NumField label="Maximum iterations" integer min={1} max={200000} value={s.max_iterations} onChange={(v) => update((d) => void (d.solver.max_iterations = v))} />
        </div>
      </Section>
      <Section title="Relaxation" description="ω = 1 is plain Gauss–Seidel; 1 < ω < 2 over-relaxes (SOR) and can cut the iterations a lot.">
        <div className="grid items-end gap-4 sm:grid-cols-3">
          <NumField label="Relaxation factor" symbol="\omega" min={0} max={2} value={s.relaxation} disabled={s.auto_relaxation} onChange={(v) => update((d) => void (d.solver.relaxation = v))} />
          <Label className="flex items-center gap-2 pb-1.5 font-normal leading-normal">
            <Switch checked={s.auto_relaxation} onCheckedChange={(v) => update((d) => void (d.solver.auto_relaxation = v))} />
            Optimal ω (model problem): <span className="font-mono">{fmt(wOpt, 4)}</span>
          </Label>
        </div>
      </Section>
      <Section title="Initialisation" description="Starting guess for the iterations (steady problems). Unsteady problems start from the initial condition.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select
            label="Initial guess"
            value={s.initial_guess}
            onChange={(v) => update((d) => void (d.solver.initial_guess = v))}
            options={[
              { value: 'uniform', label: 'Uniform value' },
              { value: 'zero', label: 'Zero field' },
              { value: 'bc_mean', label: 'Mean of boundary temperatures' },
            ]}
          />
          <NumField label="Uniform value" symbol="T^{(0)}" unit={unit} disabled={s.initial_guess !== 'uniform'} value={s.initial_guess_value} onChange={(v) => update((d) => void (d.solver.initial_guess_value = v))} />
        </div>
      </Section>
    </div>
  )
}

// ---------------------------------------------------------- IV. Run
export function RunStep({ wf, onRun }: { wf: Workflow; onRun: () => void }) {
  const { setup, result, status, check, stale } = wf
  const p = setup.preprocessor
  const s = setup.solver
  const unit = p.temperature_unit === 'C' ? '°C' : 'K'
  const g = p.geometry
  const dim = p.problem.dimension
  const blocking = check?.errors ?? []
  const solverLabel = { gauss_seidel: 'Gauss–Seidel', gauss_elimination: 'Gauss elimination', lu: 'LU decomposition' }[s.linear_solver]
  return (
    <div className="space-y-5">
      <PhaseStepHeader phase={PHASE} roman="IV" title="Solve: run the calculation" description="Check the full set-up, then run the preprocessor, solver and post-processor in sequence." />
      <Card className={cn(blocking.length ? 'border-red-200 bg-red-50/60' : 'border-[var(--ph-solver-ring)] bg-gradient-to-r from-[var(--ph-solver-soft)] to-card')}>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
              {blocking.length ? <XCircle className="size-5 text-red-600" /> : <CheckCircle2 className="size-5 text-emerald-600" />}
              {blocking.length ? `${blocking.length} issue${blocking.length > 1 ? 's' : ''} to fix before running` : 'Ready to solve'}
            </div>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              {nodeCount(setup).toLocaleString()} equations · {{ fdm: 'FDM', fvm: 'FVM', fem: 'FEM' }[s.discretization]} · {solverLabel}
              {p.problem.time_mode === 'transient' ? ` · ${s.num_steps} time steps` : ''}
              {check && check.warnings.length > 0 ? ` · ${check.warnings.length} warning${check.warnings.length > 1 ? 's' : ''}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {result && stale && <Badge variant="warning">Inputs changed since the last run</Badge>}
            <span className="hidden text-[12px] text-muted-foreground sm:inline">Ctrl / ⌘ + Enter</span>
            <Button size="lg" onClick={onRun} disabled={status === 'solving' || blocking.length > 0} className="bg-[var(--ph-solver-accent)] hover:bg-[var(--ph-solver-hover)]">
              {status === 'solving' ? <SolvingLoader /> : <PlayCircle />}
              {status === 'solving' ? 'Running…' : 'Run calculation'}
            </Button>
          </div>
        </CardContent>
        {status === 'solving' && (
          <div className="grid place-items-center border-t border-[var(--ph-solver-ring)] px-5 py-5">
            <SolvingPanel label="Assembling and solving the linear system…" />
          </div>
        )}
      </Card>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Section title="Phase I · Preprocessor">
          <KV
            rows={[
              ['Problem', p.problem.title],
              ['Mode', `${PHYSICS_INFO[p.problem.physics].short}, ${p.problem.time_mode === 'steady' ? 'steady' : 'unsteady'}, ${dim}-D`],
              p.problem.source.expression != null
                ? ["q''' = f(x) + βT", `${p.problem.source.expression} + ${fmt(p.problem.source.beta, 4)}·T`]
                : ["q''' = q₀ + βT", `${fmt(p.problem.source.q0, 4)} + ${fmt(p.problem.source.beta, 4)}·T`],
              ['Domain', [g.length, g.width, g.height].slice(0, dim).map((v) => fmt(v, 4)).join(' × ') + ' m'],
              ['Grid', [g.nx, g.ny, g.nz].slice(0, dim).join(' × ') + ` = ${nodeCount(setup).toLocaleString()} nodes`],
              ['Material', `${activeMaterial(setup).name || 'custom'} (k = ${fmt(activeMaterial(setup).k, 4)})`],
              ...facesFor(dim).map((f): [string, string] => {
                const b = p.boundaries[f]
                const v = b.type === 'convection' ? ` h=${fmt(b.h, 3)}, T∞=${fmt(b.t_inf, 4)}` : b.type === 'heat_flux' ? ` ${fmt(b.value, 4)} W/m²` : b.type === 'temperature' || b.type === 'inflow' ? ` ${fmt(b.value, 4)} ${unit}` : ''
                return [`${FACE_INFO[f].name} (${FACE_INFO[f].where})`, BC_INFO[b.type].label + v]
              }),
            ]}
          />
        </Section>
        <Section title="Phase II · Solver">
          <KV
            rows={[
              ['Discretisation', { fdm: 'Finite difference', fvm: 'Finite volume', fem: 'Finite element' }[s.discretization]],
              ...(p.problem.physics !== 'conduction' && s.discretization !== 'fem' ? ([['Advection', s.advection_scheme]] as [string, string][]) : []),
              ...(p.problem.time_mode === 'transient'
                ? ([
                    ['Time scheme', { implicit: 'Fully implicit', crank_nicolson: 'Crank–Nicolson', explicit: 'Explicit' }[s.time_scheme]],
                    ['Δt × steps', `${formatTime(s.time_step)} × ${s.num_steps}`],
                  ] as [string, string][])
                : []),
              ['Matrix solver', solverLabel],
              ...(s.linear_solver === 'gauss_seidel'
                ? ([
                    ['Tolerance / max it.', `${fmt(s.tolerance, 3)} / ${s.max_iterations}`],
                    ['ω', s.auto_relaxation ? 'optimal' : fmt(s.relaxation, 4)],
                    ['Initial guess', s.initial_guess === 'uniform' ? `${fmt(s.initial_guess_value, 4)} ${unit}` : s.initial_guess === 'zero' ? 'zero' : 'mean of BCs'],
                  ] as [string, string][])
                : []),
            ]}
          />
        </Section>
      </div>

      {blocking.length > 0 && (
        <Callout tone="error" title="Fix these before running">
          <ul className="list-disc pl-4">
            {blocking.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </Callout>
      )}
      {check && check.warnings.length > 0 && (
        <Callout tone="warning" title="Warnings">
          <ul className="list-disc pl-4">
            {check.warnings.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </Callout>
      )}


      {result && (
        <Section title="Run log" aside={<span className="font-mono text-[12px] text-slate-500">{formatMs(result.execution_time_ms)}</span>}>
          <ol className="scroll-thin max-h-72 space-y-1 overflow-auto font-mono text-[12px]">
            {result.log.map((l, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-16 shrink-0 text-right text-slate-400">{l.t_ms.toFixed(1)} ms</span>
                <span className="w-28 shrink-0 text-primary-ink">{l.phase}</span>
                <span className="text-slate-800">{l.message}</span>
              </li>
            ))}
          </ol>
        </Section>
      )}
    </div>
  )
}
