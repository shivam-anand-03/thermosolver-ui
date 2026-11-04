import { cn } from '@/lib/utils'
import { ToggleGroup, ToggleGroupItem } from './toggle-group'

export interface SegmentOption<T extends string> {
  value: T
  label: React.ReactNode
  icon?: React.ReactNode
}

/** Single-select segmented control, built on shadcn's ToggleGroup. */
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
    <ToggleGroup
      type="single"
      variant="outline"
      size={size}
      value={value}
      // a single toggle group allows deselecting; keep one option always selected
      onValueChange={(v) => v && onChange(v as T)}
      aria-label={ariaLabel}
      className={cn('bg-card', className)}
    >
      {options.map((o) => (
        <ToggleGroupItem key={o.value} value={o.value} className="flex-none">
          {o.icon}
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
