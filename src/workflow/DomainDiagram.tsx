import { fmt } from '@/lib/format'
import { BC_INFO, FACE_INFO, facesFor } from './defaults'
import type { Face, FaceBC, Setup } from './types'

function bcText(bc: FaceBC, unit: string): string {
  switch (bc.type) {
    case 'temperature':
      return `T = ${fmt(bc.value, 4)} ${unit}`
    case 'inflow':
      return `Inflow, T = ${fmt(bc.value, 4)} ${unit}`
    case 'heat_flux':
      return `q″ = ${fmt(bc.value, 4)} W/m²`
    case 'convection':
      return `h = ${fmt(bc.h, 4)}, T∞ = ${fmt(bc.t_inf, 4)}`
    case 'outflow':
      return 'Outflow'
    default:
      return 'Wall (q″ = 0)'
  }
}

const range = (n: number, max = 40) => {
  if (n <= max) return Array.from({ length: n }, (_, i) => i)
  const step = (n - 1) / (max - 1)
  return Array.from({ length: max }, (_, i) => Math.round(i * step))
}

/** Schematic of the computational domain, grid and boundary conditions. */
export function DomainDiagram({ setup, className, compact = false, highlight }: { setup: Setup; className?: string; compact?: boolean; highlight?: Face | null }) {
  const p = setup.preprocessor
  const dim = p.problem.dimension
  const unit = p.temperature_unit === 'C' ? '°C' : 'K'
  const g = p.geometry
  const vel = p.problem.physics !== 'conduction' ? [p.velocity.u, p.velocity.v, p.velocity.w] : [0, 0, 0]
  const stroke = (f: Face) => BC_INFO[p.boundaries[f].type].color
  const width = (f: Face) => (highlight === f ? 6 : 4)

  if (dim === 1) {
    const N = Math.max(2, g.nx)
    const x0 = 70
    const x1 = 330
    const xs = range(N, 41).map((i) => x0 + (i / (N - 1)) * (x1 - x0))
    return (
      <svg viewBox="0 0 400 130" className={className} role="img" aria-label="1-D domain">
        <rect x={x0} y={42} width={x1 - x0} height={30} fill="var(--ui-domain)" stroke="var(--ui-faint)" />
        <line x1={x0} x2={x0} y1={34} y2={80} stroke={stroke('x_min')} strokeWidth={width('x_min')} />
        <line x1={x1} x2={x1} y1={34} y2={80} stroke={stroke('x_max')} strokeWidth={width('x_max')} />
        {xs.map((x, i) => (
          <circle key={i} cx={x} cy={57} r={2.6} fill="var(--ui-accent)" />
        ))}
        {vel[0] !== 0 && <Arrow x1={170} y1={22} x2={230} y2={22} label={`u = ${fmt(vel[0], 3)} m/s`} flip={vel[0] < 0} />}
        <text x={x0} y={98} textAnchor="middle" className="fill-slate-500 text-[10px]">x = 0</text>
        <text x={x1} y={98} textAnchor="middle" className="fill-slate-500 text-[10px]">x = L = {fmt(g.length, 3)} m</text>
        {!compact && (
          <>
            <text x={x0 - 6} y={118} textAnchor="start" className="fill-slate-700 text-[10px]">{bcText(p.boundaries.x_min, unit)}</text>
            <text x={x1 + 6} y={118} textAnchor="end" className="fill-slate-700 text-[10px]">{bcText(p.boundaries.x_max, unit)}</text>
          </>
        )}
      </svg>
    )
  }

  if (dim === 2) {
    const aspect = Math.min(2.2, Math.max(0.35, g.width / g.length))
    const W = 260
    const H = Math.min(220, W * aspect)
    const w = H / aspect > W ? W : H / aspect
    const ox = 70
    const oy = 30
    const xs = range(g.nx).map((i) => (i / (g.nx - 1)) * w)
    const ys = range(g.ny).map((j) => (j / (g.ny - 1)) * H)
    return (
      <svg viewBox={`0 0 400 ${H + 80}`} className={className} role="img" aria-label="2-D domain">
        <rect x={ox} y={oy} width={w} height={H} fill="var(--ui-domain)" />
        {xs.map((x, i) => (
          <line key={`x${i}`} x1={ox + x} x2={ox + x} y1={oy} y2={oy + H} stroke="var(--ui-domain-grid)" strokeWidth={0.7} />
        ))}
        {ys.map((y, j) => (
          <line key={`y${j}`} x1={ox} x2={ox + w} y1={oy + H - y} y2={oy + H - y} stroke="var(--ui-domain-grid)" strokeWidth={0.7} />
        ))}
        <line x1={ox} x2={ox} y1={oy} y2={oy + H} stroke={stroke('x_min')} strokeWidth={width('x_min')} />
        <line x1={ox + w} x2={ox + w} y1={oy} y2={oy + H} stroke={stroke('x_max')} strokeWidth={width('x_max')} />
        <line x1={ox} x2={ox + w} y1={oy + H} y2={oy + H} stroke={stroke('y_min')} strokeWidth={width('y_min')} />
        <line x1={ox} x2={ox + w} y1={oy} y2={oy} stroke={stroke('y_max')} strokeWidth={width('y_max')} />
        {(vel[0] !== 0 || vel[1] !== 0) && (
          <Arrow
            x1={ox + w / 2 - (24 * vel[0]) / Math.hypot(vel[0], vel[1])}
            y1={oy + H / 2 + (24 * vel[1]) / Math.hypot(vel[0], vel[1])}
            x2={ox + w / 2 + (24 * vel[0]) / Math.hypot(vel[0], vel[1])}
            y2={oy + H / 2 - (24 * vel[1]) / Math.hypot(vel[0], vel[1])}
            label="u"
          />
        )}
        <text x={ox + w / 2} y={oy + H + 16} textAnchor="middle" className="fill-slate-500 text-[10px]">L = {fmt(g.length, 3)} m · {g.nx} nodes</text>
        <text x={ox - 10} y={oy + H / 2} textAnchor="middle" transform={`rotate(-90 ${ox - 10} ${oy + H / 2})`} className="fill-slate-500 text-[10px]">
          W = {fmt(g.width, 3)} m · {g.ny}
        </text>
        {!compact && (
          <>
            <text x={ox + w / 2} y={oy - 8} textAnchor="middle" className="fill-slate-700 text-[10px]">Top: {bcText(p.boundaries.y_max, unit)}</text>
            <text x={ox + w / 2} y={oy + H + 32} textAnchor="middle" className="fill-slate-700 text-[10px]">Bottom: {bcText(p.boundaries.y_min, unit)}</text>
            <text x={ox + w + 8} y={oy + H / 2} className="fill-slate-700 text-[10px]">Right</text>
            <text x={ox + w + 8} y={oy + H / 2 + 12} className="fill-slate-500 text-[9.5px]">{BC_INFO[p.boundaries.x_max.type].label.split(' ')[0]}</text>
          </>
        )}
      </svg>
    )
  }

  // 3-D oblique box: front (z = H), right (x = L) and top (y = W) faces are visible
  const s = 150 / Math.max(g.length, g.width, g.height)
  const L = g.length * s
  const Wd = g.width * s
  const D = g.height * s * 0.55
  const ox = 90
  const oy = 40 + D
  const front = `${ox},${oy} ${ox + L},${oy} ${ox + L},${oy + Wd} ${ox},${oy + Wd}`
  const top = `${ox},${oy} ${ox + D},${oy - D} ${ox + L + D},${oy - D} ${ox + L},${oy}`
  const right = `${ox + L},${oy} ${ox + L + D},${oy - D} ${ox + L + D},${oy + Wd - D} ${ox + L},${oy + Wd}`
  return (
    <div className={className}>
      <svg viewBox={`0 0 400 ${Wd + D + 70}`} className="w-full" role="img" aria-label="3-D domain">
        <polygon points={front} fill={stroke('z_max')} fillOpacity={0.18} stroke={stroke('z_max')} strokeWidth={highlight === 'z_max' ? 3 : 1.5} />
        <polygon points={top} fill={stroke('y_max')} fillOpacity={0.18} stroke={stroke('y_max')} strokeWidth={highlight === 'y_max' ? 3 : 1.5} />
        <polygon points={right} fill={stroke('x_max')} fillOpacity={0.18} stroke={stroke('x_max')} strokeWidth={highlight === 'x_max' ? 3 : 1.5} />
        <text x={ox + L / 2} y={oy + Wd / 2 + 4} textAnchor="middle" className="fill-slate-700 text-[10px]">Front z = H</text>
        <text x={ox + L / 2 + D / 2} y={oy - D / 2 + 3} textAnchor="middle" className="fill-slate-700 text-[10px]">Top y = W</text>
        <text x={ox + L + D / 2} y={oy + Wd / 2 - D / 2} textAnchor="middle" className="fill-slate-700 text-[10px]" transform={`rotate(-90 ${ox + L + D / 2} ${oy + Wd / 2 - D / 2})`}>
          x = L
        </text>
        <text x={ox + L / 2} y={oy + Wd + 16} textAnchor="middle" className="fill-slate-500 text-[10px]">
          {g.nx} × {g.ny} × {g.nz} = {(g.nx * g.ny * g.nz).toLocaleString()} nodes
        </text>
      </svg>
      {!compact && (
        <ul className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-slate-600">
          {facesFor(3).map((f) => (
            <li key={f} className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-sm" style={{ background: stroke(f) }} />
              {FACE_INFO[f].name}: {bcText(p.boundaries[f], unit)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Arrow({ x1, y1, x2, y2, label, flip = false }: { x1: number; y1: number; x2: number; y2: number; label: string; flip?: boolean }) {
  const [a, b, c, d] = flip ? [x2, y2, x1, y1] : [x1, y1, x2, y2]
  const ang = Math.atan2(d - b, c - a)
  const hx = (k: number) => c - 7 * Math.cos(ang + k)
  const hy = (k: number) => d - 7 * Math.sin(ang + k)
  return (
    <g>
      <line x1={a} y1={b} x2={c} y2={d} stroke="#2a78d6" strokeWidth={2} />
      <polygon points={`${c},${d} ${hx(0.45)},${hy(0.45)} ${hx(-0.45)},${hy(-0.45)}`} fill="#2a78d6" />
      <text x={(a + c) / 2} y={Math.min(b, d) - 6} textAnchor="middle" className="fill-blue-700 text-[10px]">
        {label}
      </text>
    </g>
  )
}

export function BCLegend() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
      {Object.entries(BC_INFO).map(([k, v]) => (
        <span key={k} className="inline-flex items-center gap-1">
          <span className="inline-block h-1 w-3 rounded" style={{ background: v.color }} />
          {v.label}
        </span>
      ))}
    </div>
  )
}
