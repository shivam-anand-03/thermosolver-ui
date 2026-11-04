import { HEAT_COOL, HEAT_HOT, HEAT_WARM } from './shared'

// Rod geometry (front face) and isometric depth offset, in a 40×40 viewBox.
const X0 = 3.5
const X1 = 32
const Y0 = 17
const Y1 = 27
const DX = 4.5
const DY = -4.5
const CY = (Y0 + Y1) / 2
const NODES = [X0 + 3.2, 13.7, 21.8, X1 - 3.2]

const TOP_FACE = `M${X0} ${Y0} L${X0 + DX} ${Y0 + DY} L${X1 + DX} ${Y0 + DY} L${X1} ${Y0} Z`
const END_FACE = `M${X1} ${Y0} L${X1 + DX} ${Y0 + DY} L${X1 + DX} ${Y1 + DY} L${X1} ${Y1} Z`
const OUTLINE =
  `M${X0} ${Y0} L${X0 + DX} ${Y0 + DY} L${X1 + DX} ${Y0 + DY} L${X1 + DX} ${Y1 + DY} L${X1} ${Y1} L${X0} ${Y1} Z ` +
  `M${X0} ${Y0} L${X1} ${Y0} L${X1 + DX} ${Y0 + DY} M${X1} ${Y0} L${X1} ${Y1}`

export function LogoDefs({ heat, ring }: { heat: string; ring: string }) {
  return (
    <defs>
      <linearGradient id={heat} x1={X0} x2={X1 + DX} y1="0" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={HEAT_COOL} />
        <stop offset="0.42" stopColor="#8db6e6" />
        <stop offset="0.6" stopColor={HEAT_WARM} />
        <stop offset="1" stopColor={HEAT_HOT} />
      </linearGradient>
      <linearGradient id={ring} x1="4" x2="36" y1="0" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={HEAT_COOL} />
        <stop offset="1" stopColor={HEAT_HOT} />
      </linearGradient>
    </defs>
  )
}

export function LogoRod({ heat }: { heat: string }) {
  return (
    <g strokeLinejoin="round">
      <path d={TOP_FACE} fill={`url(#${heat})`} />
      <path d={TOP_FACE} fill="#fff" opacity="0.4" />
      <path d={END_FACE} fill={HEAT_HOT} />
      <path d={END_FACE} fill="#000" opacity="0.22" />
      <rect x={X0} y={Y0} width={X1 - X0} height={Y1 - Y0} fill={`url(#${heat})`} />
      <path d={OUTLINE} fill="none" stroke="var(--ui-ink)" strokeOpacity="0.6" strokeWidth="1" />
      {renderNodes()}
    </g>
  )
}

function renderNodes() {
  const last = NODES.length - 1
  return (
    <g>
      <line x1={NODES[0]} x2={NODES[last]} y1={CY} y2={CY} stroke="#fff" strokeWidth="1.3" strokeLinecap="round" opacity="0.9" />
      {NODES.map((x, i) => {
        const end = i === 0 || i === last
        const ring = i === 0 ? '#1c5cab' : '#b84a1f'
        return (
          <circle
            key={x}
            cx={x}
            cy={CY}
            r={end ? 2.5 : 1.8}
            fill="#fff"
            stroke={end ? ring : '#3d3d39'}
            strokeWidth={end ? 1.3 : 1}
          />
        )
      })}
    </g>
  )
}

