import { FileSpreadsheet } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { exportCsv } from '@/lib/export'
import { fixed, fmt, formatTime } from '@/lib/format'
import type { SimulationResult } from '@/types/solver'
import type { TempDisplay } from './charts'

const PAGE = 100

export function DataTab({ result, temp, xUnit, xScale }: { result: SimulationResult; temp: TempDisplay; xUnit: string; xScale: number }) {
  const transient = result.problem_type === 'transient'
  const [snap, setSnap] = useState(transient ? result.times.length - 1 : 0)
  const [page, setPage] = useState(0)
  const n = result.nodes.length
  const values = transient ? result.snapshots[Math.min(snap, result.snapshots.length - 1)] : result.solution
  const rows = result.x.slice(page * PAGE, page * PAGE + PAGE)

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>Temperature distribution</CardTitle>
          <CardDescription>{transient ? `${result.times.length} stored time levels (every ${result.summary.output_interval} step(s))` : `${n} nodes`}</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {transient && (
            <select
              aria-label="Time level"
              value={snap}
              onChange={(e) => setSnap(Number(e.target.value))}
              className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs"
            >
              {result.times.map((t, i) => (
                <option key={i} value={i}>
                  t = {formatTime(t)}
                </option>
              ))}
            </select>
          )}
          <Button size="sm" variant="secondary" onClick={() => exportCsv(result)}>
            <FileSpreadsheet /> Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="scroll-thin max-h-[520px] overflow-auto rounded border border-slate-200">
          <table className="w-full text-[13px] tabular">
            <thead className="sticky top-0 bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Node</th>
                <th className="px-3 py-2 font-medium">x [{xUnit}]</th>
                {transient && <th className="px-3 py-2 font-medium">T⁰ [{temp.symbol}]</th>}
                <th className="px-3 py-2 text-right font-medium">Temperature [{temp.symbol}]</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((x, k) => {
                const i = page * PAGE + k
                return (
                  <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-3 py-1.5 font-medium">{i + 1}</td>
                    <td className="px-3 py-1.5 font-mono text-slate-600">{fmt(x * xScale, 6)}</td>
                    {transient && <td className="px-3 py-1.5 font-mono text-slate-500">{fixed(temp.conv(result.initial[i]), 2)}</td>}
                    <td className="px-3 py-1.5 text-right font-mono font-medium text-slate-900">{fixed(temp.conv(values[i]), 4)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {n > PAGE && (
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>
              Nodes {page * PAGE + 1}–{Math.min(n, (page + 1) * PAGE)} of {n}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <Button size="sm" variant="secondary" disabled={(page + 1) * PAGE >= n} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
