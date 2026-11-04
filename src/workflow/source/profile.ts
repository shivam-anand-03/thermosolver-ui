import { evaluate, type Ast } from '../expression'
import type { Setup } from '../types'
import { SAMPLES } from './constants'

export interface ProfilePoint {
  x: number
  v: number
}

/** f sampled along x (at the mid-plane in 2-D and 3-D), plus the first x where it is not finite. */
export function sampleProfile(setup: Setup, ast: Ast): { pts: ProfilePoint[]; bad: number | null } {
  const g = setup.preprocessor.geometry
  const pts: ProfilePoint[] = []
  let bad: number | null = null
  for (let i = 0; i <= SAMPLES; i++) {
    const x = (g.length * i) / SAMPLES
    const v = evaluate(ast, { x, y: g.width / 2, z: g.height / 2, L: g.length, W: g.width, H: g.height })
    if (!Number.isFinite(v)) bad ??= x
    pts.push({ x, v })
  }
  return { pts, bad }
}
