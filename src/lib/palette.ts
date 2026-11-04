// Chart colours. Categorical slots come from the validated reference palette and are
// assigned in fixed order (never cycled); slot 1 is the brand gold. Time snapshots use a single-hue gold ramp
// (ordinal: lightest step kept at ≥ 2:1 contrast on the light surface).

export const SERIES = ['#c9952c', '#eb6834', '#1baf7a', '#2a78d6', '#e87ba4', '#008300', '#4a3aa7', '#e34948']
export const MAX_SERIES = SERIES.length

// Gold theme: the snapshot ramp is a single-hue gold ramp (the name is kept so imports stay stable).
export const BLUE_RAMP = ['#f0d592', '#e8c46e', '#e0b54f', '#d4a536', '#c9952c', '#b5841f', '#9c7019', '#825d15', '#6a4c12', '#523a0e']

/** Pick `count` evenly spaced ordinal steps from the blue ramp (light → dark = early → late). */
export function ordinalBlues(count: number): string[] {
  if (count <= 1) return [BLUE_RAMP[BLUE_RAMP.length - 3]]
  return Array.from({ length: count }, (_, i) => BLUE_RAMP[Math.round((i * (BLUE_RAMP.length - 1)) / (count - 1))])
}

/** Chart chrome colours; CSS variables so they follow light / dark mode. */
export const CHART = {
  grid: 'var(--chart-grid)',
  axis: 'var(--chart-axis)',
  text: 'var(--chart-text)',
  reference: 'var(--chart-reference)',
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
