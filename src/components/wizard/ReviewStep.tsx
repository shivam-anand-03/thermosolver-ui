import { Pencil, Play } from 'lucide-react'
import { SolvingLoader } from '@/components/svg'
import { useEffect, useState } from 'react'
import { SlabDiagram } from '@/components/diagram/SlabDiagram'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Simulation } from '@/hooks/useSimulation'
import { validateInputs } from '@/lib/api'
import { num } from '@/lib/form'
import { formatTime, fmt } from '@/lib/format'
import { BC_META, fromMetres, TEMP_SYMBOL } from '@/lib/units'
import type { InputValidation } from '@/types/solver'
import { Callout, StepHeader } from './common'

function bcText(type: string, value: string, unit: string) {
  const meta = BC_META[type as keyof typeof BC_META]
  if (type === 'adiabatic') return "Adiabatic (q'' = 0)"
  return `${meta.short} = ${value} ${meta.unit(unit === '°C' ? 'C' : 'K')}${type === 'heat_flux' ? ' (in)' : ''}`
}

export function ReviewStep({ sim, onEdit, onRun }: { sim: Simulation; onEdit: () => void; onRun: () => void }) {
  const { form, derived, blocking, request, status } = sim
  const [serverState, setServer] = useState<InputValidation | null>(null)
  const server = blocking.length ? null : serverState
  const unit = TEMP_SYMBOL[form.tempUnit]
  const transient = form.problemType === 'transient'

  useEffect(() => {
    if (blocking.length) return
    let alive = true
    validateInputs(form.problemType, request)
      .then((v) => alive && setServer(v))
      .catch(() => alive && setServer(null))
    return () => {
      alive = false
    }
  }, [request, form.problemType, blocking.length])

  const rows: [string, string][] = [
    ['Type', transient ? 'Transient (fully implicit)' : 'Steady State'],
    ['Geometry', 'Plane slab (1-D)'],
    ['L', `${form.length} ${form.lengthUnit}`],
    ['Nodes', `${derived.N} (${derived.N - 1} intervals)`],
    ['Δx', `${fmt(fromMetres(derived.dx, form.lengthUnit), 5)} ${form.lengthUnit}`],
    ['k', `${form.k} W/m·K`],
    ["q'''", `${form.qgen || 0} W/m³`],
  ]
  if (transient) {
    rows.push(
      ['ρ', `${form.rho} kg/m³`],
      ['Cp', `${form.cp} J/kg·K`],
      ['α', `${fmt(derived.alpha, 5)} m²/s`],
      ['T(x,0)', form.initialType === 'uniform' ? `${form.initialValue} ${unit}` : 'custom nodal values'],
      ['Fo / Δt', `${fmt(derived.fo, 4)} / ${formatTime(derived.dt)}`],
      ['Time steps', `${derived.steps} → t = ${formatTime(derived.steps * derived.dt)}`],
    )
  }
  rows.push(
    ['Left BC', bcText(form.left.type, form.left.value, unit)],
    ['Right BC', bcText(form.right.type, form.right.value, unit)],
    ['Boundary scheme', form.scheme === 'first_order' ? 'First-order one-sided' : 'Second-order ghost node'],
  )

  return (
    <div>
      <StepHeader step={6} title="Review and solve" description="Check the problem definition. The inputs are validated again on the server before the system is assembled." />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Problem summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <dl className="divide-y text-[13px]">
              {rows.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 py-1.5">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-mono text-foreground tabular">{v}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardContent>
              <SlabDiagram
                className="w-full"
                nodes={derived.N}
                lengthM={derived.L > 0 ? derived.L : 1}
                lengthUnit={form.lengthUnit}
                left={{ type: form.left.type, value: num(form.left.value) }}
                right={{ type: form.right.type, value: num(form.right.value) }}
                tempUnit={form.tempUnit}
              />
            </CardContent>
          </Card>
          {blocking.length > 0 && (
            <Callout tone="error" title="Fix these inputs before solving">
              <ul className="list-disc pl-4">
                {blocking.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </Callout>
          )}
          {server && server.errors.length > 0 && (
            <Callout tone="error" title="Backend validation">
              <ul className="list-disc pl-4">
                {server.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </Callout>
          )}
          {server && server.warnings.length > 0 && (
            <Callout tone="warning" title="Notes">
              <ul className="list-disc pl-4">
                {server.warnings.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </Callout>
          )}
          {server?.valid && blocking.length === 0 && server.warnings.length === 0 && <Callout>Inputs are valid. Ready to assemble a {derived.N}×{derived.N} system.</Callout>}
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onEdit}>
              <Pencil /> Edit
            </Button>
            <Button size="lg" className="flex-1 sm:flex-none" disabled={blocking.length > 0 || server?.valid === false || status === 'solving'} onClick={onRun}>
              {status === 'solving' ? <SolvingLoader /> : <Play />}
              {status === 'solving' ? 'Solving…' : 'Run solver'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
