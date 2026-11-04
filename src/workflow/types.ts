// Types for the three-phase workflow (mirror app/engine/schema.py and runner.py).

export type Physics = 'conduction' | 'convection_diffusion' | 'convection'
export type TimeMode = 'steady' | 'transient'
export type Dim = 1 | 2 | 3
export type Face = 'x_min' | 'x_max' | 'y_min' | 'y_max' | 'z_min' | 'z_max'
export type BCType = 'temperature' | 'heat_flux' | 'convection' | 'insulated' | 'inflow' | 'outflow'
export type Discretization = 'fdm' | 'fvm' | 'fem'
export type AdvectionScheme = 'upwind' | 'central' | 'hybrid'
export type TimeScheme = 'implicit' | 'crank_nicolson' | 'explicit'
export type LinearSolver = 'gauss_seidel' | 'gauss_elimination' | 'lu'
export type Criterion = 'residual' | 'max_change'
export type InitialGuess = 'uniform' | 'zero' | 'bc_mean'

export interface Material {
  name: string
  k: number
  rho: number
  cp: number
}

export interface FaceBC {
  type: BCType
  value: number
  h: number
  t_inf: number
}

export interface Setup {
  preprocessor: {
    problem: { title: string; physics: Physics; time_mode: TimeMode; dimension: Dim; source: { q0: number; beta: number; expression?: string | null; expression_input?: string } }
    geometry: { length: number; width: number; height: number; nx: number; ny: number; nz: number }
    velocity: { u: number; v: number; w: number }
    solid: Material
    fluid: Material
    initial_temperature: number
    boundaries: Record<Face, FaceBC>
    temperature_unit: 'C' | 'K'
  }
  solver: {
    discretization: Discretization
    advection_scheme: AdvectionScheme
    time_scheme: TimeScheme
    time_step: number
    num_steps: number
    linear_solver: LinearSolver
    tolerance: number
    max_iterations: number
    relaxation: number
    auto_relaxation: boolean
    criterion: Criterion
    initial_guess: InitialGuess
    initial_guess_value: number
  }
}

export interface LogLine {
  t_ms: number
  phase: string
  message: string
}

export interface SampleEquation {
  node: number
  ijk: number[]
  terms: { label: string; coefficient: number; node: number }[]
  rhs: number
  latex: string
}

export interface ErrorNorms {
  max_abs: number
  rms: number
  mean_abs: number
  relative_pct: number
  reference_range: number
  points: number
  excluded: number
}

export interface WorkflowResult {
  success: true
  title: string
  warnings: string[]
  log: LogLine[]
  execution_time_ms: number
  phase1: {
    physics: Physics
    time_mode: TimeMode
    dimension: Dim
    governing_latex: string
    source: { q0: number; beta: number; expression?: string | null }
    material: { k: number; rho_cp: number; alpha: number }
    velocity: number[]
    grid: { kind: 'vertex' | 'cell'; counts: number[]; lengths: number[]; spacing: number[]; n: number; axis_coords: number[][] }
    boundaries: Partial<Record<Face, { type: BCType; label: string; face: string; value: number; h: number; t_inf: number }>>
    derived: {
      alpha: number
      rho_cp: number
      k: number
      peclet?: number
      cell_peclet?: number
      fourier_cell?: number
      courant?: number
      final_time?: number
      biot?: Partial<Record<Face, number>>
    }
  }
  phase2: {
    discretization: Discretization
    discretization_label: string
    advection: string | null
    time_scheme: TimeScheme | null
    linear_solver: LinearSolver
    linear_solver_label: string
    matrix: {
      n: number
      nnz: number
      bandwidth: string
      lower_bandwidth: number
      upper_bandwidth: number
      fill_pct: number
      symmetric: boolean | null
      diagonally_dominant: boolean
      dense: number[][] | null
      rhs: number[] | null
      pattern: [number, number][] | null
      lu: { L: number[][]; U: number[][]; P: number[] } | null
    }
    sample_equation: SampleEquation | null
    convergence: {
      iterations: number | null
      converged: boolean
      history: number[]
      iterations_per_step?: number[]
      residual: number
      omega: number | null
      factor_ms: number
      solve_ms: number
      row_swaps: number
    }
    assemble_ms: number
  }
  phase3: {
    coords: number[] | number[][]
    temperature: number[]
    exact: number[] | null
    exact_info: { available: boolean; name: string | null; latex: string | null }
    errors: Partial<ErrorNorms>
    stats: { min: number; max: number; mean: number }
    residual_max: number
    final_time: number | null
    times: number[] | null
    snapshots: number[][] | null
    snapshots_exact: number[][] | null
    monitor: { node: number; coords: number[]; times: number[]; values: number[]; exact?: number[] } | null
    fixed_nodes: number[] | null
    excluded_nodes?: number[]
  }
}

export interface RefinementLevel {
  counts: number[]
  n: number
  h: number
  max_abs: number | null
  rms: number | null
  order_max_abs?: number
  order_rms?: number
}

export interface RefinementResult {
  levels: RefinementLevel[]
  method: Discretization
}

export interface WorkflowExample {
  id: string
  title: string
  description: string
  tags: string[]
  setup: Setup
}
