import * as React from 'react'
import { cn } from '@/lib/utils'
import { Input } from './input'
import { Label } from './label'

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
        {symbol && <span className="font-mono text-[12px] font-normal text-slate-400">{symbol}</span>}
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
        {unitSlot ??
          (unit && (
            <span className="inline-flex min-w-14 items-center justify-center rounded-r border border-l-0 border-slate-300 bg-slate-100 px-2 text-xs text-slate-600">
              {unit}
            </span>
          ))}
      </div>
      {error ? (
        <p id={`${id}-err`} className="text-xs text-red-600">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-slate-500">{hint}</p>
      )}
    </div>
  )
}

/** Unit selector rendered as the input's right adornment. */
export function UnitSelect<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: T[]; label: string }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="min-w-16 rounded-r border border-l-0 border-slate-300 bg-slate-100 px-2 text-xs text-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:outline-none"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}
