import type { ReactNode } from 'react'
import { DRAW_CSS, HEAT_COOL, HEAT_HOT, draw, fade, useSvgId } from './shared'

export type EmptyStateVariant = 'results' | 'validation' | 'locked' | 'no-data'

const CURVE = 'M30 74 C48 72 60 58 72 46 S96 28 116 26'

function chartAxes(): ReactNode {
  return (
    <>
      <path d="M26 82 H122 M26 82 V18" stroke="var(--ui-muted)" {...draw(0)} />
      <path d="M26 62 H122 M26 42 H122 M26 22 H122" stroke="var(--ui-rule)" strokeWidth="1" {...fade(100)} />
    </>
  )
}

function badge(cx: number, cy: number, icon: ReactNode): ReactNode {
  return (
    <g {...fade(450)}>
      <circle cx={cx} cy={cy} r="13" fill="var(--ui-surface)" stroke="var(--ui-rule)" />
      <g stroke="var(--ui-ink)">{icon}</g>
    </g>
  )
}

function renderVariant(variant: EmptyStateVariant, heat: string): ReactNode {
  switch (variant) {
    case 'results':
      return (
        <>
          {chartAxes()}
          <path d={CURVE} stroke={`url(#${heat})`} strokeOpacity="0.55" strokeWidth="2" strokeDasharray="4 4" {...fade(250)} />
          {badge(104, 66, <path d="M100.5 60.5 L110 66 L100.5 71.5 Z" strokeWidth="1.5" />)}
        </>
      )
    case 'validation':
      return (
        <>
          {chartAxes()}
          <path d="M30 76 Q74 0 118 76" stroke="var(--ui-faint)" strokeDasharray="4 4" {...fade(250)} />
          {[44, 60, 88, 104].map((x) => (
            <circle key={x} cx={x} cy={76 - ((x - 30) * (118 - x)) / 50.9} r="2.6" fill="var(--ui-surface)" stroke="var(--ui-faint)" {...fade(350)} />
          ))}
          {badge(110, 30, <path d="M104.5 30.5 L108.5 34.5 L115.5 26.5" strokeWidth="1.75" strokeDasharray="2.5 2" />)}
        </>
      )
    case 'locked':
      return (
        <>
          {chartAxes()}
          <path d={CURVE} stroke="var(--ui-faint)" strokeDasharray="4 4" {...fade(250)} />
          {badge(
            74,
            50,
            <>
              <rect x="68" y="48" width="12" height="9" rx="1.75" strokeWidth="1.5" />
              <path d="M70.5 48 V45 a3.5 3.5 0 0 1 7 0 V48" strokeWidth="1.5" />
            </>,
          )}
        </>
      )
    case 'no-data':
      return (
        <>
          <rect x="24" y="16" width="92" height="68" rx="5" stroke="var(--ui-muted)" {...draw(0)} />
          <path d="M24 30 H116 M56 16 V84" stroke="var(--ui-muted)" strokeWidth="1.25" {...draw(150)} />
          <path d="M32 43 H48 M64 43 H104 M32 57 H44 M64 57 H96 M32 71 H46 M64 71 H100" stroke="var(--ui-faint)" strokeDasharray="3 3" {...fade(300)} />
          {badge(116, 78, <><circle cx="114.5" cy="76.5" r="4.5" strokeWidth="1.5" /><path d="M118 80 L121 83" strokeWidth="1.5" /></>)}
        </>
      )
  }
}

/** ~140px illustration for EmptyState. Decorative. */
export function EmptyArt({ variant }: { variant: EmptyStateVariant }) {
  const heat = useSvgId('cfd-empty-heat')
  return (
    <svg viewBox="0 0 140 100" width="140" height="100" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <style>{DRAW_CSS}</style>
      <defs>
        <linearGradient id={heat} x1="30" x2="116" y1="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={HEAT_COOL} />
          <stop offset="1" stopColor={HEAT_HOT} />
        </linearGradient>
      </defs>
      {renderVariant(variant, heat)}
    </svg>
  )
}
