import { PHASE_THEME, type PhaseKey } from '../theme'

export function PhaseHeading({ phase, name, title, collapsed }: { phase: PhaseKey; name: string; title: string; collapsed: boolean }) {
  const th = PHASE_THEME[phase]
  if (collapsed) return <div className="mx-auto mt-2 mb-1.5 h-0.5 w-6 rounded-full" style={{ background: th.accent }} aria-label={`${name} ${title}`} />
  return (
    <div className="flex items-center gap-2 px-2 pt-2 pb-1.5">
      <span className="size-2 rounded-full" style={{ background: th.accent }} />
      <span className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: th.text }}>
        {name}
      </span>
      <span className="text-[11px] font-medium text-slate-400">{title}</span>
    </div>
  )
}
