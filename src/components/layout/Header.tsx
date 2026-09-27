import { BookOpen, ChevronDown, Download, FileJson, FileSpreadsheet, FileText, FlaskConical, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Example } from '@/types/solver'

function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && close()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])
  return ref
}

export function Header({
  examples,
  onLoadExample,
  onReset,
  canExport,
  onExport,
  exporting,
}: {
  examples: Example[]
  onLoadExample: (e: Example) => void
  onReset: () => void
  canExport: boolean
  onExport: (kind: 'csv' | 'json' | 'pdf') => void
  exporting: boolean
}) {
  const [exOpen, setExOpen] = useState(false)
  const [expOpen, setExpOpen] = useState(false)
  const exRef = useDismiss(exOpen, () => setExOpen(false))
  const expRef = useDismiss(expOpen, () => setExpOpen(false))

  return (
    <header className="sticky top-0 z-30 border-b border-slate-300 bg-white">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4 sm:px-5">
        <a href="/" className="flex min-w-0 shrink items-center" aria-label="ThermoSolve home">
          <img src="/logo-wide.png" alt="ThermoSolve — 1D heat conduction numerical solver" className="h-9 w-auto sm:h-11" width={900} height={237} />
        </a>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <div className="relative" ref={exRef}>
            <Button variant="secondary" size="sm" onClick={() => setExOpen((o) => !o)} aria-expanded={exOpen} aria-haspopup="menu">
              <BookOpen />
              <span className="hidden sm:inline">Examples</span>
              <ChevronDown className="opacity-60" />
            </Button>
            {exOpen && (
              <div role="menu" className="absolute right-0 mt-2 w-[min(92vw,380px)] overflow-hidden rounded-md border border-slate-300 bg-white p-1 text-slate-800 shadow-lg">
                {examples.length === 0 && <div className="px-3 py-2 text-sm text-slate-500">Examples unavailable. Is the API running?</div>}
                {examples.map((ex) => (
                  <button
                    key={ex.id}
                    role="menuitem"
                    onClick={() => {
                      onLoadExample(ex)
                      setExOpen(false)
                    }}
                    className="flex w-full items-start gap-3 rounded px-3 py-2 text-left hover:bg-slate-100 focus-visible:bg-slate-50 focus-visible:outline-none"
                  >
                    <FlaskConical className="mt-0.5 size-4 shrink-0 text-blue-600" />
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-1.5 text-[13px] font-medium">
                        {ex.title}
                        {ex.is_reference && <Badge variant="warning">Reference</Badge>}
                        <Badge variant="neutral">{ex.problem_type}</Badge>
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{ex.description}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button variant="secondary" size="sm" onClick={onReset} title="Reset inputs">
            <RotateCcw />
            <span className="hidden sm:inline">Reset</span>
          </Button>

          <div className="relative" ref={expRef}>
            <Button size="sm" disabled={!canExport || exporting} onClick={() => setExpOpen((o) => !o)} aria-expanded={expOpen} aria-haspopup="menu">
              <Download />
              <span className="hidden sm:inline">{exporting ? 'Exporting…' : 'Export'}</span>
            </Button>
            {expOpen && (
              <div role="menu" className="absolute right-0 mt-2 w-56 rounded-md border border-slate-300 bg-white p-1 text-slate-800 shadow-lg">
                {(
                  [
                    ['pdf', FileText, 'PDF report', 'Derivation, matrices, charts'],
                    ['csv', FileSpreadsheet, 'CSV data', 'Node, x, temperature'],
                    ['json', FileJson, 'JSON', 'Configuration + full results'],
                  ] as const
                ).map(([kind, Icon, label, hint]) => (
                  <button
                    key={kind}
                    role="menuitem"
                    onClick={() => {
                      onExport(kind)
                      setExpOpen(false)
                    }}
                    className="flex w-full items-center gap-3 rounded px-3 py-2 text-left hover:bg-slate-100"
                  >
                    <Icon className="size-4 text-slate-500" />
                    <span>
                      <span className="block text-[13px] font-medium">{label}</span>
                      <span className="block text-[11px] text-slate-500">{hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
