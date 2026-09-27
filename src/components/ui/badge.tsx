import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center gap-1 rounded-sm border px-1.5 py-px text-[11px] font-medium [&_svg]:size-3', {
  variants: {
    variant: {
      default: 'border-blue-200 bg-blue-50 text-blue-700',
      neutral: 'border-slate-200 bg-slate-50 text-slate-600',
      success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      warning: 'border-amber-200 bg-amber-50 text-amber-800',
      danger: 'border-red-200 bg-red-50 text-red-700',
      dark: 'border-white/10 bg-white/10 text-slate-200',
    },
  },
  defaultVariants: { variant: 'default' },
})

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
