import { Bot } from 'lucide-react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import {
  Tooltip as TooltipRoot,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../primitives/tooltip'
import { useLiro } from '../provider/liro-provider'

/*
 * AgentMark (P5.2): one consistent machine marker, shown after any name that belongs to an agent —
 * in a message's header, a history entry, the presence list, an agent's question. Neutral, never
 * blue (D17: an agent is not an action): lucide's Bot at 14px in text.secondary, a tooltip with
 * `messages['agent.mark']` ("Agent") on hover, and the same word for assistive technology, so a
 * screen reader hears "Liro agent, Agent". With `showLabel` the word is also written beside the
 * icon (xs text.secondary), where there is room and the mark must be read without hovering (a
 * list of people). Text and icon together, never colour alone.
 */

export interface AgentMarkProps {
  /** Writes the word beside the icon. Default: the icon only (the word for assistive technology). */
  showLabel?: boolean
  className?: string
}

/** The marker after an agent's name: an icon, its word for assistive technology and a tooltip. */
export function AgentMark({ showLabel = false, className }: AgentMarkProps) {
  const { messages } = useLiro()
  const word = messages['agent.mark']
  return (
    <TooltipProvider>
      <TooltipRoot>
        <TooltipTrigger asChild>
          <span
            data-slot="agent-mark"
            className={cn(
              'inline-flex shrink-0 items-center gap-1 align-middle font-sans text-xs font-medium text-secondary',
              className,
            )}
          >
            <Bot aria-hidden="true" className="size-3.5 shrink-0" />
            <span className={showLabel ? TEXT_DIRECTION : 'sr-only'}>{word}</span>
          </span>
        </TooltipTrigger>
        {!showLabel && <TooltipContent>{word}</TooltipContent>}
      </TooltipRoot>
    </TooltipProvider>
  )
}
