import { BookCheck, CircleAlert, CircleCheck, Clock, Search } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import {
  Alert,
  BalanceBar,
  Button,
  CandidateList,
  ChangeableValue,
  ComboboxField,
  ConfirmDialog,
  DataTable,
  DateText,
  Dialog,
  DocumentFrame,
  EditableGrid,
  FormGrid,
  KeyFigures,
  KeyValueList,
  LookupDialog,
  MoneyText,
  ProgressBar,
  RadioGroupField,
  SelectField,
  StatusBadge,
  TextField,
  Toaster,
  UnavailableAction,
  WorklistPage,
  notice,
  useLiro,
  type Candidate,
  type DataTableColumn,
  type EditableGridColumn,
  type ModuleTab,
  type WorklistItem,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Shell } from './example-shell'
import {
  ACCOUNTS,
  accountOf,
  BANK_LINES,
  CANDIDATES,
  closeOutcome,
  COST_CENTRES,
  decimal,
  entryBalance,
  entryLines,
  OPEN_ITEMS,
  openItem,
  PAYMENT_CODES,
  QUICK_TYPES,
  quickTypesFor,
  splitBalance,
  STATEMENT,
  STATEMENT_TOTALS,
  STATEMENT_VIEWER,
  SUGGESTIONS,
  WRITE_OFF_LIMIT,
  type BankLine,
  type Decision,
  type DifferenceChoice,
  type EntryLine,
  type OpenItem,
  type QuickType,
  type SplitPart,
} from './data-bank'

/*
 * Bank statement 188, worked line by line (P5.23, the owner's review): the statement is the
 * page — its balances, whether they check out, its file, its state and progress — and its lines
 * are a WorklistPage, the same "decide items one by one" as the supplier invoices to approve:
 * the lines at the side, one line in focus with everything the bank sent and "What is this
 * payment?" preselected by the Core's best suggestion, Previous / Next and "Confirm and next";
 * a toast with Undo after each decision. "Post statement" opens a confirmation with the summary
 * and the journal entry's preview once no line is left. The screen plays the application: it
 * keeps every line's draft and computes in whole paras (data-bank.ts); the components show.
 */

const STATEMENT_PATH = `/banking/statements/${STATEMENT.number}`

export const BANK_ROUTES = {
  statement: STATEMENT_PATH,
  /** Line 3 in focus: a partial payment. */
  partial: `${STATEMENT_PATH}?line=3`,
  /** Line 7 in focus: 0,40 RSD less than the invoice. */
  difference: `${STATEMENT_PATH}?line=7`,
  /** Every line decided: the statement can be posted. */
  decided: `${STATEMENT_PATH}?stage=decided`,
}

const BANKING_TABS: ModuleTab[] = [
  { key: 'statements', label: 'Statements', href: '#/banking/statements', current: true },
  { key: 'payments', label: 'Payments', href: '#/banking/payments' },
  { key: 'accounts', label: 'Bank accounts', href: '#/banking/accounts' },
]

// ── A line's work: what the user has chosen so far ─────────────────────────────────────────────

type Kind = 'close' | 'account' | 'split'

interface AccountDraft {
  type: QuickType
  account: string | null
  text: string
  costCentre: string
}

interface LineWork {
  kind: Kind | null
  close: { items: string[]; difference: DifferenceChoice }
  account: AccountDraft
  split: SplitPart[]
  /** Open items added from "Search all open items…". */
  extra: string[]
  done: boolean
  later: boolean
}

function size(line: BankLine): bigint {
  return line.paras < 0n ? -line.paras : line.paras
}

/** A line's work as the Core proposes it: the suggestion preselected, the other kinds ready. */
function startWork(line: BankLine): LineWork {
  const suggestion = SUGGESTIONS[line.id]?.decision
  return {
    kind: suggestion?.kind ?? null,
    close:
      suggestion?.kind === 'close'
        ? { items: suggestion.items, difference: suggestion.difference }
        : { items: [], difference: 'open' },
    account:
      suggestion?.kind === 'account'
        ? suggestion
        : { type: 'other', account: null, text: line.purpose, costCentre: '' },
    split:
      suggestion?.kind === 'split'
        ? suggestion.parts
        : [
            {
              id: 'p1',
              account: null,
              text: line.purpose,
              costCentre: '',
              amount: decimal(size(line)),
            },
          ],
    extra: [],
    done: false,
    later: false,
  }
}

/** The difference choice that applies to a rest: an underpayment stays open or is written off. */
function differenceFor(rest: bigint, chosen: DifferenceChoice): DifferenceChoice {
  if (rest < 0n) return chosen === 'advance' ? 'open' : chosen
  return chosen === 'open' ? 'advance' : chosen
}

function decisionOf(work: LineWork, line: BankLine): Decision | null {
  if (work.kind === 'close') {
    const rest = closeOutcome(line.paras, work.close.items).rest
    return {
      kind: 'close',
      items: work.close.items,
      difference: differenceFor(rest, work.close.difference),
    }
  }
  if (work.kind === 'account') return { kind: 'account', ...work.account }
  if (work.kind === 'split') return { kind: 'split', parts: work.split }
  return null
}

const START_DONE = ['b1', 'b2']
const START_LATER = ['b10']

function startAll(stage: 'start' | 'decided'): Record<string, LineWork> {
  return Object.fromEntries(
    BANK_LINES.map((line) => {
      const work = startWork(line)
      if (stage === 'decided') {
        // Every line decided: the suggestions confirmed, the advance and the unknown payment too.
        if (line.id === 'b9') {
          work.kind = 'account'
          work.account = {
            type: 'advanceReceived',
            account: '4300',
            text: 'Advance for offer P-2026-118',
            costCentre: '',
          }
        }
        if (line.id === 'b10') {
          work.kind = 'account'
          work.account = {
            type: 'advanceReceived',
            account: '4300',
            text: 'Petar Jovanović, deposit for an apartment viewing',
            costCentre: '',
          }
        }
        work.done = true
      } else {
        work.done = START_DONE.includes(line.id)
        work.later = START_LATER.includes(line.id)
      }
      return [line.id, work]
    }),
  )
}

type LineState = 'done' | 'later' | 'suggestion' | 'todo'

function stateOf(line: BankLine, work: LineWork): LineState {
  if (work.done) return 'done'
  if (work.later) return 'later'
  return line.id in SUGGESTIONS ? 'suggestion' : 'todo'
}

/** The line states in words; the tone only repeats them (To do needs a decision, Done is done). */
const STATE_BADGE: Record<
  LineState,
  { label: string; tone: 'success' | 'neutral' | 'info' | 'warning' }
> = {
  done: { label: 'Done', tone: 'success' },
  later: { label: 'Left for later', tone: 'neutral' },
  suggestion: { label: 'Suggestion ready', tone: 'info' },
  todo: { label: 'To do', tone: 'warning' },
}

function quickLabel(type: QuickType): string {
  return QUICK_TYPES.find((each) => each.value === type)?.label ?? ''
}

function accountLabel(value: string | null): string {
  return value === null ? '' : (accountOf(value)?.label ?? value)
}

/** Writes the amounts of a screen: whole paras through the provider's format, with RSD. */
function useMoney() {
  const { format } = useLiro()
  return (paras: bigint) => format.money(decimal(paras), 'RSD')
}

/** How a decided line was decided, in a few words ("Closes F-2026-0412"). */
function howText(line: BankLine, decision: Decision, money: (paras: bigint) => string): string {
  if (decision.kind === 'close') {
    const { rest } = closeOutcome(line.paras, decision.items)
    const items = decision.items.join(', ')
    if (rest === 0n) return `Closes ${items}`
    if (rest < 0n) {
      return decision.difference === 'writeOff'
        ? `Closes ${items}, ${money(-rest)} written off`
        : `Pays part of ${items}`
    }
    return decision.difference === 'writeOff'
      ? `Closes ${items}, ${money(rest)} written off`
      : `Closes ${items}, ${money(rest)} as an advance`
  }
  if (decision.kind === 'account') {
    return `${quickLabel(decision.type)}: ${accountLabel(decision.account)}`
  }
  return `Split over ${String(decision.parts.length)} accounts`
}

/** What closing the chosen items does, one sentence per item and for the rest. */
function outcomeLines(
  line: BankLine,
  items: readonly string[],
  difference: DifferenceChoice,
  money: (paras: bigint) => string,
): string[] {
  const outcome = closeOutcome(line.paras, items)
  const choice = differenceFor(outcome.rest, difference)
  const sentences = outcome.paid.map((each, index) => {
    if (each.open < 0n) return `Uses credit note ${each.id} (${money(-each.open)}).`
    const last = index === outcome.paid.length - 1
    if (each.paras === each.open) return `Closes ${each.id} in full.`
    if (last && outcome.rest < 0n && choice === 'writeOff') {
      return `Closes ${each.id}; ${money(-outcome.rest)} is written off.`
    }
    if (each.paras === 0n) return `Nothing is left for ${each.id}; ${money(each.open)} stays open.`
    return `Pays ${money(each.paras)} of ${each.id}; ${money(each.open - each.paras)} stays open.`
  })
  if (outcome.rest > 0n) {
    sentences.push(
      choice === 'writeOff'
        ? `${money(outcome.rest)} more than the items is written off.`
        : `${money(outcome.rest)} more than the items is recorded as an advance ${line.paras > 0n ? 'from' : 'to'} ${line.party}.`,
    )
  }
  return sentences
}

/** Why "Confirm and next" cannot be used yet, or null. */
function problemOf(line: BankLine, work: LineWork, money: (paras: bigint) => string) {
  if (work.kind === null) return 'Choose what this payment is.'
  if (work.kind === 'close' && work.close.items.length === 0) {
    return 'Choose at least one open item.'
  }
  if (work.kind === 'account' && work.account.account === null) return 'Choose an account.'
  if (work.kind === 'split') {
    const balance = splitBalance(line.paras, work.split)
    if (balance.state === 'incomplete') return 'Every part needs an account and an amount.'
    if (balance.state === 'unbalanced') {
      return `The parts must add up to ${money(size(line))}.`
    }
  }
  return null
}

// ── The line in focus ──────────────────────────────────────────────────────────────────────────

const SPLIT_COLUMNS: EditableGridColumn<SplitPart>[] = [
  {
    id: 'account',
    header: 'Account',
    type: 'combobox',
    width: 240,
    value: (part) => part.account,
    options: ACCOUNTS,
  },
  { id: 'text', header: 'Description', type: 'text', value: (part) => part.text },
  {
    id: 'costCentre',
    header: 'Cost centre',
    type: 'select',
    width: 170,
    value: (part) => part.costCentre,
    options: COST_CENTRES,
  },
  {
    id: 'amount',
    header: 'Amount',
    type: 'number',
    width: 140,
    decimals: 2,
    value: (part) => part.amount,
  },
]

function candidateOf(item: OpenItem, reason: ReactNode): Candidate {
  return {
    id: item.id,
    title: <span dir="ltr">{item.id}</span>,
    label: `${item.id}, ${item.partner}`,
    subtitle: (
      <>
        {item.kind} · {item.partner} · due <DateText value={item.due} />
      </>
    ),
    reason,
    figure: <MoneyText value={decimal(item.paras)} currency="RSD" />,
  }
}

function LineDetail({
  line,
  work,
  phone,
  onChange,
  onSearchAll,
}: {
  line: BankLine
  work: LineWork
  phone: boolean
  onChange: (patch: Partial<LineWork>) => void
  onSearchAll: () => void
}) {
  const { format } = useLiro()
  const money = useMoney()
  const incoming = line.paras > 0n
  const state = stateOf(line, work)
  const decision = decisionOf(work, line)
  const suggestion = SUGGESTIONS[line.id]

  const ranked = (CANDIDATES[line.id] ?? []).flatMap((each) => {
    const item = openItem(each.id)
    if (item === undefined) return []
    const reason =
      'text' in each.reason
        ? each.reason.text
        : `Same ${each.reason.partner}, amount differs by ${money(each.reason.differsBy)}`
    return [candidateOf(item, reason)]
  })
  const added = work.extra.flatMap((id) => {
    const item = openItem(id)
    return item === undefined || ranked.some((each) => each.id === id)
      ? []
      : [candidateOf(item, 'Chosen from all open items')]
  })
  const candidates = [...ranked, ...added]
  const outcome = closeOutcome(line.paras, work.close.items)
  const difference = differenceFor(outcome.rest, work.close.difference)
  const rest = outcome.rest < 0n ? -outcome.rest : outcome.rest
  const lastItem = work.close.items.at(-1) ?? ''
  const writeOffAccount = accountLabel(outcome.rest < 0n === incoming ? '5790' : '6790')
  const split = splitBalance(line.paras, work.split)
  const types = quickTypesFor(line.paras)

  const changeAccount = (patch: Partial<AccountDraft>) => {
    onChange({ account: { ...work.account, ...patch } })
  }

  const accountField = (
    <ComboboxField
      label="Account"
      options={ACCOUNTS}
      value={work.account.account === null ? null : accountOf(work.account.account)}
      onChange={(option) => {
        changeAccount({ account: option?.value ?? null })
      }}
    />
  )

  return (
    <div className={phone ? 'flex flex-col gap-6' : 'flex flex-col gap-6 p-6'}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="bidi-content m-0 text-h2 text-primary">{line.party}</h2>
          <p className="m-0 text-sm text-secondary">
            Line {format.number(String(line.no))} of statement {STATEMENT.number}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-secondary">{incoming ? 'Money in' : 'Money out'}</span>
          <bdi className="text-xl font-semibold whitespace-nowrap text-primary tabular-nums">
            {format.money(decimal(line.paras), 'RSD', { sign: 'always' })}
          </bdi>
          <StatusBadge label={STATE_BADGE[state].label} tone={STATE_BADGE[state].tone} />
        </div>
      </div>

      {work.done && decision !== null && (
        <Alert tone="success" title="Done">
          {howText(line, decision, money)}. It can be changed until the statement is posted.
        </Alert>
      )}
      {work.later && (
        <Alert icon={Clock} title="Left for later">
          The statement cannot be posted until this line is decided.
        </Alert>
      )}

      <section aria-label="From the bank" className="flex flex-col gap-2">
        <h3 className="m-0 text-h4 text-primary">From the bank</h3>
        <KeyValueList
          items={[
            // The counterparty's name and the amount stand in the heading above.
            {
              label: 'Counterparty account',
              value: <span dir="ltr">{line.partyAccount}</span>,
              numeric: true,
            },
            { label: 'Value date', value: <DateText value={line.valueDate} />, numeric: true },
            {
              label: 'Payment code',
              value: `${line.code} ${PAYMENT_CODES[line.code] ?? ''}`,
            },
            {
              label: 'Model and reference number',
              value:
                line.model === '' && line.reference === '' ? (
                  '—'
                ) : (
                  <span dir="ltr">{`${line.model} ${line.reference}`.trim()}</span>
                ),
              numeric: true,
            },
            { label: 'Purpose', value: line.purpose, fullWidth: true },
          ]}
        />
      </section>

      {work.done && decision?.kind === 'close' && (
        <ul aria-label="Result" className="m-0 flex list-none flex-col gap-1 p-0 text-sm">
          {outcomeLines(line, decision.items, decision.difference, money).map((text) => (
            <li key={text} className="bidi-content text-primary">
              {text}
            </li>
          ))}
        </ul>
      )}

      {!work.done && (
        <section aria-label="What is this payment?" className="flex flex-col gap-4">
          <RadioGroupField
            label="What is this payment?"
            {...(suggestion === undefined
              ? {}
              : { description: `Suggested: ${suggestion.reason}` })}
            options={[
              {
                value: 'close',
                label: 'Close open items',
                description: incoming
                  ? 'Invoices and credit notes of customers'
                  : 'Supplier invoices and credit notes',
              },
              {
                value: 'account',
                label: 'Post to an account',
                description: incoming
                  ? 'An advance, a transfer or any other account'
                  : 'A bank fee, salaries, taxes, a transfer, an advance or any other account',
              },
              {
                value: 'split',
                label: 'Split over several accounts',
                description: 'Parts that add up to the line’s amount',
              },
            ]}
            value={work.kind ?? ''}
            onChange={(value) => {
              onChange({ kind: value as Kind })
            }}
          />

          {work.kind === 'close' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <h3 className="m-0 text-h4 text-primary">Open items</h3>
                <CandidateList
                  label="Open items"
                  candidates={candidates}
                  selected={work.close.items}
                  onSelectedChange={(items) => {
                    onChange({ close: { ...work.close, items } })
                  }}
                  empty={
                    <p className="m-0 border-0 border-y border-solid border-subtle py-3 text-sm text-secondary">
                      No open item matches this payment.
                    </p>
                  }
                />
                <div>
                  <Button
                    family="neutral"
                    icon={Search}
                    label="Search all open items…"
                    onClick={onSearchAll}
                  />
                </div>
              </div>
              {work.close.items.length > 0 && (
                <div className="flex flex-col gap-1">
                  <h3 className="m-0 text-h4 text-primary">Result</h3>
                  {/* Announced politely as the choice changes. */}
                  <div role="status">
                    <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm">
                      {outcomeLines(line, work.close.items, work.close.difference, money).map(
                        (text) => (
                          <li key={text} className="bidi-content text-primary">
                            {text}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                </div>
              )}
              {work.close.items.length > 0 && outcome.rest !== 0n && (
                <RadioGroupField
                  label={`The difference of ${money(rest)}`}
                  options={
                    outcome.rest < 0n
                      ? [
                          { value: 'open', label: `Leave it open on ${lastItem}` },
                          {
                            value: 'writeOff',
                            label: `Write it off to ${writeOffAccount}`,
                            disabled: rest > WRITE_OFF_LIMIT,
                            description: `Only a difference up to ${money(WRITE_OFF_LIMIT)}.`,
                          },
                        ]
                      : [
                          {
                            value: 'advance',
                            label: `Record it as an advance ${incoming ? 'from' : 'to'} ${line.party}`,
                          },
                          {
                            value: 'writeOff',
                            label: `Write it off to ${writeOffAccount}`,
                            disabled: rest > WRITE_OFF_LIMIT,
                            description: `Only a difference up to ${money(WRITE_OFF_LIMIT)}.`,
                          },
                        ]
                  }
                  value={difference}
                  onChange={(value) => {
                    onChange({ close: { ...work.close, difference: value as DifferenceChoice } })
                  }}
                />
              )}
            </div>
          )}

          {work.kind === 'account' && (
            <FormGrid>
              <SelectField
                label="Type"
                options={types.map((each) => ({ value: each.value, label: each.label }))}
                value={work.account.type}
                onChange={(value) => {
                  const type = QUICK_TYPES.find((each) => each.value === value)
                  if (type !== undefined) {
                    changeAccount({ type: type.value, account: type.account })
                  }
                }}
              />
              {work.account.account === null ? (
                accountField
              ) : (
                <ChangeableValue
                  label="Account"
                  value={accountLabel(work.account.account)}
                  field={accountField}
                />
              )}
              <ChangeableValue
                label="Description"
                value={work.account.text}
                field={
                  <TextField
                    label="Description"
                    value={work.account.text}
                    onChange={(text) => {
                      changeAccount({ text })
                    }}
                  />
                }
              />
              <SelectField
                label="Cost centre"
                options={COST_CENTRES}
                value={work.account.costCentre}
                clearable
                placeholder="None"
                onChange={(costCentre) => {
                  changeAccount({ costCentre })
                }}
              />
            </FormGrid>
          )}

          {work.kind === 'split' && (
            <EditableGrid
              label={`Parts of line ${String(line.no)}`}
              layout={phone ? 'phone' : 'desktop'}
              columns={SPLIT_COLUMNS}
              rows={work.split}
              getRowId={(part) => part.id}
              onCellChange={(rowId, columnId, value) => {
                onChange({
                  split: work.split.map((part) =>
                    part.id === rowId ? { ...part, [columnId]: value as never } : part,
                  ),
                })
              }}
              onAddRow={(index) => {
                onChange({
                  split: [
                    ...work.split.slice(0, index),
                    {
                      id: `p${String(work.split.length + 1)}-${String(index)}`,
                      account: null,
                      text: line.purpose,
                      costCentre: '',
                      amount: null,
                    },
                    ...work.split.slice(index),
                  ],
                })
              }}
              onRemoveRow={(rowId) => {
                onChange({ split: work.split.filter((part) => part.id !== rowId) })
              }}
              minRows={1}
              footer={
                <BalanceBar
                  debit={split.debit}
                  credit={split.credit}
                  difference={split.difference}
                  state={split.state}
                  currency="RSD"
                  layout={phone ? 'stacked' : 'row'}
                />
              }
            />
          )}
        </section>
      )}
    </div>
  )
}

// ── The statement's summary ────────────────────────────────────────────────────────────────────

function StatementSummary({ phone, done }: { phone: boolean; done: number }) {
  const { format } = useLiro()
  const total = BANK_LINES.length
  const progress = `${format.number(String(done))} of ${format.number(String(total))} lines done`
  return (
    <div
      data-slot="statement-summary"
      className={
        phone ? 'flex flex-col gap-4' : 'flex flex-wrap items-end justify-between gap-x-8 gap-y-4'
      }
    >
      <KeyFigures
        layout={phone ? 'phone' : 'desktop'}
        items={[
          {
            key: 'opening',
            label: 'Opening balance',
            value: <MoneyText value={STATEMENT_TOTALS.opening} currency="RSD" />,
          },
          {
            key: 'in',
            label: 'Money in',
            value: <MoneyText value={STATEMENT_TOTALS.incoming} currency="RSD" />,
          },
          {
            key: 'out',
            label: 'Money out',
            value: <MoneyText value={STATEMENT_TOTALS.outgoing} currency="RSD" />,
          },
          {
            key: 'closing',
            label: 'Closing balance',
            value: <MoneyText value={STATEMENT_TOTALS.closing} currency="RSD" />,
          },
        ]}
      />
      <div className="flex min-w-60 flex-col gap-2">
        <span className="text-sm font-medium text-primary">{progress}</span>
        <ProgressBar label={progress} value={done} max={total} />
        {STATEMENT_TOTALS.checksOut ? (
          <p className="m-0 flex items-center gap-1.5 text-xs font-medium text-status-success-fg">
            <CircleCheck aria-hidden="true" className="size-3.5 shrink-0" />
            Balance checks out: opening + in − out = closing
          </p>
        ) : (
          <p className="m-0 flex items-center gap-1.5 text-xs font-medium text-status-danger-fg">
            <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
            Balance does not check out: opening + in − out differs from closing
          </p>
        )}
      </div>
    </div>
  )
}

// ── Posting ────────────────────────────────────────────────────────────────────────────────────

const ENTRY_COLUMNS: DataTableColumn<EntryLine>[] = [
  { id: 'account', header: 'Account', cell: (entry) => accountLabel(entry.account) },
  { id: 'text', header: 'Description', cell: (entry) => entry.text },
  {
    id: 'debit',
    header: 'Debit',
    align: 'end',
    numeric: true,
    cell: (entry) => <MoneyText value={entry.debit} currency="RSD" />,
  },
  {
    id: 'credit',
    header: 'Credit',
    align: 'end',
    numeric: true,
    cell: (entry) => <MoneyText value={entry.credit} currency="RSD" />,
  },
]

function PostPreview({ work, phone }: { work: Record<string, LineWork>; phone: boolean }) {
  const { format } = useLiro()
  const decided = BANK_LINES.flatMap((line) => {
    const lineWork = work[line.id]
    const decision = lineWork === undefined ? null : decisionOf(lineWork, line)
    return decision === null ? [] : [{ line, decision }]
  })
  const closing = decided.filter((each) => each.decision.kind === 'close')
  const items = closing.reduce(
    (total, each) => total + (each.decision.kind === 'close' ? each.decision.items.length : 0),
    0,
  )
  const entries = decided.flatMap((each) => entryLines(each.line, each.decision))
  const balance = entryBalance(entries)
  const count = (value: number) => format.number(String(value))
  return (
    <>
      <KeyValueList
        columns={1}
        items={[
          {
            label: 'Close open items',
            value: `${count(closing.length)} lines, ${count(items)} items`,
          },
          {
            label: 'Posted to accounts',
            value: `${count(decided.length - closing.length)} lines`,
          },
          {
            label: 'Money in',
            value: <MoneyText value={STATEMENT_TOTALS.incoming} currency="RSD" />,
            numeric: true,
          },
          {
            label: 'Money out',
            value: <MoneyText value={STATEMENT_TOTALS.outgoing} currency="RSD" />,
            numeric: true,
          },
        ]}
      />
      <section aria-label="Journal entry" className="flex flex-col gap-2">
        <h3 className="m-0 text-h4 text-primary">Journal entry</h3>
        <DataTable
          label="Journal entry"
          layout={phone ? 'cards' : 'table'}
          columns={ENTRY_COLUMNS}
          rows={entries}
          getRowId={(entry) => entry.id}
          getRowLabel={(entry) => `${entry.account} ${entry.text}`}
          maxHeight="18rem"
          mobile={{ subtitle: (entry) => entry.text, details: ['debit', 'credit'] }}
        />
        <BalanceBar
          debit={balance.debit}
          credit={balance.credit}
          difference={balance.difference}
          state={balance.state}
          currency="RSD"
          layout={phone ? 'stacked' : 'row'}
        />
      </section>
    </>
  )
}

// ── All open items ("Search all open items…") ──────────────────────────────────────────────────

const OPEN_ITEM_COLUMNS: DataTableColumn<OpenItem>[] = [
  { id: 'number', header: 'Number', cell: (item) => <span dir="ltr">{item.id}</span> },
  { id: 'kind', header: 'Kind', cell: (item) => item.kind },
  { id: 'partner', header: 'Partner', cell: (item) => item.partner },
  { id: 'due', header: 'Due', numeric: true, cell: (item) => <DateText value={item.due} /> },
  {
    id: 'open',
    header: 'Open amount',
    align: 'end',
    numeric: true,
    cell: (item) => <MoneyText value={decimal(item.paras)} currency="RSD" />,
  },
]

// ── The screen ─────────────────────────────────────────────────────────────────────────────────

export function BankStatement({
  phone,
  line: startLine,
  stage = 'start',
}: {
  phone: boolean
  /** The line in focus when the screen opens (its number). */
  line?: number
  stage?: 'start' | 'decided'
}) {
  const { format } = useLiro()
  const money = useMoney()
  const [work, setWork] = useState(() => startAll(stage))
  const [posted, setPosted] = useState(false)
  const first = startLine === undefined ? undefined : `b${String(startLine)}`
  const [selected, setSelected] = useState<string | undefined>(first ?? (phone ? undefined : 'b3'))
  const [posting, setPosting] = useState(false)
  const [viewing, setViewing] = useState(false)
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')

  const index = BANK_LINES.findIndex((each) => each.id === selected)
  const line = BANK_LINES[index]
  const lineWork = line === undefined ? undefined : work[line.id]
  const change = (id: string, patch: Partial<LineWork>) => {
    setWork((current) => {
      const before = current[id]
      return before === undefined ? current : { ...current, [id]: { ...before, ...patch } }
    })
  }
  const move = (step: number) => {
    const next = BANK_LINES[(index + step + BANK_LINES.length) % BANK_LINES.length]
    if (next !== undefined) setSelected(next.id)
  }

  const states = BANK_LINES.map((each) => {
    const eachWork = work[each.id]
    return eachWork === undefined ? 'todo' : stateOf(each, eachWork)
  })
  const done = states.filter((state) => state === 'done').length
  const later = states.filter((state) => state === 'later').length
  const open = BANK_LINES.length - done - later
  const lines = (count: number) =>
    `${format.number(String(count))} ${count === 1 ? 'line' : 'lines'}`
  const postReason = posted
    ? 'The statement is posted.'
    : open > 0 && later > 0
      ? `${lines(open)} still ${open === 1 ? 'needs' : 'need'} a decision, and ${lines(later)} ${later === 1 ? 'is' : 'are'} left for later.`
      : open > 0
        ? `${lines(open)} still ${open === 1 ? 'needs' : 'need'} a decision.`
        : later > 0
          ? `${lines(later)} ${later === 1 ? 'is' : 'are'} left for later. Decide ${later === 1 ? 'it' : 'them'} before posting.`
          : undefined
  // "Post statement" is the main action only once every line is done; until then the line's
  // "Confirm and next" is (one primary button per screen, D13).
  const post =
    postReason === undefined ? (
      <Button
        family="primary"
        icon={BookCheck}
        emphasis="primary"
        label="Post statement"
        onClick={() => {
          setPosting(true)
        }}
      />
    ) : (
      <UnavailableAction
        family="primary"
        icon={BookCheck}
        emphasis="secondary"
        label="Post statement"
        reason={postReason}
      />
    )
  const statusBadge = posted ? (
    <StatusBadge label="Posted" tone="success" />
  ) : done === 0 ? (
    <StatusBadge label="Imported" tone="neutral" />
  ) : (
    <StatusBadge label="In progress" tone="info" />
  )

  const confirm = () => {
    if (line === undefined || lineWork === undefined) return
    const decision = decisionOf(lineWork, line)
    if (decision === null) return
    const id = line.id
    change(id, { done: true, later: false })
    // On to the next line that still needs a decision, at the same place in the list.
    const after = [...BANK_LINES.slice(index + 1), ...BANK_LINES.slice(0, index)].find(
      (each) => each.id !== id && work[each.id]?.done !== true,
    )
    if (after !== undefined) setSelected(after.id)
    notice.success(
      `Line ${format.number(String(line.no))} done: ${howText(line, decision, money)}.`,
      {
        // Until the statement is posted every decision can be taken back.
        action: {
          label: 'Undo',
          onClick: () => {
            change(id, { done: false })
            setSelected(id)
          },
        },
      },
    )
  }
  const leaveForLater = () => {
    if (line === undefined) return
    const id = line.id
    change(id, { later: true })
    move(1)
    notice.info(`Line ${format.number(String(line.no))} is left for later.`, {
      action: {
        label: 'Undo',
        onClick: () => {
          change(id, { later: false })
          setSelected(id)
        },
      },
    })
  }

  const problem =
    line === undefined || lineWork === undefined ? null : problemOf(line, lineWork, money)
  const decisions =
    line === undefined || lineWork === undefined || posted ? undefined : lineWork.done ? (
      <Button
        intent="edit"
        label="Change"
        onClick={() => {
          change(line.id, { done: false })
        }}
      />
    ) : (
      <>
        {!lineWork.later && (
          <Button family="neutral" icon={Clock} label="Leave for later" onClick={leaveForLater} />
        )}
        {problem === null ? (
          <Button
            family="primary"
            icon={CircleCheck}
            emphasis="primary"
            label="Confirm and next"
            onClick={confirm}
          />
        ) : (
          <UnavailableAction
            family="primary"
            icon={CircleCheck}
            emphasis="primary"
            label="Confirm and next"
            reason={problem}
          />
        )}
      </>
    )

  const items: WorklistItem[] = BANK_LINES.map((each, at) => {
    const eachWork = work[each.id]
    const state = states[at] ?? 'todo'
    const decision = eachWork === undefined ? null : decisionOf(eachWork, each)
    return {
      id: each.id,
      label: `Line ${String(each.no)}, ${each.party}`,
      title: each.party,
      subtitle: (
        <>
          <span className="block">
            {format.number(String(each.no))} ·{' '}
            {each.reference === '' ? each.purpose : each.reference}
          </span>
          {state === 'done' && decision !== null && (
            <span className="block">{howText(each, decision, money)}</span>
          )}
        </>
      ),
      figure: <bdi>{format.money(decimal(each.paras), 'RSD', { sign: 'always' })}</bdi>,
      status: <StatusBadge label={STATE_BADGE[state].label} tone={STATE_BADGE[state].tone} />,
    }
  })

  const side = line === undefined || line.paras > 0n ? 'customer' : 'supplier'
  const found = OPEN_ITEMS.filter(
    (item) =>
      item.side === side &&
      `${item.id} ${item.partner}`.toLowerCase().includes(query.trim().toLowerCase()),
  )

  return (
    <Shell
      phone={phone}
      crumbs={[
        { label: 'Statements', href: '#/banking/statements' },
        { label: `Statement ${STATEMENT.number}` },
      ]}
      tabs={BANKING_TABS}
      // On a phone the line's decisions, or the posting on the list, stand in the bottom bar.
      {...(phone
        ? {
            bottomBar:
              line !== undefined && decisions !== undefined ? (
                <div className="flex gap-2 [&>*]:flex-1">{decisions}</div>
              ) : line === undefined ? (
                post
              ) : undefined,
          }
        : {})}
    >
      <WorklistPage
        layout={phone ? 'stacked' : 'split'}
        title={`Statement ${STATEMENT.number}`}
        back={{ href: '#/banking/statements', label: 'Statements' }}
        status={statusBadge}
        subtitle={
          <>
            {STATEMENT.bank} · <span dir="ltr">{STATEMENT.account}</span> · Statement date{' '}
            <DateText value={STATEMENT.date} />
          </>
        }
        actions={
          <>
            <Button
              intent="preview"
              label="Bank’s file"
              onClick={() => {
                setViewing(true)
              }}
            />
            {phone ? null : post}
          </>
        }
        summary={<StatementSummary phone={phone} done={done} />}
        label={`Lines of statement ${STATEMENT.number}`}
        items={items}
        {...(selected === undefined ? {} : { selected })}
        onSelect={setSelected}
        {...(line === undefined || lineWork === undefined
          ? {}
          : {
              detail: (
                <LineDetail
                  key={line.id}
                  line={line}
                  work={lineWork}
                  phone={phone}
                  onChange={(patch) => {
                    change(line.id, patch)
                  }}
                  onSearchAll={() => {
                    setQuery('')
                    setSearching(true)
                  }}
                />
              ),
            })}
        {...(decisions === undefined || phone ? {} : { detailActions: decisions })}
        onBack={() => {
          setSelected(undefined)
        }}
        onPrevious={() => {
          move(-1)
        }}
        onNext={() => {
          move(1)
        }}
      />
      <ConfirmDialog
        open={posting}
        onOpenChange={setPosting}
        family="primary"
        actionIcon={BookCheck}
        tone="info"
        icon={BookCheck}
        size="wide"
        title={`Post statement ${STATEMENT.number}?`}
        message="The journal entry below is posted and the open items are closed. A posted statement can only be corrected by a reversal."
        preview={<PostPreview work={work} phone={phone} />}
        confirmLabel="Post statement"
        onConfirm={() => {
          setPosted(true)
          notice.success(`Statement ${STATEMENT.number} posted.`)
        }}
      />
      <Dialog
        open={viewing}
        onOpenChange={setViewing}
        size="wide"
        title={STATEMENT.file}
        description={STATEMENT.imported}
      >
        <DocumentFrame
          title={`Statement ${STATEMENT.number}, ${STATEMENT.bank}`}
          srcDoc={STATEMENT_VIEWER}
          allowedOrigin="null"
          className="h-[60dvh]"
        />
      </Dialog>
      <LookupDialog
        open={searching}
        onOpenChange={setSearching}
        title="Open items"
        {...(line === undefined
          ? {}
          : {
              description: `${line.paras > 0n ? 'Customer' : 'Supplier'} items that line ${String(line.no)} may close`,
            })}
        onSearch={setQuery}
        searchPlaceholder="Number or partner"
        columns={OPEN_ITEM_COLUMNS}
        rows={found}
        getRowId={(item) => item.id}
        getRowLabel={(item) => `${item.id}, ${item.partner}`}
        onChoose={(item) => {
          if (line === undefined || lineWork === undefined) return
          change(line.id, {
            extra: lineWork.extra.includes(item.id) ? lineWork.extra : [...lineWork.extra, item.id],
            close: {
              ...lineWork.close,
              items: lineWork.close.items.includes(item.id)
                ? lineWork.close.items
                : [...lineWork.close.items, item.id],
            },
          })
        }}
        hasNext={false}
        onNext={() => undefined}
        count={found.length}
        mobile={{ subtitle: (item) => item.partner, details: ['due', 'open'] }}
        layout={phone ? 'phone' : 'desktop'}
      />
      <Toaster layout={phone ? 'phone' : 'desktop'} />
    </Shell>
  )
}

export const BANK_STATEMENT_ROUTES: ExampleRoute[] = [
  { path: BANK_ROUTES.statement, render: (phone) => <BankStatement phone={phone} /> },
  { path: BANK_ROUTES.partial, render: (phone) => <BankStatement phone={phone} line={3} /> },
  { path: BANK_ROUTES.difference, render: (phone) => <BankStatement phone={phone} line={7} /> },
  {
    path: BANK_ROUTES.decided,
    render: (phone) => <BankStatement phone={phone} stage="decided" />,
  },
]
