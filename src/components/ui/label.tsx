import * as React from 'react'
import { cn } from '@/lib/utils'

export function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return <label data-slot="label" className={cn('text-[13px] leading-none font-medium text-foreground/85 select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50', className)} {...props} />
}
