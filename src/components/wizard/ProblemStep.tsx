import { Tex } from '@/components/math/Tex'
import { Card } from '@/components/ui/card'
import { RadioGroup, RadioGroupCard } from '@/components/ui/radio-group'
import { Segmented } from '@/components/ui/segmented'
import type { Simulation } from '@/hooks/useSimulation'
import type { ProblemType } from '@/types/solver'
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
      <RadioGroup
        aria-label="Problem type"
        value={form.problemType}
        onValueChange={(v) => sim.setProblemType(v as ProblemType)}
        className="gap-3 md:grid-cols-2"
      >
        {TYPES.map((t) => (
          <RadioGroupCard key={t.id} value={t.id} className="group/type items-stretch justify-start gap-0 p-4">
            <div className="flex items-center gap-2.5">
              <span className="grid size-4 place-items-center rounded-full border border-muted-foreground/60 group-data-[state=checked]/type:border-primary">
                <span className="hidden size-2 rounded-full bg-primary group-data-[state=checked]/type:block" />
              </span>
              <span className="text-[15px] font-semibold text-foreground">{t.title}</span>
            </div>
            <p className="mt-2 text-[13px] text-muted-foreground">{t.text}</p>
            <div className="mt-3 border-t pt-2 text-foreground">
              <Tex math={t.eq} block />
            </div>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Inputs: <span className="font-mono">{t.needs}</span>
            </p>
          </RadioGroupCard>
        ))}
      </RadioGroup>

      <Card className="mt-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-medium text-foreground">Temperature scale</div>
          <p className="text-[13px] text-muted-foreground">Used for inputs and results. Gradients (K/m and °C/m are the same) and heat flux are not affected.</p>
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
