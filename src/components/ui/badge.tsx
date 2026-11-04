import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

export const badgeVariants = cva('inline-flex w-fit shrink-0 items-center gap-1 rounded-sm border px-1.5 py-px text-[11px] font-medium whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3', {
  variants: {
    variant: {
      default: 'border-primary/25 bg-primary-soft text-primary-ink',
      secondary: 'border-transparent bg-secondary text-secondary-foreground',
      outline: 'text-foreground',
      neutral: 'border-border bg-muted text-muted-foreground',
      success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      warning: 'border-amber-200 bg-amber-50 text-amber-800',
      danger: 'border-red-200 bg-red-50 text-red-700',
      destructive: 'border-red-200 bg-red-50 text-red-700',
      dark: 'border-white/10 bg-white/10 text-slate-200',
    },
  },
  defaultVariants: { variant: 'default' },
})

export function Badge({ className, variant, asChild = false, ...props }: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'
  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}
