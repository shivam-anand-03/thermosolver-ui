import * as SliderPrimitive from '@radix-ui/react-slider'
import * as React from 'react'
import { cn } from '@/lib/utils'

export function Slider({ className, 'aria-label': ariaLabel = 'Time', ...props }: React.ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root data-slot="slider" className={cn('relative flex h-5 w-full touch-none items-center select-none data-[disabled]:opacity-50', className)} {...props}>
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label={ariaLabel}
        className="block size-4 shrink-0 rounded-full border-2 border-primary bg-card shadow-sm transition-[box-shadow,transform] outline-none hover:scale-110 focus-visible:ring-4 focus-visible:ring-ring/25"
      />
    </SliderPrimitive.Root>
  )
}
