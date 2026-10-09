import type { ReactNode } from 'react'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { MessageBubble } from './messages'

/*
 * AgentQuestion (P5.3's agent sentence; owner, P3.6): an agent asking the user something — the
 * agent's name with AgentMark and its question in a Bubble (the Message family's MessageBubble, so
 * an agent's question looks like its messages everywhere), and the way to answer inside the
 * bubble under the question: a Questionnaire (one question with `summary={false}` for a short
 * answer, or several), or any short form of the application. Once answered, `answer` replaces the
 * form with the user's answer as text, so the conversation keeps what was decided.
 *
 * It is content, not a container: the application opens it where it fits — in a Popover from the
 * shell's agent button, in a Drawer, or in a MessageThread (there a ThreadMessage from the agent
 * with the questionnaire as its `extra` draws the same bubble). The group is named "Question from <agent>"
 * (`messages['agent.question']`). The Design System never decides what an agent asks.
 */

export interface AgentQuestionProps {
  /** The agent's name ("Liro agent"). */
  agent: string
  /** When the agent asked: an ISO instant in the tenant's offset. */
  at?: string
  /** The question, in the agent's words. */
  question: ReactNode
  /** How to answer: a Questionnaire or a short form. Not shown once `answer` is given. */
  children?: ReactNode
  /** The user's answer, once given ("Payment expected on 20.10.2026."). */
  answer?: ReactNode
  className?: string
}

/** An agent's question with the way to answer it, in the agent's bubble. */
export function AgentQuestion({
  agent,
  at,
  question,
  children,
  answer,
  className,
}: AgentQuestionProps) {
  const { messages } = useLiro()
  const extra =
    answer !== undefined ? (
      <p className="m-0 border-0 border-t border-solid border-subtle pt-3 text-sm font-medium text-primary">
        {answer}
      </p>
    ) : (
      children
    )
  return (
    <div
      role="group"
      aria-label={messages['agent.question'](agent)}
      data-slot="agent-question"
      className={cn('min-w-0 font-sans', className)}
    >
      <MessageBubble
        author={{ name: agent, agent: true }}
        {...(at === undefined ? {} : { at })}
        {...(extra === undefined ? {} : { extra })}
      >
        {question}
      </MessageBubble>
    </div>
  )
}
