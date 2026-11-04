import type { ComponentType } from 'react'
import { StepFrame, type StepArtProps } from './StepFrame'
import { ConditionsArt, StencilArt } from './steps/conditions'
import { ConvergenceArt, MatrixArt } from './steps/linear'
import { MaterialArt, PhenomenaArt } from './steps/physics'
import { ResultsArt, RunArt } from './steps/run'
import { GeometryArt, ProblemArt } from './steps/setup'
import { ValidationArt } from './steps/validation'

/** Workflow step numbers, 1-based, in app order. */
export type WorkflowStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11

const ART: Record<WorkflowStep, ComponentType<StepArtProps>> = {
  1: ProblemArt,
  2: GeometryArt,
  3: PhenomenaArt,
  4: MaterialArt,
  5: ConditionsArt,
  6: StencilArt,
  7: MatrixArt,
  8: ConvergenceArt,
  9: RunArt,
  10: ResultsArt,
  11: ValidationArt,
}

export interface StepIllustrationProps {
  /** 1–11; anything else renders nothing. */
  step: number
  /** Size it with Tailwind, e.g. `size-12` / `size-16`; colour comes from `text-*` (currentColor). */
  className?: string
  /** Colour of the single accent element. Default `var(--ui-accent)`. */
  accent?: string
}

/** Line-art illustration for a workflow step; draws itself in on mount (reduced-motion safe). */
export function StepIllustration({ step, className, accent = 'var(--ui-accent)' }: StepIllustrationProps) {
  const Art = ART[step as WorkflowStep]
  if (!Art) return null
  return (
    <StepFrame className={className}>
      <Art accent={accent} />
    </StepFrame>
  )
}
