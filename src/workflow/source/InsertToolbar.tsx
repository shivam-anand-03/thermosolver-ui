import { Tex } from '@/components/math/Tex'
import { Button } from '@/components/ui/button'
import { Hint } from '@/components/ui/tooltip'
import { KEYS } from './constants'

/** Buttons that insert functions, constants and variables at the caret. */
export function InsertToolbar({ dim, onInsert }: { dim: number; onInsert: (ins: string, back?: number) => void }) {
  return (
    <div className="flex flex-wrap gap-1" role="toolbar" aria-label="Insert into expression">
      {KEYS.filter((k) => !k.minDim || dim >= k.minDim).map((k) => (
        <Hint key={k.title} label={k.title}>
          <Button
            variant="outline"
            size="sm"
            aria-label={`Insert ${k.title}`}
            // keep focus (and the caret) in the expression input
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onInsert(k.ins, k.back)}
            className="min-w-9 px-2 font-normal text-foreground hover:border-primary/50 hover:bg-primary-soft"
          >
            <Tex math={k.tex} />
          </Button>
        </Hint>
      ))}
    </div>
  )
}
