import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'

export function Checkbox({ className, style, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'peer size-4 shrink-0 rounded-[4px] border border-slate-300 bg-white shadow-xs focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:outline-none disabled:opacity-40 data-[state=checked]:border-transparent data-[state=checked]:bg-primary data-[state=checked]:text-white',
        className,
      )}
      style={style}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        <Check className="size-3" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}
