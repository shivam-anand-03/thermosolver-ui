import { Tex } from '@/components/math/Tex'
import { Card, CardContent } from '@/components/ui/card'
import type { SimulationResult } from '@/types/solver'

export function StepByStepTab({ result }: { result: SimulationResult }) {
  const { explanation } = result
  return (
    <div className="flex flex-col gap-4">
      <Card className="border-l-4 border-l-primary">
        <CardContent className="">
          <div className="text-[13px] font-semibold text-slate-900">Summary</div>
          <p className="mt-1.5 text-[14px] leading-relaxed text-slate-700">{explanation.summary}</p>
        </CardContent>
      </Card>
      <ol className="relative flex flex-col gap-4">
        {explanation.steps.map((s, i) => (
          <li key={i}>
            <Card>
              <CardContent className="">
                <div className="flex items-baseline gap-3">
                  <span className="shrink-0 font-mono text-xs font-semibold text-blue-600">STEP {i + 1}</span>
                  <h3 className="text-[15px] font-semibold text-slate-900">{s.title}</h3>
                </div>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-600">{s.text}</p>
                {s.latex.length > 0 && (
                  <div className="mt-3 space-y-0.5 rounded border border-slate-100 bg-slate-50/70 px-4 py-2 text-slate-900">
                    {s.latex.map((l, j) => (
                      <Tex key={j} block math={l} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    </div>
  )
}
