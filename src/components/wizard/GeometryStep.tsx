import { Tex } from '@/components/math/Tex'
import { SlabDiagram } from '@/components/diagram/SlabDiagram'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, UnitSelect } from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Simulation } from '@/hooks/useSimulation'
import { num } from '@/lib/form'
import { fmt } from '@/lib/format'
import { fromMetres } from '@/lib/units'
import type { LengthUnit } from '@/types/solver'
import { Callout, Stat, StepHeader } from './common'

export function GeometryStep({ sim }: { sim: Simulation }) {
  const { form, derived, errors } = sim
  const ok = Number.isFinite(derived.dx) && derived.N >= 2
  const u = form.lengthUnit
  const shownRows = ok ? Math.min(derived.N, 400) : 0

  return (
    <div>
      <StepHeader step={2} title="Geometry and mesh" description="Define the slab length and the number of nodes. The grid spacing Δx follows automatically from Δx = L/(N−1)." />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Domain</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field
              id="length"
              label="Length"
              symbol="L"
              value={form.length}
              onChange={(v) => sim.update({ length: v })}
              error={errors.length}
              unitSlot={<UnitSelect<LengthUnit> label="Length unit" value={u} onChange={(v) => sim.update({ lengthUnit: v })} options={['m', 'cm', 'mm']} />}
            />
            {!form.customMesh ? (
              <Field
                id="nodes"
                label="Number of nodes"
                symbol="N"
                unit="nodes"
                inputMode="numeric"
                value={form.nodes}
                onChange={(v) => sim.update({ nodes: v })}
                error={errors.nodes}
                hint="Supports 2 – 2000 nodes. Matrices are shown in full up to N = 100."
              />
            ) : (
              <Field
                id="dx"
                label="Grid spacing"
                symbol="Δx"
                unit={u}
                value={form.dx}
                onChange={(v) => sim.update({ dx: v })}
                error={errors.dx}
                hint={
                  !derived.meshExact && ok
                    ? `L/Δx is not a whole number: N rounded to ${derived.N}, Δx adjusted to ${fmt(fromMetres(derived.dx, u), 5)} ${u}.`
                    : 'N is computed from L and Δx.'
                }
              />
            )}
            <div className="flex items-center justify-between rounded-md border px-3 py-2.5">
              <div>
                <Label htmlFor="custom-mesh">Advanced / custom mesh</Label>
                <p className="text-xs text-muted-foreground">Enter Δx instead of N</p>
              </div>
              <Switch
                id="custom-mesh"
                checked={form.customMesh}
                onCheckedChange={(c) =>
                  sim.update({
                    customMesh: c,
                    dx: ok ? String(Number(fromMetres(derived.dx, u).toPrecision(6))) : form.dx,
                    nodes: c ? form.nodes : String(derived.N),
                  })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
              <Stat label="L" value={`${fmt(num(form.length), 5)} ${u}`} />
              <Stat label="N" value={ok ? `${derived.N}` : '—'} sub="nodes" />
              <Stat label="Mesh" value={ok ? `${derived.N - 1}` : '—'} sub="intervals" />
              <Stat label="Δx" value={ok ? `${fmt(fromMetres(derived.dx, u), 5)} ${u}` : '—'} sub={ok && u !== 'm' ? `${fmt(derived.dx, 4)} m` : undefined} accent />
            </div>
            <div className="rounded bg-slate-50 px-3 py-1 text-slate-800">
              <Tex
                block
                math={
                  ok
                    ? String.raw`\Delta x = \frac{L}{N-1} = \frac{${fmt(num(form.length), 6)}\,\text{${u}}}{${derived.N}-1} = ${fmt(fromMetres(derived.dx, u), 6)}\,\text{${u}}`
                    : String.raw`\Delta x = \frac{L}{N-1}`
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex min-w-0 flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Computational domain</CardTitle>
            </CardHeader>
            <CardContent>
              <SlabDiagram
                className="w-full"
                nodes={derived.N}
                lengthM={ok ? derived.L : 1}
                lengthUnit={u}
                left={{ type: form.left.type, value: num(form.left.value) }}
                right={{ type: form.right.type, value: num(form.right.value) }}
                tempUnit={form.tempUnit}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Node coordinates</CardTitle>
            </CardHeader>
            <CardContent>
              {ok ? (
                <Table containerClassName="max-h-64 overflow-auto rounded-md border" className="text-[13px] tabular">
                  <TableHeader className="sticky top-0 z-10 bg-muted">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="px-3">Node</TableHead>
                      <TableHead className="px-3">x-coordinate</TableHead>
                      <TableHead className="px-3">x [{u}]</TableHead>
                      <TableHead className="px-3">Unknown</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: shownRows }, (_, i) => (
                      <TableRow key={i}>
                        <TableCell className="px-3 font-medium">{i + 1}</TableCell>
                        <TableCell className="px-3 text-muted-foreground">
                          <Tex math={i === 0 ? '0' : i === derived.N - 1 ? 'L' : i === 1 ? String.raw`\Delta x` : String.raw`${i}\Delta x`} />
                        </TableCell>
                        <TableCell className="px-3 font-mono">{fmt(fromMetres(i * derived.dx, u), 6)}</TableCell>
                        <TableCell className="px-3">
                          <Tex math={`T_{${i + 1}}`} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Callout tone="warning">Enter a valid length and node count to generate the mesh.</Callout>
              )}
              {ok && derived.N > shownRows && <p className="mt-2 text-xs text-slate-500">Showing the first {shownRows} of {derived.N} nodes.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
