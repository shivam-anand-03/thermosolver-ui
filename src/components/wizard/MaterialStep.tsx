import { Tex } from '@/components/math/Tex'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import type { Simulation } from '@/hooks/useSimulation'
import { num } from '@/lib/form'
import { fmt } from '@/lib/format'
import { StepHeader } from './common'

const PRESETS = [
  { name: 'Epoxy / polymer', k: 0.25, rho: 1300, cp: 2000 },
  { name: 'Brick', k: 0.72, rho: 1920, cp: 835 },
  { name: 'Carbon steel', k: 45, rho: 7850, cp: 460 },
  { name: 'Aluminium', k: 237, rho: 2702, cp: 903 },
  { name: 'Copper', k: 401, rho: 8933, cp: 385 },
]

export function MaterialStep({ sim }: { sim: Simulation }) {
  const { form, errors, derived } = sim
  const transient = form.problemType === 'transient'
  const alphaOk = Number.isFinite(derived.alpha) && derived.alpha > 0

  return (
    <div>
      <StepHeader
        step={3}
        title="Material properties"
        description={transient ? 'Conductivity, density and specific heat define the thermal diffusivity α = k/(ρCp).' : 'Thermal conductivity and (optional) uniform volumetric heat generation.'}
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Properties</CardTitle>
            <CardDescription>Constant, isotropic properties. Inputs are in SI units.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field id="k" label="Thermal conductivity" symbol="k" unit="W/m·K" value={form.k} onChange={(v) => sim.update({ k: v })} error={errors.k} />
            <Field
              id="qgen"
              label="Volumetric heat generation"
              symbol="q'''"
              unit="W/m³"
              value={form.qgen}
              onChange={(v) => sim.update({ qgen: v })}
              error={errors.qgen}
              hint="Enter 0 for no internal generation."
            />
            {transient && (
              <>
                <Field id="rho" label="Density" symbol="ρ" unit="kg/m³" value={form.rho} onChange={(v) => sim.update({ rho: v })} error={errors.rho} />
                <Field id="cp" label="Specific heat" symbol="Cp" unit="J/kg·K" value={form.cp} onChange={(v) => sim.update({ cp: v })} error={errors.cp} />
              </>
            )}
            <div className="sm:col-span-2">
              <div className="mb-1.5 text-xs font-medium text-slate-500">Quick presets</div>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => sim.update(transient ? { k: String(p.k), rho: String(p.rho), cp: String(p.cp) } : { k: String(p.k) })}
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{transient ? 'Thermal diffusivity' : 'Source term'}</CardTitle>
          </CardHeader>
          <CardContent>
            {transient ? (
              <>
                <div className="rounded bg-slate-50 px-3 py-2">
                  <Tex
                    block
                    math={
                      alphaOk
                        ? String.raw`\alpha = \frac{k}{\rho\,C_p} = \frac{${fmt(num(form.k))}}{(${fmt(num(form.rho))})(${fmt(num(form.cp))})}`
                        : String.raw`\alpha = \frac{k}{\rho\,C_p}`
                    }
                  />
                </div>
                <div className="mt-3 rounded border border-blue-200 bg-blue-50/60 px-4 py-3">
                  <div className="text-[12px] text-slate-600">α (computed)</div>
                  <div className="mt-1 font-mono text-xl text-blue-900 tabular">{alphaOk ? `${fmt(derived.alpha, 5)} m²/s` : '—'}</div>
                </div>
              </>
            ) : (
              <>
                <div className="rounded bg-slate-50 px-3 py-2">
                  <Tex block math={String.raw`\frac{q'''}{k}\,(\Delta x)^2 = ${Number.isFinite(derived.dx) && num(form.k) > 0 ? fmt((num(form.qgen) / num(form.k)) * derived.dx ** 2, 5) : '\\,?'}`} />
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-slate-500">
                  This value appears on the right-hand side of every interior-node equation. With q''' = 0 and constant k the exact solution is linear.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
