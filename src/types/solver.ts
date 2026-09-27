// Types mirroring the ThermoSolve API (backend/app/models.py and solver results).

export type ProblemType = 'steady' | 'transient'
export type BoundaryType = 'temperature' | 'heat_flux' | 'gradient' | 'adiabatic'
export type BoundaryScheme = 'first_order' | 'ghost_node'
export type LengthUnit = 'm' | 'mm' | 'cm'
export type TemperatureUnit = 'C' | 'K'

export interface BoundaryConditionInput {
  type: BoundaryType
  value: number
}

export interface BaseRequest {
  length: number
  length_unit: LengthUnit
  nodes: number
  thermal_conductivity: number
  heat_generation: number
  left_boundary: BoundaryConditionInput
  right_boundary: BoundaryConditionInput
  temperature_unit: TemperatureUnit
  boundary_scheme: BoundaryScheme
  record_steps?: boolean | null
}

export type SteadyRequest = BaseRequest

export interface TransientRequest extends BaseRequest {
  density: number
  specific_heat: number
  initial_condition: { type: 'uniform' | 'custom'; value: number; values?: number[] | null }
  time_step_mode: 'fourier' | 'manual'
  fourier_number: number
  time_step?: number | null
  num_steps?: number | null
  final_time?: number | null
  output_interval?: number | null
}

export interface NodeRow {
  index: number
  x: number
  temperature: number
}

export interface NodeEquation {
  node: number
  kind: 'interior' | 'boundary'
  general_latex: string
  numeric_latex: string
  note: string
}

export interface RowOperation {
  target: number
  pivot_row: number
  factor: number
  description: string
}

export interface EliminationStep {
  step: number
  pivot_row: number
  pivot_column: number
  pivot_value: number
  swapped: boolean
  swap_with: number
  operations: RowOperation[]
  matrix: number[][] | null
}

export interface BackSubstitutionStep {
  index: number
  rhs: number
  sum: number
  diagonal: number
  value: number
  terms: { j: number; a: number; x: number }[]
}

export interface GaussianLog {
  recorded: boolean
  initial_augmented: number[][] | null
  upper_augmented: number[][] | null
  total_row_operations: number
  total_swaps: number
  warnings: string[]
  steps: EliminationStep[]
  back_substitution: BackSubstitutionStep[]
}

export interface ValidationCheck {
  name: string
  passed: boolean | null
  detail: string
}

export interface ValidationBlock {
  status: 'validated' | 'failed'
  message: string
  residual_max: number
  residual_l2: number
  residual_vector: number[] | null
  boundary_error: number
  boundary_error_left: number
  boundary_error_right: number
  tolerance: number
  all_finite: boolean
  checks: ValidationCheck[]
  residual_first_step?: number[] | null
}

export interface ExplanationStep {
  title: string
  text: string
  latex: string[]
}

export interface Summary {
  title: string
  length_m: number
  nodes: number
  intervals: number
  dx: number
  left_bc: string
  right_bc: string
  temperature_unit: TemperatureUnit
  unit_symbol: string
  t_min: number
  t_max: number
  scheme: BoundaryScheme
  alpha?: number
  dt?: number
  fourier?: number
  time_steps?: number
  final_time?: number
  output_interval?: number
  steady_state_time?: number | null
}

export interface BoundaryInfo {
  description: string
  latex: string
  type: BoundaryType
  value: number
}

export interface BaseResult {
  success: true
  problem_type: ProblemType
  inputs: Record<string, unknown>
  summary: Summary
  warnings: string[]
  execution_time_ms: number
  dx: number
  length_m: number
  x: number[]
  nodes: NodeRow[]
  solution: number[]
  matrix: number[][] | null
  matrix_truncated: boolean
  bands: { lower: number[]; diag: number[]; upper: number[] }
  rhs: number[]
  equations: NodeEquation[]
  gaussian: GaussianLog
  validation: ValidationBlock
  explanation: { summary: string; steps: ExplanationStep[] }
  boundary_conditions: { left: BoundaryInfo; right: BoundaryInfo }
}

export interface SteadyResult extends BaseResult {
  problem_type: 'steady'
}

export interface TransientResult extends BaseResult {
  problem_type: 'transient'
  alpha: number
  dt: number
  fourier: number
  num_steps: number
  final_time: number
  initial: number[]
  first_step_solution: number[]
  times: number[]
  snapshots: number[][]
  time_coefficients: number[]
  rhs_constant: number[]
}

export type SimulationResult = SteadyResult | TransientResult

export interface ExampleReference {
  label: string
  values: number[]
  note: string
  time_step?: number
}

export interface Example {
  id: string
  title: string
  description: string
  problem_type: ProblemType
  is_reference: boolean
  request: SteadyRequest | TransientRequest
  reference: ExampleReference | null
}

export interface ApiError {
  success: false
  error: string
  details: string[]
  kind: 'input' | 'numerical' | 'schema' | 'internal' | 'network'
}

export interface InputValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
}
