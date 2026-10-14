import { useId, useState } from 'react'
import { Tex } from '@/components/math/Tex'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { PHASE_THEME, phaseOf } from './theme'

/** Numeric input that keeps the typed text and only commits valid numbers. */
export function NumField({
  label,
  symbol,
  unit,
  value,
  onChange,
  integer = false,
  min,
  max,
  hint,
  disabled,
  className,
}: {
  label: string
  symbol?: string
  unit?: string
  value: number
  onChange: (v: number) => void
  integer?: boolean
  min?: number
  max?: number
  hint?: React.ReactNode
  disabled?: boolean
  className?: string
}) {
  const id = useId()
  const [text, setText] = useState(String(value))
  const [prev, setPrev] = useState(value)
  if (value !== prev) {
    // follow external changes (examples, resets) without fighting the user's typing
    setPrev(value)
    if (Number(text) !== value || text.trim() === '') setText(String(value))
  }

  const parsed = text.trim() === '' ? NaN : Number(text)
  let error: string | undefined
  if (!Number.isFinite(parsed)) error = 'Enter a number'
  else if (integer && !Number.isInteger(parsed)) error = 'Whole number required'
  else if (min !== undefined && parsed < min) error = `Must be ≥ ${min}`
  else if (max !== undefined && parsed > max) error = `Must be ≤ ${max}`

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id} className="flex items-baseline justify-between gap-2">
        <span className="truncate">{label}</span>
        {symbol && <Tex math={symbol} className="text-[12px] font-normal text-slate-500" />}
      </Label>
      <div className="flex min-w-0 items-stretch">
        <Input
          id={id}
          value={text}
          disabled={disabled}
          inputMode={integer ? 'numeric' : 'decimal'}
          aria-invalid={!!error}
          onChange={(e) => {
            setText(e.target.value)
            const v = Number(e.target.value)
            if (e.target.value.trim() !== '' && Number.isFinite(v) && (!integer || Number.isInteger(v))) onChange(v)
          }}
          className={cn('min-w-0 flex-1', unit && 'rounded-r-none')}
        />
        {unit && (
          <span className="inline-flex shrink-0 items-center justify-center rounded-r border border-l-0 border-slate-300 bg-slate-100 px-2 text-xs whitespace-nowrap text-slate-600">
            {unit}
          </span>
        )}
      </div>
      {error && !disabled ? <p className="text-xs text-red-600">{error}</p> : hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

export interface Choice<T extends string | number> {
  value: T
  title: React.ReactNode
  description?: React.ReactNode
  math?: string
  badge?: React.ReactNode
  disabled?: boolean
}

/** Radio group rendered as selectable cards. */
export function ChoiceCards<T extends string | number>({
  value,
  onChange,
  options,
  columns = 3,
  label,
}: {
  value: T
  onChange: (v: T) => void
  options: Choice<T>[]
  columns?: 2 | 3 | 4
  label: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('grid gap-2', columns === 2 && 'sm:grid-cols-2', columns === 3 && 'sm:grid-cols-3', columns === 4 && 'sm:grid-cols-2 xl:grid-cols-4')}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex flex-col items-start gap-1 rounded-md border px-3 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45',
              active ? 'border-primary bg-primary-soft ring-1 ring-primary' : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50',
            )}
          >
            <span className="flex w-full items-center justify-between gap-2">
              <span className={cn('text-[13.5px] font-semibold', active ? 'text-primary' : 'text-slate-900')}>{o.title}</span>
              {o.badge}
            </span>
            {o.description && <span className="text-[12px] leading-snug text-slate-600">{o.description}</span>}
            {o.math && (
              <span className="w-full overflow-x-auto text-[12px] text-slate-700">
                <Tex math={o.math} />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function Section({ title, description, children, className, aside }: { title: React.ReactNode; description?: React.ReactNode; children: React.ReactNode; className?: string; aside?: React.ReactNode }) {
  return (
    <section className={cn('rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]', className)}>
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div>
          <h3 className="text-[14px] font-semibold text-slate-900">{title}</h3>
          {description && <p className="mt-0.5 text-[12.5px] leading-snug text-slate-500">{description}</p>}
        </div>
        {aside}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

export function PhaseStepHeader({ phase, roman, title, description }: { phase: string; roman: string; title: string; description: React.ReactNode }) {
  return (
    <div className="mb-5 flex gap-3.5">
      <span
        className="grid h-11 min-w-11 shrink-0 place-items-center rounded-lg px-2 font-mono text-[15px] font-semibold text-white shadow-sm"
        style={{ background: PHASE_THEME[phaseOf(phase)].accent }}
        aria-hidden
      >
        {roman}
      </span>
      <div className="min-w-0">
        <div className="text-[11.5px] font-semibold tracking-wide uppercase" style={{ color: PHASE_THEME[phaseOf(phase)].text }}>
          {phase}
        </div>
        <h2 className="text-xl leading-tight font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 max-w-3xl text-[13.5px] leading-relaxed text-slate-600">{description}</p>
      </div>
    </div>
  )
}

export function KV({ rows, className }: { rows: [React.ReactNode, React.ReactNode][]; className?: string }) {
  return (
    <dl className={cn('space-y-1.5 text-[12.5px]', className)}>
      {rows.map(([k, v], i) => (
        <div key={i} className="flex justify-between gap-3">
          <dt className="text-slate-500">{k}</dt>
          <dd className="text-right font-medium text-slate-900 tabular">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

export function Select<T extends string>({ value, onChange, options, label, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string; className?: string }) {
  const id = useId()
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-8 rounded border border-slate-300 bg-white px-2 text-[13px] text-slate-900 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

/** Headline number tile. `hot` / `cold` tint the extremes of the temperature field. */
export function Tile({ label, value, sub, tone = 'neutral' }: { label: React.ReactNode; value: React.ReactNode; sub?: React.ReactNode; tone?: 'neutral' | 'hot' | 'cold' }) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-white px-3.5 py-2.5',
        tone === 'hot' && 'border-orange-200 bg-orange-50/70',
        tone === 'cold' && 'border-blue-200 bg-blue-50/70',
        tone === 'neutral' && 'border-slate-200',
      )}
    >
      <div className="text-[11.5px] font-medium text-slate-500">{label}</div>
      <div className="mt-0.5 font-mono text-[16px] font-semibold text-slate-900 tabular">{value}</div>
      {sub && <div className="mt-0.5 truncate text-[11px] text-slate-500">{sub}</div>}
    </div>
  )
}
