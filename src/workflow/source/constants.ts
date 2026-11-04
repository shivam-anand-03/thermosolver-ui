export const Q3 = "q'''"
export const SAMPLES = 120

export const PRESETS: { label: string; text: string; minDim?: number }[] = [
  { label: 'Sine', text: '5e5 sin(pi x / L)' },
  { label: 'Hot spot', text: '1e6 exp(-((x - L/2)/(0.1 L))^2)' },
  { label: 'Linear ramp', text: '2e5 (1 + x / L)' },
  { label: 'Parabolic', text: '4e5 x (L - x) / L^2' },
  { label: 'Decaying', text: '8e5 exp(-5 x / L)' },
  { label: '2-D bump', text: '5e5 sin(pi x / L) sin(pi y / W)', minDim: 2 },
]

/** Insert keys: KaTeX label, text inserted, and how far the caret moves back (into the parentheses). */
export const KEYS: { tex: string; ins: string; back?: number; title: string; minDim?: number }[] = [
  { tex: '\\sin', ins: 'sin()', back: 1, title: 'Sine' },
  { tex: '\\cos', ins: 'cos()', back: 1, title: 'Cosine' },
  { tex: 'e^{\\square}', ins: 'exp()', back: 1, title: 'Exponential' },
  { tex: '\\sqrt{\\square}', ins: 'sqrt()', back: 1, title: 'Square root' },
  { tex: '\\tfrac{a}{b}', ins: '()/()', back: 4, title: 'Fraction' },
  { tex: 'x^{n}', ins: '^', title: 'Power' },
  { tex: '(\\,)', ins: '()', back: 1, title: 'Parentheses' },
  { tex: '\\pi', ins: 'pi ', title: 'Pi' },
  { tex: 'x', ins: 'x', title: 'Position x (m)' },
  { tex: 'y', ins: 'y', title: 'Position y (m)', minDim: 2 },
  { tex: 'z', ins: 'z', title: 'Position z (m)', minDim: 3 },
  { tex: 'L', ins: 'L', title: 'Length L (m)' },
  { tex: 'W', ins: 'W', title: 'Width W (m)', minDim: 2 },
  { tex: 'H', ins: 'H', title: 'Height H (m)', minDim: 3 },
]
