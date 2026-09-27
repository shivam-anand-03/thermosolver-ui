import katex from 'katex'
import { useMemo } from 'react'
import { cn } from '@/lib/utils'

/** Render a LaTeX string with KaTeX (never throws; malformed input is shown in red). */
export function Tex({ math, block = false, className }: { math: string; block?: boolean; className?: string }) {
  const html = useMemo(
    () => katex.renderToString(math, { displayMode: block, throwOnError: false, strict: 'ignore', trust: false }),
    [math, block],
  )
  return <span className={cn(block ? 'block' : 'inline', className)} dangerouslySetInnerHTML={{ __html: html }} />
}
