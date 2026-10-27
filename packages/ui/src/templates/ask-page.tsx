import { History, Plus, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { AssistantComposer, type AssistantComposerProps } from '../components/assistant-composer'
import { QuestionList } from '../components/assistant-panel'
import { Button } from '../components/button'
import { usePhone } from '../components/use-phone'

/*
 * AskPage (BUILD-PLAN P5.34): an assistant's page of its own — and nothing else on it.
 * - **Before a question**: one large question box in a centred column (42rem), the application's
 *   title over it as the page's h1 ("What would you like to know?") and its line, then the
 *   suggested and the recent questions as buttons (two columns on a desktop, one on a phone); a
 *   press asks it.
 * - **With a question** (`question`): a calm reading column (44rem): "New question" at the start,
 *   the question as the page's h1, the answer (an AssistantAnswer with `size="page"`: headings,
 *   text, tables, charts and sources) and the question box for a follow-up under it.
 * - The application's `note` under the box ("Answers use only the data you may see; check them
 *   before you act.").
 * Words, questions and answers are the application's.
 */

export interface AskPageProps {
  /** The page's h1 before a question ("What would you like to know?"). */
  title: string
  /** A line under it. */
  description?: ReactNode
  /** Asks a question (typed, suggested, recent or a follow-up). */
  onAsk: (question: string) => void
  /** The question box's other props (placeholder, value, busy, unavailable with its reason). */
  composer?: Omit<AssistantComposerProps, 'onAsk' | 'size'>
  /** Questions to start with. */
  suggestions?: readonly string[]
  /** The user's recent questions, newest first. */
  recent?: readonly string[]
  /** The question asked: the page shows it as its h1 with the answer. */
  question?: string
  /** The answer: an AssistantAnswer with `size="page"`. */
  answer?: ReactNode
  /** Back to an empty question box: shows "New question" over the answer. */
  onNewQuestion?: () => void
  /** A line under the question box, from the application. */
  note?: ReactNode
  /** 'desktop' or 'phone' forces one; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

/** An assistant's page: a question box, then the answer as a readable page. */
export function AskPage(props: AskPageProps) {
  const { messages } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const note =
    props.note === undefined ? null : (
      <p className={cn('m-0 text-xs text-tertiary', TEXT_DIRECTION)}>{props.note}</p>
    )

  if (props.question !== undefined) {
    return (
      <div
        data-slot="ask-page"
        className={cn(
          'mx-auto box-border flex w-full max-w-[44rem] min-w-0 flex-col font-sans text-primary',
          phone ? 'gap-4 p-4' : 'gap-6 px-6 py-8',
          props.className,
        )}
      >
        {props.onNewQuestion !== undefined && (
          <div className="flex">
            <Button
              family="neutral"
              icon={Plus}
              label={messages['assistant.newQuestion']}
              onClick={props.onNewQuestion}
            />
          </div>
        )}
        <h1 className={cn('m-0 text-h2 break-words text-primary', TEXT_DIRECTION)}>
          {props.question}
        </h1>
        {props.answer}
        <div className="flex flex-col gap-2 border-0 border-t border-solid border-default pt-6">
          <AssistantComposer
            label={messages['assistant.followUp']}
            {...props.composer}
            size="page"
            onAsk={props.onAsk}
          />
          {note}
        </div>
      </div>
    )
  }

  const hasSuggestions = props.suggestions !== undefined && props.suggestions.length > 0
  const hasRecent = props.recent !== undefined && props.recent.length > 0
  return (
    <div
      data-slot="ask-page"
      className={cn(
        'mx-auto box-border flex w-full max-w-[42rem] min-w-0 flex-col font-sans text-primary',
        phone ? 'gap-5 px-4 pt-8 pb-6' : 'gap-6 px-6 pt-[12vh] pb-12',
        props.className,
      )}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className={cn('m-0 text-h1 text-primary', TEXT_ISOLATE)}>{props.title}</h1>
        {props.description !== undefined && (
          <p className={cn('m-0 text-md text-secondary', TEXT_ISOLATE)}>{props.description}</p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <AssistantComposer {...props.composer} size="page" onAsk={props.onAsk} />
        {note}
      </div>
      {(hasSuggestions || hasRecent) && (
        <div className={cn('grid gap-6', !phone && hasSuggestions && hasRecent && 'grid-cols-2')}>
          {hasSuggestions && (
            <QuestionList
              label={messages['assistant.suggested']}
              questions={props.suggestions ?? []}
              onAsk={props.onAsk}
              icon={Sparkles}
            />
          )}
          {hasRecent && (
            <QuestionList
              label={messages['assistant.recent']}
              questions={props.recent ?? []}
              onAsk={props.onAsk}
              icon={History}
            />
          )}
        </div>
      )}
    </div>
  )
}
