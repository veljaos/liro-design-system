import type { ComponentProps } from 'react'
import { INPUT } from './classes'
import { cn } from './cn'

/**
 * A multi-line text input (shadcn/ui textarea, adapted; Mantine Textarea): the input look, at
 * least one control high, 5.5px vertical padding (Input.css, multiline 'sm'), not resizable by
 * default (Mantine's --input-resize: none).
 */
export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(INPUT, 'h-auto min-h-control resize-none py-[5.5px]', className)}
      {...props}
    />
  )
}
