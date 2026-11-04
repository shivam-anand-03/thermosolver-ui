import type { StepArtProps } from '../StepFrame'
import { draw, fade } from '../shared'

/** 1 — Problem statement: clipboard with a heat-generating slab sketch. */
export function ProblemArt({ accent }: StepArtProps) {
  return (
    <>
      <rect x="10" y="8" width="28" height="35" rx="3" {...draw(0)} />
      <rect x="18" y="5" width="12" height="6" rx="1.5" fill="var(--ui-surface)" {...draw(120)} />
      <rect x="15" y="16" width="18" height="10" rx="1" fill="var(--ui-domain)" stroke="none" {...fade(200)} />
      <rect x="15" y="16" width="18" height="10" rx="1" {...draw(220)} />
      <text
        x="24"
        y="23.4"
        textAnchor="middle"
        fontSize="6.5"
        fontStyle="italic"
        fontFamily="Georgia, 'Times New Roman', serif"
        fill={accent}
        stroke="none"
        {...fade(520)}
      >
        q‴
      </text>
      <path d="M15 31.5 H33" stroke="var(--ui-muted)" {...draw(380)} />
      <path d="M15 36 H27" stroke="var(--ui-muted)" {...draw(460)} />
    </>
  )
}

const CELLS = [12, 18, 24, 30, 36]
const NODES = [9, 15, 21, 27, 33, 39]

/** 2 — Geometry and grid: a discretised body with cell faces and nodes. */
export function GeometryArt({ accent }: StepArtProps) {
  return (
    <>
      <rect x="6" y="17" width="36" height="14" rx="1.5" fill="var(--ui-domain)" stroke="none" {...fade(0)} />
      <rect x="6" y="17" width="36" height="14" rx="1.5" {...draw(0)} />
      {CELLS.map((x, i) => (
        <path key={x} d={`M${x} 17 V31`} stroke="var(--ui-faint)" strokeWidth="1" {...draw(150 + i * 50)} />
      ))}
      {NODES.map((x, i) => (
        <circle key={x} cx={x} cy="24" r="1.6" fill={accent} stroke="none" {...fade(380 + i * 45)} />
      ))}
      <g stroke="var(--ui-muted)" strokeWidth="1">
        <path d="M6 37.5 H42" {...draw(300)} />
        <path d="M6 35.5 V39.5 M42 35.5 V39.5" {...fade(300)} />
      </g>
      <path d="M6 11.5 V14.5 M42 11.5 V14.5" stroke="var(--ui-faint)" strokeWidth="1" {...fade(500)} />
    </>
  )
}
