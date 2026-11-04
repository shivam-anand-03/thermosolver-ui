import { CheckCircle2, ChevronLeft, ChevronRight, Download, FlaskConical, TriangleAlert, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Tex } from '@/components/math/Tex'
import { Legend } from '@/components/results/charts'
import { Badge } from '@/components/ui/badge'
import { SolvingLoader } from '@/components/svg'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Callout } from '@/components/wizard/common'
import { downloadBlob } from '@/lib/export'
import { cell, fmt, formatMs, formatTime } from '@/lib/format'
import { SERIES } from '@/lib/palette'
import { cn } from '@/lib/utils'
import { XYChart, SparsityPattern } from '../charts'
import { FieldHeatmap } from '../FieldHeatmap'
import type { WorkflowResult } from '../types'
import { PhaseStepHeader, Section, Tile } from '../ui'
import type { Workflow } from '../useWorkflow'

const PHASE = 'Phase III · Post-processing'
const NUM = SERIES[0]
const EXACT = SERIES[1]

// ------------------------------------------------------------------ helpers
function gridOf(r: WorkflowResult) {
  const g = r.phase1.grid
  const [nx, ny = 1, nz = 1] = g.counts
  return { ...g, nx, ny, nz, dim: g.counts.length }
}

const sliceXY = (v: number[], nx: number, ny: number, k: number) => v.slice(k * nx * ny, (k + 1) * nx * ny)
const lineX = (v: number[], nx: number, ny: number, j: number, k: number) => v.slice((k * ny + j) * nx, (k * ny + j + 1) * nx)

function useTimeIndex(r: WorkflowResult) {
  const count = r.phase3.snapshots?.length ?? 0
  const [idx, setIdx] = useState(count - 1)
  const i = Math.min(Math.max(0, idx), Math.max(0, count - 1))
  const field = r.phase3.snapshots ? r.phase3.snapshots[i] : r.phase3.temperature
  const exact = r.phase3.snapshots_exact ? r.phase3.snapshots_exact[i] : r.phase3.exact
  const time = r.phase3.times ? r.phase3.times[i] : null
  return { i, setIdx, count, field, exact, time }
}

function unitOf(wf: Workflow) {
  return (wf.resultSetup ?? wf.setup).preprocessor.temperature_unit === 'C' ? '°C' : 'K'
}

function NoResult() {
  return <Callout>Run the calculation in Phase II · IV first.</Callout>
}

// ------------------------------------------------------------------- I. Results
export function ResultsStep({ wf }: { wf: Workflow }) {
  const r = wf.result
  if (!r) return <NoResult />
  return <Results r={r} unit={unitOf(wf)} stale={wf.stale} />
}

function Results({ r, unit, stale }: { r: WorkflowResult; unit: string; stale: boolean }) {
  const g = gridOf(r)
  const t = useTimeIndex(r)
  const transient = r.phase1.time_mode === 'transient'
  const conv = r.phase2.convergence
  const [kSlice, setK] = useState(Math.floor(g.nz / 2))
  const [jLine, setJ] = useState(Math.floor(g.ny / 2))
  const allVals = r.phase3.snapshots ? r.phase3.snapshots.flat() : r.phase3.temperature
  const domain = useMemo<[number, number]>(() => {
    let mn = Infinity
    let mx = -Infinity
    for (const v of allVals) {
      if (v < mn) mn = v
      if (v > mx) mx = v
    }
    return mn === mx ? [mn - 1, mx + 1] : [mn, mx]
  }, [allVals])

  const xs = g.axis_coords[0]
  const lineNum = g.dim === 1 ? t.field : lineX(t.field, g.nx, g.ny, Math.min(jLine, g.ny - 1), g.dim === 3 ? kSlice : 0)
  const lineExact = t.exact ? (g.dim === 1 ? t.exact : lineX(t.exact, g.nx, g.ny, Math.min(jLine, g.ny - 1), g.dim === 3 ? kSlice : 0)) : null
  const profileData = xs.map((x, i) => ({ x, num: lineNum[i], ...(lineExact ? { exact: lineExact[i] } : {}) }))
  const profileSeries = [{ key: 'num', name: 'Numerical', color: NUM, markers: true }, ...(lineExact ? [{ key: 'exact', name: 'Exact', color: EXACT, dashed: true }] : [])]

  return (
    <div className="space-y-5">
      <PhaseStepHeader phase={PHASE} roman="I" title="Results" description={`${r.title}: the computed temperature field, node by node, next to the exact solution where one exists.`} />
      {stale && <Callout tone="warning">The inputs have changed since this run. Re-run to update the results.</Callout>}
      {r.warnings.length > 0 && (
        <Callout tone="warning" title="Solver notes">
          <ul className="list-disc pl-4">
            {r.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </Callout>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Tile label="T min" value={`${fmt(r.phase3.stats.min, 5)} ${unit}`} tone="cold" />
        <Tile label="T max" value={`${fmt(r.phase3.stats.max, 5)} ${unit}`} tone="hot" />
        <Tile label="T mean" value={`${fmt(r.phase3.stats.mean, 5)} ${unit}`} />
        <Tile label="Unknowns" value={g.n.toLocaleString()} sub={`${r.phase2.discretization.toUpperCase()} · ${g.kind === 'cell' ? 'cell-centred' : 'vertex'} grid`} />
        <Tile label={r.phase2.linear_solver_label} value={conv.iterations !== null ? `${conv.iterations.toLocaleString()} it.` : 'direct'} sub={conv.omega ? `ω = ${fmt(conv.omega, 4)}` : `${conv.row_swaps} row swaps`} />
        <Tile label="Wall time" value={formatMs(r.execution_time_ms)} sub={`solve ${formatMs(conv.solve_ms + conv.factor_ms)}`} />
      </div>

      {transient && t.count > 1 && (
        <Section title="Time" aside={<span className="font-mono text-[13px] text-slate-700">t = {formatTime(t.time ?? 0)}</span>}>
          <Slider min={0} max={t.count - 1} step={1} value={[t.i]} onValueChange={([v]) => t.setIdx(v)} aria-label="Time snapshot" />
          <div className="mt-1 flex justify-between text-[11px] text-slate-500">
            <span>t = 0</span>
            <span>
              snapshot {t.i + 1} / {t.count}
            </span>
            <span>t = {formatTime(r.phase3.times?.[t.count - 1] ?? 0)}</span>
          </div>
        </Section>
      )}

      <div className={cn('grid grid-cols-1 gap-5', g.dim > 1 && g.lengths[1] / g.lengths[0] >= 0.5 && 'xl:grid-cols-2')}>
      {g.dim > 1 && (
        <Section
          title={g.dim === 3 ? `Temperature field, slice z = ${fmt(g.axis_coords[2][kSlice], 4)} m` : 'Temperature field'}
          description="Hover for nodal values. Light → dark orange = cold → hot."
        >
          {g.dim === 3 && (
            <div className="mb-3 max-w-md">
              <div className="mb-1 text-[12px] text-slate-600">
                Slice index k = {kSlice + 1} / {g.nz}
              </div>
              <Slider min={0} max={g.nz - 1} step={1} value={[kSlice]} onValueChange={([v]) => setK(v)} aria-label="z slice" />
            </div>
          )}
          <FieldHeatmap xs={xs} ys={g.axis_coords[1]} Lx={g.lengths[0]} Ly={g.lengths[1]} values={sliceXY(t.field, g.nx, g.ny, g.dim === 3 ? kSlice : 0)} unit={unit} domain={domain} maxHeight={380} />
        </Section>
      )}

      <Section
        title={g.dim === 1 ? 'Temperature profile' : `Profile along x at y = ${fmt(g.axis_coords[1][Math.min(jLine, g.ny - 1)], 4)} m`}
        aside={profileSeries.length > 1 ? <Legend items={profileSeries.map((s) => ({ name: s.name, color: s.color, dashed: s.dashed }))} /> : undefined}
      >
        {g.dim > 1 && (
          <div className="mb-3 max-w-md">
            <div className="mb-1 text-[12px] text-slate-600">
              Row j = {jLine + 1} / {g.ny}
            </div>
            <Slider min={0} max={g.ny - 1} step={1} value={[Math.min(jLine, g.ny - 1)]} onValueChange={([v]) => setJ(v)} aria-label="y row" />
          </div>
        )}
        <XYChart data={profileData} xKey="x" series={profileSeries} xLabel="x [m]" yLabel={`T [${unit}]`} height={g.dim > 1 ? 340 : 300} />
      </Section>
      </div>

      {transient && r.phase3.monitor && (
        <Section
          title={`History at node ${r.phase3.monitor.node} (${r.phase3.monitor.coords.map((c) => fmt(c, 3)).join(', ')} m)`}
          aside={r.phase3.monitor.exact ? <Legend items={[{ name: 'Numerical', color: NUM }, { name: 'Exact', color: EXACT, dashed: true }]} /> : undefined}
        >
          <XYChart
            data={r.phase3.monitor.times.map((tt, i) => ({ t: tt, num: r.phase3.monitor!.values[i], ...(r.phase3.monitor!.exact ? { exact: r.phase3.monitor!.exact[i] } : {}) }))}
            xKey="t"
            xLabel="t [s]"
            yLabel={`T [${unit}]`}
            series={[{ key: 'num', name: 'Numerical', color: NUM }, ...(r.phase3.monitor.exact ? [{ key: 'exact', name: 'Exact', color: EXACT, dashed: true }] : [])]}
          />
        </Section>
      )}

      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table">Node table</TabsTrigger>
          <TabsTrigger value="matrix">Matrix [A]{'{T}'} = {'{B}'}</TabsTrigger>
        </TabsList>
        <TabsContent value="table">
          <NodeTable r={r} field={t.field} exact={t.exact} unit={unit} time={t.time} />
        </TabsContent>
        <TabsContent value="matrix">
          <MatrixView r={r} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function NodeTable({ r, field, exact, unit, time }: { r: WorkflowResult; field: number[]; exact: number[] | null; unit: string; time: number | null }) {
  const g = gridOf(r)
  const PAGE = 50
  const [page, setPage] = useState(0)
  const pages = Math.ceil(field.length / PAGE)
  const fixed = useMemo(() => new Set(r.phase3.fixed_nodes ?? []), [r])
  const coordsOf = (p: number): number[] => {
    const c = r.phase3.coords[p]
    return typeof c === 'number' ? [c] : c
  }
  const axes = ['x', 'y', 'z'].slice(0, g.dim)

  const csv = () => {
    const head = ['node', ...axes.map((a) => `${a}_m`), `T_numerical_${unit}`, ...(exact ? [`T_exact_${unit}`, 'abs_error'] : [])]
    const lines = [head.join(',')]
    for (let p = 0; p < field.length; p++) {
      const row = [p + 1, ...coordsOf(p), field[p], ...(exact ? [exact[p], Math.abs(field[p] - exact[p])] : [])]
      lines.push(row.join(','))
    }
    downloadBlob(new Blob([lines.join('\n')], { type: 'text/csv' }), `cfd-solver-results${time !== null ? `-t${time}` : ''}.csv`)
  }

  const start = Math.min(page, pages - 1) * PAGE
  const rows = Array.from({ length: Math.min(PAGE, field.length - start) }, (_, k) => start + k)
  return (
    <Section
      title="Node | x | T_numerical | T_exact"
      description={time !== null ? `At t = ${formatTime(time)}` : undefined}
      aside={
        <Button variant="secondary" size="sm" onClick={csv}>
          <Download /> CSV
        </Button>
      }
    >
      <Table className="tabular">
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead className="pr-3 pl-2">Node</TableHead>
            {g.dim > 1 && <TableHead className="pr-3 pl-0">(i, j{g.dim > 2 ? ', k' : ''})</TableHead>}
            {axes.map((a) => (
              <TableHead key={a} className="pr-3 pl-0 text-right">
                {a} [m]
              </TableHead>
            ))}
            <TableHead className="pr-3 pl-0 text-right">T numerical [{unit}]</TableHead>
            {exact && <TableHead className="pr-3 pl-0 text-right">T exact [{unit}]</TableHead>}
            {exact && <TableHead className="px-0 text-right">|error|</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody className="font-mono">
          {rows.map((p) => {
            const ijk = [p % g.nx, Math.floor(p / g.nx) % g.ny, Math.floor(p / (g.nx * g.ny))].slice(0, g.dim)
            return (
              <TableRow key={p}>
                <TableCell className="py-1 pr-3 pl-2 text-muted-foreground">
                  {p + 1}
                  {fixed.has(p) && (
                    <Badge variant="neutral" className="ml-1.5 font-sans">
                      fixed
                    </Badge>
                  )}
                </TableCell>
                {g.dim > 1 && <TableCell className="py-1 pr-3 pl-0 text-muted-foreground">({ijk.map((v) => v + 1).join(', ')})</TableCell>}
                {coordsOf(p).map((c, i) => (
                  <TableCell key={i} className="py-1 pr-3 pl-0 text-right text-slate-700">
                    {fmt(c, 5)}
                  </TableCell>
                ))}
                <TableCell className="py-1 pr-3 pl-0 text-right text-foreground">{field[p].toFixed(5)}</TableCell>
                {exact && <TableCell className="py-1 pr-3 pl-0 text-right text-slate-700">{exact[p].toFixed(5)}</TableCell>}
                {exact && <TableCell className="px-0 py-1 text-right text-muted-foreground">{fmt(Math.abs(field[p] - exact[p]), 3)}</TableCell>}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      {pages > 1 && (
        <div className="mt-3 flex items-center justify-end gap-2 text-[12px] text-slate-600">
          <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage((x) => x - 1)} aria-label="Previous page">
            <ChevronLeft />
          </Button>
          Nodes {start + 1}–{start + rows.length} of {field.length.toLocaleString()}
          <Button variant="secondary" size="sm" disabled={page >= pages - 1} onClick={() => setPage((x) => x + 1)} aria-label="Next page">
            <ChevronRight />
          </Button>
        </div>
      )}
    </Section>
  )
}

function DenseMatrix({ M, rhs, title }: { M: number[][]; rhs?: number[] | null; title: string }) {
  return (
    <div className="min-w-0">
      <div className="mb-1 text-[12.5px] font-medium text-slate-700">{title}</div>
      <Table containerClassName="overflow-auto rounded-md border" className="w-auto font-mono text-[11px] tabular">
        <TableBody>
          {M.map((row, i) => (
            <TableRow key={i} className="border-0 hover:bg-transparent">
              {row.map((v, j) => (
                <TableCell key={j} className={cn('px-1.5 py-0.5 text-right', v === 0 ? 'text-slate-300' : i === j ? 'bg-primary-soft font-medium text-primary-ink' : 'text-slate-800')}>
                  {cell(v, 4)}
                </TableCell>
              ))}
              {rhs && <TableCell className="border-l border-input py-0.5 text-right text-foreground">{cell(rhs[i], 5)}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function MatrixView({ r }: { r: WorkflowResult }) {
  const m = r.phase2.matrix
  const eq = r.phase2.sample_equation
  return (
    <div className="space-y-5">
      <Section title="Discretised equation at a representative node" description={eq ? `Node ${eq.node}, (i, j, k) = (${eq.ijk.join(', ')}). P is the node; W/E, S/N, B/T are its x, y, z neighbours.` : undefined}>
        {eq ? <Tex block math={eq.latex} /> : <p className="text-[13px] text-slate-500">All nodes are fixed.</p>}
        <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-[12.5px] sm:grid-cols-4">
          {[
            ['Size', `${m.n} × ${m.n}`],
            ['Non-zeros', `${m.nnz.toLocaleString()} (${fmt(m.fill_pct, 3)} %)`],
            ['Bandwidth (lower / upper)', m.bandwidth],
            ['Symmetric', m.symmetric === null ? '—' : m.symmetric ? 'yes' : 'no'],
            ['Diagonally dominant', m.diagonally_dominant ? 'yes' : 'no'],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-slate-500">{k}</div>
              <div className="font-mono text-slate-900">{v}</div>
            </div>
          ))}
        </div>
      </Section>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[auto_minmax(0,1fr)]">
        {m.pattern && (
          <Section title="Sparsity pattern">
            <SparsityPattern n={m.n} pattern={m.pattern} />
          </Section>
        )}
        {m.dense && (
          <Section title="[A | B]" description={r.phase1.time_mode === 'transient' ? 'Right-hand side of the first time step.' : undefined}>
            <DenseMatrix M={m.dense} rhs={m.rhs} title="" />
          </Section>
        )}
      </div>
      {m.lu && (
        <Section title="LU decomposition, PA = LU" description={`Row order P = [${m.lu.P.map((p) => p + 1).join(', ')}]`}>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <DenseMatrix M={m.lu.L} title="L (unit lower triangular)" />
            <DenseMatrix M={m.lu.U} title="U (upper triangular)" />
          </div>
        </Section>
      )}
      {!m.dense && <p className="text-[12.5px] text-slate-500">The full matrix is shown for systems up to 30 unknowns; the sparsity pattern up to 900.</p>}
    </div>
  )
}

// --------------------------------------------------------------- II. Validation
export function ValidationStep({ wf }: { wf: Workflow }) {
  const r = wf.result
  if (!r) return <NoResult />
  return <Validation r={r} wf={wf} unit={unitOf(wf)} />
}

function verdict(pct: number) {
  if (pct < 0.5) return { tone: 'success' as const, icon: CheckCircle2, text: 'Excellent agreement' }
  if (pct < 2) return { tone: 'success' as const, icon: CheckCircle2, text: 'Good agreement' }
  if (pct < 5) return { tone: 'warning' as const, icon: TriangleAlert, text: 'Fair: refine the grid' }
  return { tone: 'danger' as const, icon: XCircle, text: 'Poor: refine the grid or change the scheme' }
}

function Validation({ r, wf, unit }: { r: WorkflowResult; wf: Workflow; unit: string }) {
  const g = gridOf(r)
  const e = r.phase3.errors
  const ex = r.phase3.exact
  const conv = r.phase2.convergence
  // nodes left out of the error norms (discontinuous corners) are shown as zero error, not as spikes
  const skip = new Set(r.phase3.excluded_nodes ?? [])
  const err = ex ? r.phase3.temperature.map((v, i) => (skip.has(i) ? 0 : v - ex[i])) : null
  const v = e.relative_pct !== undefined ? verdict(e.relative_pct) : null
  const ref = wf.refinement
  const steady = r.phase1.time_mode === 'steady'

  return (
    <div className="space-y-5">
      <PhaseStepHeader phase={PHASE} roman="II" title="Validation" description="Compare with the exact (analytical) solution, check the algebra, and confirm grid convergence." />

      <Section title="Exact solution">
        {r.phase3.exact_info.available ? (
          <>
            <div className="mb-1 flex items-center gap-2 text-[13px] font-medium text-slate-800">
              <FlaskConical className="size-4 text-primary-ink" /> {r.phase3.exact_info.name}
            </div>
            <Tex block math={r.phase3.exact_info.latex ?? ''} />
          </>
        ) : (
          <Callout>
            No closed-form solution exists for this configuration. Exact solutions are available for: 1-D (or effectively 1-D) steady conduction / convection–diffusion / convection with any end conditions; 1-D unsteady conduction with fixed-temperature or insulated ends; and the
            2-D Laplace plate with fixed edge temperatures. The algebraic checks below still apply.
          </Callout>
        )}
      </Section>

      {e.max_abs !== undefined && v && (
        <Section title={`Error vs exact${r.phase3.final_time !== null ? ` at t = ${formatTime(r.phase3.final_time)}` : ''}`} aside={<Badge variant={v.tone}><v.icon /> {v.text}</Badge>}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Tile label="Max |T − T_exact|" value={`${fmt(e.max_abs, 4)} ${unit}`} tone="hot" />
            <Tile label="RMS error" value={`${fmt(e.rms ?? 0, 4)} ${unit}`} />
            <Tile label="Relative (of range)" value={`${fmt(e.relative_pct, 4)} %`} sub={`range ${fmt(e.reference_range ?? 0, 4)} ${unit}`} />
            <Tile label="Nodes compared" value={(e.points ?? 0).toLocaleString()} sub={e.excluded ? `${e.excluded} corner nodes excluded` : undefined} />
          </div>
          {err && (
            <div className="mt-4">
              {g.dim === 1 ? (
                <XYChart data={g.axis_coords[0].map((x, i) => ({ x, err: err[i] }))} xKey="x" series={[{ key: 'err', name: 'T − T_exact', color: NUM, markers: true }]} xLabel="x [m]" yLabel={`Error [${unit}]`} height={240} />
              ) : (
                <FieldHeatmap
                  title={`Error T − T_exact${g.dim === 3 ? ` (slice k = ${Math.floor(g.nz / 2) + 1})` : ''}. Blue: below exact, red: above.`}
                  xs={g.axis_coords[0]}
                  ys={g.axis_coords[1]}
                  Lx={g.lengths[0]}
                  Ly={g.lengths[1]}
                  values={sliceXY(err, g.nx, g.ny, g.dim === 3 ? Math.floor(g.nz / 2) : 0)}
                  unit={unit}
                  diverging
                />
              )}
            </div>
          )}
        </Section>
      )}

      <Section title="Algebraic checks">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Tile label="max |A·T − B|" value={fmt(r.phase3.residual_max, 3)} />
          <Tile label="Relative residual" value={fmt(conv.residual, 3)} />
          <Tile label="Diagonally dominant" value={r.phase2.matrix.diagonally_dominant ? 'yes' : 'no'} sub={r.phase2.matrix.diagonally_dominant ? 'Gauss–Seidel guaranteed to converge' : 'Gauss–Seidel may struggle'} />
          <Tile label="Converged" value={conv.converged ? 'yes' : 'no'} sub={conv.iterations !== null ? `${conv.iterations} iterations` : 'direct solve'} />
        </div>
        {conv.history.length > 1 && (
          <div className="mt-4">
            <div className="mb-1 text-[12.5px] font-medium text-slate-700">Gauss–Seidel convergence{r.phase1.time_mode === 'transient' ? ' (first time step)' : ''}</div>
            <XYChart
              data={conv.history.map((h, i) => ({ it: i + 1, res: Math.max(h, 1e-300) }))}
              xKey="it"
              series={[{ key: 'res', name: 'Criterion', color: NUM }]}
              xLabel="Iteration"
              yLabel="Criterion (log)"
              logY
              height={240}
              xFormat={(x) => String(Math.round(x))}
            />
          </div>
        )}
      </Section>

      {steady && r.phase3.exact_info.available && (
        <Section
          title="Grid convergence study"
          description="Halve the grid spacing repeatedly (solved with LU) and measure how fast the error falls. Observed order p = ln(e₁/e₂) / ln(h₁/h₂)."
          aside={
            <Button size="sm" onClick={() => void wf.refine()} disabled={wf.refining || wf.stale}>
              {wf.refining ? <SolvingLoader /> : <FlaskConical />} Run study
            </Button>
          }
        >
          {wf.refineError && <Callout tone="error">{wf.refineError}</Callout>}
          {wf.stale && <p className="text-[12.5px] text-slate-500">Re-run the calculation first; the study uses the last solved set-up.</p>}
          {ref && r.phase3.exact_info.name?.startsWith('2-D Laplace') && (
            <Callout className="mb-3">
              Adjacent edges at different temperatures make the corners singular. The max error sits beside a corner and barely falls, while the RMS error still converges. This is a property of the problem, not
              of the solver.
            </Callout>
          )}
          {ref && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Table className="tabular">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-0">Grid</TableHead>
                    <TableHead className="px-0 text-right">h [m]</TableHead>
                    <TableHead className="px-0 text-right">max |e|</TableHead>
                    <TableHead className="px-0 text-right">order</TableHead>
                    <TableHead className="px-0 text-right">RMS</TableHead>
                    <TableHead className="px-0 text-right">order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="font-mono">
                  {ref.levels.map((l) => (
                    <TableRow key={l.n}>
                      <TableCell className="px-0 py-1">{l.counts.join('×')}</TableCell>
                      <TableCell className="px-0 py-1 text-right">{fmt(l.h, 4)}</TableCell>
                      <TableCell className="px-0 py-1 text-right">{fmt(l.max_abs, 4)}</TableCell>
                      <TableCell className="px-0 py-1 text-right font-medium text-foreground">{l.order_max_abs !== undefined ? l.order_max_abs.toFixed(2) : '—'}</TableCell>
                      <TableCell className="px-0 py-1 text-right">{fmt(l.rms, 4)}</TableCell>
                      <TableCell className="px-0 py-1 text-right font-medium text-foreground">{l.order_rms !== undefined ? l.order_rms.toFixed(2) : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div>
                <Legend items={[{ name: 'max |e|', color: NUM }, { name: 'RMS', color: EXACT }]} />
                <XYChart
                  data={ref.levels.filter((l) => (l.max_abs ?? 0) > 0).map((l) => ({ h: l.h, max: l.max_abs, rms: l.rms }))}
                  xKey="h"
                  series={[
                    { key: 'max', name: 'max |e|', color: NUM, markers: true },
                    { key: 'rms', name: 'RMS', color: EXACT, markers: true },
                  ]}
                  xLabel="h [m] (log)"
                  yLabel="Error (log)"
                  logX
                  logY
                  height={220}
                />
              </div>
            </div>
          )}
        </Section>
      )}
    </div>
  )
}
