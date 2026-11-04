import { createContext, useCallback, useContext, useState } from 'react'
import { flushSync } from 'react-dom'

export type Theme = 'light' | 'dark'

const KEY = 'thermosolve-theme'

function readTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function save(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* private mode: the choice just isn't remembered */
  }
}

interface ThemeCtx {
  theme: Theme
  /** Switch theme. With an origin point the new theme is revealed as a growing circle from it. */
  toggle: (origin?: { x: number; y: number }) => void
}

const Ctx = createContext<ThemeCtx>({ theme: 'light', toggle: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readTheme)

  const toggle = useCallback((origin?: { x: number; y: number }) => {
    const next: Theme = readTheme() === 'dark' ? 'light' : 'dark'
    const apply = () => {
      document.documentElement.classList.toggle('dark', next === 'dark')
      save(next)
      // canvases read CSS variables while rendering, so re-render in the same frame
      flushSync(() => setTheme(next))
    }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!document.startViewTransition || reduce) {
      apply()
      return
    }

    const x = origin?.x ?? window.innerWidth / 2
    const y = origin?.y ?? 0
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
    const transition = document.startViewTransition(apply)
    transition.ready
      .then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration: 700, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' },
        )
      })
      .catch(() => {})
  }, [])

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>
}

export const useTheme = () => useContext(Ctx)

/** Current value of a CSS custom property on <html> (for canvas drawing). */
export function cssVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}
