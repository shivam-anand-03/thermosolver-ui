import { HEAT_COOL, HEAT_HOT, HEAT_WARM, cx, useSvgId } from './shared'

const PANEL_CSS = `
.cfdsvg-front{transform-box:fill-box;transform-origin:left center;animation:cfdsvg-front 3.6s cubic-bezier(.3,0,.3,1) infinite}
.cfdsvg-resid{transform-box:fill-box;transform-origin:left center;animation:cfdsvg-resid 3.6s cubic-bezier(.2,.6,.3,1) infinite}
.cfdsvg-node{transform-box:fill-box;transform-origin:center;animation:cfdsvg-node 1.6s ease-in-out infinite}
@keyframes cfdsvg-front{0%{transform:scaleX(1);opacity:1}62%{transform:scaleX(.03);opacity:1}82%{transform:scaleX(.03);opacity:1}86%{transform:scaleX(.03);opacity:0}87%{transform:scaleX(1);opacity:0}100%{transform:scaleX(1);opacity:1}}
@keyframes cfdsvg-resid{0%{transform:scaleX(1)}62%{transform:scaleX(.05)}86%{transform:scaleX(.05)}100%{transform:scaleX(1)}}
@keyframes cfdsvg-node{0%,100%{transform:scale(1)}30%{transform:scale(1.45)}}
@media (prefers-reduced-motion: reduce){
  .cfdsvg-front{animation:none;opacity:0}
  .cfdsvg-resid{animation:none;transform:scaleX(.05)}
  .cfdsvg-node{animation:none}
}`

// Slab geometry in a 220×90 viewBox.
const SX = 20
const SY = 22
const SW = 180
const SH = 22
const MID = SY + SH / 2
const CELLS = 8
const CELL_W = SW / CELLS
const FACES = Array.from({ length: CELLS - 1 }, (_, i) => SX + CELL_W * (i + 1))
const NODES = Array.from({ length: CELLS }, (_, i) => SX + CELL_W * (i + 0.5))
const TRACK_X = 66
const TRACK_W = SX + SW - TRACK_X

export interface SolvingPanelProps {
  /** Status text under the animation, e.g. "Solving 41 nodes…". Announced politely. */
  label?: string
  className?: string
}

/** Larger "calculation running" visual: heat diffusing through a slab towards its steady profile. */
export function SolvingPanel({ label, className }: SolvingPanelProps) {
  const id = useSvgId('cfd-solving')
  const steady = `${id}-steady`
  const cold = `${id}-cold`
  return (
    <div role="status" aria-live="polite" className={cx('flex flex-col items-center gap-2', className)}>
      <svg viewBox="0 0 220 90" className="w-full h-auto max-w-[240px]" aria-hidden focusable="false">
        <style>{PANEL_CSS}</style>
        <defs>
          <linearGradient id={steady} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor={HEAT_COOL} />
            <stop offset="0.45" stopColor="#8db6e6" />
            <stop offset="0.62" stopColor={HEAT_WARM} />
            <stop offset="1" stopColor={HEAT_HOT} />
          </linearGradient>
          <linearGradient id={cold} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor={HEAT_COOL} />
            <stop offset="0.85" stopColor={HEAT_COOL} />
            <stop offset="1" stopColor={HEAT_COOL} stopOpacity="0" />
          </linearGradient>
        </defs>
        <g fontSize="9" fill="var(--ui-muted)" fontStyle="italic" fontFamily="Georgia, 'Times New Roman', serif">
          <text x={SX} y={SY - 7}>T₁</text>
          <text x={SX + SW} y={SY - 7} textAnchor="end">T<tspan fontSize="6.5" dy="2">N</tspan></text>
        </g>
        <rect x={SX} y={SY} width={SW} height={SH} rx="3" fill={`url(#${steady})`} />
        <rect className="cfdsvg-front" x={SX} y={SY} width={SW - 8} height={SH} rx="3" fill={`url(#${cold})`} />
        <g stroke="#fff" strokeOpacity="0.4" strokeWidth="1">
          {FACES.map((x) => <path key={x} d={`M${x} ${SY} V${SY + SH}`} />)}
        </g>
        <path d={`M${NODES[0]} ${MID} H${NODES[CELLS - 1]}`} stroke="#fff" strokeOpacity="0.75" strokeWidth="1.25" />
        {NODES.map((x, i) => (
          <circle key={x} className="cfdsvg-node" cx={x} cy={MID} r="2.6" fill="#fff" stroke="#3d3d39" strokeWidth="0.9" style={{ animationDelay: `${i * 0.12}s` }} />
        ))}
        <rect x={SX} y={SY} width={SW} height={SH} rx="3" fill="none" stroke="var(--ui-ink)" strokeOpacity="0.45" strokeWidth="1" />
        <text x={SX} y="68" fontSize="8.5" fill="var(--ui-muted)" letterSpacing="0.04em">residual</text>
        <rect x={TRACK_X} y="62" width={TRACK_W} height="5" rx="2.5" fill="var(--ui-rule)" />
        <rect className="cfdsvg-resid" x={TRACK_X} y="62" width={TRACK_W} height="5" rx="2.5" fill="var(--ph-solver-accent)" />
        <path d={`M${TRACK_X + TRACK_W * 0.05} 58.5 V70.5`} stroke="var(--ui-muted)" strokeWidth="1" strokeDasharray="1.5 1.5" />
      </svg>
      {label && <p className="text-sm text-muted-foreground tabular-nums">{label}</p>}
    </div>
  )
}
