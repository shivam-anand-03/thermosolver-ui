import { FlaskConical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
        <p className="mb-3 text-[13px] leading-relaxed text-slate-600">{ref.note}</p>
        <div className="scroll-thin overflow-x-auto rounded border border-slate-200">
          <table className="w-full text-[13px] tabular">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Node</th>
                <th className="px-3 py-2 text-right font-medium">Computed [{temp.symbol}]</th>
                <th className="px-3 py-2 text-right font-medium">{ref.label}</th>
                <th className="px-3 py-2 text-right font-medium">Difference</th>
              </tr>
            </thead>
            <tbody>
              {computed.map((c, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-3 py-1.5 font-medium">T{i + 1}</td>
                  <td className="px-3 py-1.5 text-right font-mono">{fixed(temp.conv(c), 2)}</td>
                  <td className="px-3 py-1.5 text-right font-mono text-slate-500">{fixed(temp.conv(ref.values[i]), 2)}</td>
                  <td className={`px-3 py-1.5 text-right font-mono ${Math.abs(diffs[i]) < 0.02 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {diffs[i] >= 0 ? '+' : ''}
                    {fixed(diffs[i], 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">The solver never reads these reference values. They are shown for comparison only.</p>
      </CardContent>
    </Card>
  )
}
