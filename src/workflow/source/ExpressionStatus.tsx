import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { fmt } from '@/lib/format'
import type { Analysis } from '../expression'

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-start gap-1.5 text-red-700">
      <AlertTriangle className="mt-px size-3.5 shrink-0" />
      {children}
    </span>
  )
}

/** One line under the input: the parse error, a non-finite warning, or the canonical form sent to the API. */
export function ExpressionStatus({ id, analysis, badX }: { id: string; analysis: Analysis; badX: number | null }) {
  let body: React.ReactNode
  if (!analysis.ok) body = <Warning>{analysis.error ?? 'Invalid expression.'}</Warning>
  else if (badX != null) body = <Warning>Not finite at x = {fmt(badX, 4)} m (division by zero or log of a non-positive number).</Warning>
  else
    body = (
      <span className="flex flex-wrap items-center gap-1.5 text-slate-500">
        <CheckCircle2 className="size-3.5 text-emerald-600" />
        Sent to the solver as
        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11.5px] text-slate-700">{analysis.plain}</code>
      </span>
    )
  return <div id={id} className="min-h-5 text-[12px]" aria-live="polite">{body}</div>
}
