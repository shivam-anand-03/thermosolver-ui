/** Temperature display conversion passed to all result views. */
export interface TempDisplay {
  symbol: string
  conv: (v: number) => number
}

/** Round step (1, 2, 2.5, 5 × 10^k) giving about `target` intervals. */
function niceStep(span: number, target = 5): number {
  const raw = span / target
  const mag = 10 ** Math.floor(Math.log10(raw))
  const f = raw / mag
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * mag
}

/** Axis domain snapped to round numbers, with its tick values. */
export function niceAxis(min: number, max: number): { domain: [number, number]; ticks: number[] } {
  let [lo, hi] = paddedDomain(min, max)
  const step = niceStep(hi - lo)
  lo = Math.floor(lo / step) * step
  hi = Math.ceil(hi / step) * step
  const ticks: number[] = []
  for (let v = lo; v <= hi + step * 1e-9; v += step) ticks.push(Number(v.toPrecision(12)))
  return { domain: [lo, hi], ticks }
}

/** Nice padded y-domain. */
export function paddedDomain(min: number, max: number): [number, number] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1]
  const span = max - min || Math.max(1, Math.abs(max) * 0.05)
  return [min - span * 0.06, max + span * 0.06]
}
