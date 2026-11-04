// Visual identity of the three phases (sidebar, step headers, phase rail).
// Values are CSS variables (src/index.css) so dark mode can swap them for monochrome.
export type PhaseKey = 'pre' | 'solver' | 'post'

const vars = (k: PhaseKey) => ({ accent: `var(--ph-${k}-accent)`, soft: `var(--ph-${k}-soft)`, ring: `var(--ph-${k}-ring)`, text: `var(--ph-${k}-text)` })

export const PHASE_THEME: Record<PhaseKey, { label: string; title: string; accent: string; soft: string; ring: string; text: string }> = {
  pre: { label: 'Phase I', title: 'Preprocessor', ...vars('pre') },
  solver: { label: 'Phase II', title: 'Solver', ...vars('solver') },
  post: { label: 'Phase III', title: 'Post-processing', ...vars('post') },
}

export function phaseOf(label: string): PhaseKey {
  return label.startsWith('Phase III') ? 'post' : label.startsWith('Phase II') ? 'solver' : 'pre'
}
