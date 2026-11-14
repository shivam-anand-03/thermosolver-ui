import type { BCType, Dim, Face, FaceBC, Material, Physics, Setup, WorkflowExample } from './types'

export const ALL_FACES: Face[] = ['x_min', 'x_max', 'y_min', 'y_max', 'z_min', 'z_max']

export const facesFor = (dim: Dim): Face[] => ALL_FACES.slice(0, dim * 2)

export const FACE_INFO: Record<Face, { name: string; where: string; short: string }> = {
  x_min: { name: 'Left', where: 'x = 0', short: 'W' },
  x_max: { name: 'Right', where: 'x = L', short: 'E' },
  y_min: { name: 'Bottom', where: 'y = 0', short: 'S' },
  y_max: { name: 'Top', where: 'y = W', short: 'N' },
  z_min: { name: 'Back', where: 'z = 0', short: 'B' },
  z_max: { name: 'Front', where: 'z = H', short: 'T' },
}

export const BC_INFO: Record<BCType, { label: string; group: 'thermal' | 'flow'; hint: string; color: string }> = {
  temperature: { label: 'Temperature specified', group: 'thermal', hint: 'T = T_s (Dirichlet)', color: '#e34948' },
  heat_flux: { label: 'Heat flux specified', group: 'thermal', hint: "q'' into the domain (Neumann)", color: '#eb6834' },
  convection: { label: 'Convective heat transfer', group: 'thermal', hint: "q'' = h (T∞ − T_s) (Robin)", color: '#1baf7a' },
  insulated: { label: 'Wall (insulated)', group: 'flow', hint: "q'' = 0, no flow through the wall", color: '#64748b' },
  inflow: { label: 'Inflow', group: 'flow', hint: 'Fluid enters at T_in', color: '#2a78d6' },
  outflow: { label: 'Outflow', group: 'flow', hint: '∂T/∂n = 0, fluid leaves', color: '#4a3aa7' },
}

export const PHYSICS_INFO: Record<Physics, { label: string; short: string; material: 'solid' | 'fluid'; description: string }> = {
  conduction: {
    label: 'Heat conduction (diffusion)',
    short: 'Conduction',
    material: 'solid',
    description: 'Heat diffuses through a stationary solid. Velocity is ignored; solid properties are used.',
  },
  convection_diffusion: {
    label: 'Convection–diffusion',
    short: 'Convection–conduction',
    material: 'fluid',
    description: 'A moving fluid carries heat (advection) while it also conducts (diffusion). Fluid properties are used.',
  },
  convection: {
    label: 'Convection (advection)',
    short: 'Convection',
    material: 'fluid',
    description: 'Heat is carried by the flow only (k → 0). Needs an inflow temperature on the upstream face.',
  },
}

export const SOLIDS: Material[] = [
  { name: 'Copper', k: 401, rho: 8933, cp: 385 },
  { name: 'Aluminium', k: 237, rho: 2702, cp: 903 },
  { name: 'Carbon steel', k: 45, rho: 7850, cp: 460 },
  { name: 'Stainless steel 304', k: 14.9, rho: 7900, cp: 477 },
  { name: 'Concrete', k: 1.4, rho: 2300, cp: 880 },
  { name: 'Brick', k: 0.72, rho: 1920, cp: 835 },
  { name: 'Glass', k: 1.4, rho: 2500, cp: 750 },
  { name: 'Wood (oak)', k: 0.17, rho: 545, cp: 2385 },
  { name: 'Unit properties', k: 1, rho: 1, cp: 1 },
]

export const FLUIDS: Material[] = [
  { name: 'Water (300 K)', k: 0.613, rho: 997, cp: 4179 },
  { name: 'Air (300 K)', k: 0.0263, rho: 1.161, cp: 1007 },
  { name: 'Engine oil (300 K)', k: 0.145, rho: 884, cp: 1909 },
  { name: 'Ethylene glycol', k: 0.252, rho: 1114, cp: 2415 },
  { name: 'Unit properties', k: 1, rho: 1, cp: 1 },
]

const bc = (type: BCType, value = 0, h = 10, t_inf = 25): FaceBC => ({ type, value, h, t_inf })

export function defaultSetup(): Setup {
  return {
    preprocessor: {
      problem: { title: 'Plane wall with heat generation', physics: 'conduction', time_mode: 'steady', dimension: 1, source: { q0: 5e5, beta: 0 } },
      geometry: { length: 0.05, width: 0.05, height: 0.05, nx: 11, ny: 11, nz: 11 },
      velocity: { u: 0, v: 0, w: 0 },
      solid: { ...SOLIDS[2] },
      fluid: { ...FLUIDS[0] },
      initial_temperature: 25,
      boundaries: {
        x_min: bc('temperature', 100),
        x_max: bc('temperature', 100),
        y_min: bc('insulated'),
        y_max: bc('insulated'),
        z_min: bc('insulated'),
        z_max: bc('insulated'),
      },
      temperature_unit: 'C',
    },
    solver: {
      discretization: 'fdm',
      advection_scheme: 'upwind',
      time_scheme: 'implicit',
      time_step: 1,
      num_steps: 100,
      linear_solver: 'gauss_elimination',
      tolerance: 1e-6,
      max_iterations: 5000,
      relaxation: 1,
      auto_relaxation: false,
      criterion: 'residual',
      initial_guess: 'uniform',
      initial_guess_value: 25,
    },
  }
}

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] }

function merge<T>(base: T, patch: DeepPartial<T>): T {
  const out = structuredClone(base) as Record<string, unknown>
  for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) ? merge(out[k], v as never) : v
  }
  return out as T
}

const make = (patch: DeepPartial<Setup>): Setup => merge(defaultSetup(), patch)

export const EXAMPLES: WorkflowExample[] = [
  {
    id: 'wall-gen',
    title: 'Plane wall, q‴ = q₀ (steel)',
    description: 'Both faces at 100 °C, uniform generation 5×10⁵ W/m³. FDM reproduces the parabola exactly.',
    tags: ['1-D', 'steady', 'conduction'],
    setup: defaultSetup(),
  },
  {
    id: 'wall-beta',
    title: 'Temperature-dependent generation q‴ = q₀ + βT',
    description: 'Unit-property slab with β > 0: the exact solution is a cosine profile. Compare FDM / FVM / FEM.',
    tags: ['1-D', 'steady', 'q₀ + βT'],
    setup: make({
      preprocessor: {
        problem: { title: 'Slab with q‴ = q₀ + βT', source: { q0: 10, beta: 2 } },
        geometry: { length: 1, nx: 11 },
        solid: { name: 'Unit properties', k: 1, rho: 1, cp: 1 },
        boundaries: { x_min: bc('temperature', 0), x_max: bc('temperature', 1) },
      },
    }),
  },
  {
    id: 'sine-source',
    title: 'Custom source q‴ = 5×10⁵ sin(πx/L)',
    description: 'Steel wall at 20 °C on both faces with a sine-shaped generation profile typed in the expression editor.',
    tags: ['1-D', 'steady', 'f(x) source'],
    setup: make({
      preprocessor: {
        problem: { title: 'Wall with a sine-shaped heat source', source: { q0: 0, beta: 0, expression: '500000 * sin(pi * x / L)', expression_input: '5e5 sin(pi x / L)' } },
        geometry: { length: 0.1, nx: 41 },
        boundaries: { x_min: bc('temperature', 20), x_max: bc('temperature', 20) },
      },
    }),
  },
  {
    id: 'flux-conv',
    title: 'Heated wall cooled by convection',
    description: 'Heat flux 2 kW/m² on the left face; convection to 25 °C air (h = 50 W/m²K) on the right.',
    tags: ['1-D', 'steady', 'Robin BC'],
    setup: make({
      preprocessor: {
        problem: { title: 'Heated wall with convective cooling', source: { q0: 0, beta: 0 } },
        geometry: { length: 0.2, nx: 21 },
        solid: { ...SOLIDS[4] },
        boundaries: { x_min: bc('heat_flux', 2000), x_max: bc('convection', 0, 50, 25) },
      },
    }),
  },
  {
    id: 'cd-1d',
    title: 'Convection–diffusion, Pe = 20',
    description: 'Fluid enters at 0 °C, outlet held at 100 °C: a thin boundary layer forms. Try upwind vs central differencing.',
    tags: ['1-D', 'steady', 'convection–diffusion'],
    setup: make({
      preprocessor: {
        problem: { title: '1-D convection–diffusion (Pe = 20)', physics: 'convection_diffusion', source: { q0: 0, beta: 0 } },
        geometry: { length: 1, nx: 41 },
        velocity: { u: 20 },
        fluid: { name: 'Unit properties', k: 1, rho: 1, cp: 1 },
        boundaries: { x_min: bc('inflow', 0), x_max: bc('temperature', 100) },
      },
      solver: { advection_scheme: 'upwind' },
    }),
  },
  {
    id: 'plug',
    title: 'Plug flow heated by a source (pure convection)',
    description: 'Water at 20 °C flows at 0.01 m/s through a 1 m duct with q₀ = 4×10⁵ W/m³. Upwind marching from the inlet.',
    tags: ['1-D', 'steady', 'convection'],
    setup: make({
      preprocessor: {
        problem: { title: 'Plug-flow heating', physics: 'convection', source: { q0: 4e5, beta: 0 } },
        geometry: { length: 1, nx: 41 },
        velocity: { u: 0.01 },
        fluid: { ...FLUIDS[0] },
        boundaries: { x_min: bc('inflow', 20), x_max: bc('outflow') },
      },
      solver: { linear_solver: 'gauss_seidel' },
    }),
  },
  {
    id: 'plate-2d',
    title: '2-D plate, hot top edge (Laplace)',
    description: 'Three edges at 0 °C, top at 100 °C. Validated against the Fourier-series solution. Gauss–Seidel with SOR.',
    tags: ['2-D', 'steady', 'Gauss–Seidel'],
    setup: make({
      preprocessor: {
        problem: { title: '2-D plate with a hot edge', dimension: 2, source: { q0: 0, beta: 0 } },
        geometry: { length: 1, width: 1, nx: 31, ny: 31 },
        boundaries: { x_min: bc('temperature', 0), x_max: bc('temperature', 0), y_min: bc('temperature', 0), y_max: bc('temperature', 100) },
      },
      solver: { linear_solver: 'gauss_seidel', auto_relaxation: true, initial_guess: 'bc_mean' },
    }),
  },
  {
    id: 'channel-2d',
    title: '2-D channel: inflow, heated wall, outflow',
    description: 'Fluid enters at 20 °C from the left, the bottom wall receives a heat flux, the top wall is insulated.',
    tags: ['2-D', 'steady', 'convection–diffusion'],
    setup: make({
      preprocessor: {
        problem: { title: 'Heated channel flow', physics: 'convection_diffusion', dimension: 2, source: { q0: 0, beta: 0 } },
        geometry: { length: 0.5, width: 0.05, nx: 51, ny: 21 },
        velocity: { u: 0.002, v: 0 },
        fluid: { ...FLUIDS[0] },
        boundaries: { x_min: bc('inflow', 20), x_max: bc('outflow'), y_min: bc('heat_flux', 2000), y_max: bc('insulated') },
      },
      solver: { discretization: 'fvm', advection_scheme: 'hybrid' },
    }),
  },
  {
    id: 'block-3d',
    title: '3-D block, convective faces',
    description: 'Aluminium cube with internal generation, one face at 20 °C and convection on the others.',
    tags: ['3-D', 'steady', 'conduction'],
    setup: make({
      preprocessor: {
        problem: { title: '3-D block with generation', dimension: 3, source: { q0: 2e6, beta: 0 } },
        geometry: { length: 0.1, width: 0.1, height: 0.1, nx: 11, ny: 11, nz: 11 },
        solid: { ...SOLIDS[1] },
        boundaries: {
          x_min: bc('temperature', 20),
          x_max: bc('convection', 0, 100, 20),
          y_min: bc('convection', 0, 100, 20),
          y_max: bc('convection', 0, 100, 20),
          z_min: bc('insulated'),
          z_max: bc('convection', 0, 100, 20),
        },
      },
      solver: { linear_solver: 'lu' },
    }),
  },
  {
    id: 'transient-slab',
    title: 'Unsteady slab: sudden face heating',
    description: 'Steel slab at 25 °C; left face jumps to 200 °C, right face insulated. Compared with the series solution.',
    tags: ['1-D', 'transient', 'exact series'],
    setup: make({
      preprocessor: {
        problem: { title: 'Sudden heating of a slab', time_mode: 'transient', source: { q0: 0, beta: 0 } },
        geometry: { length: 0.05, nx: 26 },
        initial_temperature: 25,
        boundaries: { x_min: bc('temperature', 200), x_max: bc('insulated') },
      },
      solver: { time_scheme: 'crank_nicolson', time_step: 1, num_steps: 120, linear_solver: 'lu' },
    }),
  },
  {
    id: 'transient-2d',
    title: 'Unsteady 2-D plate cooling',
    description: 'Copper plate at 300 °C cooled by convection on all edges (h = 500 W/m²K, T∞ = 25 °C).',
    tags: ['2-D', 'transient', 'Robin BC'],
    setup: make({
      preprocessor: {
        problem: { title: 'Cooling plate', dimension: 2, time_mode: 'transient', source: { q0: 0, beta: 0 } },
        geometry: { length: 0.1, width: 0.1, nx: 21, ny: 21 },
        solid: { ...SOLIDS[0] },
        initial_temperature: 300,
        boundaries: {
          x_min: bc('convection', 0, 500, 25),
          x_max: bc('convection', 0, 500, 25),
          y_min: bc('convection', 0, 500, 25),
          y_max: bc('convection', 0, 500, 25),
        },
      },
      solver: { time_step: 2, num_steps: 60, linear_solver: 'lu' },
    }),
  },
]

export function activeMaterial(s: Setup): Material {
  return PHYSICS_INFO[s.preprocessor.problem.physics].material === 'solid' ? s.preprocessor.solid : s.preprocessor.fluid
}

/** Grid spacing per axis: every method uses a vertex grid, h = L/(N−1). */
export function spacing(s: Setup): number[] {
  const g = s.preprocessor.geometry
  const dim = s.preprocessor.problem.dimension
  return [
    [g.length, g.nx],
    [g.width, g.ny],
    [g.height, g.nz],
  ]
    .slice(0, dim)
    .map(([L, N]) => L / (N - 1))
}

export function nodeCount(s: Setup): number {
  const g = s.preprocessor.geometry
  return [g.nx, g.ny, g.nz].slice(0, s.preprocessor.problem.dimension).reduce((a, b) => a * b, 1)
}

export const LIMITS = { direct: 2500, iterative: 10000, perAxis: 401 }

/** Governing equation (mirrors runner.governing_latex). */
export function governingLatex(physics: Physics, transient: boolean, dim: Dim, customSource = false): string {
  const lap = { 1: String.raw`\frac{\partial^2 T}{\partial x^2}`, 2: String.raw`\left(\frac{\partial^2 T}{\partial x^2} + \frac{\partial^2 T}{\partial y^2}\right)`, 3: String.raw`\nabla^2 T` }[dim]
  const adv = { 1: String.raw`u\frac{\partial T}{\partial x}`, 2: String.raw`u\frac{\partial T}{\partial x} + v\frac{\partial T}{\partial y}`, 3: String.raw`\mathbf{u}\cdot\nabla T` }[dim]
  const src = customSource ? String.raw`f(\mathbf{x}) + \beta T` : String.raw`q_0 + \beta T`
  if (physics === 'conduction') return `${transient ? String.raw`\rho c_p\frac{\partial T}{\partial t} = ` : '0 = '}k\\,${lap} + ${src}`
  const lhs = transient ? String.raw`\rho c_p\left(\frac{\partial T}{\partial t} + ${adv}\right)` : String.raw`\rho c_p\left(${adv}\right)`
  return physics === 'convection' ? `${lhs} = ${src}` : `${lhs} = k\\,${lap} + ${src}`
}
