// Chart colours. Categorical slots come from the validated reference palette and are
// assigned in fixed order (never cycled). Time snapshots use a single-hue blue ramp
// (ordinal: lightest step kept at ≥ 2:1 contrast on the light surface).

export const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948']
export const MAX_SERIES = SERIES.length

export const BLUE_RAMP = ['#86b6ef', '#6da7ec', '#5598e7', '#3987e5', '#2a78d6', '#256abf', '#1c5cab', '#184f95', '#104281', '#0d366b']

/** Pick `count` evenly spaced ordinal steps from the blue ramp (light → dark = early → late). */
export function ordinalBlues(count: number): string[] {
  if (count <= 1) return [BLUE_RAMP[BLUE_RAMP.length - 3]]
  return Array.from({ length: count }, (_, i) => BLUE_RAMP[Math.round((i * (BLUE_RAMP.length - 1)) / (count - 1))])
}

export const CHART = {
  grid: '#e5e7eb',
  axis: '#94a3b8',
  text: '#475569',
  reference: '#64748b',
}

/** Sequential heat colour for the slab diagram (cool blue → warm orange), t in [0, 1]. */
export function heatColor(t: number): string {
  const stops: [number, number, number][] = [
    [205, 226, 251],
    [134, 182, 239],
    [253, 230, 200],
    [251, 176, 120],
    [235, 104, 52],
  ]
  const x = Math.min(1, Math.max(0, t)) * (stops.length - 1)
  const i = Math.min(stops.length - 2, Math.floor(x))
  const f = x - i
  const c = stops[i].map((v, k) => Math.round(v + (stops[i + 1][k] - v) * f))
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
}
