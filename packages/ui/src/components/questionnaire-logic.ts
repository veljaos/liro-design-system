/*
 * The logic of Questionnaire (P5.1), kept apart from the markup so it can be unit-tested
 * (AGENTS.md C7): the path through branching questions, what counts as answered, the progress,
 * where Next and Back go, and which answers are submitted. The component decides nothing about the
 * content: questions, branches and validation come from the application.
 *
 * **Branching (declarative).** A question's `next` names the question after it; `null` ends the
 * questionnaire; left out, the next question in the list follows (the last one ends). A choice may
 * name its own `next`, which wins over the question's: for a single choice, the chosen option's;
 * for several choices, the first chosen option (in the options' order) that names one.
 *
 * **Answers on a branch no longer taken are kept but not submitted** (the rule): changing an answer
 * that changes the path keeps every other answer in the component's state, so going back to the
 * old branch brings them back; only the answers of the questions on the current path are
 * submitted (`answersOnPath`).
 */

/** The kinds of answer. */
export type QuestionType = 'single' | 'multiple' | 'date' | 'number' | 'amount' | 'text'

/** One option of a single or multiple choice. */
export interface QuestionOption {
  /** The value the application stores. */
  value: string
  /** What the user reads. From the application. */
  label: string
  /** A line under the label. */
  description?: string
  /** The question after this one when this option is chosen; null ends. Wins over the question's. */
  next?: string | null
  /** "Other": choosing it asks for the user's own text (required while it is chosen). */
  other?: boolean
  /** Shown, but cannot be chosen. */
  disabled?: boolean
}

/** One question, from the application. */
export interface QuestionDefinition {
  id: string
  /** The question itself ("What type of contract?"). */
  title: string
  /** A line under the question. */
  description?: string
  type: QuestionType
  /** The options of a single or multiple choice. */
  options?: readonly QuestionOption[]
  /** An answer is needed to go on. Default: true. */
  required?: boolean
  /** The question after this one; null ends; left out: the next in the list. */
  next?: string | null
  /** The amount's currency ('amount'). */
  currency?: string
  /** Decimals shown for a number or an amount (never rounded). */
  decimals?: number
  /** Shown while a typed answer is empty. Never the question repeated. */
  placeholder?: string
  /** The label of the "Other" text field ("Other position"); default: the option's label. */
  otherLabel?: string
  /** The field's label for typed answers, for assistive technology; default: the title. */
  fieldLabel?: string
  /** A short unit beside a number, as its own text ("days per week"). From the application. */
  unit?: string
}

/** The answer to one question. */
export interface QuestionAnswer {
  /**
   * single: the option's value; multiple: the options' values; date: YYYY-MM-DD; number and
   * amount: a decimal string; text: the text. null or missing: not answered.
   */
  value?: string | readonly string[] | null
  /** The user's own text for an "Other" option. */
  other?: string
}

export type QuestionAnswers = Readonly<Record<string, QuestionAnswer | undefined>>

/** Where the questionnaire stands: a question, or the final summary. */
export type QuestionnaireStep = { kind: 'question'; id: string } | { kind: 'summary' }

/** The value of a single choice, or null. */
export function singleValue(answer: QuestionAnswer | undefined): string | null {
  const value = answer?.value
  return typeof value === 'string' && value !== '' ? value : null
}

/** The values of a multiple choice (empty when none). */
export function multipleValues(answer: QuestionAnswer | undefined): readonly string[] {
  const value = answer?.value
  return Array.isArray(value) ? (value as readonly string[]) : []
}

/** The options chosen in an answer, in the options' order. */
export function chosenOptions(
  question: QuestionDefinition,
  answer: QuestionAnswer | undefined,
): QuestionOption[] {
  const options = question.options ?? []
  if (question.type === 'single') {
    const value = singleValue(answer)
    return options.filter((option) => option.value === value)
  }
  if (question.type === 'multiple') {
    const values = multipleValues(answer)
    return options.filter((option) => values.includes(option.value))
  }
  return []
}

/** Whether a question has an answer: a choice (with its "Other" text), a date, a number, text. */
export function isAnswered(question: QuestionDefinition, answer: QuestionAnswer | undefined) {
  if (question.type === 'single' || question.type === 'multiple') {
    const chosen = chosenOptions(question, answer)
    if (chosen.length === 0) return false
    const needsOther = chosen.some((option) => option.other === true)
    return !needsOther || (answer?.other ?? '').trim() !== ''
  }
  const value = answer?.value
  return typeof value === 'string' && value.trim() !== ''
}

/** Whether the question must be answered before going on. */
export function isRequired(question: QuestionDefinition): boolean {
  return question.required !== false
}

/**
 * The id of the question after `question` given its answer, or null at the end. A chosen option's
 * `next` wins; then the question's own; then the next question in the list.
 */
export function nextQuestionId(
  questions: readonly QuestionDefinition[],
  question: QuestionDefinition,
  answer: QuestionAnswer | undefined,
): string | null {
  for (const option of chosenOptions(question, answer)) {
    if (option.next !== undefined) return option.next
  }
  if (question.next !== undefined) return question.next
  const index = questions.findIndex((each) => each.id === question.id)
  return questions[index + 1]?.id ?? null
}

/**
 * The questions on the current path, in order, from the first question: each answered question
 * leads where its answer says, an unanswered one where its default leads. A question named twice
 * (a loop in the definitions) or an unknown id ends the path.
 */
export function questionPath(
  questions: readonly QuestionDefinition[],
  answers: QuestionAnswers,
): QuestionDefinition[] {
  const byId = new Map(questions.map((question) => [question.id, question]))
  const path: QuestionDefinition[] = []
  const seen = new Set<string>()
  let current = questions[0]
  while (current !== undefined && !seen.has(current.id)) {
    path.push(current)
    seen.add(current.id)
    const next = nextQuestionId(questions, current, answers[current.id])
    current = next === null ? undefined : byId.get(next)
  }
  return path
}

/** Answered questions on the path and the path's length: the progress ("3 of 9 answered"). */
export function questionProgress(
  path: readonly QuestionDefinition[],
  answers: QuestionAnswers,
): { answered: number; total: number } {
  return {
    answered: path.filter((question) => isAnswered(question, answers[question.id])).length,
    total: path.length,
  }
}

/** Only the answers of the questions on the path: what is submitted. */
export function answersOnPath(
  path: readonly QuestionDefinition[],
  answers: QuestionAnswers,
): Record<string, QuestionAnswer> {
  const result: Record<string, QuestionAnswer> = {}
  for (const question of path) {
    const answer = answers[question.id]
    if (answer === undefined || !isAnswered(question, answer)) continue
    const other = chosenOptions(question, answer).some((option) => option.other === true)
    result[question.id] = other
      ? { value: answer.value ?? null, other: (answer.other ?? '').trim() }
      : { value: answer.value ?? null }
  }
  return result
}

/**
 * Where Next goes from a question. Normally the next question on the path, or the summary after
 * the last (or the end, without a summary: null). After "Change" from the summary (`fromSummary`)
 * it goes back to the summary, unless the change opened questions on the path that have no answer
 * yet: then the first of those is asked first.
 */
export function nextStep(
  path: readonly QuestionDefinition[],
  answers: QuestionAnswers,
  currentId: string,
  fromSummary: boolean,
): QuestionnaireStep {
  const index = path.findIndex((question) => question.id === currentId)
  const rest = index < 0 ? [] : path.slice(index + 1)
  if (fromSummary) {
    const open = rest.find(
      (question) => isRequired(question) && !isAnswered(question, answers[question.id]),
    )
    return open === undefined ? { kind: 'summary' } : { kind: 'question', id: open.id }
  }
  const next = rest[0]
  return next === undefined ? { kind: 'summary' } : { kind: 'question', id: next.id }
}

/** Where Back goes: the previous question on the path; from the summary, the last question. */
export function previousStep(
  path: readonly QuestionDefinition[],
  step: QuestionnaireStep,
): QuestionnaireStep | null {
  if (step.kind === 'summary') {
    const last = path[path.length - 1]
    return last === undefined ? null : { kind: 'question', id: last.id }
  }
  const index = path.findIndex((question) => question.id === step.id)
  const previous = index > 0 ? path[index - 1] : undefined
  return previous === undefined ? null : { kind: 'question', id: previous.id }
}

/** The answer after choosing (single) or toggling (multiple) an option. */
export function chooseOption(
  question: QuestionDefinition,
  answer: QuestionAnswer | undefined,
  value: string,
  checked: boolean,
): QuestionAnswer {
  if (question.type === 'multiple') {
    const values = multipleValues(answer).filter((each) => each !== value)
    const order = (question.options ?? []).map((option) => option.value)
    const next = checked ? [...values, value] : values
    next.sort((a, b) => order.indexOf(a) - order.indexOf(b))
    return { ...answer, value: next }
  }
  return { ...answer, value: checked ? value : null }
}
