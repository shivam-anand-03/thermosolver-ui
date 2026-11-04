import { useEffect, useState } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/lib/theme'
import { SolverPage } from '@/pages/SolverPage'
import { WorkflowPage } from '@/workflow/WorkflowPage'

const isClassic = () => window.location.hash === '#classic'

/** The three-phase workflow is the main app; the original 1-D step-by-step solver lives at #classic. */
export default function App() {
  const [classic, setClassic] = useState(isClassic)
  useEffect(() => {
    const onHash = () => {
      setClassic(isClassic())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return (
    <ThemeProvider>
      <TooltipProvider>{classic ? <SolverPage /> : <WorkflowPage />}</TooltipProvider>
    </ThemeProvider>
  )
}
