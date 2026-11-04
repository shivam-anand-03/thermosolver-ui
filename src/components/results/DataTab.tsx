import { FileSpreadsheet } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
            <Select value={String(snap)} onValueChange={(v) => setSnap(Number(v))}>
              <SelectTrigger aria-label="Time level" size="sm" className="w-auto min-w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {result.times.map((t, i) => (
                  <SelectItem key={i} value={String(i)}>
                    t = {formatTime(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button size="sm" variant="secondary" onClick={() => exportCsv(result)}>
            <FileSpreadsheet /> Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table containerClassName="max-h-[520px] overflow-auto rounded-md border" className="text-[13px] tabular">
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-3">Node</TableHead>
              <TableHead className="px-3">x [{xUnit}]</TableHead>
              {transient && <TableHead className="px-3">T⁰ [{temp.symbol}]</TableHead>}
              <TableHead className="px-3 text-right">Temperature [{temp.symbol}]</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((x, k) => {
              const i = page * PAGE + k
              return (
                <TableRow key={i}>
                  <TableCell className="px-3 font-medium">{i + 1}</TableCell>
                  <TableCell className="px-3 font-mono text-muted-foreground">{fmt(x * xScale, 6)}</TableCell>
                  {transient && <TableCell className="px-3 font-mono text-muted-foreground">{fixed(temp.conv(result.initial[i]), 2)}</TableCell>}
                  <TableCell className="px-3 text-right font-mono font-medium text-foreground">{fixed(temp.conv(values[i]), 4)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        {n > PAGE && (
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
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
