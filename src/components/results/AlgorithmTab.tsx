import { ChevronLeft, ChevronRight, ListOrdered, Rows3 } from 'lucide-react'
import { useState } from 'react'
import { Tex } from '@/components/math/Tex'
import { Callout } from '@/components/wizard/common'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Segmented } from '@/components/ui/segmented'
import { fmt } from '@/lib/format'
import type { EliminationStep, SimulationResult } from '@/types/solver'
import { dense } from '@/lib/matrix'
import { MatrixGrid } from './MatrixGrid'

function opLatex(desc: string) {
  // "R2 → R2 + 1·R1" → R_{2} \rightarrow R_{2} + 1\,R_{1}
  return desc
    .replace(/R(\d+)/g, 'R_{$1}')
    .replace('→', '\\rightarrow')
    .replace('·', '\\,')
    .replace('−', '-')
}

function StepCard({ step, n }: { step: EliminationStep; n: number }) {
  const k = step.pivot_column - 1
  return (
    <div className="rounded-md border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-2.5">
        <span className="rounded-md bg-slate-900 px-2 py-0.5 font-mono text-xs font-semibold text-white">STEP {step.step}</span>
        <span className="text-[13px] text-slate-700">
          Pivot <Tex math={`a_{${step.pivot_row}${step.pivot_column}} = ${fmt(step.pivot_value, 6)}`} />
        </span>
        {step.swapped && <Badge variant="warning">Rows {step.pivot_row} ↔ {step.swap_with} swapped (partial pivoting)</Badge>}
      </div>
      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
        <div className="text-[13px]">
          <div className="text-[12px] font-medium text-slate-500">Operations</div>
          {step.operations.length === 0 ? (
            <p className="mt-1 text-slate-500">All entries below the pivot are already zero, so no row operation is needed.</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {step.operations.map((o) => (
                <li key={o.target}>
                  <Tex math={opLatex(o.description)} />
                  <div className="text-[11px] text-slate-500">
                    factor = a<sub>{o.target}{step.pivot_column}</sub>/a<sub>{step.pivot_row}{step.pivot_column}</sub> = {fmt(o.factor, 6)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {step.matrix && (
          <MatrixGrid
            rows={n}
            cols={n}
            compact={n > 8}
            get={dense(step.matrix)}
            rhs={(i) => step.matrix![i][n]}
            highlight={{ pivot: [k, k], pivotRow: k, changedRows: step.operations.map((o) => o.target - 1) }}
          />
        )}
      </div>
    </div>
  )
}

export function AlgorithmTab({ result }: { result: SimulationResult }) {
  const g = result.gaussian
  const n = result.nodes.length
  const [mode, setMode] = useState<'walk' | 'all'>('walk')
  const [idx, setIdx] = useState(0) // 0 = initial, 1..steps = elimination, steps+1 = back substitution
  const total = g.steps.length + 2
  const transient = result.problem_type === 'transient'

  const initial = g.initial_augmented && (
    <div className="rounded-md border border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
        <span className="rounded-md bg-slate-900 px-2 py-0.5 font-mono text-xs font-semibold text-white">STEP 0</span>
        <span className="text-[13px] text-slate-700">Initial augmented matrix [A | b]</span>
      </div>
      <div className="p-4">
        <MatrixGrid rows={n} cols={n} compact={n > 8} get={dense(g.initial_augmented)} rhs={(i) => g.initial_augmented![i][n]} />
      </div>
    </div>
  )

  const back = (
    <div className="rounded-md border border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
        <span className="rounded-md bg-emerald-600 px-2 py-0.5 font-mono text-xs font-semibold text-white">BACK SUBSTITUTION</span>
        <span className="text-[13px] text-slate-700">From the last row upward</span>
      </div>
      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <Tex block math={String.raw`T_n = \frac{b_n^*}{a_{nn}^*},\qquad T_i = \frac{b_i^* - \sum_{j>i} a_{ij}^*\,T_j}{a_{ii}^*}`} />
          <div className="scroll-thin mt-2 max-h-[420px] space-y-0.5 overflow-auto">
            {g.back_substitution.map((b) => {
              const terms = b.terms.map((t) => `(${fmt(t.a, 5)})(${fmt(t.x, 6)})`).join(' + ') || '0'
              return (
                <Tex
                  key={b.index}
                  block
                  math={String.raw`T_{${b.index}} = \frac{${fmt(b.rhs, 6)} - [${terms}]}{${fmt(b.diagonal, 6)}} = \mathbf{${fmt(b.value, 7)}}`}
                />
              )
            })}
            {g.back_substitution.length === 0 && <p className="text-sm text-slate-500">Back-substitution details are omitted for very large systems.</p>}
          </div>
        </div>
        {g.upper_augmented && (
          <MatrixGrid rows={n} cols={n} compact={n > 8} get={dense(g.upper_augmented)} rhs={(i) => g.upper_augmented![i][n]} caption="Upper-triangular system [A* | b*] after forward elimination" />
        )}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Gaussian elimination with partial pivoting</CardTitle>
            <CardDescription>
              {g.total_row_operations} row operation(s), {g.total_swaps} row swap(s){transient && ' · shown for the first time step'}
            </CardDescription>
          </div>
          {g.recorded && (
            <Segmented
              size="sm"
              ariaLabel="Display mode"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'walk', label: 'Step through', icon: <ListOrdered /> },
                { value: 'all', label: 'Show all', icon: <Rows3 /> },
              ]}
            />
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-[13px] text-slate-600 sm:grid-cols-3">
            <div className="rounded bg-slate-50 px-3 py-2">
              <b className="text-slate-900">1 · Pivot.</b> Choose the largest |a<sub>ik</sub>| in column k (rows k…n) and swap it into place.
            </div>
            <div className="rounded bg-slate-50 px-3 py-2">
              <b className="text-slate-900">2 · Eliminate.</b> R<sub>i</sub> → R<sub>i</sub> − (a<sub>ik</sub>/a<sub>kk</sub>)·R<sub>k</sub> for every row below the pivot.
            </div>
            <div className="rounded bg-slate-50 px-3 py-2">
              <b className="text-slate-900">3 · Back-substitute.</b> Solve the upper-triangular system from T<sub>n</sub> up to T<sub>1</sub>.
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded bg-blue-600" /> pivot
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded border border-blue-200 bg-blue-50" /> pivot row
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded border border-amber-200 bg-amber-50" /> rows modified in this step
            </span>
          </div>
        </CardContent>
      </Card>

      {!g.recorded && (
        <Callout tone="info" title="Large system">
          Intermediate matrices are stored only for N ≤ 12 to keep the page responsive. Pivots and row operations for the first {g.steps.length} steps are listed below.
        </Callout>
      )}

      {g.recorded && mode === 'walk' ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <Button variant="secondary" size="sm" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>
              <ChevronLeft /> Previous
            </Button>
            <div className="text-xs text-slate-500">
              {idx === 0 ? 'Initial matrix' : idx === total - 1 ? 'Backward substitution' : `Elimination step ${idx} of ${g.steps.length}`}
            </div>
            <Button variant="secondary" size="sm" disabled={idx === total - 1} onClick={() => setIdx(idx + 1)}>
              Next <ChevronRight />
            </Button>
          </div>
          {idx === 0 ? initial : idx === total - 1 ? back : <StepCard step={g.steps[idx - 1]} n={n} />}
        </>
      ) : g.recorded ? (
        <>
          {initial}
          {g.steps.map((s) => (
            <StepCard key={s.step} step={s} n={n} />
          ))}
          {back}
        </>
      ) : (
        <>
          <Card>
            <CardContent>
              <ul className="scroll-thin max-h-80 space-y-1 overflow-auto font-mono text-xs text-slate-700">
                {g.steps.map((s) => (
                  <li key={s.step}>
                    Step {s.step}: pivot a[{s.pivot_row},{s.pivot_column}] = {fmt(s.pivot_value, 6)}
                    {s.swapped && ` (swap ${s.pivot_row}↔${s.swap_with})`}: {s.operations.map((o) => o.description).join('; ') || 'no operation'}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          {back}
        </>
      )}
      {g.warnings.map((w) => (
        <Callout key={w} tone="warning">
          {w}
        </Callout>
      ))}
    </div>
  )
}
