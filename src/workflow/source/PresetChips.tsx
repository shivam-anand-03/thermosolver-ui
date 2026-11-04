import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PRESETS } from './constants'

/** One-click example expressions. */
export function PresetChips({ dim, current, onPick }: { dim: number; current: string; onPick: (text: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[12px] text-muted-foreground">Examples</span>
      {PRESETS.filter((p) => !p.minDim || dim >= p.minDim).map((p) => (
        <Button
          key={p.label}
          variant="outline"
          size="sm"
          aria-pressed={current === p.text}
          onClick={() => onPick(p.text)}
          className={cn('h-auto px-2.5 py-1 text-[12px] font-normal shadow-none', current === p.text ? 'border-primary bg-primary-soft text-primary-ink hover:bg-primary-soft hover:text-primary-ink' : 'text-muted-foreground')}
        >
          {p.label}
        </Button>
      ))}
    </div>
  )
}
