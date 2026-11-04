import type { StepArtProps } from '../StepFrame'
import { draw, fade } from '../shared'

const ARROWS_Y = [17, 24, 31]

/** 3 — Physical phenomena: conduction into a wall, convection plumes leaving it. */
export function PhenomenaArt({ accent }: StepArtProps) {
  return (
    <>
      <rect x="19" y="9" width="10" height="30" rx="1.5" fill="var(--ui-domain)" stroke="none" {...fade(0)} />
      <rect x="19" y="9" width="10" height="30" rx="1.5" {...draw(0)} />
      <g stroke={accent}>
        {ARROWS_Y.map((y, i) => (
          <g key={y}>
            <path d={`M5 ${y} H15`} {...draw(200 + i * 80)} />
            <path d={`M12.5 ${y - 2.5} L15 ${y} L12.5 ${y + 2.5}`} {...fade(450 + i * 80)} />
          </g>
        ))}
      </g>
      <g stroke="var(--ui-muted)">
        <path d="M34.5 38 c-2 -3 2 -5 0 -8 s2 -5 0 -8 s2 -5 0 -8" {...draw(350)} />
        <path d="M40.5 36 c-2 -3 2 -5 0 -8 s2 -5 0 -8 s2 -5 0 -8" {...draw(450)} />
      </g>
    </>
  )
}

/** 4 — Material properties: an isometric layered sample. */
export function MaterialArt({ accent }: StepArtProps) {
  return (
    <>
      <path d="M24 8 L40 16 L24 24 L8 16 Z" fill="var(--ui-domain)" stroke="none" {...fade(0)} />
      <path d="M8 21.33 L24 29.33 L24 34.67 L8 26.67 Z M24 29.33 L40 21.33 L40 26.67 L24 34.67 Z" fill={accent} fillOpacity="0.28" stroke="none" {...fade(420)} />
      <path d="M24 8 L40 16 L40 32 L24 40 L8 32 L8 16 Z" {...draw(0)} />
      <path d="M8 16 L24 24 L40 16 M24 24 V40" {...draw(150)} />
      <g stroke="var(--ui-muted)" strokeWidth="1">
        <path d="M8 21.33 L24 29.33 L40 21.33" {...draw(300)} />
        <path d="M8 26.67 L24 34.67 L40 26.67" {...draw(380)} />
      </g>
    </>
  )
}
