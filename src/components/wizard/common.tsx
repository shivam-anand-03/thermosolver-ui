import { AlertTriangle, Info, XCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
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
    // informational callouts are static notes, not live alerts
    <Alert variant={tone === 'error' ? 'destructive' : tone === 'warning' ? 'warning' : 'default'} role={tone === 'info' ? 'note' : 'alert'} className={className}>
      <Icon className="shrink-0" />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription className="block min-w-0">{children}</AlertDescription>
    </Alert>
  )
}

/** Key/value stat used in derived-quantity panels. */
export function Stat({ label, value, sub, accent = false }: { label: React.ReactNode; value: React.ReactNode; sub?: React.ReactNode; accent?: boolean }) {
  return (
    <Card className={cn('shadow-none', accent ? 'border-primary/40 bg-primary-soft' : 'bg-muted')}>
      <CardContent className="px-3 py-2">
        <div className="text-[12px] text-muted-foreground">{label}</div>
        <div className={cn('font-mono text-[14px] font-medium tabular', accent ? 'text-primary-ink' : 'text-foreground')}>{value}</div>
        {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  )
}
