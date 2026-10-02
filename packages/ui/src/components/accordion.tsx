import type { ReactNode } from 'react'
import {
  Accordion as AccordionRoot,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../primitives/accordion'
import { cn } from '../primitives/cn'

/*
 * Accordion (P3.6): sections that open and close in place, on the Radix accordion that shadcn/ui
 * uses, with Mantine's default Accordion look (primitives/accordion.tsx). One open at a time
 * (`multiple` false, the default; a press on the open one closes it) or several. The chevron sits
 * at the inline end, so it moves to the other side in right-to-left. Closed panels are not
 * mounted, as in Tabs (AGENTS.md D16): a dialog opened from inside one belongs at page level.
 */

/** One section of an Accordion. */
export interface AccordionSection {
  /** Unique; `value` and `onValueChange` use it. */
  value: string
  /** The header, from the application. */
  title: ReactNode
  /** The panel. */
  content: ReactNode
  disabled?: boolean
}

export interface AccordionProps {
  items: readonly AccordionSection[]
  /** Several sections may be open at once. Default: false (one at a time). */
  multiple?: boolean
  /** Controlled open sections (their values). */
  value?: readonly string[]
  /** Uncontrolled initially open sections. Default: none. */
  defaultValue?: readonly string[]
  onValueChange?: (value: string[]) => void
  /** The heading level of the headers, to fit the page's outline. Default: 3. */
  headingLevel?: 2 | 3 | 4 | 5 | 6
  className?: string
}

/**
 * Sections of related content that the user opens when needed: details under a summary, a FAQ,
 * rarely used settings. Not for steps (FormWizard) or for parts of a form with errors to find
 * (FormSection's `collapsible` keeps its fields mounted).
 */
export function Accordion(props: AccordionProps) {
  const items = props.items.map((item) => (
    <AccordionItem key={item.value} value={item.value} disabled={item.disabled === true}>
      <AccordionTrigger headingLevel={props.headingLevel ?? 3}>{item.title}</AccordionTrigger>
      <AccordionContent>{item.content}</AccordionContent>
    </AccordionItem>
  ))
  const className = cn('font-sans text-primary', props.className)
  if (props.multiple === true) {
    return (
      <AccordionRoot
        type="multiple"
        className={className}
        {...(props.value === undefined ? {} : { value: [...props.value] })}
        {...(props.defaultValue === undefined ? {} : { defaultValue: [...props.defaultValue] })}
        {...(props.onValueChange === undefined ? {} : { onValueChange: props.onValueChange })}
      >
        {items}
      </AccordionRoot>
    )
  }
  const single = (values: readonly string[] | undefined) => values?.[0] ?? ''
  const onValueChange = props.onValueChange
  return (
    <AccordionRoot
      type="single"
      collapsible
      className={className}
      {...(props.value === undefined ? {} : { value: single(props.value) })}
      {...(props.defaultValue === undefined ? {} : { defaultValue: single(props.defaultValue) })}
      {...(onValueChange === undefined
        ? {}
        : {
            onValueChange: (value: string) => {
              onValueChange(value === '' ? [] : [value])
            },
          })}
    >
      {items}
    </AccordionRoot>
  )
}
