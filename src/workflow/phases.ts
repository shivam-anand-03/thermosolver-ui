import { BarChart3, Box, Calculator, Grid3x3, Layers, PlayCircle, ShieldCheck, SlidersHorizontal, Thermometer, Waves } from 'lucide-react'
import type { PhaseKey } from './theme'

export interface StepDef {
  id: number
  roman: string
  title: string
  icon: React.ComponentType<{ className?: string }>
}

export const PHASES: { key: PhaseKey; name: string; title: string; steps: StepDef[] }[] = [
  {
    key: 'pre',
    name: 'Phase I',
    title: 'Preprocessor',
    steps: [
      { id: 1, roman: 'I', title: 'Problem statement', icon: Box },
      { id: 2, roman: 'II', title: 'Geometry and grid', icon: Grid3x3 },
      { id: 3, roman: 'III', title: 'Physical phenomena', icon: Waves },
      { id: 4, roman: 'IV', title: 'Material properties', icon: Layers },
      { id: 5, roman: 'V', title: 'Initial and boundary conditions', icon: Thermometer },
    ],
  },
  {
    key: 'solver',
    name: 'Phase II',
    title: 'Solver',
    steps: [
      { id: 6, roman: 'I', title: 'Numerical method', icon: Calculator },
      { id: 7, roman: 'II', title: 'Matrix inversion', icon: Grid3x3 },
      { id: 8, roman: 'III', title: 'Convergence and initialisation', icon: SlidersHorizontal },
      { id: 9, roman: 'IV', title: 'Solve: run calculation', icon: PlayCircle },
    ],
  },
  {
    key: 'post',
    name: 'Phase III',
    title: 'Post-processing',
    steps: [
      { id: 10, roman: 'I', title: 'Results', icon: BarChart3 },
      { id: 11, roman: 'II', title: 'Validation', icon: ShieldCheck },
    ],
  },
]
export const LAST = 11
