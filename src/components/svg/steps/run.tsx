import type { StepArtProps } from '../StepFrame'
import { HEAT_COOL, HEAT_HOT, draw, fade, useSvgId } from '../shared'

/** 9 — Solve / run: progress ring around a play glyph. */
export function RunArt({ accent }: StepArtProps) {
  return (
    <>
      <circle cx="24" cy="24" r="16" stroke="var(--ui-rule)" {...fade(0)} />
      <path d="M24 8 A16 16 0 1 1 8 24" stroke={accent} strokeWidth="2" {...draw(150)} />
      <path d="M20.5 17.5 L31 24 L20.5 30.5 Z" fill="var(--ui-domain)" {...draw(0)} />
      <path d="M24 3.5 V5.5 M44.5 24 H42.5 M24 44.5 V42.5 M3.5 24 H5.5" stroke="var(--ui-faint)" strokeWidth="1" {...fade(300)} />
    </>
  )
}

/** 10 — Results: temperature profile drawn in the heat ramp. */
export function ResultsArt({ accent }: StepArtProps) {
  const grad = useSvgId('cfd-step-heat')
  return (
    <>
      <defs>
        <linearGradient id={grad} x1="9" x2="42" y1="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={HEAT_COOL} />
          <stop offset="1" stopColor={HEAT_HOT} />
        </linearGradient>
      </defs>
      <path d="M8 5 V40 H43" {...draw(0)} />
      <path d="M8 14 H43 M8 24 H43" stroke="var(--ui-rule)" strokeWidth="1" strokeDasharray="1.5 2.5" {...fade(100)} />
      <path d="M42 9 V40" stroke={accent} strokeWidth="1" strokeDasharray="1.5 2" {...fade(650)} />
      <path d="M9.5 36 C17 35 22 28 27 21 S36 10 42 9" stroke={`url(#${grad})`} strokeWidth="2.25" {...draw(200)} />
      <circle cx="42" cy="9" r="2" fill={accent} stroke="none" {...fade(750)} />
    </>
  )
}
