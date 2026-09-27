import { useId } from 'react'
import { fmt } from '@/lib/format'
import { heatColor } from '@/lib/palette'
import { TEMP_SYMBOL } from '@/lib/units'
import type { BoundaryType, LengthUnit, TemperatureUnit } from '@/types/solver'

interface BC {
  type: BoundaryType
  value: number
}

interface Props {
  nodes: number
  lengthM: number
  lengthUnit: LengthUnit
  left: BC
  right: BC
  tempUnit: TemperatureUnit
  temperatures?: number[] | null
  className?: string
}

const W = 720
const H = 240
const X0 = 168
const X1 = 552
const YC = 124
const SLAB_H = 36

const LEN_F: Record<LengthUnit, number> = { m: 1, mm: 1e3, cm: 1e2 }

/** Indices to label when there are many nodes: first, last and an even spread. */
function labelIndices(n: number, max = 9): number[] {
  if (n <= max) return Array.from({ length: n }, (_, i) => i)
  const step = Math.ceil((n - 1) / (max - 1))
  const idx: number[] = []
  for (let i = 0; i < n - 1; i += step) idx.push(i)
  if (n - 1 - idx[idx.length - 1] < step / 2) idx.pop()
  idx.push(n - 1)
  return idx
}

/** Dynamic 1-D slab diagram: nodes, Δx, L, boundary-condition arrows and (optionally) temperatures. */
export function SlabDiagram({ nodes, lengthM, lengthUnit, left, right, tempUnit, temperatures, className }: Props) {
  const uid = useId().replace(/:/g, '')
  const n = Number.isFinite(nodes) && nodes >= 2 ? Math.min(nodes, 2000) : 2
  const xs = Array.from({ length: n }, (_, i) => X0 + ((X1 - X0) * i) / (n - 1))
  const labels = labelIndices(n, 8)
  const unitL = (v: number) => `${fmt(v * LEN_F[lengthUnit], 4)} ${lengthUnit}`
  const dx = lengthM / (n - 1)
  const hasT = !!temperatures && temperatures.length === n
  const tmin = hasT ? Math.min(...temperatures!) : 0
  const tmax = hasT ? Math.max(...temperatures!) : 1
  const norm = (t: number) => (tmax - tmin < 1e-12 ? 0.5 : (t - tmin) / (tmax - tmin))
  const gradStops = hasT
    ? labelIndices(n, 40).map((i) => ({ off: (i / (n - 1)) * 100, color: heatColor(norm(temperatures![i])) }))
    : []
  const dotR = n > 60 ? 0 : n > 25 ? 2.5 : 4.5

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      role="img"
      aria-label={`Plane slab of length ${unitL(lengthM)} discretised into ${n} nodes`}
    >
      <defs>
        <marker id={`arr-${uid}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#475569" />
        </marker>
        <marker id={`flux-${uid}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#ea580c" />
        </marker>
        <pattern id={`hatch-${uid}`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="7" stroke="#94a3b8" strokeWidth="2" />
        </pattern>
        <linearGradient id={`slab-${uid}`} x1="0" x2="1" y1="0" y2="0">
          {hasT ? (
            gradStops.map((s, i) => <stop key={i} offset={`${s.off}%`} stopColor={s.color} />)
          ) : (
            <>
              <stop offset="0%" stopColor="#e8eef7" />
              <stop offset="100%" stopColor="#dde6f3" />
            </>
          )}
        </linearGradient>
      </defs>

      {/* L dimension */}
      <line x1={X0} x2={X1} y1={40} y2={40} stroke="#475569" strokeWidth={1} markerStart={`url(#arr-${uid})`} markerEnd={`url(#arr-${uid})`} />
      <line x1={X0} x2={X0} y1={32} y2={YC - SLAB_H / 2 - 4} stroke="#cbd5e1" strokeDasharray="3 3" />
      <line x1={X1} x2={X1} y1={32} y2={YC - SLAB_H / 2 - 4} stroke="#cbd5e1" strokeDasharray="3 3" />
      <rect x={(X0 + X1) / 2 - 62} y={30} width={124} height={20} rx={4} fill="white" />
      <text x={(X0 + X1) / 2} y={44} textAnchor="middle" fontSize={14.5} fontWeight={600} fill="#0f172a">
        L = {unitL(lengthM)}
      </text>

      {/* slab */}
      <rect x={X0} y={YC - SLAB_H / 2} width={X1 - X0} height={SLAB_H} rx={3} fill={`url(#slab-${uid})`} stroke="#64748b" strokeWidth={1.2} />
      <line x1={X0} x2={X1} y1={YC} y2={YC} stroke="#334155" strokeWidth={1.4} />

      {/* nodes */}
      {dotR > 0 &&
        xs.map((x, i) => <circle key={i} cx={x} cy={YC} r={dotR} fill="#0f172a" stroke="white" strokeWidth={1.5} />)}
      {dotR === 0 && labels.map((i) => <line key={i} x1={xs[i]} x2={xs[i]} y1={YC - 6} y2={YC + 6} stroke="#0f172a" strokeWidth={1.5} />)}

      {/* node labels & temperatures */}
      {labels.map((i) => (
        <g key={i}>
          <text x={xs[i]} y={YC + SLAB_H / 2 + 18} textAnchor="middle" fontSize={13.5} fontWeight={600} fill="#0f172a" fontFamily="var(--font-mono)">
            T<tspan fontSize={9} dy={3}>{i + 1}</tspan>
          </text>
          <text x={xs[i]} y={YC + SLAB_H / 2 + 35} textAnchor="middle" fontSize={11.5} fill="#64748b" className="tabular">
            {fmt(i * dx * LEN_F[lengthUnit], 3)}
          </text>
          {hasT && (
            <text x={xs[i]} y={YC - SLAB_H / 2 - 17} textAnchor="middle" fontSize={12} fontWeight={600} fill="#1e293b" className="tabular">
              {fmt(temperatures![i], 5)}
            </text>
          )}
        </g>
      ))}
      <text x={X1 + 2} y={YC + SLAB_H / 2 + 35} fontSize={11} fill="#94a3b8" dx={14}>
        x [{lengthUnit}]
      </text>

      {/* Δx dimension on the first interval */}
      <g>
        <line x1={xs[0]} x2={xs[1]} y1={H - 22} y2={H - 22} stroke="#2563eb" strokeWidth={1} markerStart={`url(#arr-${uid})`} markerEnd={`url(#arr-${uid})`} />
        <line x1={xs[0]} x2={xs[0]} y1={H - 30} y2={H - 14} stroke="#2563eb" />
        <line x1={xs[1]} x2={xs[1]} y1={H - 30} y2={H - 14} stroke="#2563eb" />
        <text x={Math.max(xs[1] + 8, X0 + 8)} y={H - 18} fontSize={13} fill="#1d4ed8" fontWeight={500}>
          Δx = {unitL(dx)}
        </text>
      </g>
      <text x={X1} y={H - 18} textAnchor="end" fontSize={12} fill="#64748b">
        {n} nodes · {n - 1} intervals
      </text>

      <BoundaryGlyph side="left" bc={left} tempUnit={tempUnit} uid={uid} />
      <BoundaryGlyph side="right" bc={right} tempUnit={tempUnit} uid={uid} />
    </svg>
  )
}

function BoundaryGlyph({ side, bc, tempUnit, uid }: { side: 'left' | 'right'; bc: BC; tempUnit: TemperatureUnit; uid: string }) {
  const edge = side === 'left' ? X0 : X1
  const out = side === 'left' ? -1 : 1 // outward direction
  const labelX = side === 'left' ? 4 : W - 4
  const anchor = side === 'left' ? 'start' : 'end'
  const top = YC - SLAB_H / 2 - 10
  const h = SLAB_H + 20
  const xText = <text x={edge} y={H - 44} textAnchor="middle" fontSize={12} fill="#64748b" fontStyle="italic">{side === 'left' ? 'x = 0' : 'x = L'}</text>

  if (bc.type === 'temperature') {
    return (
      <g>
        <rect x={side === 'left' ? edge - 8 : edge} y={top} width={8} height={h} fill="#dc2626" rx={1.5} opacity={0.85} />
        <text x={labelX} y={YC - 4} textAnchor={anchor} fontSize={14} fontWeight={600} fill="#0f172a">
          T = {fmt(bc.value, 6)} {TEMP_SYMBOL[tempUnit]}
        </text>
        <text x={labelX} y={YC + 13} textAnchor={anchor} fontSize={12} fill="#64748b">
          fixed temperature
        </text>
        {xText}
      </g>
    )
  }
  if (bc.type === 'adiabatic') {
    return (
      <g>
        <rect x={side === 'left' ? edge - 18 : edge} y={top} width={18} height={h} fill={`url(#hatch-${uid})`} stroke="#94a3b8" />
        <text x={labelX} y={YC - 4} textAnchor={anchor} fontSize={14} fontWeight={600} fill="#0f172a">
          q'' = 0
        </text>
        <text x={labelX} y={YC + 13} textAnchor={anchor} fontSize={12} fill="#64748b">
          insulated
        </text>
        {xText}
      </g>
    )
  }
  if (bc.type === 'heat_flux') {
    const inward = bc.value >= 0
    const far = edge + out * 64
    const near = edge + out * 6
    const [x1, x2] = inward ? [far, near] : [near, far]
    return (
      <g>
        {[-10, 0, 10].map((dy) => (
          <line key={dy} x1={x1} x2={x2} y1={YC + dy} y2={YC + dy} stroke="#ea580c" strokeWidth={2} markerEnd={`url(#flux-${uid})`} />
        ))}
        <text x={labelX} y={YC - 24} textAnchor={anchor} fontSize={14} fontWeight={600} fill="#0f172a">
          q'' = {fmt(Math.abs(bc.value), 6)} W/m²
        </text>
        <text x={labelX} y={YC + 34} textAnchor={anchor} fontSize={12} fill="#64748b">
          {inward ? 'entering slab' : 'leaving slab'}
        </text>
        {xText}
      </g>
    )
  }
  // gradient
  return (
    <g>
      <line x1={edge + out * 8} x2={edge + out * 56} y1={YC + 12} y2={YC - 12} stroke="#7c3aed" strokeWidth={2} />
      <text x={labelX} y={YC - 24} textAnchor={anchor} fontSize={14} fontWeight={600} fill="#0f172a">
        dT/dx = {fmt(bc.value, 6)} K/m
      </text>
      <text x={labelX} y={YC + 34} textAnchor={anchor} fontSize={12} fill="#64748b">
        prescribed gradient
      </text>
      {xText}
    </g>
  )
}
