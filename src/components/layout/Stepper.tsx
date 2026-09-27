import { Check } from 'lucide-react'
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
}: {
  steps: StepDef[]
  current: number
  onSelect: (id: number) => void
  isComplete: (id: number) => boolean
  hasError: (id: number) => boolean
  isLocked: (id: number) => boolean
}) {
  return (
    <nav aria-label="Solver steps">
      <ol className="flex flex-col">
        {steps.map((s) => {
          const active = s.id === current
          const done = isComplete(s.id) && !active
          const err = hasError(s.id)
          const locked = isLocked(s.id)
          return (
            <li key={s.id}>
              <button
                type="button"
                disabled={locked}
                onClick={() => onSelect(s.id)}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'flex w-full items-center gap-3 border-l-2 py-2 pr-3 pl-4 text-left text-[13.5px] focus-visible:bg-slate-100 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40',
                  active ? 'border-primary bg-primary-soft text-slate-900' : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                <span
                  className={cn(
                    'grid size-5 shrink-0 place-items-center rounded-sm font-mono text-[11px]',
                    active && 'bg-primary text-white',
                    !active && err && 'bg-amber-100 text-amber-800',
                    !active && !err && done && 'bg-slate-700 text-white',
                    !active && !err && !done && 'border border-slate-300 text-slate-500',
                  )}
                >
                  {done && !err ? <Check className="size-3" strokeWidth={3} /> : s.id}
                </span>
                <span className="min-w-0">
                  <span className={cn('block leading-tight', active && 'font-medium')}>{s.title}</span>
                  <span className="block truncate text-[11.5px] text-slate-400">{s.subtitle}</span>
                </span>
              </button>
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
    <div className="border-b border-slate-300 bg-white px-4 py-2.5 lg:hidden">
      <div className="mb-2 text-xs text-slate-600">
        <span className="font-medium text-slate-900">
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
            className={cn('h-1 flex-1 disabled:cursor-not-allowed', s.id <= current ? 'bg-primary' : 'bg-slate-200')}
          />
        ))}
      </div>
    </div>
  )
}
