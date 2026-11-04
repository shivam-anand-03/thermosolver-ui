import { Tex } from '@/components/math/Tex'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupCard } from '@/components/ui/radio-group'
import { Hint } from '@/components/ui/tooltip'
import { Callout } from '@/components/wizard/common'
import { fmt } from '@/lib/format'
import { cn } from '@/lib/utils'
import { BC_INFO, FACE_INFO, FLUIDS, LIMITS, PHYSICS_INFO, SOLIDS, activeMaterial, facesFor, governingLatex, nodeCount, spacing } from '../defaults'
import { BCLegend, DomainDiagram } from '../DomainDiagram'
import type { BCType, Dim, Face, Material, Physics } from '../types'
import { SourceEditor } from '../source/SourceEditor'
import { ChoiceCards, KV, NumField, PhaseStepHeader, Section, Select } from '../ui'
import type { Workflow } from '../useWorkflow'

const PHASE = 'Phase I · Preprocessor'

export function PhysicsCards({ wf }: { wf: Workflow }) {
  const { setup, update } = wf
  return (
    <ChoiceCards<Physics>
      label="Heat transfer mode"
      value={setup.preprocessor.problem.physics}
      onChange={(v) =>
        update((d) => {
          d.preprocessor.problem.physics = v
          if (v === 'convection' && d.solver.discretization === 'fem') d.solver.discretization = 'fvm'
          if (v !== 'conduction' && !d.preprocessor.velocity.u && !d.preprocessor.velocity.v && !d.preprocessor.velocity.w) d.preprocessor.velocity.u = 0.01
        })
      }
      options={(Object.keys(PHYSICS_INFO) as Physics[]).map((p) => ({
        value: p,
        title: PHYSICS_INFO[p].label,
        description: PHYSICS_INFO[p].description,
        math: governingLatex(p, false, 1),
      }))}
    />
  )
}

// ---------------------------------------------------------------- I. Problem
export function ProblemStatementStep({ wf }: { wf: Workflow }) {
  const { setup, update } = wf
  const pb = setup.preprocessor.problem
  return (
    <div className="space-y-5">
      <PhaseStepHeader phase={PHASE} roman="I" title="Problem statement" description="Name the problem, choose what physics governs it, whether it changes in time, how many space dimensions it has, and how heat is generated inside it." />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Problem title</Label>
        <Input id="title" value={pb.title} onChange={(e) => update((d) => void (d.preprocessor.problem.title = e.target.value))} className="max-w-lg font-sans" />
      </div>

      <Section title="Heat transfer mode" description="Diffusion (heat conduction), convection–diffusion, or pure convection.">
        <PhysicsCards wf={wf} />
      </Section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Section title="Time dependence">
          <ChoiceCards
            label="Time dependence"
            columns={2}
            value={pb.time_mode}
            onChange={(v) => update((d) => void (d.preprocessor.problem.time_mode = v))}
            options={[
              { value: 'steady', title: 'Steady state', description: '∂T/∂t = 0. One linear system [A]{T} = {B}.' },
              { value: 'transient', title: 'Unsteady (transient)', description: 'March in time from an initial field; one solve per time step.' },
            ]}
          />
        </Section>
        <Section title="Dimension">
          <ChoiceCards<Dim>
            label="Dimension"
            value={pb.dimension}
            onChange={(v) => update((d) => void (d.preprocessor.problem.dimension = v))}
            options={[
              { value: 1, title: '1-D', description: 'Slab, rod, duct' },
              { value: 2, title: '2-D', description: 'Plate, channel' },
              { value: 3, title: '3-D', description: 'Block' },
            ]}
          />
        </Section>
      </div>

      <Section title="Volumetric heat generation" description="A constant or any function of position, plus a part proportional to T. Type plain maths or LaTeX.">
        <SourceEditor wf={wf} />
      </Section>

      <Section title="Governing equation">
        <div className="text-[15px]">
          <Tex block math={governingLatex(pb.physics, pb.time_mode === 'transient', pb.dimension, pb.source.expression != null)} />
        </div>
        <p className="mt-1 text-[12.5px] text-slate-500">
          The βT term is moved to the left-hand side, so it adds <Tex math={String.raw`-\beta`} /> to the diagonal of [A]. No iteration is needed.
        </p>
      </Section>
    </div>
  )
}

// ------------------------------------------------------------ II. Geometry
export function GeometryStep({ wf }: { wf: Workflow }) {
  const { setup, update } = wf
  const dim = setup.preprocessor.problem.dimension
  const g = setup.preprocessor.geometry
  const h = spacing(setup)
  const n = nodeCount(setup)
  const cell = setup.solver.discretization === 'fvm'
  const limit = setup.solver.linear_solver === 'gauss_seidel' ? LIMITS.iterative : LIMITS.direct
  const axes = [
    { key: 'length', nkey: 'nx', label: 'Length', sym: 'L', ax: 'x' },
    { key: 'width', nkey: 'ny', label: 'Width', sym: 'W', ax: 'y' },
    { key: 'height', nkey: 'nz', label: 'Height', sym: 'H', ax: 'z' },
  ] as const
  return (
    <div className="space-y-5">
      <PhaseStepHeader phase={PHASE} roman="II" title="Geometry and grid generation" description="Size of the box-shaped domain and the number of nodes along each axis. The structured grid is generated from these." />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <Section title="Domain size">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {axes.map((a, i) => (
                <NumField key={a.key} label={`${a.label} (${a.ax})`} symbol={a.sym} unit="m" min={0} disabled={i >= dim} value={g[a.key]} onChange={(v) => update((d) => void (d.preprocessor.geometry[a.key] = v))} />
              ))}
            </div>
          </Section>
          <Section title="Number of nodes" description={dim < 3 ? 'Unused directions are greyed out.' : 'Keep 3-D grids modest: every node is one equation.'}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {axes.map((a, i) => (
                <NumField
                  key={a.nkey}
                  label={`Along ${a.ax}`}
                  symbol={`N_${a.ax}`}
                  integer
                  min={2}
                  max={LIMITS.perAxis}
                  disabled={i >= dim}
                  value={g[a.nkey]}
                  onChange={(v) => update((d) => void (d.preprocessor.geometry[a.nkey] = v))}
                  hint={i < dim ? <>Δ{a.ax} = {fmt(h[i], 4)} m</> : undefined}
                />
              ))}
            </div>
          </Section>
          <Section title="Grid summary">
            <KV
              rows={[
                ['Grid type', cell ? 'Cell-centred (FVM): nodes at control-volume centres' : 'Vertex (FDM / FEM): nodes on the faces too'],
                ['Spacing', cell ? 'Δ = L / N' : 'Δ = L / (N − 1)'],
                ...h.map((v, i): [string, string] => [`Δ${'xyz'[i]}`, `${fmt(v, 5)} m`]),
                ['Total nodes (unknowns)', n.toLocaleString()],
                ['Coefficient matrix', `${n.toLocaleString()} × ${n.toLocaleString()}`],
              ]}
            />
            {n > limit && (
              <Callout tone="error" className="mt-3">
                {n.toLocaleString()} unknowns exceed the limit for the selected matrix solver ({limit.toLocaleString()}). Reduce the grid
                {setup.solver.linear_solver !== 'gauss_seidel' && ' or switch to Gauss–Seidel'}.
              </Callout>
            )}
          </Section>
        </div>
        <Section title="Grid preview">
          <DomainDiagram setup={setup} className="w-full" />
          <div className="mt-2">
            <BCLegend />
          </div>
        </Section>
      </div>
    </div>
  )
}

// ------------------------------------------------------- III. Phenomena
export function PhenomenaStep({ wf }: { wf: Workflow }) {
  const { setup, update } = wf
  const p = setup.preprocessor
  const dim = p.problem.dimension
  const mat = activeMaterial(setup)
  const conv = p.problem.physics !== 'conduction'
  const vel = [p.velocity.u, p.velocity.v, p.velocity.w].slice(0, dim)
  const speed = Math.hypot(...vel)
  const L = Math.max(p.geometry.length, ...(dim > 1 ? [p.geometry.width] : []), ...(dim > 2 ? [p.geometry.height] : []))
  const h = spacing(setup)
  const rc = mat.rho * mat.cp
  const pe = conv && p.problem.physics !== 'convection' && mat.k > 0 ? (rc * speed * L) / mat.k : null
  const cellPe = pe !== null ? Math.max(...vel.map((u, i) => (rc * Math.abs(u) * h[i]) / mat.k)) : null
  return (
    <div className="space-y-5">
      <PhaseStepHeader phase={PHASE} roman="III" title="Physical phenomena mode" description="Choose conduction, convection–conduction or convection, and set the flow velocity for the convective modes." />
      <Section title="Mode">
        <PhysicsCards wf={wf} />
      </Section>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Section title="Velocity field" description={conv ? 'Uniform, prescribed velocity (the flow field is not solved for).' : 'Not used in conduction mode.'}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(['u', 'v', 'w'] as const).map((c, i) => (
              <NumField key={c} label={`${c} (${'xyz'[i]})`} symbol={c} unit="m/s" disabled={!conv || i >= dim} value={p.velocity[c]} onChange={(v) => update((d) => void (d.preprocessor.velocity[c] = v))} />
            ))}
          </div>
        </Section>
        <Section title="Dimensionless groups">
          <KV
            rows={[
              ['Thermal diffusivity α = k/ρc_p', `${fmt(mat.k / rc, 4)} m²/s`],
              ['Heat capacity ρc_p', `${fmt(rc, 4)} J/m³·K`],
              ...(pe !== null
                ? ([
                    ['Péclet number Pe = ρc_p|u|L/k', fmt(pe, 4)],
                    ['Cell Péclet (max)', fmt(cellPe ?? 0, 4)],
                  ] as [string, string][])
                : []),
            ]}
          />
          {cellPe !== null && cellPe > 2 && (
            <Callout tone="warning" className="mt-3">
              Cell Péclet {fmt(cellPe, 3)} &gt; 2: central differencing will oscillate. Use upwind or hybrid in Phase II, or refine the grid.
            </Callout>
          )}
          {p.problem.physics === 'convection' && (
            <Callout className="mt-3">Pure convection has no diffusion. Information travels only downstream, so the upstream face needs an inflow temperature.</Callout>
          )}
        </Section>
      </div>
    </div>
  )
}

// -------------------------------------------------------- IV. Materials
function MaterialCard({ title, mat, presets, active, onChange, kDisabled }: { title: string; mat: Material; presets: Material[]; active: boolean; onChange: (m: Material) => void; kDisabled?: boolean }) {
  return (
    <Section
      title={title}
      className={cn(!active && 'opacity-60')}
      aside={active ? <Badge variant="success">Used by this mode</Badge> : <Badge variant="neutral">Not used</Badge>}
    >
      <Select
        label="Preset"
        value={presets.some((p) => p.name === mat.name) ? mat.name : 'custom'}
        onChange={(name) => {
          const p = presets.find((x) => x.name === name)
          if (p) onChange({ ...p })
        }}
        options={[...presets.map((p) => ({ value: p.name, label: p.name })), { value: 'custom', label: 'Custom' }]}
        className="mb-4"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <NumField label="Conductivity" symbol="k" unit="W/m·K" min={0} disabled={kDisabled} value={mat.k} onChange={(k) => onChange({ ...mat, k, name: 'custom' })} hint={kDisabled ? 'k = 0 in pure convection' : undefined} />
        <NumField label="Density" symbol="\rho" unit="kg/m³" min={0} value={mat.rho} onChange={(rho) => onChange({ ...mat, rho, name: 'custom' })} />
        <NumField label="Specific heat" symbol="c_p" unit="J/kg·K" min={0} value={mat.cp} onChange={(cp) => onChange({ ...mat, cp, name: 'custom' })} />
      </div>
      <p className="mt-3 text-[12px] text-slate-500">
        α = k/ρc<sub>p</sub> = <span className="font-mono text-slate-700">{fmt(mat.k / (mat.rho * mat.cp), 4)} m²/s</span>
      </p>
    </Section>
  )
}

export function MaterialStep({ wf }: { wf: Workflow }) {
  const { setup, update } = wf
  const which = PHYSICS_INFO[setup.preprocessor.problem.physics].material
  return (
    <div className="space-y-5">
      <PhaseStepHeader phase={PHASE} roman="IV" title="Material properties" description="Fluid and solid properties. Conduction uses the solid; the convective modes use the fluid." />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <MaterialCard title="Solid" mat={setup.preprocessor.solid} presets={SOLIDS} active={which === 'solid'} onChange={(m) => update((d) => void (d.preprocessor.solid = m))} />
        <MaterialCard
          title="Fluid"
          mat={setup.preprocessor.fluid}
          presets={FLUIDS}
          active={which === 'fluid'}
          kDisabled={setup.preprocessor.problem.physics === 'convection'}
          onChange={(m) => update((d) => void (d.preprocessor.fluid = m))}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------- V. Initial & boundary conditions
const THERMAL: BCType[] = ['temperature', 'heat_flux', 'convection']
const FLOW: BCType[] = ['inflow', 'insulated', 'outflow']

const SHORT: Record<BCType, string> = {
  temperature: 'Temperature',
  heat_flux: 'Heat flux',
  convection: 'Convection',
  inflow: 'Inflow',
  insulated: 'Wall',
  outflow: 'Outflow',
}

function FaceEditor({ wf, face }: { wf: Workflow; face: Face }) {
  const { setup, update } = wf
  const bc = setup.preprocessor.boundaries[face]
  const unit = setup.preprocessor.temperature_unit === 'C' ? '°C' : 'K'
  const set = (fn: (b: typeof bc) => void) => update((d) => fn(d.preprocessor.boundaries[face]))
  const group = (title: string, types: BCType[]) => (
    <div>
      <div className="mb-1 text-[10.5px] font-semibold tracking-wide text-slate-400 uppercase">{title}</div>
      <RadioGroup
        className="grid grid-cols-3 gap-1"
        aria-label={`${FACE_INFO[face].name} ${title} condition`}
        // one selection spans both groups: this group shows nothing checked when the type is in the other one
        value={types.includes(bc.type) ? bc.type : ''}
        onValueChange={(v) => set((b) => void (b.type = v as BCType))}
      >
        {types.map((t) => {
          const on = bc.type === t
          return (
            <Hint key={t} label={`${BC_INFO[t].label}: ${BC_INFO[t].hint}`}>
              <RadioGroupCard
                value={t}
                className="block truncate px-1.5 py-1.5 text-center text-[12px] font-medium text-muted-foreground data-[state=checked]:text-white data-[state=checked]:shadow-sm data-[state=checked]:ring-0"
                style={on ? { background: BC_INFO[t].color, borderColor: BC_INFO[t].color } : undefined}
              >
                {SHORT[t]}
              </RadioGroupCard>
            </Hint>
          )
        })}
      </RadioGroup>
    </div>
  )
  return (
    <Card>
      <CardContent className="flex flex-col p-3.5">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-block h-4 w-1.5 rounded" style={{ background: BC_INFO[bc.type].color }} />
          <span className="text-[13.5px] font-semibold text-foreground">{FACE_INFO[face].name}</span>
          <span className="font-mono text-[12px] text-muted-foreground">{FACE_INFO[face].where}</span>
          <span className="ml-auto truncate text-[11.5px] text-muted-foreground">{BC_INFO[bc.type].label}</span>
        </div>
        <div className="space-y-2.5">
          {group('Thermal', THERMAL)}
          {group('Flow', FLOW)}
        </div>
        <div className="mt-3.5 grid gap-3 border-t pt-3 [grid-template-columns:repeat(auto-fit,minmax(170px,1fr))]">
          {(bc.type === 'temperature' || bc.type === 'inflow') && (
            <NumField label={bc.type === 'inflow' ? 'Inlet temperature' : 'Surface temperature'} symbol={bc.type === 'inflow' ? 'T_{in}' : 'T_s'} unit={unit} value={bc.value} onChange={(v) => set((b) => void (b.value = v))} />
          )}
          {bc.type === 'heat_flux' && <NumField label="Heat flux in" symbol="q''" unit="W/m²" value={bc.value} onChange={(v) => set((b) => void (b.value = v))} hint="Positive = heat enters the domain." />}
          {bc.type === 'convection' && (
            <>
              <NumField label="Coefficient" symbol="h" unit="W/m²K" min={0} value={bc.h} onChange={(v) => set((b) => void (b.h = v))} />
              <NumField label="Ambient" symbol="T_\infty" unit={unit} value={bc.t_inf} onChange={(v) => set((b) => void (b.t_inf = v))} />
            </>
          )}
          {(bc.type === 'insulated' || bc.type === 'outflow') && <p className="py-1 text-[12px] text-muted-foreground">{BC_INFO[bc.type].hint}. No value needed.</p>}
        </div>
      </CardContent>
    </Card>
  )
}

export function BoundaryStep({ wf }: { wf: Workflow }) {
  const { setup, update } = wf
  const p = setup.preprocessor
  const faces = facesFor(p.problem.dimension)
  const unit = p.temperature_unit === 'C' ? '°C' : 'K'
  return (
    <div className="space-y-5">
      <PhaseStepHeader
        phase={PHASE}
        roman="V"
        title="Initial and boundary conditions"
        description="Thermal conditions: temperature, heat flux, or convective heat transfer. Flow conditions for the convective modes: inflow, wall and outflow."
      />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Section title="Initial condition" description={p.problem.time_mode === 'transient' ? 'Uniform temperature of the whole domain at t = 0.' : 'Only used for unsteady problems; steady problems start from the initial guess set in Phase II.'}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <NumField label="Initial temperature" symbol="T(\mathbf{x},0)" unit={unit} value={p.initial_temperature} onChange={(v) => update((d) => void (d.preprocessor.initial_temperature = v))} disabled={p.problem.time_mode !== 'transient'} />
              <Select
                label="Temperature unit"
                value={p.temperature_unit}
                onChange={(v) => update((d) => void (d.preprocessor.temperature_unit = v))}
                options={[
                  { value: 'C', label: 'Degrees Celsius (°C)' },
                  { value: 'K', label: 'Kelvin (K)' },
                ]}
              />
            </div>
          </Section>
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(290px,1fr))]">
            {faces.map((f) => (
              <FaceEditor key={f} wf={wf} face={f} />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Section title="Boundary map">
            <DomainDiagram setup={setup} className="w-full" />
            <div className="mt-2">
              <BCLegend />
            </div>
          </Section>
          <Section title="Flow boundaries">
            <ul className="space-y-2 text-[12.5px] text-slate-600">
              <li>
                <b className="text-slate-800">Inflow:</b> fluid enters with a known temperature <Tex math="T_{in}" />.
              </li>
              <li>
                <b className="text-slate-800">Wall:</b> no flow through it and no heat flux (insulated).
              </li>
              <li>
                <b className="text-slate-800">Outflow:</b> fully developed, <Tex math={String.raw`\partial T/\partial n = 0`} />.
              </li>
            </ul>
          </Section>
        </div>
      </div>
    </div>
  )
}
