import * as React from 'react'
import { cn } from '@/lib/utils'
import { Input } from './input'
import { Label } from './label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

/** Labelled numeric input with a unit adornment, hint and inline error. */
export function Field({
  id,
  label,
  symbol,
  unit,
  value,
  onChange,
  error,
  hint,
  disabled,
  className,
  unitSlot,
  inputMode = 'decimal',
}: {
  id: string
  label: string
  symbol?: React.ReactNode
  unit?: string
  value: string
  onChange: (v: string) => void
  error?: string
  hint?: React.ReactNode
  disabled?: boolean
  className?: string
  unitSlot?: React.ReactNode
  inputMode?: 'decimal' | 'numeric'
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id} className="flex items-baseline justify-between gap-2">
        <span>{label}</span>
        {symbol && <span className="font-mono text-[12px] font-normal text-muted-foreground">{symbol}</span>}
      </Label>
      <div className="flex items-stretch">
        <Input
          id={id}
          value={value}
          inputMode={inputMode}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={cn((unit || unitSlot) && 'rounded-r-none')}
        />
        {unitSlot ?? (unit && <span className="inline-flex min-w-14 items-center justify-center rounded-r-md border border-l-0 border-input bg-muted px-2 text-xs text-muted-foreground">{unit}</span>)}
      </div>
      {error ? (
        <p id={`${id}-err`} className="text-xs text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}

/** Unit selector rendered as the input's right adornment (shadcn Select). */
export function UnitSelect<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: T[]; label: string }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger aria-label={label} className="h-auto min-w-16 rounded-l-none border-l-0 bg-muted px-2 text-xs text-muted-foreground shadow-none">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
