import { cell } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface MatrixHighlight {
  pivot?: [number, number] // 0-based (row, col)
  pivotRow?: number
  changedRows?: number[]
}

/**
 * Bracketed matrix / augmented-matrix view. `get(i, j)` lets callers render huge
 * tridiagonal systems without materialising them; rows/cols are windowed.
 */
export function MatrixGrid({
  rows,
  cols,
  get,
  rhs,
  rowStart = 0,
  rowCount,
  colStart = 0,
  colCount,
  highlight,
  rowLabel = (i) => `${i + 1}`,
  compact = false,
  caption,
}: {
  rows: number
  cols: number
  get: (i: number, j: number) => number
  rhs?: (i: number) => number
  rowStart?: number
  rowCount?: number
  colStart?: number
  colCount?: number
  highlight?: MatrixHighlight
  rowLabel?: (i: number) => string
  compact?: boolean
  caption?: string
}) {
  const r1 = Math.min(rows, rowStart + (rowCount ?? rows))
  const c1 = Math.min(cols, colStart + (colCount ?? cols))
  const rIdx = Array.from({ length: r1 - rowStart }, (_, k) => rowStart + k)
  const cIdx = Array.from({ length: c1 - colStart }, (_, k) => colStart + k)
  const changed = new Set(highlight?.changedRows ?? [])

  return (
    <div className="scroll-thin max-w-full overflow-x-auto">
      <table className={cn('mx-auto border-separate border-spacing-0 font-mono tabular', compact ? 'text-[11px]' : 'text-[12.5px]')}>
        {caption && <caption className="pb-2 text-left font-sans text-xs text-slate-500">{caption}</caption>}
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-white" />
            <th />
            {colStart > 0 && <th className="px-1 text-slate-300">…</th>}
            {cIdx.map((j) => (
              <th key={j} className="px-2 pb-1 text-center font-sans text-[10px] font-medium text-slate-400">
                {j + 1}
              </th>
            ))}
            {c1 < cols && <th className="px-1 text-slate-300">…</th>}
            <th />
            {rhs && (
              <>
                <th />
                <th className="px-2 pb-1 text-center font-sans text-[10px] font-medium text-slate-400">b</th>
                <th />
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {rIdx.map((i, k) => {
            const first = k === 0
            const last = k === rIdx.length - 1
            const bracket = cn('w-2 border-slate-500', first && 'rounded-t-sm border-t', last && 'rounded-b-sm border-b')
            const isPivotRow = highlight?.pivotRow === i
            const isChanged = changed.has(i)
            return (
              <tr key={i} className={cn(isPivotRow && 'bg-blue-50', isChanged && 'bg-amber-50')}>
                <td className="sticky left-0 z-10 bg-white pr-2 text-right font-sans text-[10px] text-slate-400">R{rowLabel(i)}</td>
                <td className={cn(bracket, 'border-l')} />
                {colStart > 0 && <td className="px-1 text-slate-300">…</td>}
                {cIdx.map((j) => {
                  const v = get(i, j)
                  const isPivot = highlight?.pivot && highlight.pivot[0] === i && highlight.pivot[1] === j
                  return (
                    <td
                      key={j}
                      className={cn(
                        'px-2 py-[3px] text-right whitespace-nowrap',
                        v === 0 ? 'text-slate-300' : i === j ? 'font-medium text-slate-900' : 'text-slate-700',
                        isPivot && 'rounded bg-blue-600 font-semibold text-white',
                      )}
                    >
                      {cell(v)}
                    </td>
                  )
                })}
                {c1 < cols && <td className="px-1 text-slate-300">…</td>}
                <td className={cn(bracket, !rhs && 'border-r')} />
                {rhs && (
                  <>
                    <td className="w-3 border-l-2 border-slate-400" />
                    <td className="px-2 py-[3px] text-right whitespace-nowrap text-blue-800">{cell(rhs(i), 6)}</td>
                    <td className={cn(bracket, 'border-r')} />
                  </>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
