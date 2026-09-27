import { CheckCircle2, Info, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Stat } from '@/components/wizard/common'
import { formatMs, sci } from '@/lib/format'
import type { SimulationResult } from '@/types/solver'

export function ValidationTab({ result }: { result: SimulationResult }) {
  const v = result.validation
  const ok = v.status === 'validated'
  const residualVector = result.problem_type === 'transient' ? v.residual_first_step : v.residual_vector

  return (
    <div className="flex flex-col gap-5">
      <div className={`flex items-start gap-3 rounded-md border px-5 py-4 ${ok ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
        {ok ? <CheckCircle2 className="mt-0.5 size-5 text-emerald-600" /> : <XCircle className="mt-0.5 size-5 text-red-600" />}
        <div>
          <div className={`font-semibold ${ok ? 'text-emerald-900' : 'text-red-900'}`}>{ok ? 'Numerical solution validated' : v.message}</div>
          <p className="text-[13px] text-slate-600">
            Residual <span className="font-mono">r = A·T − b</span> {result.problem_type === 'transient' ? 'is checked at every time step' : 'is evaluated with the solved temperatures'}; boundary equations are checked separately.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Max residual" value={sci(v.residual_max, 2)} sub={`tolerance ${sci(v.tolerance, 1)}`} accent />
        <Stat label="Boundary error" value={v.boundary_error < 1e-10 ? '< 10⁻¹⁰' : sci(v.boundary_error, 2)} sub={`L ${sci(v.boundary_error_left, 1)} · R ${sci(v.boundary_error_right, 1)}`} />
        <Stat label="Nodes" value={result.nodes.length} sub={result.problem_type === 'transient' ? `${result.num_steps} time steps` : 'unknowns solved'} />
        <Stat label="Execution time" value={formatMs(result.execution_time_ms)} sub="server-side" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Checks</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-slate-100">
            {v.checks.map((c) => (
              <li key={c.name} className="flex items-start gap-3 py-2.5">
                {c.passed === null ? (
                  <Info className="mt-0.5 size-4 shrink-0 text-slate-400" />
                ) : c.passed ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
                )}
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-slate-900">
                    {c.name}{' '}
                    <span className={`ml-1 text-[11px] font-semibold ${c.passed === null ? 'text-slate-400' : c.passed ? 'text-emerald-700' : 'text-red-700'}`}>
                      {c.passed === null ? 'INFO' : c.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  <div className="text-xs break-words text-slate-500">{c.detail}</div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {residualVector && (
        <Card>
          <CardHeader>
            <CardTitle>Residual vector</CardTitle>
            <CardDescription>rᵢ = (A·T − b)ᵢ{result.problem_type === 'transient' ? ' for the first time step' : ''}. Values at round-off level confirm the elimination is exact.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="scroll-thin flex max-h-48 flex-wrap gap-1.5 overflow-auto">
              {residualVector.map((r, i) => (
                <span key={i} className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-600">
                  r<sub>{i + 1}</sub> = {r === 0 ? '0' : sci(r, 2)}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
