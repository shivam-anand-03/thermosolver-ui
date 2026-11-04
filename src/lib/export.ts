import type { SimulationResult, SteadyRequest, TransientRequest } from '@/types/solver'

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** CSV: Node,x,Temperature (steady) or Time,Node,x,Temperature (transient, sampled snapshots). */
export function resultToCsv(result: SimulationResult): string {
  const unit = result.summary.temperature_unit === 'C' ? 'C' : 'K'
  if (result.problem_type === 'steady') {
    const rows = [`Node,x_m,Temperature_${unit}`]
    for (const n of result.nodes) rows.push(`${n.index},${n.x},${n.temperature}`)
    return rows.join('\n')
  }
  const rows = [`Time_s,Node,x_m,Temperature_${unit}`]
  result.times.forEach((t, k) => {
    result.snapshots[k].forEach((T, i) => rows.push(`${t},${i + 1},${result.x[i]},${T}`))
  })
  return rows.join('\n')
}

export function exportCsv(result: SimulationResult) {
  downloadBlob(new Blob([resultToCsv(result)], { type: 'text/csv' }), `cfd-solver-${result.problem_type}.csv`)
}

export function exportJson(request: SteadyRequest | TransientRequest, result: SimulationResult) {
  const payload = {
    app: 'CFD Solver',
    version: 1,
    exported_at: new Date().toISOString(),
    problem_type: result.problem_type,
    configuration: request,
    results: result,
  }
  downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `cfd-solver-${result.problem_type}.json`)
}
