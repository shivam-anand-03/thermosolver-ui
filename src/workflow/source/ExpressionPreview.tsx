import { Tex } from '@/components/math/Tex'
import { cn } from '@/lib/utils'
import type { Analysis } from '../expression'
import { Q3 } from './constants'

/** Live KaTeX rendering of q'''(x) as typed. */
export function ExpressionPreview({ analysis, beta }: { analysis: Analysis; beta: number }) {
  const tex = `${Q3}(\\mathbf{x}) = ${analysis.latex}${beta ? ' + \\beta\\,T' : ''}`
  return (
    <div className={cn('flex min-h-16 items-center justify-center overflow-x-auto border-b px-4 py-3 text-[17px] transition-colors', analysis.ok ? 'border-slate-200 bg-slate-50/60' : 'border-red-200 bg-red-50/50')}>
      {analysis.ok ? <Tex block math={tex} /> : <span className="text-[13px] text-slate-400">Preview appears when the expression is complete</span>}
    </div>
  )
}
