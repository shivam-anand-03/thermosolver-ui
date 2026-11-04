import * as React from 'react'
import { cn } from '@/lib/utils'

export function Table({ className, containerClassName, ...props }: React.ComponentProps<'table'> & { containerClassName?: string }) {
  return (
    <div className={cn('scroll-thin relative w-full overflow-x-auto', containerClassName)}>
      <table className={cn('w-full caption-bottom text-[12.5px]', className)} {...props} />
    </div>
  )
}
export function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return <thead className={cn('[&_tr]:border-b', className)} {...props} />
}
export function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
}
export function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return <tfoot className={cn('border-t bg-muted/50 font-medium [&>tr]:last:border-b-0', className)} {...props} />
}
export function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return <tr className={cn('border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted', className)} {...props} />
}
export function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return <th className={cn('h-8 px-2 text-left align-middle font-medium whitespace-nowrap text-muted-foreground', className)} {...props} />
}
export function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return <td className={cn('px-2 py-1.5 align-middle whitespace-nowrap', className)} {...props} />
}
export function TableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
  return <caption className={cn('mt-3 text-xs text-muted-foreground', className)} {...props} />
}
