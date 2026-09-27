import { AlertTriangle, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StepHeader({ step, title, description }: { step: number; title: string; description: React.ReactNode }) {
  return (
    <div className="mb-4 border-b border-slate-300 pb-3">
      <h2 className="text-lg font-semibold text-slate-900">
        <span className="mr-2 font-mono text-slate-400">{step}.</span>
        {title}
      </h2>
      <p className="mt-0.5 max-w-3xl text-[13.5px] text-slate-600">{description}</p>
    </div>
  )
}

export function Callout({ tone = 'info', title, children, className }: { tone?: 'info' | 'warning' | 'error'; title?: string; children: React.ReactNode; className?: string }) {
  const Icon = tone === 'error' ? XCircle : tone === 'warning' ? AlertTriangle : Info
  return (
    <div
      className={cn(
        'flex gap-2.5 rounded border-l-[3px] px-3 py-2.5 text-[13px] leading-relaxed',
        tone === 'info' && 'border-primary bg-primary-soft text-slate-800',
        tone === 'warning' && 'border-amber-500 bg-amber-50 text-amber-900',
        tone === 'error' && 'border-red-600 bg-red-50 text-red-800',
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">
        {title && <div className="font-semibold">{title}</div>}
        <div>{children}</div>
      </div>
    </div>
  )
}

/** Key/value stat used in derived-quantity panels. */
export function Stat({ label, value, sub, accent = false }: { label: React.ReactNode; value: React.ReactNode; sub?: React.ReactNode; accent?: boolean }) {
  return (
    <div className={cn('rounded border px-3 py-2', accent ? 'border-primary/40 bg-primary-soft' : 'border-slate-200 bg-slate-50')}>
      <div className="text-[12px] text-slate-500">{label}</div>
      <div className={cn('font-mono text-[14px] font-medium tabular', accent ? 'text-primary' : 'text-slate-900')}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-slate-500">{sub}</div>}
    </div>
  )
}
