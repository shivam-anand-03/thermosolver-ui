import { SidebarShell } from '@/components/layout/SidebarShell'
import { useSidebarCollapsed } from '@/hooks/useSidebarCollapsed'
import { PHASES } from '../phases'
import { PhaseHeading } from './PhaseHeading'
import { StepButton } from './StepButton'

interface Props {
  step: number
  hasResult: boolean
  stale: boolean
  locked: (id: number) => boolean
  onGo: (id: number) => void
}

/** Desktop step navigation for the three-phase workflow; collapses to a rail of step badges. */
export function WorkflowSidebar({ step, hasResult, stale, locked, onGo }: Props) {
  const { collapsed, toggle } = useSidebarCollapsed()
  return (
    <SidebarShell collapsed={collapsed} onToggle={toggle} label="Workflow steps" className="border-slate-200 bg-white py-3">
      <nav aria-label="Workflow steps" className={collapsed ? 'px-1.5' : 'px-2'}>
        {PHASES.map((ph) => (
          <div key={ph.name} className="mb-3">
            <PhaseHeading phase={ph.key} name={ph.name} title={ph.title} collapsed={collapsed} />
            <ol className="space-y-0.5">
              {ph.steps.map((s) => (
                <li key={s.id}>
                  <StepButton
                    s={s}
                    phase={ph.key}
                    active={s.id === step}
                    done={s.id !== step && hasResult && (s.id >= 10 || !stale)}
                    disabled={locked(s.id)}
                    collapsed={collapsed}
                    onClick={() => onGo(s.id)}
                  />
                </li>
              ))}
            </ol>
          </div>
        ))}
      </nav>
    </SidebarShell>
  )
}
