// Client-side preview of the boundary finite-difference rows (mirrors backend boundary_conditions.py).
import type { BoundaryScheme, BoundaryType, ProblemType, TemperatureUnit } from '@/types/solver'
import { fmt } from './format'

export interface BcPreview {
  physical: string // the physical condition
  general: string // the discretised equation in symbols
  numeric: string // with numbers substituted
}

/** dT/dx implied by a derivative-type BC (positive q'' = heat entering the slab). */
export function impliedGradient(side: 'left' | 'right', type: BoundaryType, value: number, k: number): number {
  if (type === 'gradient') return value
  const q = type === 'adiabatic' ? 0 : value
  return side === 'left' ? -q / k : q / k
}

export function bcPreview(opts: {
  side: 'left' | 'right'
  type: BoundaryType
  value: number
  k: number
  dx: number
  N: number
  qgen: number
  scheme: BoundaryScheme
  problem: ProblemType
  fo: number
  tempUnit: TemperatureUnit
}): BcPreview {
  const { side, type, value, k, dx, N, qgen, scheme, problem, fo, tempUnit } = opts
  const x = side === 'left' ? '0' : 'L'
  const i = side === 'left' ? 1 : N
  const nb = side === 'left' ? 2 : N - 1
  const sup = problem === 'transient' ? '^{n+1}' : ''
  const Ti = `T_{${i}}${sup}`
  const Tn = `T_{${nb}}${sup}`
  const n = (v: number) => (Number.isFinite(v) ? fmt(v, 6) : '?')
  const u = tempUnit === 'C' ? '^\\circ\\mathrm{C}' : '\\,\\mathrm{K}'

  if (type === 'temperature') {
    return {
      physical: `T(${x}) = ${n(value)}${u}`,
      general: `${Ti} = T_{\\text{${side}}}`,
      numeric: `${Ti} = ${n(value)}`,
    }
  }
  const g = impliedGradient(side, type, value, k)
  const s = side === 'right' ? 1 : -1
  const physical =
    type === 'gradient'
      ? `\\left.\\frac{dT}{dx}\\right|_{x=${x}} = ${n(value)}\\ \\mathrm{K/m}`
      : `${side === 'left' ? '-' : ''}k\\left.\\frac{dT}{dx}\\right|_{x=${x}} = q''_{in} = ${type === 'adiabatic' ? '0' : n(value)}\\ \\mathrm{W/m^2}`
  const lhs = side === 'left' ? `${Ti} - ${Tn}` : `-${Tn} + ${Ti}`

  if (scheme === 'first_order') {
    const diff = side === 'left' ? `\\frac{${Tn} - ${Ti}}{\\Delta x}` : `\\frac{${Ti} - ${Tn}}{\\Delta x}`
    return {
      physical,
      general: `${diff} = \\frac{dT}{dx} \\;\\Rightarrow\\; ${lhs} = ${s > 0 ? '' : '-'}\\frac{dT}{dx}\\,\\Delta x`,
      numeric: `${lhs} = ${n(s * g * dx)}`,
    }
  }
  if (problem === 'steady') {
    const rhs = (qgen / k) * dx * dx * 0.5 + s * g * dx
    return {
      physical,
      general: `${lhs} = \\frac{q'''\\Delta x^2}{2k} ${s > 0 ? '+' : '-'} \\frac{dT}{dx}\\Delta x \\quad (\\text{ghost node})`,
      numeric: `${lhs} = ${n(rhs)}`,
    }
  }
  const c = fo * (qgen / k) * dx * dx + s * 2 * fo * g * dx
  return {
    physical,
    general: `(1+2Fo)\\,${Ti} - 2Fo\\,${Tn} = T_{${i}}^{n} ${s > 0 ? '+' : '-'} 2Fo\\,\\frac{dT}{dx}\\Delta x`,
    numeric: `${n(1 + 2 * fo)}\\,${Ti} - ${n(2 * fo)}\\,${Tn} = T_{${i}}^{n}${c ? ` ${c > 0 ? '+' : '-'} ${n(Math.abs(c))}` : ''}`,
  }
}
