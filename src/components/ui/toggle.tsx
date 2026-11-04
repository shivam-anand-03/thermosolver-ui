import * as TogglePrimitive from '@radix-ui/react-toggle'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

export const toggleVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-md text-[13px] font-medium whitespace-nowrap transition-[color,box-shadow,background-color] outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-foreground data-[state=on]:text-background [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        default: 'bg-transparent text-muted-foreground',
        outline: 'border border-input bg-card text-muted-foreground shadow-xs',
      },
      size: {
        default: 'h-8 min-w-8 px-3',
        sm: 'h-7 min-w-7 px-2.5 text-xs',
        lg: 'h-9 min-w-9 px-3.5',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export function Toggle({ className, variant, size, ...props }: React.ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>) {
  return <TogglePrimitive.Root className={cn(toggleVariants({ variant, size, className }))} {...props} />
}
