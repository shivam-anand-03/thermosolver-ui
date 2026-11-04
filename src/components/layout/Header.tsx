import { BookOpen, ChevronDown, Download, FileJson, FileSpreadsheet, FileText, FlaskConical, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Hint } from '@/components/ui/tooltip'
import type { Example } from '@/types/solver'
import { LogoMark } from '@/components/svg'
import { ThemeToggle } from './ThemeToggle'

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
  return (
    <header className="sticky top-0 z-30 px-3 pt-3">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 rounded-full border border-slate-200 bg-white/85 pr-2 pl-4 shadow-[0_12px_32px_-16px_rgba(18,18,18,0.18)] backdrop-blur-md backdrop-saturate-150 sm:pl-5">
        <a href="/" className="flex min-w-0 shrink items-center gap-2.5" aria-label="CFD Solver home">
          <LogoMark size={34} decorative className="shrink-0" />
          <span className="text-[15px] font-bold tracking-tight whitespace-nowrap text-slate-900 max-[420px]:sr-only sm:text-[19px]">
            CFD <span className="text-[#eb6834]">Solver</span>
          </span>
        </a>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <a href="#" className="hidden text-[12.5px] text-slate-500 underline-offset-4 hover:text-slate-900 hover:underline lg:inline">
            ← Three-phase workflow (1-D/2-D/3-D)
          </a>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm">
                <BookOpen />
                <span className="hidden sm:inline">Examples</span>
                <ChevronDown className="hidden opacity-60 sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[min(92vw,380px)]">
              <DropdownMenuLabel>Examples</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {examples.length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">Examples unavailable. Is the API running?</div>}
              {examples.map((ex) => (
                <DropdownMenuItem key={ex.id} onSelect={() => onLoadExample(ex)} className="items-start gap-3 px-3 py-2">
                  <FlaskConical className="mt-0.5 size-4 shrink-0 text-primary-ink" />
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-1.5 text-[13px] font-medium">
                      {ex.title}
                      {ex.is_reference && <Badge variant="warning">Reference</Badge>}
                      <Badge variant="neutral">{ex.problem_type}</Badge>
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{ex.description}</span>
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Hint label="Reset inputs">
            <Button variant="secondary" size="sm" onClick={onReset} aria-label="Reset">
              <RotateCcw />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          </Hint>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" disabled={!canExport || exporting}>
                <Download />
                <span className="hidden sm:inline">{exporting ? 'Exporting…' : 'Export'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Export results</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(
                [
                  ['pdf', FileText, 'PDF report', 'Derivation, matrices, charts'],
                  ['csv', FileSpreadsheet, 'CSV data', 'Node, x, temperature'],
                  ['json', FileJson, 'JSON', 'Configuration + full results'],
                ] as const
              ).map(([kind, Icon, label, hint]) => (
                <DropdownMenuItem key={kind} onSelect={() => onExport(kind)} className="gap-3 px-3 py-2">
                  <Icon className="size-4 text-muted-foreground" />
                  <span>
                    <span className="block text-[13px] font-medium">{label}</span>
                    <span className="block text-[11px] text-muted-foreground">{hint}</span>
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
