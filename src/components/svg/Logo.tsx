import { LogoDefs, LogoRod } from './logo-parts'
import { HEAT_HOT, cx, useSvgId } from './shared'

export interface LogoMarkProps {
  /** Rendered width/height in px. Default 32. */
  size?: number
  className?: string
  /** Accessible name. Default "CFD Solver". */
  title?: string
  /** Hide from assistive tech (when a visible label sits next to it). */
  decorative?: boolean
}

/**
 * Square brand mark: a discretised rod with a cool→hot temperature gradient,
 * nodes on its centre line and a broken ring around it (echoes /logo.png).
 */
export function LogoMark({ size = 32, className, title = 'CFD Solver', decorative = false }: LogoMarkProps) {
  const id = useSvgId('cfd-logo')
  const heat = `${id}-heat`
  const ring = `${id}-ring`
  const titleId = `${id}-title`
  const a11y = decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-labelledby': titleId }

  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={cx('shrink-0', className)} {...a11y}>
      {!decorative && <title id={titleId}>{title}</title>}
      <LogoDefs heat={heat} ring={ring} />
      <g fill="none" stroke={`url(#${ring})`} strokeWidth="2.2" strokeLinecap="round" opacity="0.9">
        <path d="M7.6 8.6 A17.5 17.5 0 0 1 32.4 8.6" />
        <path d="M33.5 31.4 A17.5 17.5 0 0 1 6.5 31.4" />
      </g>
      <LogoRod heat={heat} />
    </svg>
  )
}

export interface LogoWordmarkProps {
  /** Mark size in px; the text scales with it. Default 32. */
  size?: number
  className?: string
}

/** Mark + "CFD Solver" wordmark. "CFD" follows theme ink, "Solver" is heat orange. */
export function LogoWordmark({ size = 32, className }: LogoWordmarkProps) {
  return (
    <span
      role="img"
      aria-label="CFD Solver"
      className={cx('inline-flex items-center select-none', className)}
      style={{ gap: size * 0.3 }}
    >
      <LogoMark size={size} decorative />
      <span
        aria-hidden
        className="font-semibold leading-none tracking-tight whitespace-nowrap"
        style={{ fontSize: Math.round(size * 0.56), color: 'var(--ui-ink)' }}
      >
        CFD <span style={{ color: HEAT_HOT }}>Solver</span>
      </span>
    </span>
  )
}
