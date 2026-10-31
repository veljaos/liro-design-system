import { Check } from 'lucide-react'
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import {
  Questionnaire as QuestionnaireRoot,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireItem,
  QuestionnaireTitle,
} from '../primitives/questionnaire'
import { useLiro } from '../provider/liro-provider'
import type { LiroFormat } from '../provider/format'
import type { LiroMessages } from '../provider/messages'
import { Button, CompactIconButton } from './button'
import { KeyValueList } from './cards'
import { DateField } from './date-field'
import type { IconComponent } from './intents'
import { MoneyField, NumberField } from './number-field'
import { ProgressBar } from './progress'
import {
  answersOnPath,
  chooseOption,
  chosenOptions,
  isAnswered,
  isRequired,
  multipleValues,
  nextStep,
  previousStep,
  questionnaireKeyAction,
  questionPath,
  questionProgress,
  singleValue,
  type QuestionnaireKeyTarget,
  type QuestionAnswer,
  type QuestionAnswers,
  type QuestionDefinition,
  type QuestionnaireStep,
} from './questionnaire-logic'
import { Spinner } from './spinner'
import { TextField } from './text-field'

/*
 * Questionnaire: a general step-by-step question component — guided
 * document generation (an employment contract), the questions an agent asks (AgentQuestion), a
 * guided form. On the shadcn/ui Questionnaire primitive (`primitives/questionnaire.tsx`): each
 * question is a fieldset named by its legend; choices are real radio buttons and checkboxes; the
 * number keys choose an option while the user is not typing; the question whose turn it is takes
 * the focus when it changes. The component decides nothing about the content: the questions,
 * their branches, the validation and what happens with the answers are the application's.
 *
 * - **Questions as data with branching** (`questions-logic.ts`): an option may name the next
 *   question, a question has a default next, `null` ends. The path is recomputed from the answers.
 * - **Answer types:** single choice, multiple choice, date (DateField), number (NumberField),
 *   amount (MoneyField), short text (TextField), and "Other" with its own text on any choice.
 * - **Back keeps every answer.** Answers on a branch no longer taken are kept (they come back when
 *   the user returns to that branch) but only the answers on the current path are submitted.
 * - **Final summary** (`summary`, default true): every question on the path with its answer in a
 *   KeyValueList, each with a 28px pencil ("Change <question>", `messages['value.change']`) that
 *   jumps to it; Next then returns to the summary — unless the change opened new questions without
 *   an answer, which are asked first. Without a summary, the last question's button submits.
 * - **Progress:** "3 of 9 answered" (answered questions on the current path, through
 *   `format.number`) above a ProgressBar.
 * - **Keyboard:** Enter goes on (not on a button, which presses itself); the number keys choose
 *   options when the focus is not in a typing field (the primitive's `shortcuts="numbers"`, the
 *   key shown at the end of each option); arrows move between options (radio buttons natively,
 *   checkboxes by the primitive).
 * - **Required answers and the application's checks:** a required question (the default) cannot
 *   be left without an answer (`messages['questionnaire.required']`), an "Other" without its text
 *   (`questionnaire.otherRequired`); `validate` returns the application's own message. The error
 *   shows after Next is pressed, under the question (choices) or the field (typed answers), and
 *   the focus goes to the answer.
 * - Buttons: Back (the back intent) at the start, the main action last at the end (Next, then
 *   "Review answers" before the summary, then the application's submit label, filled).
 */

export interface QuestionnaireProps {
  /** The questions, in their default order; the first is asked first. */
  questions: readonly QuestionDefinition[]
  /** Controlled answers (every answer given, also on branches not taken). */
  answers?: QuestionAnswers
  /** Uncontrolled initial answers. */
  defaultAnswers?: QuestionAnswers
  /**
   * Where it opens, for a questionnaire resumed: a question on the answers' path, or the
   * summary. Default: the first question.
   */
  defaultStep?: QuestionnaireStep
  /** Called with all answers whenever one changes. */
  onAnswersChange?: (answers: QuestionAnswers) => void
  /**
   * The application's check of an answer before going on: a message when it is not acceptable
   * ("The end date must be after the start date."), else undefined.
   */
  validate?: (
    question: QuestionDefinition,
    answer: QuestionAnswer | undefined,
    answers: QuestionAnswers,
  ) => ReactNode | undefined
  /** Called with the answers of the questions on the current path only. */
  onSubmit: (answers: Record<string, QuestionAnswer>) => void | Promise<void>
  /** The final button ("Generate contract"). Default: `messages['questionnaire.submit']`. */
  submitLabel?: string
  /** Its icon. Default: Check. */
  submitIcon?: IconComponent
  /** The application is working on the submitted answers. */
  submitting?: boolean
  /** Ends with a summary where any answer can be changed. Default: true. */
  summary?: boolean
  /** Shows the progress ("3 of 7 answered" and its bar). Default: true; off for one question. */
  progress?: boolean
  /** The summary's title. Default: `messages['questionnaire.summaryTitle']`. */
  summaryTitle?: string
  /** The summary title's heading level. Default: 2. */
  headingLevel?: 2 | 3 | 4 | 5 | 6
  /** Names the questionnaire for assistive technology ("Employment contract"). */
  label?: string
  className?: string
}

/** The error of an answer, or undefined: required, "Other" text, then the application's check. */
function answerError(
  question: QuestionDefinition,
  answers: QuestionAnswers,
  messages: LiroMessages,
  validate: QuestionnaireProps['validate'],
): ReactNode {
  const answer = answers[question.id]
  const chosen = chosenOptions(question, answer)
  if (chosen.some((option) => option.other === true) && (answer?.other ?? '').trim() === '') {
    return messages['questionnaire.otherRequired']
  }
  if (isRequired(question) && !isAnswered(question, answer))
    return messages['questionnaire.required']
  return validate?.(question, answer, answers)
}

/** An answer as the summary shows it. */
function answerText(
  question: QuestionDefinition,
  answer: QuestionAnswer | undefined,
  messages: LiroMessages,
  format: LiroFormat,
): string | null {
  if (!isAnswered(question, answer)) return null
  if (question.type === 'single' || question.type === 'multiple') {
    const labels = chosenOptions(question, answer).map((option) =>
      option.other === true ? (answer?.other ?? '').trim() : option.label,
    )
    return messages['text.join'](labels)
  }
  const value = typeof answer?.value === 'string' ? answer.value : ''
  if (question.type === 'date') return format.date(value)
  const decimals = question.decimals === undefined ? {} : { decimals: question.decimals }
  if (question.type === 'number') return format.number(value, decimals)
  if (question.type === 'amount') return format.money(value, question.currency ?? '', decimals)
  return value
}

/** The answer area of one question. */
function Answer({
  question,
  answer,
  error,
  onChange,
  otherRef,
}: {
  question: QuestionDefinition
  answer: QuestionAnswer | undefined
  error: ReactNode
  onChange: (answer: QuestionAnswer) => void
  otherRef: (element: HTMLDivElement | null) => void
}) {
  const fieldLabel = question.fieldLabel ?? question.title
  const errorProps = error === undefined ? {} : { error }
  const placeholder =
    question.placeholder === undefined ? {} : { placeholder: question.placeholder }
  const decimals = question.decimals === undefined ? {} : { decimals: question.decimals }
  const typed = typeof answer?.value === 'string' ? answer.value : null

  if (question.type === 'single' || question.type === 'multiple') {
    const options = question.options ?? []
    const chosen = chosenOptions(question, answer)
    const other = chosen.find((option) => option.other === true)
    const checked = (value: string) =>
      question.type === 'single'
        ? singleValue(answer) === value
        : multipleValues(answer).includes(value)
    return (
      <>
        <QuestionnaireChoices>
          {options.map((option) => (
            <QuestionnaireChoice
              key={option.value}
              value={option.value}
              checked={checked(option.value)}
              {...(option.disabled === true ? { disabled: true } : {})}
              onChange={(event) => {
                onChange(chooseOption(question, answer, option.value, event.target.checked))
              }}
            >
              <span className={TEXT_DIRECTION}>{option.label}</span>
              {option.description !== undefined && (
                <QuestionnaireChoiceDescription className={TEXT_DIRECTION}>
                  {option.description}
                </QuestionnaireChoiceDescription>
              )}
            </QuestionnaireChoice>
          ))}
        </QuestionnaireChoices>
        {other !== undefined && (
          <div ref={otherRef}>
            <TextField
              label={question.otherLabel ?? other.label}
              required
              value={answer?.other ?? ''}
              onChange={(text) => {
                onChange({ ...answer, other: text })
              }}
              {...placeholder}
            />
          </div>
        )}
        {error !== undefined && <QuestionnaireError>{error}</QuestionnaireError>}
      </>
    )
  }
  const common = {
    label: fieldLabel,
    hideLabel: true,
    required: isRequired(question),
    className: 'max-w-80',
    ...errorProps,
    ...placeholder,
  }
  if (question.type === 'date') {
    return (
      <DateField
        {...common}
        value={typed}
        onChange={(value) => {
          onChange({ ...answer, value })
        }}
      />
    )
  }
  if (question.type === 'number') {
    return (
      <NumberField
        {...common}
        {...decimals}
        value={typed}
        onChange={(value) => {
          onChange({ ...answer, value })
        }}
      />
    )
  }
  if (question.type === 'amount') {
    return (
      <MoneyField
        {...common}
        {...decimals}
        currency={question.currency ?? ''}
        value={typed}
        onChange={(value) => {
          onChange({ ...answer, value })
        }}
      />
    )
  }
  return (
    <TextField
      {...common}
      className="max-w-120"
      value={typed ?? ''}
      onChange={(value) => {
        onChange({ ...answer, value })
      }}
    />
  )
}

/** What kind of element a key was pressed on, for `questionnaireKeyAction`. */
function keyTarget(target: EventTarget | null): QuestionnaireKeyTarget {
  if (target instanceof HTMLTextAreaElement) return 'multiline'
  if (target instanceof HTMLButtonElement || target instanceof HTMLAnchorElement) return 'button'
  if (target instanceof HTMLSelectElement) return 'typing'
  if (target instanceof HTMLInputElement) {
    return ['radio', 'checkbox'].includes(target.type)
      ? 'other'
      : ['button', 'submit', 'reset'].includes(target.type)
        ? 'button'
        : 'typing'
  }
  if (target instanceof HTMLElement && target.isContentEditable) return 'typing'
  return 'other'
}

/** The choices of the question shown that can be chosen, in order: what 1–9 choose. */
function choiceInputs(item: HTMLElement | null): HTMLInputElement[] {
  return Array.from(
    item?.querySelectorAll<HTMLInputElement>(
      'input[type=radio]:not(:disabled), input[type=checkbox]:not(:disabled)',
    ) ?? [],
  )
}

/** The typed answers: their field takes the focus when the question is shown. */
const TYPED_TYPES: ReadonlySet<QuestionDefinition['type']> = new Set([
  'date',
  'number',
  'amount',
  'text',
])

/** Questions one at a time, with branching, Back, a summary and progress. */
export function Questionnaire(props: QuestionnaireProps) {
  const { messages, format } = useLiro()
  const headingId = useId()
  const [innerAnswers, setInnerAnswers] = useState<QuestionAnswers>(props.defaultAnswers ?? {})
  const answers = props.answers ?? innerAnswers
  const path = questionPath(props.questions, answers)
  const first = path[0]
  const [step, setStep] = useState<QuestionnaireStep>(() => {
    const start = props.defaultStep
    if (start?.kind === 'summary' && props.summary !== false) return start
    if (start?.kind === 'question' && path.some((question) => question.id === start.id)) {
      return start
    }
    return first === undefined ? { kind: 'summary' } : { kind: 'question', id: first.id }
  })
  const [fromSummary, setFromSummary] = useState(false)
  const [attempted, setAttempted] = useState<ReadonlySet<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const summaryHeading = useRef<HTMLHeadingElement>(null)
  const item = useRef<HTMLFieldSetElement>(null)
  const rootRef = useRef<HTMLFormElement>(null)
  const otherField = useRef<HTMLDivElement | null>(null)
  // Set in event handlers, read after the render they cause (refs: no state update in an effect).
  const focusOther = useRef(false)
  // The answers just reported by a field in this event (a typed date is read on Enter, in the
  // field's own key handler, before the form's), until the render that shows them.
  const reportedAnswers = useRef<QuestionAnswers | null>(null)
  const withSummary = props.summary ?? true
  const submitting = busy || props.submitting === true

  const current =
    step.kind === 'question'
      ? props.questions.find((question) => question.id === step.id)
      : undefined
  const progress = questionProgress(path, answers)
  const error =
    current !== undefined && attempted.has(current.id)
      ? answerError(current, answers, messages, props.validate)
      : undefined

  const setAnswers = (next: QuestionAnswers) => {
    reportedAnswers.current = next
    setInnerAnswers(next)
    props.onAnswersChange?.(next)
  }

  const submit = (latest: QuestionAnswers = answers) => {
    if (submitting) return
    const result = props.onSubmit(answersOnPath(questionPath(props.questions, latest), latest))
    if (result instanceof Promise) {
      setBusy(true)
      result.then(
        () => {
          setBusy(false)
        },
        () => {
          setBusy(false)
        },
      )
    }
  }

  const goTo = (next: QuestionnaireStep, viaSummary: boolean) => {
    setFromSummary(viaSummary)
    setStep(next)
  }

  const goNext = (latest: QuestionAnswers = answers) => {
    if (current === undefined) return
    if (answerError(current, latest, messages, props.validate) !== undefined) {
      setAttempted(new Set([...attempted, current.id]))
      const target = item.current?.querySelector<HTMLElement>(
        'input:not([type=hidden]):not(:disabled)',
      )
      target?.focus()
      return
    }
    const next = nextStep(questionPath(props.questions, latest), latest, current.id, fromSummary)
    if (next.kind === 'summary' && !withSummary) {
      submit(latest)
      return
    }
    goTo(next, fromSummary && next.kind === 'question')
  }

  const goBack = () => {
    const previous = previousStep(path, step)
    if (previous !== null) goTo(previous, false)
  }

  // The answers reported during an event are in state after its render.
  useEffect(() => {
    reportedAnswers.current = null
  })

  // The summary takes the focus when it opens, so a screen reader starts there.
  useEffect(() => {
    if (step.kind === 'summary') summaryHeading.current?.focus()
  }, [step])

  // Choosing "Other" moves the focus into its text.
  useEffect(() => {
    if (!focusOther.current) return
    focusOther.current = false
    otherField.current?.querySelector('input')?.focus()
  })

  /**
   * The keys: 1–9 choose the numbered option, Enter goes on (a typed answer was
   * read by its field's own Enter, just before this: use what it reported). True when handled.
   */
  const pressKey = (event: {
    key: string
    target: EventTarget | null
    ctrlKey: boolean
    metaKey: boolean
    altKey: boolean
    shiftKey: boolean
    isComposing: boolean
  }): boolean => {
    if (step.kind !== 'question') return false
    const choices = choiceInputs(item.current)
    const action = questionnaireKeyAction(event.key, keyTarget(event.target), choices.length, {
      ctrl: event.ctrlKey,
      meta: event.metaKey,
      alt: event.altKey,
      shift: event.shiftKey,
      composing: event.isComposing,
    })
    if (action === null) return false
    if (action.kind === 'next') {
      goNext(reportedAnswers.current ?? answers)
      return true
    }
    const choice = choices[action.index]
    choice?.focus()
    // A radio already chosen stays chosen; a checkbox toggles, as a press on it does.
    if (choice !== undefined && !(choice.type === 'radio' && choice.checked)) choice.click()
    return true
  }

  const onKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (
      pressKey({
        key: event.key,
        target: event.target,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        altKey: event.altKey,
        shiftKey: event.shiftKey,
        isComposing: event.nativeEvent.isComposing,
      })
    ) {
      // A handled key stops here: a page-wide shortcut on the same key (Storybook's "1", an
      // application's own) must not take the focus away before the next key.
      event.preventDefault()
      event.stopPropagation()
    }
  }

  // Nothing focused on the page (it has just opened, or the user clicked beside the question):
  // the keys still work when this is the page's only questionnaire, so a first-day user can answer
  // with the number keys at once.
  const pressKeyRef = useRef(pressKey)
  useEffect(() => {
    pressKeyRef.current = pressKey
  })
  useEffect(() => {
    const onDocumentKey = (event: globalThis.KeyboardEvent) => {
      const active = document.activeElement
      if (event.defaultPrevented || (active !== null && active !== document.body)) return
      const root = rootRef.current
      if (root === null || root.getClientRects().length === 0) return
      if (document.querySelectorAll('[data-slot="questionnaire-flow"]').length !== 1) return
      if (pressKeyRef.current(event)) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    document.addEventListener('keydown', onDocumentKey)
    return () => {
      document.removeEventListener('keydown', onDocumentKey)
    }
  }, [])

  // A typed answer's field takes the focus when its question is shown (after the first), so the
  // user types at once: Enter, then the date, then Enter. The primitive focuses the question
  // itself (a fieldset, not in the tab order) once it is registered; for a typed answer that
  // focus moves on into the field.
  const typedFocus = (event: FocusEvent<HTMLFieldSetElement>) => {
    if (event.target !== event.currentTarget) return
    if (current === undefined || !TYPED_TYPES.has(current.type)) return
    event.currentTarget
      .querySelector<HTMLInputElement>('input:not([type=hidden]):not(:disabled)')
      ?.focus()
  }

  const Heading = `h${String(props.headingLevel ?? 2)}` as 'h2'
  // What Next leads to: another question, the summary ("Review answers") or, without a summary,
  // the submission (the application's label, filled).
  const target = current === undefined ? null : nextStep(path, answers, current.id, fromSummary)
  const toEnd = target?.kind === 'summary'
  const submitsHere = toEnd && !withSummary

  return (
    <QuestionnaireRoot
      ref={rootRef}
      data-slot="questionnaire-flow"
      shortcuts="numbers"
      {...(step.kind === 'question' ? { item: step.id } : { item: '' })}
      {...(props.label === undefined ? {} : { 'aria-label': props.label })}
      onKeyDown={onKeyDown}
      onSubmit={(event) => {
        event.preventDefault()
      }}
      className={props.className}
    >
      {props.progress !== false && (
        <div className="flex flex-col gap-1.5">
          <p className={cn('m-0 text-xs text-secondary tabular-nums', TEXT_DIRECTION)}>
            {messages['questionnaire.progress'](
              progress.answered,
              format.number(String(progress.answered)),
              progress.total,
              format.number(String(progress.total)),
            )}
          </p>
          <ProgressBar
            label={messages['questionnaire.progressLabel']}
            value={progress.answered}
            max={Math.max(progress.total, 1)}
          />
        </div>
      )}

      {current !== undefined && (
        <QuestionnaireItem
          key={current.id}
          ref={item}
          onFocus={typedFocus}
          name={current.id}
          required={isRequired(current)}
          multiple={current.type === 'multiple'}
          invalid={error !== undefined}
        >
          <QuestionnaireTitle>{current.title}</QuestionnaireTitle>
          {current.description !== undefined && (
            <QuestionnaireDescription>{current.description}</QuestionnaireDescription>
          )}
          <Answer
            question={current}
            answer={answers[current.id]}
            error={error}
            otherRef={(element) => {
              otherField.current = element
            }}
            onChange={(answer) => {
              const before = chosenOptions(current, answers[current.id]).some(
                (option) => option.other === true,
              )
              const after = chosenOptions(current, answer).some((option) => option.other === true)
              if (!before && after) focusOther.current = true
              setAnswers({ ...answers, [current.id]: answer })
            }}
          />
        </QuestionnaireItem>
      )}

      {step.kind === 'summary' && (
        <section aria-labelledby={headingId} className="flex flex-col gap-2">
          <Heading
            id={headingId}
            ref={summaryHeading}
            tabIndex={-1}
            className={cn('m-0 text-lg font-semibold text-primary outline-none', TEXT_DIRECTION)}
          >
            {props.summaryTitle ?? messages['questionnaire.summaryTitle']}
          </Heading>
          <KeyValueList
            columns={1}
            items={path.map((question) => {
              const text = answerText(question, answers[question.id], messages, format)
              return {
                key: question.id,
                label: question.title,
                value: (
                  <span className="inline-flex items-center gap-1">
                    <span className={cn(text === null && 'text-secondary', TEXT_ISOLATE)}>
                      {text ?? messages['questionnaire.notAnswered']}
                    </span>
                    <CompactIconButton
                      intent="edit"
                      label={messages['value.change'](question.title)}
                      onClick={() => {
                        goTo({ kind: 'question', id: question.id }, true)
                      }}
                    />
                  </span>
                ),
              }
            })}
          />
        </section>
      )}

      {/* One row, never stacked: a long label wraps inside its button. */}
      <div className="flex flex-nowrap items-center gap-2 [&>*]:min-w-0">
        {previousStep(path, step) !== null && (
          <Button
            intent="back"
            emphasis="secondary"
            label={messages['questionnaire.back']}
            onClick={goBack}
          />
        )}
        <span className="ms-auto flex min-w-0 items-center gap-2">
          {submitting && <Spinner size="sm" />}
          {step.kind === 'summary' ? (
            <Button
              family="primary"
              icon={props.submitIcon ?? Check}
              emphasis="primary"
              label={props.submitLabel ?? messages['questionnaire.submit']}
              disabled={submitting}
              onClick={() => {
                submit()
              }}
            />
          ) : (
            <Button
              {...(submitsHere
                ? { family: 'primary' as const, icon: props.submitIcon ?? Check }
                : { intent: 'next' as const })}
              emphasis="primary"
              label={
                submitsHere
                  ? (props.submitLabel ?? messages['questionnaire.submit'])
                  : toEnd
                    ? messages['questionnaire.review']
                    : messages['questionnaire.next']
              }
              disabled={submitting}
              onClick={() => {
                goNext()
              }}
            />
          )}
        </span>
      </div>
    </QuestionnaireRoot>
  )
}
