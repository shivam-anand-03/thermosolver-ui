import { AlertTriangle } from 'lucide-react'
import { SlabDiagram } from '@/components/diagram/SlabDiagram'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fixed, fmt, formatTime } from '@/lib/format'
import { SERIES } from '@/lib/palette'
import type { Example, LengthUnit, SimulationResult } from '@/types/solver'
import { ProfileChart, type TempDisplay } from './charts'
import { ReferenceComparison } from './ReferenceComparison'
import { TransientPlayer } from './TransientViews'

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-2 py-1 text-[13px]">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-mono break-words text-slate-900 tabular">{value}</dd>
    </div>
  )
}

export function OverviewTab({
  result,
  temp,
  xUnit,
  xScale,
  example,
}: {
  result: SimulationResult
  temp: TempDisplay
  xUnit: LengthUnit
  xScale: number
  example: Example | null
}) {
  const s = result.summary
  const inp = result.inputs as Record<string, number | string>
  const transient = result.problem_type === 'transient'
  const bc = result.boundary_conditions
  const rows = result.nodes.length > 12 ? [...result.nodes.slice(0, 6), null, ...result.nodes.slice(-5)] : result.nodes

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Problem</CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              <Info label="Type" value={transient ? 'Transient (implicit)' : 'Steady state'} />
              <Info label="L" value={`${inp.length} ${inp.length_unit}`} />
              <Info label="Nodes" value={`${s.nodes} (${s.intervals} intervals)`} />
              <Info label="Δx" value={`${fmt(s.dx * xScale, 5)} ${xUnit}`} />
              {transient && <Info label="Δt / Fo" value={`${formatTime(s.dt!)} / ${fmt(s.fourier!, 4)}`} />}
              {transient && <Info label="Steps" value={`${s.time_steps} → ${formatTime(s.final_time!)}`} />}
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Material</CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              <Info label="k" value={`${inp.thermal_conductivity} W/m·K`} />
              <Info label="q'''" value={`${inp.heat_generation} W/m³`} />
              {transient && <Info label="ρ" value={`${inp.density} kg/m³`} />}
              {transient && <Info label="Cp" value={`${inp.specific_heat} J/kg·K`} />}
              {transient && <Info label="α" value={`${fmt(s.alpha!, 5)} m²/s`} />}
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Boundary conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              <Info label="Left" value={bc.left.description} />
              <Info label="Right" value={bc.right.description} />
              <Info label="Scheme" value={s.scheme === 'first_order' ? '1st-order one-sided' : '2nd-order ghost node'} />
              <Info label="T range" value={`${fixed(temp.conv(s.t_min), 2)} – ${fixed(temp.conv(s.t_max), 2)} ${temp.symbol}`} />
            </dl>
          </CardContent>
        </Card>
      </div>

      {result.warnings.length > 0 && (
        <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
          {result.warnings.map((w) => (
            <div key={w} className="flex gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {w}
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{transient ? 'Temperature profile over time' : 'Temperature vs position'}</CardTitle>
          </CardHeader>
          <CardContent>
            {transient ? (
              <TransientPlayer result={result} temp={temp} xUnit={xUnit} xScale={xScale} height={280} />
            ) : (
              <ProfileChart x={result.x} xUnit={xUnit} xScale={xScale} temp={temp} series={[{ key: 'T', name: 'T', values: result.solution, color: SERIES[0] }]} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Temperature distribution{transient && ` at t = ${formatTime(result.final_time)}`}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded border border-slate-200">
              <table className="w-full text-[13px] tabular">
                <thead className="bg-slate-50 text-left text-xs text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Node</th>
                    <th className="px-3 py-2 font-medium">x [{xUnit}]</th>
                    <th className="px-3 py-2 text-right font-medium">T [{temp.symbol}]</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) =>
                    r === null ? (
                      <tr key={`gap-${i}`} className="border-t border-slate-100">
                        <td colSpan={3} className="px-3 py-1 text-center text-xs text-slate-400">
                          ⋮ {result.nodes.length - 11} more nodes (see Data tab)
                        </td>
                      </tr>
                    ) : (
                      <tr key={r.index} className="border-t border-slate-100">
                        <td className="px-3 py-1.5 font-medium">{r.index}</td>
                        <td className="px-3 py-1.5 font-mono text-slate-600">{fmt(r.x * xScale, 5)}</td>
                        <td className="px-3 py-1.5 text-right font-mono font-medium">{fixed(temp.conv(r.temperature), 2)}</td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Solved slab</CardTitle>
        </CardHeader>
        <CardContent>
          <SlabDiagram
            className="w-full"
            nodes={result.nodes.length}
            lengthM={result.length_m}
            lengthUnit={xUnit}
            left={bc.left}
            right={bc.right}
            tempUnit={s.temperature_unit}
            temperatures={result.solution}
          />
          <p className="mt-2 text-xs text-slate-600">{result.explanation.summary}</p>
        </CardContent>
      </Card>

      {example?.reference && <ReferenceComparison result={result} example={example} temp={temp} />}
    </div>
  )
}
