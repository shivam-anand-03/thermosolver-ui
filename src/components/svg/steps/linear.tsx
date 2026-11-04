import type { StepArtProps } from '../StepFrame'
import { draw, fade } from '../shared'

const N = 6
const IDX = Array.from({ length: N }, (_, i) => i)
const pos = (i: number) => 12.5 + i * 4.6

/** 7 — Matrix inversion: tridiagonal sparsity pattern in brackets. */
export function MatrixArt({ accent }: StepArtProps) {
  return (
    <>
      <path d="M10.5 8 H7.5 V40 H10.5" {...draw(0)} />
      <path d="M37.5 8 H40.5 V40 H37.5" {...draw(80)} />
      {IDX.flatMap((r) =>
        IDX.map((c) => {
          const band = Math.abs(r - c) <= 1
          const diag = r === c
          const fill = diag ? accent : band ? 'currentColor' : 'var(--ui-faint)'
          return (
            <circle
              key={`${r}-${c}`}
              cx={pos(c)}
              cy={pos(r)}
              r={diag ? 1.75 : band ? 1.4 : 0.6}
              fill={fill}
              stroke="none"
              {...fade(150 + (r + c) * 35)}
            />
          )
        }),
      )}
    </>
  )
}

/** 8 — Convergence: residual falling on a log axis below the tolerance line. */
export function ConvergenceArt({ accent }: StepArtProps) {
  return (
    <>
      <path d="M8 5 V40 H43" {...draw(0)} />
      <path d="M5.5 10 H8 M5.5 20 H8 M5.5 30 H8" strokeWidth="1" {...fade(150)} />
      <path d="M8 33 H43" stroke={accent} strokeWidth="1.2" strokeDasharray="2 2.5" {...fade(450)} />
      <path d="M10.5 8.5 C13 10 14 17 17 18 S21 17.5 23 21.5 S27 25 29 27 S33 27.5 35 31 S40 35 42.5 35.5" {...draw(200)} />
      <circle cx="42.5" cy="35.5" r="1.6" fill="currentColor" stroke="none" {...fade(800)} />
    </>
  )
}
