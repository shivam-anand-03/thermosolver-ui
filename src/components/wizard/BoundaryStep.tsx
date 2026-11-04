import { ArrowLeftRight, Minus, Thermometer, TrendingUp } from 'lucide-react'
import { Tex } from '@/components/math/Tex'
import { SlabDiagram } from '@/components/diagram/SlabDiagram'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Segmented } from '@/components/ui/segmented'
import type { Simulation } from '@/hooks/useSimulation'
import { bcPreview } from '@/lib/fd'
import { num, type BoundaryForm } from '@/lib/form'
import { BC_META } from '@/lib/units'
import type { BoundaryType } from '@/types/solver'
import { Callout, StepHeader } from './common'

const OPTIONS = [
  { value: 'temperature' as const, label: 'Temperature', icon: <Thermometer /> },
  { value: 'heat_flux' as const, label: 'Heat flux', icon: <ArrowLeftRight /> },
  { value: 'gradient' as const, label: 'Gradient', icon: <TrendingUp /> },
  { value: 'adiabatic' as const, label: 'Adiabatic', icon: <Minus /> },
]

function BoundaryCard({ sim, side }: { sim: Simulation; side: 'left' | 'right' }) {
  const { form, derived, errors } = sim
  const bc = form[side]
  const set = (patch: Partial<BoundaryForm>) => sim.update({ [side]: { ...bc, ...patch } })
  const meta = BC_META[bc.type]
  const preview = bcPreview({
    side,
    type: bc.type,
    value: num(bc.value),
    k: num(form.k),
    dx: derived.dx,
    N: derived.N,
    qgen: num(form.qgen) || 0,
    scheme: form.scheme,
    problem: form.problemType,
    fo: derived.fo,
    tempUnit: form.tempUnit,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {side === 'left' ? 'Left boundary' : 'Right boundary'}
          <span className="font-mono text-xs font-normal text-slate-400">{side === 'left' ? 'x = 0 · node 1' : `x = L · node ${derived.N}`}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Segmented<BoundaryType>
          ariaLabel={`${side} boundary type`}
          size="sm"
          value={bc.type}
          onChange={(type) => set({ type, value: type === 'adiabatic' ? '0' : bc.type === 'adiabatic' ? '' : bc.value })}
          options={OPTIONS}
        />
        {bc.type !== 'adiabatic' ? (
          <Field
            id={`${side}-value`}
            label={bc.type === 'temperature' ? 'Boundary temperature' : bc.type === 'heat_flux' ? 'Heat flux (into slab)' : 'Temperature gradient'}
            symbol={meta.short}
            unit={meta.unit(form.tempUnit)}
            value={bc.value}
            onChange={(value) => set({ value })}
            error={errors[side]}
            hint={bc.type === 'heat_flux' ? 'Positive = heat entering the slab; negative = heat leaving.' : bc.type === 'gradient' ? 'dT/dx in the +x direction.' : undefined}
          />
        ) : (
          <p className="rounded-md border border-dashed border-slate-300 px-3 py-2 text-[13px] text-slate-500">Insulated surface: no heat crosses the boundary (q'' = 0 ⇒ dT/dx = 0).</p>
        )}
        <div className="space-y-1 rounded border border-slate-100 bg-slate-50/80 px-3 py-2 text-[13px] text-slate-800">
          <div className="text-[12px] font-medium text-slate-500">Condition</div>
          <Tex block math={preview.physical} />
          <div className="pt-1 text-[12px] font-medium text-slate-500">Matrix row</div>
          <Tex block math={preview.general} />
          <Tex block math={preview.numeric} className="text-blue-800" />
        </div>
      </CardContent>
    </Card>
  )
}

export function BoundaryStep({ sim }: { sim: Simulation }) {
  const { form, derived, errors } = sim
  return (
    <div>
      <StepHeader step={4} title="Boundary conditions" description="Each boundary contributes one equation (one matrix row). Choose what is known at x = 0 and x = L." />
      <Callout className="mb-5" title="Sign convention">
        A <b>positive heat flux q''</b> always means heat <b>entering</b> the slab. With Fourier's law q = −k dT/dx this gives{' '}
        <Tex math={String.raw`-k\,\frac{dT}{dx}\Big|_{0} = q''_{in}`} /> at the left face and <Tex math={String.raw`k\,\frac{dT}{dx}\Big|_{L} = q''_{in}`} /> at the right face.
      </Callout>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <BoundaryCard sim={sim} side="left" />
        <BoundaryCard sim={sim} side="right" />
      </div>
      {errors.bcCombo && (
        <Callout tone="error" className="mt-5" title="Invalid boundary-condition combination">
          {errors.bcCombo}
        </Callout>
      )}
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>Arrows show the direction of heat flow for flux boundaries.</CardDescription>
        </CardHeader>
        <CardContent>
          <SlabDiagram
            className="w-full"
            nodes={derived.N}
            lengthM={Number.isFinite(derived.L) && derived.L > 0 ? derived.L : 1}
            lengthUnit={form.lengthUnit}
            left={{ type: form.left.type, value: num(form.left.value) }}
            right={{ type: form.right.type, value: num(form.right.value) }}
            tempUnit={form.tempUnit}
          />
        </CardContent>
      </Card>
    </div>
  )
}
