import * as React from 'react'
import { cn } from '@/lib/utils'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'flex h-8 w-full rounded border border-slate-300 bg-white px-2.5 font-mono text-[13px] text-slate-900 tabular placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 aria-invalid:border-red-400 aria-invalid:ring-red-500/15',
      className,
    )}
    {...props}
  />
))
Input.displayName = 'Input'
