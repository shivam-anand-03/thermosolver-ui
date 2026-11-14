import { Check } from 'lucide-react'
import { Hint } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { StepDef } from '../phases'
import { PHASE_THEME, type PhaseKey } from '../theme'

export function StepButton({ s, phase, active, done, disabled, collapsed, onClick }: { s: StepDef; phase: PhaseKey; active: boolean; done: boolean; disabled: boolean; collapsed: boolean; onClick: () => void }) {
  const th = PHASE_THEME[phase]
  const button = (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-current={active ? 'step' : undefined}
      aria-label={collapsed ? s.title : undefined}
      className={cn(
        'motion-surface flex w-full items-center gap-2.5 rounded-md py-1.5 text-left text-[13px] focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40',
        collapsed ? 'justify-center px-0' : 'px-2',
        active ? 'font-medium text-slate-900' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
      )}
      style={active ? { background: th.soft, boxShadow: `inset 3px 0 0 ${th.accent}` } : undefined}
    >
      <span
        className={cn('motion-surface grid h-5 min-w-7 shrink-0 place-items-center rounded px-1 font-mono text-[10.5px] font-semibold', active && 'radial-pop')}
        style={
          active
            ? { background: th.accent, color: 'var(--ui-on-accent)' }
            : done
              ? { background: th.soft, color: th.text, boxShadow: `inset 0 0 0 1px ${th.ring}` }
              : { boxShadow: 'inset 0 0 0 1px var(--ui-rule)', color: 'var(--ui-muted)' }
        }
      >
        {done ? <Check className="size-3" strokeWidth={3} /> : s.roman}
      </span>
      {!collapsed && <span className="leading-tight">{s.title}</span>}
    </button>
  )
  return collapsed ? (
    <Hint label={s.title} side="right">
      {button}
    </Hint>
  ) : (
    button
  )
}
