import { FlaskConical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { fixed } from '@/lib/format'
import type { Example, SimulationResult } from '@/types/solver'
import type { TempDisplay } from './charts'

/** Side-by-side comparison of computed values with the printed reference (never forced). */
export function ReferenceComparison({ result, example, temp }: { result: SimulationResult; example: Example; temp: TempDisplay }) {
  const ref = example.reference!
  const computed = result.problem_type === 'transient' && ref.time_step === 1 ? result.first_step_solution : result.solution
  if (computed.length !== ref.values.length) return null
  const diffs = computed.map((c, i) => c - ref.values[i])
  const maxDiff = Math.max(...diffs.map(Math.abs))
  const match = maxDiff < 0.02

  return (
    <Card className="border-amber-200">
      <CardHeader className="flex-row flex-wrap items-center gap-2">
        <FlaskConical className="size-4 text-amber-600" />
        <CardTitle>Reference example</CardTitle>
        <Badge variant="warning">Reference Example</Badge>
        <Badge variant={match ? 'success' : 'neutral'}>{match ? 'matches to print precision' : `max |Δ| = ${fixed(maxDiff, 2)}`}</Badge>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-[13px] leading-relaxed text-muted-foreground">{ref.note}</p>
        <Table containerClassName="rounded-md border" className="text-[13px] tabular">
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-3">Node</TableHead>
              <TableHead className="px-3 text-right">Computed [{temp.symbol}]</TableHead>
              <TableHead className="px-3 text-right">{ref.label}</TableHead>
              <TableHead className="px-3 text-right">Difference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {computed.map((c, i) => (
              <TableRow key={i}>
                <TableCell className="px-3 font-medium">T{i + 1}</TableCell>
                <TableCell className="px-3 text-right font-mono">{fixed(temp.conv(c), 2)}</TableCell>
                <TableCell className="px-3 text-right font-mono text-muted-foreground">{fixed(temp.conv(ref.values[i]), 2)}</TableCell>
                <TableCell className={`px-3 text-right font-mono ${Math.abs(diffs[i]) < 0.02 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {diffs[i] >= 0 ? '+' : ''}
                  {fixed(diffs[i], 2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="mt-2 text-[11px] text-muted-foreground">The solver never reads these reference values. They are shown for comparison only.</p>
      </CardContent>
    </Card>
  )
}
