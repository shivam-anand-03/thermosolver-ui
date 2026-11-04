import { useMemo, useRef } from 'react'
import { analyse } from '../expression'
import type { Setup } from '../types'
import type { Workflow } from '../useWorkflow'
import { PRESETS } from './constants'

export type SourceMode = 'constant' | 'custom'
type Source = Setup['preprocessor']['problem']['source']

function commit(s: Source, text: string) {
  const r = analyse(text)
  s.expression_input = text
  // a valid expression is sent in canonical form; an invalid one is sent as typed so the API also refuses it
  s.expression = r.ok ? r.plain! : text
}

/** State and actions for the heat generation expression editor. */
export function useSourceExpression(wf: Workflow) {
  const { setup, update } = wf
  const src = setup.preprocessor.problem.source
  const mode: SourceMode = src.expression != null ? 'custom' : 'constant'
  const input = src.expression_input ?? src.expression ?? PRESETS[0].text
  const analysis = useMemo(() => analyse(input), [input])
  const inputRef = useRef<HTMLInputElement>(null)

  const setInput = (text: string) => update((d) => commit(d.preprocessor.problem.source, text))
  const setMode = (m: SourceMode) =>
    update((d) => {
      const s = d.preprocessor.problem.source
      if (m === 'constant') s.expression = null
      else commit(s, s.expression_input ?? PRESETS[0].text)
    })

  /** Insert at the caret. With a selection and a function key, wrap it: select x, press sin, get sin(x). */
  const insert = (ins: string, back = 0) => {
    const el = inputRef.current
    const start = el?.selectionStart ?? input.length
    const end = el?.selectionEnd ?? input.length
    const selected = input.slice(start, end)
    const wrap = !!selected && back > 0
    const head = ins.slice(0, ins.length - back)
    const tail = ins.slice(ins.length - back)
    setInput(input.slice(0, start) + (wrap ? head + selected + tail : ins) + input.slice(end))
    const caret = wrap ? start + ins.length + selected.length : start + ins.length - back
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(caret, caret)
    })
  }
  return { mode, input, analysis, inputRef, setInput, setMode, insert }
}

export type SourceExpressionController = ReturnType<typeof useSourceExpression>
