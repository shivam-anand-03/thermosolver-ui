import type { BoundaryType, LengthUnit, TemperatureUnit } from '@/types/solver'

export const TEMP_SYMBOL: Record<TemperatureUnit, string> = { C: '°C', K: 'K' }
export const LENGTH_FACTOR: Record<LengthUnit, number> = { m: 1, mm: 1e-3, cm: 1e-2 }

/** Convert an absolute temperature between °C and K. */
export function convertTemp(value: number, from: TemperatureUnit, to: TemperatureUnit): number {
  if (from === to) return value
  return from === 'C' ? value + 273.15 : value - 273.15
}

export function toMetres(value: number, unit: LengthUnit): number {
  return value * LENGTH_FACTOR[unit]
}

/** Display a length given in metres in the chosen unit. */
export function fromMetres(value: number, unit: LengthUnit): number {
  return value / LENGTH_FACTOR[unit]
}

export const BC_META: Record<BoundaryType, { label: string; short: string; unit: (t: TemperatureUnit) => string }> = {
  temperature: { label: 'Temperature', short: 'T', unit: (t) => TEMP_SYMBOL[t] },
  heat_flux: { label: 'Heat flux', short: "q''", unit: () => 'W/m²' },
  gradient: { label: 'Gradient', short: 'dT/dx', unit: () => 'K/m' },
  adiabatic: { label: 'Adiabatic', short: "q'' = 0", unit: () => '' },
}
