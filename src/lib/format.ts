// Number formatting helpers for engineering output.

const SUP: Record<string, string> = {
  '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
}

/** Compact number: fixed for moderate magnitudes, scientific (1.23 × 10⁻⁸) otherwise. */
export function fmt(value: number | null | undefined, digits = 4): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  if (!Number.isFinite(value)) return value > 0 ? '∞' : '−∞'
  if (value === 0) return '0'
  const a = Math.abs(value)
  if (a >= 1e-3 && a < 1e6) {
    return trimZeros(value.toPrecision(digits))
  }
  return sci(value, digits)
}

/** Scientific notation with Unicode superscripts, e.g. 9.615 × 10⁻⁸. */
export function sci(value: number, digits = 3): string {
  if (value === 0) return '0'
  const [m, e] = value.toExponential(Math.max(0, digits - 1)).split('e')
  const exp = String(parseInt(e, 10)).split('').map((c) => SUP[c] ?? c).join('')
  return `${trimZeros(m)} × 10${exp}`
}

/** Fixed decimals, used in tables. */
export function fixed(value: number, decimals = 4): string {
  if (!Number.isFinite(value)) return '—'
  if (value !== 0 && (Math.abs(value) >= 1e7 || Math.abs(value) < 10 ** -decimals)) return sci(value, decimals)
  return value.toFixed(decimals)
}

/** Short cell formatting for matrices: integers stay integers. */
export function cell(value: number, digits = 5): string {
  if (value === 0) return '0'
  if (Number.isInteger(value) && Math.abs(value) < 1e7) return String(value)
  return fmt(value, digits)
}

function trimZeros(s: string): string {
  if (!s.includes('.')) return s
  return s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
}

export function formatMs(ms: number): string {
  return ms < 1000 ? `${ms.toFixed(ms < 10 ? 2 : 1)} ms` : `${(ms / 1000).toFixed(2)} s`
}

export function formatTime(seconds: number): string {
  if (seconds === 0) return '0 s'
  if (seconds < 1e-3 || seconds >= 1e5) return `${sci(seconds, 3)} s`
  return `${trimZeros(seconds.toFixed(seconds < 1 ? 4 : 2))} s`
}
