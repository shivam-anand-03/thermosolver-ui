import { cn } from '@/lib/utils'

export interface SegmentOption<T extends string> {
  value: T
  label: React.ReactNode
  icon?: React.ReactNode
}

/** A compact toggle group (single selection). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = 'default',
  ariaLabel,
}: {
  value: T
  onChange: (v: T) => void
  options: SegmentOption<T>[]
  className?: string
  size?: 'default' | 'sm'
  ariaLabel?: string
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn('inline-flex flex-wrap rounded border border-slate-300 bg-white', className)}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex items-center gap-1.5 border-r border-slate-300 font-medium last:border-r-0 focus-visible:bg-slate-100 focus-visible:outline-none [&_svg]:size-3.5',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-[13px]',
              active ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
            )}
          >
            {o.icon}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
