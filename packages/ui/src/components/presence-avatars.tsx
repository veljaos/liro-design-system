import { Bot } from 'lucide-react'
import type { ReactNode } from 'react'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover'
import {
  Tooltip as TooltipRoot,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../primitives/tooltip'
import { useLiro } from '../provider/liro-provider'
import { AgentMark } from './agent-mark'
import { PersonAvatar } from './person'

/*
 * PresenceAvatars (P5.2): who else has this record open. Up to `max` avatars (default 3) in a
 * row, 4px apart (the avatar look of PersonAvatar 'sm', 26px: neutral, never blue); not
 * overlapping, because an overlap needs a ring in the colour of whatever surface the row stands on,
 * which the component cannot know without a colour value. An agent's avatar is the Bot icon on the
 * same neutral square, never a person's initials. More people than `max` show as "+3" (the count
 * written by `format.number` in `messages['presence.more']`).
 *
 * The row is one button (a 26px-high target, 28px with its padding; WCAG 2.5.8): its accessible
 * name and its tooltip name everyone ("Also here: Dragan Ilić, Liro agent (agent)",
 * `messages['presence.here']`), so nothing depends on seeing the faces; pressing it (a touch, a
 * click, Enter) opens a list of the people with their line from the application ("Viewing",
 * "Editing") and AgentMark after an agent's name. The application decides who is here and keeps
 * it current; the component never polls (D1).
 */

/** One person (or agent) who has the record open. */
export interface PresencePerson {
  id: string
  /** The full name, from the application. */
  name: string
  /** A photo's address. */
  src?: string
  /** An agent (a machine actor), marked with AgentMark. */
  agent?: boolean
  /** A short line in the list ("Viewing", "Editing since 10:42"). From the application. */
  description?: ReactNode
}

export interface PresenceAvatarsProps {
  /** Everyone else who is here, in the application's order (the longest present first). */
  people: readonly PresencePerson[]
  /** How many avatars before "+N". Default: 3. */
  max?: number
  className?: string
}

function Face({ person }: { person: PresencePerson }) {
  if (person.agent === true) {
    return (
      <span
        aria-hidden="true"
        className="flex size-6.5 shrink-0 items-center justify-center rounded-xl bg-surface-sunken text-primary"
      >
        <Bot className="size-3.5" />
      </span>
    )
  }
  return (
    <PersonAvatar
      name={person.name}
      size="sm"
      {...(person.src === undefined ? {} : { src: person.src })}
    />
  )
}

/** Who else is here: overlapping avatars, "+N", their names on hover, focus and press. */
export function PresenceAvatars({ people, max = 3, className }: PresenceAvatarsProps) {
  const { messages, format } = useLiro()
  if (people.length === 0) return null
  const limit = Math.max(1, max)
  // "+1" would take the room of the avatar it hides: show it instead.
  const shown = people.length <= limit + 1 ? people : people.slice(0, limit)
  const hidden = people.length - shown.length
  const names = messages['text.join'](
    people.map((person) =>
      person.agent === true ? messages['agent.named'](person.name) : person.name,
    ),
  )
  const label = messages['presence.here'](names)
  return (
    <TooltipProvider>
      <Popover>
        <TooltipRoot>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button
                type="button"
                data-slot="presence-avatars"
                aria-label={label}
                className={cn(
                  BUTTON_RESET,
                  'inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-xl p-px',
                  FOCUS_RING,
                  className,
                )}
              >
                {shown.map((person) => (
                  <Face key={person.id} person={person} />
                ))}
                {hidden > 0 && (
                  <span
                    aria-hidden="true"
                    className="flex h-6.5 min-w-6.5 shrink-0 items-center justify-center rounded-xl bg-surface-sunken px-1 text-xs font-semibold text-primary tabular-nums"
                  >
                    {messages['presence.more'](hidden, format.number(String(hidden)))}
                  </span>
                )}
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent className="max-w-60 whitespace-normal">{label}</TooltipContent>
        </TooltipRoot>
        <PopoverContent align="end" aria-label={messages['presence.list']} className="w-64 p-1">
          <ul className="m-0 flex list-none flex-col p-0">
            {people.map((person) => (
              <li key={person.id} className="flex items-center gap-3 px-2 py-1.5">
                <Face person={person} />
                <span className="flex min-w-0 flex-col">
                  <span className="flex min-w-0 items-center gap-1.5 text-sm text-primary">
                    <span className={cn('truncate', TEXT_DIRECTION)}>{person.name}</span>
                    {person.agent === true && <AgentMark />}
                  </span>
                  {person.description !== undefined && (
                    <span className={cn('truncate text-xs text-secondary', TEXT_DIRECTION)}>
                      {person.description}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  )
}
