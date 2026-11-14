import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Hint } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/** Sticky desktop sidebar that collapses to a narrow icon rail. */
export function SidebarShell({
  collapsed,
  onToggle,
  label,
  className,
  children,
}: {
  collapsed: boolean
  onToggle: () => void
  /** Small heading shown next to the toggle while open. */
  label?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose
  return (
    <aside
      className={cn(
        'sticky top-[80px] mt-3 ml-3 hidden h-[calc(100vh-92px)] shrink-0 flex-col overflow-x-hidden overflow-y-auto rounded-2xl border transition-[width] duration-200 ease-out lg:flex',
        collapsed ? 'w-14' : 'w-64 min-[2300px]:w-72',
        className,
      )}
    >
      <div className={cn('mb-1 flex items-center gap-2', collapsed ? 'justify-center px-1' : 'pr-2 pl-4')}>
        {!collapsed && <div className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{label}</div>}
        <Hint label={collapsed ? 'Open sidebar' : 'Close sidebar'} side="right">
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? 'Open sidebar' : 'Close sidebar'}
            aria-expanded={!collapsed}
            className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            <Icon className="size-4" />
          </button>
        </Hint>
      </div>
      {children}
    </aside>
  )
}
