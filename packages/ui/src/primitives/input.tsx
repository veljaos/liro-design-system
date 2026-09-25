import type { ComponentProps } from 'react'
import { INPUT } from './classes'
import { cn } from './cn'

/** A single-line text input with the Liro look (shadcn/ui input, adapted; Mantine Input). */
export function Input({ className, type = 'text', ...props }: ComponentProps<'input'>) {
  return <input type={type} data-slot="input" className={cn(INPUT, className)} {...props} />
}
