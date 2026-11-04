import type { ReactNode } from 'react'
import { DRAW_CSS, cx } from './shared'

export interface StepArtProps {
  /** Colour of the single accent element. */
  accent: string
}

/** 48×48 line-art canvas shared by every step illustration. */
export function StepFrame({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      className={cx('shrink-0', className)}
    >
      <style>{DRAW_CSS}</style>
      {children}
    </svg>
  )
}
