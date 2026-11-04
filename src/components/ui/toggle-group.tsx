import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import { type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { toggleVariants } from './toggle'

const Ctx = React.createContext<VariantProps<typeof toggleVariants>>({ size: 'default', variant: 'outline' })

export function ToggleGroup({ className, variant = 'outline', size = 'default', children, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Root> & VariantProps<typeof toggleVariants>) {
  return (
    <ToggleGroupPrimitive.Root data-variant={variant} className={cn('group/toggle-group inline-flex w-fit flex-wrap items-center rounded-md data-[variant=outline]:shadow-xs', className)} {...props}>
      <Ctx.Provider value={{ variant, size }}>{children}</Ctx.Provider>
    </ToggleGroupPrimitive.Root>
  )
}

export function ToggleGroupItem({ className, children, variant, size, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleVariants>) {
  const ctx = React.useContext(Ctx)
  return (
    <ToggleGroupPrimitive.Item
      className={cn(
        toggleVariants({ variant: ctx.variant || variant, size: ctx.size || size }),
        'min-w-0 flex-1 shrink-0 rounded-none shadow-none first:rounded-l-md last:rounded-r-md focus:z-10 focus-visible:z-10 data-[variant=outline]:border-l-0 data-[variant=outline]:first:border-l',
        className,
      )}
      data-variant={ctx.variant || variant}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
}
