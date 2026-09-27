import { useState } from 'react'
import { Tex } from '@/components/math/Tex'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Segmented } from '@/components/ui/segmented'
import type { SimulationResult } from '@/types/solver'
import { banded, dense } from '@/lib/matrix'
import { MatrixGrid } from './MatrixGrid'

const WINDOW = 16

export function MatrixTab({ result }: { result: SimulationResult }) {
  const n = result.nodes.length
  const [view, setView] = useState<'A' | 'b' | 'aug'>('aug')
  const [start, setStart] = useState(0)
  const get = result.matrix ? dense(result.matrix) : banded(result.bands)
  const windowed = n > WINDOW * 2
  const rowStart = windowed ? start : 0
  const count = windowed ? WINDOW : n
  const transient = result.problem_type === 'transient'
  const interior = result.equations.find((e) => e.kind === 'interior')

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Linear system [A]{'{T}'} = {'{b}'}</CardTitle>
            <CardDescription>
              {n}×{n} {transient ? 'implicit matrix (constant for all time steps); b shown for the first step (uses T⁰)' : 'coefficient matrix'} · tridiagonal
            </CardDescription>
          </div>
          <Segmented
            size="sm"
            ariaLabel="Matrix view"
            value={view}
            onChange={setView}
            options={[
              { value: 'A', label: 'Coefficient [A]' },
              { value: 'b', label: 'RHS {b}' },
              { value: 'aug', label: 'Augmented [A|b]' },
            ]}
          />
        </CardHeader>
        <CardContent>
          {windowed && (
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span>
                Rows {rowStart + 1}–{Math.min(n, rowStart + WINDOW)} of {n}
              </span>
              <Button size="sm" variant="secondary" disabled={rowStart === 0} onClick={() => setStart(Math.max(0, rowStart - WINDOW))}>
                Previous
              </Button>
              <Button size="sm" variant="secondary" disabled={rowStart + WINDOW >= n} onClick={() => setStart(Math.min(n - WINDOW, rowStart + WINDOW))}>
                Next
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setStart(n - WINDOW)}>
                Last rows
              </Button>
            </div>
          )}
          <div className="rounded border border-slate-200 bg-white p-4">
            {view === 'b' ? (
              <MatrixGrid rows={n} cols={1} get={(i) => result.rhs[i]} rowStart={rowStart} rowCount={count} />
            ) : (
              <MatrixGrid
                rows={n}
                cols={n}
                get={get}
                rhs={view === 'aug' ? (i) => result.rhs[i] : undefined}
                rowStart={rowStart}
                rowCount={count}
                colStart={windowed ? Math.max(0, rowStart - 1) : 0}
                colCount={windowed ? WINDOW + 2 : n}
              />
            )}
          </div>
          {result.matrix_truncated && (
            <p className="mt-2 text-xs text-slate-500">Large system: the matrix is reconstructed from its three diagonals; only a window of rows/columns is shown.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How each row was built</CardTitle>
          <CardDescription>Row i of the matrix is the finite-difference equation written at node i.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="scroll-thin max-h-[420px] overflow-auto rounded border border-slate-200">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Row</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Equation</th>
                </tr>
              </thead>
              <tbody>
                {result.equations.map((e) => (
                  <tr key={e.node} className="border-t border-slate-100 align-top">
                    <td className="px-3 py-2 font-mono">{e.node}</td>
                    <td className="px-3 py-2">
                      <span className={e.kind === 'boundary' ? 'text-amber-700' : 'text-slate-500'}>{e.kind}</span>
                    </td>
                    <td className="px-3 py-1.5">
                      <Tex math={e.numeric_latex} />
                      {e.kind === 'boundary' && <div className="text-xs text-slate-500">{e.note}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {interior && (
            <div className="mt-3 rounded bg-slate-50 px-3 py-1">
              <Tex block math={String.raw`\text{Interior stencil: }\; ${interior.general_latex}`} />
            </div>
          )}
          {result.equations.length < n && <p className="mt-2 text-xs text-slate-500">Showing the first and last rows only (N = {n}).</p>}
        </CardContent>
      </Card>
    </div>
  )
}
