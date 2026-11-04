import { FunctionSquare } from 'lucide-react'
import { Tex } from '@/components/math/Tex'
import { Segmented } from '@/components/ui/segmented'
import { NumField } from '../ui'
import type { Workflow } from '../useWorkflow'
import { Q3 } from './constants'
import { CustomExpressionPanel } from './CustomExpressionPanel'
import { useSourceExpression, type SourceMode } from './useSourceExpression'

/** Volumetric heat generation: q₀ + βT, or a custom f(x, y, z) + βT typed as plain maths or LaTeX. */
export function SourceEditor({ wf }: { wf: Workflow }) {
  const { setup, update } = wf
  const src = setup.preprocessor.problem.source
  const ctl = useSourceExpression(wf)
  const formula = ctl.mode === 'custom' ? `${Q3} = f(\\mathbf{x}) + \\beta\\,T` : `${Q3} = q_0 + \\beta\\,T`
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented<SourceMode>
          ariaLabel="Heat generation form"
          value={ctl.mode}
          onChange={ctl.setMode}
          options={[
            { value: 'constant', label: 'Constant q₀' },
            { value: 'custom', label: <><FunctionSquare /> Custom f(x, y, z)</> },
          ]}
        />
        <div className="text-[15px]"><Tex math={formula} /></div>
      </div>
      {ctl.mode === 'constant' ? (
        <NumField label="Constant generation" symbol="q_0" unit="W/m³" value={src.q0} onChange={(v) => update((d) => void (d.preprocessor.problem.source.q0 = v))} />
      ) : (
        <CustomExpressionPanel setup={setup} ctl={ctl} />
      )}
      <NumField
        label="Temperature coefficient"
        symbol="\beta"
        unit="W/m³·K"
        value={src.beta}
        onChange={(v) => update((d) => void (d.preprocessor.problem.source.beta = v))}
        hint="β > 0: generation rises with T (runaway possible). β < 0: absorbing / self-limiting."
      />
    </div>
  )
}
