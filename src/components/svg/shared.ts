import { useId, type CSSProperties } from 'react'

/** Heat-ramp hues. Only used where colour means temperature. */
export const HEAT_COOL = '#2a78d6'
export const HEAT_WARM = '#f2a46e'
export const HEAT_HOT = '#eb6834'

/** useId() made safe for use inside url(#…) references. */
export function useSvgId(prefix: string): string {
  const raw = useId()
  return `${prefix}-${raw.replace(/[^a-zA-Z0-9_-]/g, '')}`
}

/**
 * Shared keyframes for the mount animations. Every rule is cancelled under
 * prefers-reduced-motion so the settled frame is shown instead.
 */
export const DRAW_CSS = `
.cfdsvg-d{stroke-dasharray:1 2;stroke-dashoffset:1.05;animation:cfdsvg-draw .7s cubic-bezier(.4,0,.2,1) forwards}
.cfdsvg-f{opacity:0;animation:cfdsvg-fade .45s ease-out forwards}
@keyframes cfdsvg-draw{0%{opacity:0}8%{opacity:1}100%{stroke-dashoffset:0;opacity:1}}
@keyframes cfdsvg-fade{to{opacity:1}}
@media (prefers-reduced-motion: reduce){
  .cfdsvg-d{animation:none;stroke-dasharray:none;stroke-dashoffset:0;opacity:1}
  .cfdsvg-f{animation:none;opacity:1}
}`

/** Props that make a shape draw itself in (stroke-dash animation). */
export function draw(delay = 0): { className: string; pathLength: number; style: CSSProperties } {
  return { className: 'cfdsvg-d', pathLength: 1, style: { animationDelay: `${delay}ms` } }
}

/** Props that make a shape fade in. */
export function fade(delay = 0): { className: string; style: CSSProperties } {
  return { className: 'cfdsvg-f', style: { animationDelay: `${delay}ms` } }
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
