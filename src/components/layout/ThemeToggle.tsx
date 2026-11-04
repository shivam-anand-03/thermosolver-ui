import { Moon, Sun } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Hint } from '@/components/ui/tooltip'
import { useTheme } from '@/lib/theme'

/** Light / dark switch. The new theme spreads out radially from this button. */
export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const ref = useRef<HTMLButtonElement>(null)
  const dark = theme === 'dark'

  return (
    <Hint label={dark ? 'Light mode' : 'Dark mode'}>
      <Button
        ref={ref}
        variant="secondary"
        size="icon-sm"
        onClick={() => {
          const b = ref.current
          if (!b) return toggle()
          const r = b.getBoundingClientRect()
          b.dataset.pulse = '0'
          void b.offsetWidth // restart the ring animation
          b.dataset.pulse = '1'
          toggle({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
        }}
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="theme-toggle rounded-full"
      >
        <Sun className="ti ti-sun size-4" aria-hidden />
        <Moon className="ti ti-moon size-4" aria-hidden />
      </Button>
    </Hint>
  )
}
