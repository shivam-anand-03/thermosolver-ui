// Visual identity of the three phases (sidebar, step headers, phase rail).
export type PhaseKey = 'pre' | 'solver' | 'post'

export const PHASE_THEME: Record<PhaseKey, { label: string; title: string; accent: string; soft: string; ring: string; text: string }> = {
  pre: { label: 'Phase I', title: 'Preprocessor', accent: '#2a78d6', soft: '#edf4fd', ring: '#b7d3f6', text: '#1c5cab' },
  solver: { label: 'Phase II', title: 'Solver', accent: '#4a3aa7', soft: '#f1effa', ring: '#cfc8ee', text: '#3d2f8f' },
  post: { label: 'Phase III', title: 'Post-processing', accent: '#0f8a5f', soft: '#e9f7f1', ring: '#b4e3cf', text: '#0b6b4a' },
}

export function phaseOf(label: string): PhaseKey {
  return label.startsWith('Phase III') ? 'post' : label.startsWith('Phase II') ? 'solver' : 'pre'
}
