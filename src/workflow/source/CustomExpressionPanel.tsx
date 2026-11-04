import { AlertTriangle } from 'lucide-react'
import { useId, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Analysis, Variable } from '../expression'
import type { Setup } from '../types'
import { ExpressionPreview } from './ExpressionPreview'
import { ExpressionStatus } from './ExpressionStatus'
import { InsertToolbar } from './InsertToolbar'
import { PresetChips } from './PresetChips'
import { ProfilePlot } from './ProfilePlot'
import { sampleProfile } from './profile'
import type { SourceExpressionController } from './useSourceExpression'

function unusedVariables(analysis: Analysis, dim: number): Variable[] {
  if (!analysis.ok || !analysis.vars) return []
  return [...analysis.vars].filter((v) => ((v === 'y' || v === 'W') && dim < 2) || ((v === 'z' || v === 'H') && dim < 3))
}

/** Expression editor: live preview, insert toolbar, input with status, examples and a profile plot. */
export function CustomExpressionPanel({ setup, ctl }: { setup: Setup; ctl: SourceExpressionController }) {
  const dim = setup.preprocessor.problem.dimension
  const { analysis: a, input, inputRef, setInput, insert } = ctl
  const prof = useMemo(() => (a.ok && a.ast ? sampleProfile(setup, a.ast) : null), [a, setup])
  const inputId = useId()
  const unused = unusedVariables(a, dim)
  return (
    <Card className="overflow-hidden shadow-none">
      <ExpressionPreview analysis={a} beta={setup.preprocessor.problem.source.beta} />
      <CardContent className="flex flex-col gap-3 p-3">
        <InsertToolbar dim={dim} onInsert={insert} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={inputId} className="flex items-baseline justify-between gap-2">
            <span>f(x, y, z) in W/m³</span>
            <span className="text-[11.5px] font-normal text-muted-foreground">plain maths or LaTeX · x, y, z in metres</span>
          </Label>
          <Input
            id={inputId}
            ref={inputRef}
            value={input}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => setInput(e.target.value)}
            aria-invalid={!a.ok}
            aria-describedby={`${inputId}-msg`}
            placeholder="5e5 sin(pi x / L)"
            className="h-10 px-3 text-[14px]"
          />
          <ExpressionStatus id={`${inputId}-msg`} analysis={a} badX={prof?.bad ?? null} />
        </div>
        <PresetChips dim={dim} current={input} onPick={setInput} />
        {prof && prof.bad == null && <ProfilePlot pts={prof.pts} length={setup.preprocessor.geometry.length} dim={dim} />}
        {unused.length > 0 && (
          <p className="flex items-start gap-1.5 text-[12px] text-amber-800">
            <AlertTriangle className="mt-px size-3.5 shrink-0" />
            {unused.join(', ')} {unused.length > 1 ? 'are' : 'is'} not part of a {dim}-D problem, so {unused.map((v) => (v === 'W' || v === 'H' ? `${v} = 1` : `${v} = 0`)).join(', ')} is used.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
