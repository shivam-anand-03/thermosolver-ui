import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

const alertVariants = cva(
  'relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-md border px-3.5 py-2.5 text-[13px] leading-relaxed has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-2.5 [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:text-current',
  {
    variants: {
      variant: {
        default: 'border-primary/30 bg-primary-soft text-card-foreground',
        warning: 'border-amber-200 bg-amber-50 text-amber-900',
        destructive: 'border-red-200 bg-red-50 text-red-800',
        success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export function Alert({ className, variant, ...props }: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
}

export function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('col-start-2 line-clamp-1 min-h-4 font-semibold tracking-tight', className)} {...props} />
}

export function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('col-start-2 grid justify-items-start gap-1 [&_p]:leading-relaxed', className)} {...props} />
}
