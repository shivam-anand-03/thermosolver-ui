import type { ReactNode } from 'react'
import { EmptyArt, type EmptyStateVariant } from './EmptyArt'
import { cx } from './shared'

export interface EmptyStateProps {
  variant: EmptyStateVariant
  title: ReactNode
  description?: ReactNode
  /** Optional call to action (e.g. a <Button>). */
  action?: ReactNode
  className?: string
}

/** Centred placeholder block: illustration, title, muted description, optional action. */
export function EmptyState({ variant, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cx(
        'flex flex-col items-center gap-3 rounded-lg border border-dashed bg-card p-8 text-center',
        className,
      )}
    >
      <EmptyArt variant={variant} />
      <div className="max-w-sm">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
