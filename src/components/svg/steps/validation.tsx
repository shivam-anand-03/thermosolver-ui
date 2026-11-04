import type { StepArtProps } from '../StepFrame'
import { draw, fade } from '../shared'

// Points on the analytic parabola Q(9,36) (25,4) (41,36).
const DOTS = [0.12, 0.3, 0.5, 0.7, 0.88].map((t) => ({
  x: 9 + 32 * t,
  y: 36 * (1 - t) ** 2 + 8 * t * (1 - t) + 36 * t * t,
}))

/** 11 — Validation: numeric nodes sitting on the analytic curve, with a check. */
export function ValidationArt({ accent }: StepArtProps) {
  return (
    <>
      <path d="M7 5 V40 H43" {...draw(0)} />
      <path d="M9 36 Q25 4 41 36" stroke="var(--ui-muted)" {...draw(150)} />
      {DOTS.map(({ x, y }, i) => (
        <circle key={x} cx={x} cy={y} r="1.9" fill="var(--ui-surface)" strokeWidth="1.25" {...fade(400 + i * 70)} />
      ))}
      <circle cx="38" cy="11" r="6" stroke={accent} {...draw(500)} />
      <path d="M35.4 11.2 L37.3 13.1 L40.7 9.3" stroke={accent} {...draw(750)} />
    </>
  )
}
