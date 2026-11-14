import { Check } from 'lucide-react'
import { Hint } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export interface StepDef {
  id: number
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
}

/** Vertical step list (desktop sidebar). */
export function Stepper({
  steps,
  current,
  onSelect,
  isComplete,
  hasError,
  isLocked,
  collapsed = false,
}: {
  steps: StepDef[]
  current: number
  onSelect: (id: number) => void
  isComplete: (id: number) => boolean
  hasError: (id: number) => boolean
  isLocked: (id: number) => boolean
  /** Icon-rail mode: number badges only, titles in tooltips. */
  collapsed?: boolean
}) {
  return (
    <nav aria-label="Solver steps">
      <ol className="flex flex-col">
        {steps.map((s) => {
          const active = s.id === current
          const done = isComplete(s.id) && !active
          const err = hasError(s.id)
          const locked = isLocked(s.id)
          const button = (
              <button
                type="button"
                disabled={locked}
                onClick={() => onSelect(s.id)}
                aria-current={active ? 'step' : undefined}
                aria-label={collapsed ? `${s.id}. ${s.title}` : undefined}
                className={cn(
                  'flex w-full items-center gap-3 border-l-2 py-2',
                  collapsed ? 'justify-center px-0' : 'pr-3 pl-4',
                  'text-left text-[13.5px] focus-visible:bg-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40',
                  active ? 'border-primary bg-primary-soft text-foreground' : 'border-transparent text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <span
                  className={cn(
                    'grid size-5 shrink-0 place-items-center rounded-sm font-mono text-[11px]',
                    active && 'bg-primary text-primary-foreground',
                    !active && err && 'bg-amber-100 text-amber-800',
                    !active && !err && done && 'bg-foreground/80 text-background',
                    !active && !err && !done && 'border border-input text-muted-foreground',
                  )}
                >
                  {done && !err ? <Check className="size-3" strokeWidth={3} /> : s.id}
                </span>
                {!collapsed && (
                  <span className="min-w-0">
                    <span className={cn('block leading-tight', active && 'font-medium')}>{s.title}</span>
                    <span className="block truncate text-[11.5px] text-muted-foreground/80">{s.subtitle}</span>
                  </span>
                )}
              </button>
          )
          return (
            <li key={s.id}>
              {collapsed ? (
                <Hint label={s.title} side="right">
                  {button}
                </Hint>
              ) : (
                button
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/** Compact top progress indicator (mobile / tablet). */
export function MobileProgress({ steps, current, onSelect, isLocked }: { steps: StepDef[]; current: number; onSelect: (id: number) => void; isLocked: (id: number) => boolean }) {
  const cur = steps.find((s) => s.id === current)!
  return (
    <div className="mx-3 mt-3 rounded-2xl border bg-card px-4 py-2.5 lg:hidden">
      <div className="mb-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          {current}/{steps.length}
        </span>{' '}
        {cur.title}
      </div>
      <div className="flex gap-0.5">
        {steps.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-label={`Go to step ${s.id}: ${s.title}`}
            disabled={isLocked(s.id)}
            onClick={() => onSelect(s.id)}
            className={cn('h-1 flex-1 disabled:cursor-not-allowed', s.id <= current ? 'bg-primary' : 'bg-muted')}
          />
        ))}
      </div>
    </div>
  )
}
