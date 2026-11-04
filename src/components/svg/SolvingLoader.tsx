import { cx } from './shared'

const LOADER_CSS = `
.cfdsvg-pulse{animation:cfdsvg-pulse 1.2s ease-in-out infinite;opacity:.25}
@keyframes cfdsvg-pulse{0%,100%{opacity:.25}35%{opacity:1}}
@media (prefers-reduced-motion: reduce){
  .cfdsvg-pulse{animation:none}
  .cfdsvg-pulse.n0{opacity:1}.cfdsvg-pulse.n1{opacity:.65}.cfdsvg-pulse.n2{opacity:.35}
}`

const DOTS = [4.75, 8, 11.25]

export interface SolvingLoaderProps {
  /** Width/height in px. Default 16 (button-icon size). */
  size?: number
  className?: string
}

/** Inline busy indicator: three nodes in a slab pulsing in sequence. Uses currentColor. */
export function SolvingLoader({ size = 16, className }: SolvingLoaderProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="none"
      aria-hidden
      focusable="false"
      className={cx('shrink-0', className)}
    >
      <style>{LOADER_CSS}</style>
      <rect x="1.25" y="4.75" width="13.5" height="6.5" rx="1.75" stroke="currentColor" strokeWidth="1.25" opacity="0.45" />
      {DOTS.map((x, i) => (
        <circle
          key={x}
          className={`cfdsvg-pulse n${i}`}
          cx={x}
          cy="8"
          r="1.35"
          fill="currentColor"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </svg>
  )
}
