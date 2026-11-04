import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Segmented } from '@/components/ui/segmented'
import { fmt } from '@/lib/format'
import { useTheme } from '@/lib/theme'

// Sequential (temperature magnitude): a single warm hue, light → dark = cold → hot.
const SEQ = ['#fff4eb', '#fde3cf', '#fbcdab', '#f8b287', '#f39563', '#eb6834', '#d4542a', '#b54222', '#92341c', '#6e2816']
// Diverging (signed error): blue ↔ red with a neutral grey midpoint.
const DIV = ['#1c5cab', '#3987e5', '#86b6ef', '#cde2fb', '#f0efec', '#fbd3d0', '#f2a19b', '#e34948', '#b8302f']
// Dark mode: lightness runs the other way so the background-like end (cold / zero error) is dark,
// not a white block on the black page, and large values get brighter.
const SEQ_DARK = ['#24120a', '#3d1a0e', '#5c2413', '#7d2f18', '#a03c1f', '#c54d27', '#e2632f', '#f08a55', '#f7b083', '#fdd9bd']
const DIV_DARK = ['#a9cdf5', '#5598e7', '#2a6cc0', '#183c69', '#1a1a1a', '#5a1f1e', '#a8302e', '#e34948', '#f5a5a0']

function rgb(stops: string[], t: number): [number, number, number] {
  const x = Math.min(1, Math.max(0, t)) * (stops.length - 1)
  const i = Math.min(stops.length - 2, Math.floor(x))
  const f = x - i
  const a = parseInt(stops[i].slice(1), 16)
  const b = parseInt(stops[i + 1].slice(1), 16)
  const ch = (s: number) => Math.round(((a >> s) & 255) + (((b >> s) & 255) - ((a >> s) & 255)) * f)
  return [ch(16), ch(8), ch(0)]
}

/** Cell edges from node coordinates (midpoints, clamped to the domain). */
function edges(c: number[], L: number): number[] {
  const e = [0]
  for (let i = 0; i < c.length - 1; i++) e.push((c[i] + c[i + 1]) / 2)
  e.push(L)
  return e
}

const BAR = 74 // colour-bar column width

/** 2-D colour map of a nodal field (x fastest). Canvas-rendered so 10⁴ nodes stay fast. */
export function FieldHeatmap({
  xs,
  ys,
  Lx,
  Ly,
  values,
  unit,
  diverging = false,
  domain,
  xLabel = 'x',
  yLabel = 'y',
  title,
  maxHeight = 440,
}: {
  xs: number[]
  ys: number[]
  Lx: number
  Ly: number
  values: number[]
  unit: string
  diverging?: boolean
  domain?: [number, number]
  xLabel?: string
  yLabel?: string
  title?: string
  maxHeight?: number
}) {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [avail, setAvail] = useState(480)
  const [smooth, setSmooth] = useState(true)
  const [hover, setHover] = useState<{ i: number; j: number; px: number; py: number } | null>(null)

  const [lo, hi] = useMemo<[number, number]>(() => {
    if (domain) return domain
    let mn = Infinity
    let mx = -Infinity
    for (const v of values) {
      if (v < mn) mn = v
      if (v > mx) mx = v
    }
    if (diverging) {
      const m = Math.max(Math.abs(mn), Math.abs(mx)) || 1
      return [-m, m]
    }
    return mn === mx ? [mn - 1, mx + 1] : [mn, mx]
  }, [values, domain, diverging])

  const aspect = Math.min(2.5, Math.max(0.2, Ly / Lx))
  // true aspect ratio, limited by the space left of the colour bar and a height cap
  const width = Math.max(120, Math.min(avail - BAR, Math.round(maxHeight / aspect)))
  const height = Math.round(width * aspect)
  const ex = useMemo(() => edges(xs, Lx), [xs, Lx])
  const ey = useMemo(() => edges(ys, Ly), [ys, Ly])
  const dark = useTheme().theme === 'dark'
  const stops = diverging ? (dark ? DIV_DARK : DIV) : dark ? SEQ_DARK : SEQ

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setAvail(Math.max(240, Math.floor(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const c = canvas.current
    if (!c) return
    const dpr = window.devicePixelRatio || 1
    c.width = width * dpr
    c.height = height * dpr
    const ctx = c.getContext('2d')
    if (!ctx) return
    const nx = xs.length
    const ny = ys.length
    const colour = (v: number) => rgb(stops, (v - lo) / (hi - lo || 1))
    if (smooth && nx > 1 && ny > 1) {
      // one pixel per node, then let the browser interpolate bilinearly between nodes
      const img = new ImageData(nx, ny)
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          const [r, g, b] = colour(values[j * nx + i])
          const o = ((ny - 1 - j) * nx + i) * 4
          img.data[o] = r
          img.data[o + 1] = g
          img.data[o + 2] = b
          img.data[o + 3] = 255
        }
      }
      const off = document.createElement('canvas')
      off.width = nx
      off.height = ny
      off.getContext('2d')?.putImageData(img, 0, 0)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      // map pixel centres onto the first/last node positions
      const x0 = (xs[0] / Lx) * c.width
      const x1 = (xs[nx - 1] / Lx) * c.width
      const y0 = (1 - ys[ny - 1] / Ly) * c.height
      const y1 = (1 - ys[0] / Ly) * c.height
      const px = (x1 - x0) / (nx - 1)
      const py = (y1 - y0) / (ny - 1)
      // destination padded by half a node spacing, so each source pixel centre lands exactly on its node
      ctx.drawImage(off, 0, 0, nx, ny, x0 - px / 2, y0 - py / 2, x1 - x0 + px, y1 - y0 + py)
    } else {
      ctx.scale(dpr, dpr)
      const sx = width / Lx
      const sy = height / Ly
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          ctx.fillStyle = `rgb(${colour(values[j * nx + i]).join(',')})`
          const a = Math.floor(ex[i] * sx)
          const b = Math.ceil(ex[i + 1] * sx)
          const top = Math.floor(height - ey[j + 1] * sy)
          const bot = Math.ceil(height - ey[j] * sy)
          ctx.fillRect(a, top, b - a, bot - top)
        }
      }
    }
  }, [values, width, height, lo, hi, ex, ey, xs, ys, Lx, Ly, stops, smooth])

  const onMove = (e: React.MouseEvent) => {
    const r = (e.target as HTMLElement).getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * Lx
    const y = (1 - (e.clientY - r.top) / r.height) * Ly
    const find = (ed: number[], v: number) => Math.max(0, Math.min(ed.length - 2, ed.findIndex((b, k) => k > 0 && v <= b) - 1))
    setHover({ i: find(ex, x), j: find(ey, y), px: e.clientX - r.left, py: e.clientY - r.top })
  }

  const gradId = `grad${useId().replace(/:/g, '')}`
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => lo + t * (hi - lo))

  return (
    <div ref={wrap} className="w-full">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        {title ? <div className="text-[12.5px] font-medium text-slate-700">{title}</div> : <span />}
        <Segmented<'smooth' | 'cells'>
          size="sm"
          ariaLabel="Shading"
          value={smooth ? 'smooth' : 'cells'}
          onChange={(v) => setSmooth(v === 'smooth')}
          options={[
            { value: 'smooth', label: 'Smooth' },
            { value: 'cells', label: 'Cells' },
          ]}
        />
      </div>
      <div className="flex items-start gap-2">
        <div className="relative" style={{ width }}>
          <canvas
            ref={canvas}
            style={{ width, height }}
            className="block rounded border border-slate-300"
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
            role="img"
            aria-label={`${title ?? 'Field'} colour map`}
          />
          {hover && (
            <div
              className="pointer-events-none absolute z-10 rounded-md border bg-popover px-2.5 py-1.5 text-xs whitespace-nowrap text-popover-foreground shadow-lg"
              style={{ left: Math.min(hover.px + 12, width - 150), top: Math.max(0, hover.py - 52) }}
            >
              <div className="text-slate-500">
                {xLabel} = <span className="font-mono text-slate-800">{fmt(xs[hover.i], 4)}</span>, {yLabel} = <span className="font-mono text-slate-800">{fmt(ys[hover.j], 4)}</span> m
              </div>
              <div className="font-mono font-semibold text-slate-900">
                {fmt(values[hover.j * xs.length + hover.i], 6)} {unit}
              </div>
            </div>
          )}
          <div className="mt-1 flex justify-between text-[11px] text-slate-500">
            <span>{xLabel} = 0</span>
            <span>
              {xLabel} = {fmt(Lx, 4)} m
            </span>
          </div>
        </div>
        <svg width={BAR - 8} height={height} className="shrink-0" aria-hidden>
          <defs>
            <linearGradient id={gradId} x1="0" y1="1" x2="0" y2="0">
              {stops.map((c, k) => (
                <stop key={k} offset={k / (stops.length - 1)} stopColor={c} />
              ))}
            </linearGradient>
          </defs>
          <rect x={0.5} y={6} width={12} height={height - 12} rx={2} fill={`url(#${gradId})`} stroke="var(--ui-rule)" />
          {ticks.map((v, k) => {
            const y = 6 + (1 - k / 4) * (height - 12)
            return (
              <g key={k}>
                <line x1={13} x2={17} y1={y} y2={y} stroke="var(--ui-faint)" />
                <text x={20} y={y + 3.5} className="fill-slate-600 text-[10px]">
                  {fmt(v, 4)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      <div className="mt-0.5 text-[11px] text-slate-500">Colour scale in {unit}</div>
    </div>
  )
}
