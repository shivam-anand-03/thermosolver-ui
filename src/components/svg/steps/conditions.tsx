import type { StepArtProps } from '../StepFrame'
import { HEAT_COOL, HEAT_HOT, draw, fade } from '../shared'

/** 5 — Initial and boundary conditions: block with fixed-temperature edges + thermometer. */
export function ConditionsArt({ accent }: StepArtProps) {
  return (
    <>
      <rect x="7" y="13" width="22" height="22" rx="1" fill="var(--ui-domain)" stroke="none" {...fade(0)} />
      <path d="M7 13 H29 M7 35 H29" stroke="var(--ui-muted)" strokeDasharray="1.5 2.5" strokeWidth="1.2" {...fade(150)} />
      <path d="M7 13 V35" stroke={HEAT_COOL} strokeWidth="2.5" {...draw(100)} />
      <path d="M29 13 V35" stroke={HEAT_HOT} strokeWidth="2.5" {...draw(220)} />
      <g fill="var(--ui-faint)" stroke="none" {...fade(350)}>
        <circle cx="13" cy="24" r="1" />
        <circle cx="18" cy="24" r="1" />
        <circle cx="23" cy="24" r="1" />
      </g>
      <path d="M37 31 V10 a2 2 0 0 1 4 0 V31 a4 4 0 1 1 -4 0 Z" {...draw(250)} />
      <g stroke={accent} fill={accent} {...fade(550)}>
        <path d="M39 34 V17" strokeWidth="2" />
        <circle cx="39" cy="34.5" r="2" stroke="none" />
      </g>
      <path d="M41 15 H43 M41 20 H43 M41 25 H43" stroke="var(--ui-faint)" strokeWidth="1" {...fade(450)} />
    </>
  )
}

const STENCIL = [
  { x: 10, label: 'i−1' },
  { x: 24, label: 'i' },
  { x: 38, label: 'i+1' },
]

/** 6 — Numerical method: the three-point finite-difference stencil. */
export function StencilArt({ accent }: StepArtProps) {
  return (
    <>
      <path d="M3 25 H45" stroke="var(--ui-rule)" strokeWidth="1" {...draw(0)} />
      <path d="M17 18 V32 M31 18 V32" stroke="var(--ui-faint)" strokeWidth="1" strokeDasharray="1.5 2" {...fade(100)} />
      <path d="M12.6 22.2 Q17 14.5 21.3 21.4" {...draw(250)} />
      <path d="M35.4 22.2 Q31 14.5 26.7 21.4" {...draw(320)} />
      {STENCIL.map(({ x, label }, i) => {
        const centre = i === 1
        return (
          <g key={x}>
            <circle
              cx={x}
              cy="25"
              r={centre ? 4 : 3}
              fill={centre ? accent : 'var(--ui-surface)'}
              stroke={centre ? accent : 'currentColor'}
              {...fade(100 + i * 90)}
            />
            <text x={x} y="38" textAnchor="middle" fontSize="5" fill="var(--ui-muted)" stroke="none" fontStyle="italic" fontFamily="Georgia, 'Times New Roman', serif" {...fade(400 + i * 60)}>
              {label}
            </text>
          </g>
        )
      })}
    </>
  )
}
