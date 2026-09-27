// Matrix accessors used by the matrix / algorithm views.

/** Accessor for a dense matrix. */
export const dense = (m: number[][]) => (i: number, j: number) => m[i][j]

/** Accessor for a tridiagonal matrix from its bands. */
export const banded = (b: { lower: number[]; diag: number[]; upper: number[] }) => (i: number, j: number) =>
  i === j ? b.diag[i] : j === i - 1 ? b.lower[j] : j === i + 1 ? b.upper[i] : 0
