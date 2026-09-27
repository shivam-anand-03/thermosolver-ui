// Wizard form model: raw string inputs → typed API requests + instant client-side checks.
import type {
  BoundaryScheme,
  BoundaryType,
  Example,
  LengthUnit,
  ProblemType,
  SteadyRequest,
  TemperatureUnit,
  TransientRequest,
} from '@/types/solver'
import { toMetres } from './units'

export interface BoundaryForm {
  type: BoundaryType
  value: string
}

export interface FormState {
  problemType: ProblemType
  length: string
  lengthUnit: LengthUnit
  nodes: string
  customMesh: boolean
  dx: string // only when customMesh, in lengthUnit
  k: string
  qgen: string
  rho: string
  cp: string
  tempUnit: TemperatureUnit
  left: BoundaryForm
  right: BoundaryForm
  scheme: BoundaryScheme
  initialType: 'uniform' | 'custom'
  initialValue: string
  initialValues: string
  timeStepMode: 'fourier' | 'manual'
  fourier: string
  timeStep: string
  runMode: 'steps' | 'time'
  numSteps: string
  finalTime: string
  outputInterval: string
}

export const DEFAULT_STEADY: FormState = {
  problemType: 'steady',
  length: '0.5',
  lengthUnit: 'm',
  nodes: '5',
  customMesh: false,
  dx: '0.125',
  k: '1',
  qgen: '0',
  rho: '1300',
  cp: '2000',
  tempUnit: 'K',
  left: { type: 'temperature', value: '373' },
  right: { type: 'heat_flux', value: '1000' },
  scheme: 'first_order',
  initialType: 'uniform',
  initialValue: '30',
  initialValues: '',
  timeStepMode: 'fourier',
  fourier: '1',
  timeStep: '10',
  runMode: 'steps',
  numSteps: '40',
  finalTime: '416',
  outputInterval: '',
}

export const DEFAULT_TRANSIENT: FormState = {
  ...DEFAULT_STEADY,
  problemType: 'transient',
  length: '5',
  lengthUnit: 'mm',
  nodes: '6',
  dx: '1',
  k: '0.25',
  tempUnit: 'C',
  left: { type: 'adiabatic', value: '0' },
  right: { type: 'temperature', value: '250' },
}

export const num = (s: string): number => (s.trim() === '' ? NaN : Number(s))

export interface Derived {
  L: number // in metres
  N: number
  dx: number // metres
  alpha: number
  dt: number
  fo: number
  steps: number
  meshExact: boolean
}

/** Derived quantities used across the wizard (Δx, α, Δt, Fo, steps). */
export function derive(f: FormState): Derived {
  const L = toMetres(num(f.length), f.lengthUnit)
  let N = Math.round(num(f.nodes))
  let meshExact = true
  if (f.customMesh) {
    const dxIn = toMetres(num(f.dx), f.lengthUnit)
    const intervals = L / dxIn
    N = Math.round(intervals) + 1
    meshExact = Math.abs(intervals - Math.round(intervals)) < 1e-9 * Math.max(1, intervals)
  }
  const dx = N >= 2 ? L / (N - 1) : NaN
  const alpha = num(f.k) / (num(f.rho) * num(f.cp))
  let dt: number
  let fo: number
  if (f.timeStepMode === 'fourier') {
    fo = num(f.fourier)
    dt = (fo * dx * dx) / alpha
  } else {
    dt = num(f.timeStep)
    fo = (alpha * dt) / (dx * dx)
  }
  const steps = f.runMode === 'steps' ? Math.round(num(f.numSteps)) : Math.max(1, Math.ceil(num(f.finalTime) / dt - 1e-9))
  return { L, N, dx, alpha, dt, fo, steps, meshExact }
}

export type FieldErrors = Partial<Record<string, string>>

/** Instant checks mirroring the backend validator (the backend remains authoritative). */
export function clientValidate(f: FormState): FieldErrors {
  const e: FieldErrors = {}
  const d = derive(f)
  const pos = (key: keyof FormState, label: string) => {
    const v = num(f[key] as string)
    if (!Number.isFinite(v)) e[key] = `${label} must be a number.`
    else if (v <= 0) e[key] = `${label} must be positive.`
  }
  if (!Number.isFinite(num(f.length))) e.length = 'Length must be a number.'
  else if (num(f.length) <= 0) e.length = 'Length must be greater than zero.'
  if (f.customMesh) {
    pos('dx', 'Δx')
    if (!e.dx && d.N < 2) e.dx = 'Δx must not exceed L.'
  } else {
    const n = num(f.nodes)
    if (!Number.isInteger(n)) e.nodes = 'Number of nodes must be a whole number.'
    else if (n < 2) e.nodes = 'Number of nodes must be at least 2.'
    else if (n > 2000) e.nodes = 'Number of nodes must not exceed 2000.'
  }
  pos('k', 'Thermal conductivity')
  if (!Number.isFinite(num(f.qgen))) e.qgen = "q''' must be a number (0 is allowed)."
  const tmin = f.tempUnit === 'C' ? -273.15 : 0
  for (const side of ['left', 'right'] as const) {
    const bc = f[side]
    if (bc.type === 'adiabatic') continue
    const v = num(bc.value)
    if (!Number.isFinite(v)) e[side] = 'Boundary value must be a number.'
    else if (bc.type === 'temperature' && v < tmin) e[side] = 'Temperature is below absolute zero.'
  }
  if (f.problemType === 'steady' && f.left.type !== 'temperature' && f.right.type !== 'temperature') {
    e.bcCombo =
      'At least one boundary condition must constrain the temperature field. Two flux/gradient conditions leave a steady solution undetermined (or impossible, if the heat balance is not zero).'
  }
  if (f.problemType === 'transient') {
    pos('rho', 'Density')
    pos('cp', 'Specific heat')
    if (f.timeStepMode === 'fourier') pos('fourier', 'Fourier number')
    else pos('timeStep', 'Time step')
    if (f.runMode === 'steps') {
      const s = num(f.numSteps)
      if (!Number.isInteger(s) || s < 1) e.numSteps = 'Number of time steps must be a whole number ≥ 1.'
    } else pos('finalTime', 'Final time')
    if (!e.numSteps && !e.finalTime && Number.isFinite(d.steps) && d.steps > 20000)
      e.steps = `This run needs ${d.steps.toLocaleString()} time steps (limit 20,000). Increase Δt or shorten the run.`
    if (f.outputInterval.trim() !== '') {
      const oi = num(f.outputInterval)
      if (!Number.isInteger(oi) || oi < 1) e.outputInterval = 'Output interval must be a whole number ≥ 1.'
    }
    if (f.initialType === 'uniform') {
      const v = num(f.initialValue)
      if (!Number.isFinite(v)) e.initialValue = 'Initial temperature must be a number.'
      else if (v < tmin) e.initialValue = 'Initial temperature is below absolute zero.'
    } else {
      const vals = parseList(f.initialValues)
      if (vals.length !== d.N) e.initialValues = `Enter exactly N = ${d.N} values (found ${vals.length}).`
      else if (vals.some((v) => !Number.isFinite(v))) e.initialValues = 'All initial temperatures must be numbers.'
    }
  }
  return e
}

export function parseList(s: string): number[] {
  return s
    .split(/[\s,;]+/)
    .filter((t) => t.trim() !== '')
    .map(Number)
}

/** Build the API request body from the form. */
export function buildRequest(f: FormState): SteadyRequest | TransientRequest {
  const d = derive(f)
  const length = f.customMesh ? d.L / toMetres(1, f.lengthUnit) : num(f.length)
  const base: SteadyRequest = {
    length,
    length_unit: f.lengthUnit,
    nodes: d.N,
    thermal_conductivity: num(f.k),
    heat_generation: num(f.qgen) || 0,
    left_boundary: { type: f.left.type, value: f.left.type === 'adiabatic' ? 0 : num(f.left.value) },
    right_boundary: { type: f.right.type, value: f.right.type === 'adiabatic' ? 0 : num(f.right.value) },
    temperature_unit: f.tempUnit,
    boundary_scheme: f.scheme,
  }
  if (f.problemType === 'steady') return base
  const req: TransientRequest = {
    ...base,
    density: num(f.rho),
    specific_heat: num(f.cp),
    initial_condition:
      f.initialType === 'uniform'
        ? { type: 'uniform', value: num(f.initialValue) }
        : { type: 'custom', value: 0, values: parseList(f.initialValues) },
    time_step_mode: f.timeStepMode,
    fourier_number: f.timeStepMode === 'fourier' ? num(f.fourier) : 1,
    time_step: f.timeStepMode === 'manual' ? num(f.timeStep) : null,
    num_steps: f.runMode === 'steps' ? Math.round(num(f.numSteps)) : null,
    final_time: f.runMode === 'time' ? num(f.finalTime) : null,
    output_interval: f.outputInterval.trim() === '' ? null : Math.round(num(f.outputInterval)),
  }
  return req
}

/** Convert an example's request into form state. */
export function formFromExample(ex: Example): FormState {
  const r = ex.request as TransientRequest
  const base = ex.problem_type === 'steady' ? DEFAULT_STEADY : DEFAULT_TRANSIENT
  const s = (v: number | null | undefined, fallback: string) => (v === null || v === undefined ? fallback : String(v))
  return {
    ...base,
    problemType: ex.problem_type,
    length: String(r.length),
    lengthUnit: r.length_unit,
    nodes: String(r.nodes),
    customMesh: false,
    dx: String(r.length / (r.nodes - 1)),
    k: String(r.thermal_conductivity),
    qgen: String(r.heat_generation ?? 0),
    rho: s(r.density, base.rho),
    cp: s(r.specific_heat, base.cp),
    tempUnit: r.temperature_unit,
    left: { type: r.left_boundary.type, value: String(r.left_boundary.value) },
    right: { type: r.right_boundary.type, value: String(r.right_boundary.value) },
    scheme: r.boundary_scheme,
    initialType: r.initial_condition?.type ?? 'uniform',
    initialValue: s(r.initial_condition?.value, base.initialValue),
    initialValues: r.initial_condition?.values?.join(', ') ?? '',
    timeStepMode: r.time_step_mode ?? 'fourier',
    fourier: s(r.fourier_number, '1'),
    timeStep: s(r.time_step, base.timeStep),
    runMode: r.num_steps ? 'steps' : r.final_time ? 'time' : 'steps',
    numSteps: s(r.num_steps, base.numSteps),
    finalTime: s(r.final_time, base.finalTime),
    outputInterval: s(r.output_interval, ''),
  }
}
