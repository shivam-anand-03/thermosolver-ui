import { useId } from 'react'
import { fmt } from '@/lib/format'
import type { ProfilePoint } from './profile'

const W = 1000, H = 160

/** Small area chart of f along x so the shape can be checked before solving. Labels are HTML so they never scale. */
export function ProfilePlot({ pts, length, dim }: { pts: ProfilePoint[]; length: number; dim: number }) {
  const id = useId().replace(/:/g, '')
  const vs = pts.map((p) => p.v)
  const lo = Math.min(0, ...vs)
  const hi = Math.max(0, ...vs) - lo < 1e-300 ? lo + 1 : Math.max(0, ...vs)
  const px = (x: number) => (W * x) / (length || 1)
  const py = (v: number) => H - (H * (v - lo)) / (hi - lo)
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${px(p.x).toFixed(1)} ${py(p.v).toFixed(1)}`).join(' ')
  const zero = py(0)
  const where = dim > 1 ? ` at y = W/2${dim > 2 ? ', z = H/2' : ''}` : ''
  return (
    <div className="rounded border border-slate-200 bg-slate-50/50 p-2 text-[11px] text-slate-500 tabular">
      <div className="mb-1 flex justify-between px-1 text-[11.5px]">
        <span>f along x{where}</span>
        <span>W/m³</span>
      </div>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2">
        <div className="flex h-24 flex-col justify-between text-right font-mono">
          <span>{fmt(hi, 3)}</span>
          <span>{fmt(lo, 3)}</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-24 w-full overflow-visible" role="img" aria-label={`Heat generation along x, from ${fmt(lo, 3)} to ${fmt(hi, 3)} W/m³`}>
          <defs>
            <linearGradient id={`sg-${id}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#eb6834" stopOpacity="0.35" />
              <stop offset="1" stopColor="#2a78d6" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <line x1={0} x2={W} y1={zero} y2={zero} stroke="var(--ui-rule)" vectorEffect="non-scaling-stroke" />
          <line x1={0} x2={0} y1={0} y2={H} stroke="var(--ui-rule)" vectorEffect="non-scaling-stroke" />
          <path d={`${d} L${W} ${zero} L0 ${zero} Z`} fill={`url(#sg-${id})`} />
          <path d={d} fill="none" stroke="#eb6834" strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <span />
        <div className="mt-1 flex justify-between">
          <span>x = 0</span>
          <span>x = L = {fmt(length, 4)} m</span>
        </div>
      </div>
    </div>
  )
}
