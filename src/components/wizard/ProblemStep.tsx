import { Tex } from '@/components/math/Tex'
import { Card } from '@/components/ui/card'
import { Segmented } from '@/components/ui/segmented'
import type { Simulation } from '@/hooks/useSimulation'
import { cn } from '@/lib/utils'
import { StepHeader } from './common'

const TYPES = [
  {
    id: 'steady' as const,
    title: 'Steady state',
    text: 'The temperature field no longer changes with time. One linear system is solved.',
    eq: String.raw`\frac{d^2T}{dx^2} + \frac{q'''}{k} = 0`,
    needs: "k, q''', boundary conditions",
  },
  {
    id: 'transient' as const,
    title: 'Transient',
    text: 'Heating or cooling from an initial temperature field, marched in time with the fully implicit scheme.',
    eq: String.raw`\frac{\partial T}{\partial t} = \alpha\,\frac{\partial^2 T}{\partial x^2}`,
    needs: 'k, ρ, Cp, T(x,0), Δt or Fo',
  },
]

export function ProblemStep({ sim }: { sim: Simulation }) {
  const { form } = sim
  return (
    <div>
      <StepHeader step={1} title="Problem type" description="Pick the kind of conduction problem to solve in a 1-D plane slab with constant properties." />
      <div role="radiogroup" aria-label="Problem type" className="grid gap-3 md:grid-cols-2">
        {TYPES.map((t) => {
          const active = form.problemType === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => sim.setProblemType(t.id)}
              className={cn(
                'rounded-md border bg-white p-4 text-left focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none',
                active ? 'border-primary ring-1 ring-primary' : 'border-slate-300 hover:border-slate-400',
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className={cn('grid size-4 place-items-center rounded-full border', active ? 'border-primary' : 'border-slate-400')}>
                  {active && <span className="size-2 rounded-full bg-primary" />}
                </span>
                <span className="text-[15px] font-semibold text-slate-900">{t.title}</span>
              </div>
              <p className="mt-2 text-[13px] text-slate-600">{t.text}</p>
              <div className="mt-3 border-t border-slate-200 pt-2 text-slate-800">
                <Tex math={t.eq} block />
              </div>
              <p className="mt-1 text-[12px] text-slate-500">
                Inputs: <span className="font-mono">{t.needs}</span>
              </p>
            </button>
          )
        })}
      </div>

      <Card className="mt-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-medium text-slate-900">Temperature scale</div>
          <p className="text-[13px] text-slate-500">Used for inputs and results. Gradients (K/m and °C/m are the same) and heat flux are not affected.</p>
        </div>
        <Segmented
          ariaLabel="Temperature unit"
          value={form.tempUnit}
          onChange={(v) => sim.update({ tempUnit: v })}
          options={[
            { value: 'C', label: '°C' },
            { value: 'K', label: 'K' },
          ]}
        />
      </Card>
    </div>
  )
}
