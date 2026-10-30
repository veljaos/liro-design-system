import {
  ArrowRight,
  BookCheck,
  CheckCheck,
  CircleAlert,
  CircleCheck,
  Pencil,
  ReceiptText,
  Search,
} from 'lucide-react'
import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import {
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
  EmptyState,
  FormGrid,
  InlineUndo,
  KeyValueList,
  LookupDialog,
  MoneyText,
  nextWorklistItem,
  RadioGroupField,
  RelatedDocuments,
  scheduleSearchMatches,
  SelectField,
  StatusBadge,
  TextField,
  Toaster,
  UnavailableAction,
  WorklistPage,
  WorklistSummary,
  notice,
  useLiro,
  type Candidate,
  type DataTableColumn,
  type EditableGridColumn,
  type ModuleTab,
  type Tone,
  type WorklistItem,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Shell, statusBadge } from './example-shell'
import {
  ACCOUNTS,
  accountOf,
  closeOutcome,
  COST_CENTRES,
  decimal,
  entryBalance,
  entryLines,
  PAYMENT_CODES,
  QUICK_TYPES,
  quickTypesFor,
  splitBalance,
  STATEMENT_188,
  WRITE_OFF_LIMIT,
  type BankLine,
  type Decision,
  type DifferenceChoice,
  type EntryLine,
  type OpenItem,
  type QuickType,
  type SplitPart,
  type StatementData,
} from './data-bank'
import { STATEMENT_189_DATA } from './data-bank-189'

/*
 * Bank statement 188 (P5.23; auto first in P5.90 item 9; a worklist again in P5.94 item 19, the
 * owner: "the same screen as Supplier invoices to approve, adapted, and it works with 1,000+
 * lines"). The statement is a WorklistPage:
 * - A thin strip under the title: opening balance, money in, money out, closing balance, "3 of
 *   10 done" with a bar, "Balance checks out"; once nothing waits, "Post statement" (the journal
 *   entry in a confirmation: posting cannot be undone).
 * - The queue at the start: "Accept all exact matches (6)" at its top (Undo in place, no
 *   confirmation), a search by name, amount, reference and account, the states as chips with
 *   their counts — Needs you (nothing found; the default), Suggestion (the Core's best guess),
 *   Matched automatically, Done — and the lines (drawn only in view from 100 lines).
 * - The chosen line at the end: payer or payee, the signed amount, the bank's text (purpose,
 *   reference, account, value date, payment code), what the line does and why (short labels), the
 *   full choice ("What is this payment?": close open items, post to an account, split) behind
 *   "Change", or at once when nothing was found. Confirm (the main action, last) decides the line
 *   and opens the next line that waits by itself — in the same state first, then Needs you,
 *   Suggestion, Matched automatically — with "Line 3 done … Undo" in place. Up and down move in
 *   the queue, Enter confirms. A payment against a proforma invoice is one step (P5.93 item 17):
 *   "Post advance and issue invoice", then the result — the advance invoice's link and the
 *   related documents — and "Next line".
 * - Phone: the queue (Needs you first), a line on the whole screen with its position and Previous
 *   / Next, Change and Confirm in the bottom bar, then the next line.
 * The screen plays the application: it keeps every line's draft, filters, searches and computes in
 * whole paras (data-bank.ts); the components show. Statement 189 (data-bank-189.ts) is the same
 * screen with 1,240 generated lines.
 */

const STATEMENT_PATH = `/banking/statements/${STATEMENT_188.statement.number}`

export const BANK_ROUTES = {
  statement: STATEMENT_PATH,
  /** Line 3 open: a partial payment, the Core's suggestion. */
  partial: `${STATEMENT_PATH}?line=3`,
  /** Line 7 open: 0,40 RSD less than the invoice. */
  difference: `${STATEMENT_PATH}?line=7`,
  /** Every line decided: the statement can be posted. */
  decided: `${STATEMENT_PATH}?stage=decided`,
  /** Line 9 open: a payment against a proforma invoice, the advance and its invoice proposed. */
  proforma: `${STATEMENT_PATH}?line=9`,
  /** Line 9 confirmed: the advance invoice issued, its link and the related documents. */
  proformaIssued: `${STATEMENT_PATH}?line=9&issued`,
  /** Statement 189: 1,240 generated lines. */
  large: `/banking/statements/${STATEMENT_189_DATA.statement.number}`,
}

const BANKING_TABS: ModuleTab[] = [
  { key: 'statements', label: 'Statements', href: '#/banking/statements', current: true },
  { key: 'payments', label: 'Payments', href: '#/banking/payments' },
  { key: 'accounts', label: 'Bank accounts', href: '#/banking/accounts' },
]

// Links stand inside sentences: underlined, never told by colour alone (WCAG 1.4.1).
const LINK = 'text-link underline visited:text-link'

/** The statement the screen shows (statement 188 unless a route gives another). */
const Statement = createContext<StatementData>(STATEMENT_188)

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
}

function size(line: BankLine): bigint {
  return line.paras < 0n ? -line.paras : line.paras
}

/** A line's work as the Core proposes it: its decision preselected, the other kinds ready. */
function startWork(line: BankLine, data: StatementData): LineWork {
  const suggestion = data.suggestions[line.id]?.decision
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
  }
}

/** The difference choice that applies to a rest: an underpayment stays open or is written off. */
function differenceFor(rest: bigint, chosen: DifferenceChoice): DifferenceChoice {
  if (rest < 0n) return chosen === 'advance' ? 'open' : chosen
  return chosen === 'open' ? 'advance' : chosen
}

function decisionOf(work: LineWork, line: BankLine, data: StatementData): Decision | null {
  if (work.kind === 'close') {
    const rest = closeOutcome(line.paras, work.close.items, data.openItem).rest
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

function startAll(
  data: StatementData,
  stage: 'start' | 'decided',
  issued: boolean,
): Record<string, LineWork> {
  return Object.fromEntries(
    data.lines.map((line) => {
      const work = startWork(line, data)
      // The proforma's advance invoice already issued (a restored screen).
      if (issued && line.id in data.proformas) work.done = true
      if (stage === 'decided') {
        // Every line decided: the matches accepted, the unknown payment as an advance.
        if (work.kind === null) {
          work.kind = 'account'
          work.account = {
            type: 'advanceReceived',
            account: '4300',
            text: `${line.party}, deposit for an apartment viewing`,
            costCentre: '',
          }
        }
        work.done = true
      }
      return [line.id, work]
    }),
  )
}

type LineState = 'done' | 'auto' | 'suggestion' | 'needs'

/** The states in the order the queue offers them, and the order "the next line" looks in. */
const STATES: readonly LineState[] = ['needs', 'suggestion', 'auto', 'done']

/** The queue's chips: every line ("All", always first, P5.96), or one state's lines. */
type QueueFilter = 'all' | LineState
const FILTERS: readonly QueueFilter[] = ['all', ...STATES]

function stateOf(line: BankLine, work: LineWork | undefined, data: StatementData): LineState {
  if (work?.done === true) return 'done'
  const suggestion = data.suggestions[line.id]
  if (suggestion === undefined) return 'needs'
  return suggestion.match === 'exact' ? 'auto' : 'suggestion'
}

/** The line states in words; the tone only repeats them. */
const STATE_BADGE: Record<LineState, { label: string; tone: Tone }> = {
  needs: { label: 'Needs you', tone: 'warning' },
  suggestion: { label: 'Suggestion', tone: 'info' },
  auto: { label: 'Matched automatically', tone: 'neutral' },
  done: { label: 'Done', tone: 'success' },
}

/** What a queue shows when a state has no lines. */
const EMPTY: Record<QueueFilter, { title: string; description: string }> = {
  all: { title: 'No lines', description: 'The statement has no lines.' },
  needs: { title: 'Nothing needs you', description: 'Every line has a match or a suggestion.' },
  suggestion: { title: 'No suggestions to check', description: 'Every suggestion is decided.' },
  auto: { title: 'No automatic matches left', description: 'Every exact match is accepted.' },
  done: { title: 'No line is done yet', description: 'Confirmed lines appear here.' },
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

/** How a line is decided, in a few words ("Closes F-2026-0412"). */
function howText(
  line: BankLine,
  decision: Decision,
  money: (paras: bigint) => string,
  data: StatementData,
): string {
  if (decision.kind === 'close') {
    const { rest } = closeOutcome(line.paras, decision.items, data.openItem)
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
  data: StatementData,
): string[] {
  const outcome = closeOutcome(line.paras, items, data.openItem)
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

/** What a decided line does, in sentences: the items it closes, or where it is posted. */
function resultLines(
  line: BankLine,
  decision: Decision,
  money: (paras: bigint) => string,
  data: StatementData,
) {
  return decision.kind === 'close'
    ? outcomeLines(line, decision.items, decision.difference, money, data)
    : [`${howText(line, decision, money, data)}.`]
}

/** Why "Confirm" cannot be used yet, or null. */
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

/** What a line does, in a few words, for its row in the queue (plain text: the row is a button). */
function whatText(
  line: BankLine,
  work: LineWork | undefined,
  money: (paras: bigint) => string,
  data: StatementData,
): string {
  const proforma = data.proformas[line.id]
  if (proforma !== undefined && work?.done === true) {
    return `Advance invoice ${proforma.advanceInvoice} issued`
  }
  if (proforma !== undefined && work?.kind === 'account') {
    return `Advance and its invoice for ${proforma.proforma}`
  }
  const decision = work === undefined ? null : decisionOf(work, line, data)
  return decision === null ? 'No match found' : howText(line, decision, money, data)
}

/** Whether a line matches the search: its party, account, reference, purpose or amount. */
function lineMatches(line: BankLine, query: string, amountText: string, locale: string) {
  if (query.trim() === '') return true
  const plain = decimal(size(line))
  return scheduleSearchMatches(
    query,
    [
      line.party,
      line.partyAccount,
      `${line.model} ${line.reference}`,
      line.purpose,
      amountText,
      plain,
      plain.replace('.', ','),
      plain.replace('.', ''),
      `Line ${String(line.no)}`,
    ],
    locale,
  )
}

// ── The line's full choice ("Change") ─────────────────────────────────────────────────────────

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

function LineEditor({
  line,
  work,
  onChange,
  onSearchAll,
  editor,
}: {
  line: BankLine
  work: LineWork
  onChange: (patch: Partial<LineWork>) => void
  onSearchAll: () => void
  /** The editor's section: Enter on a line that cannot be confirmed yet brings the focus here. */
  editor: RefObject<HTMLElement | null>
}) {
  const data = useContext(Statement)
  const money = useMoney()
  const incoming = line.paras > 0n
  const suggestion = data.suggestions[line.id]

  const ranked = (data.candidates[line.id] ?? []).flatMap((each) => {
    const item = data.openItem(each.id)
    if (item === undefined) return []
    const reason =
      'text' in each.reason
        ? each.reason.text
        : `Same ${each.reason.partner}, amount differs by ${money(each.reason.differsBy)}`
    return [candidateOf(item, reason)]
  })
  const added = work.extra.flatMap((id) => {
    const item = data.openItem(id)
    return item === undefined || ranked.some((each) => each.id === id)
      ? []
      : [candidateOf(item, 'Chosen from all open items')]
  })
  const candidates = [...ranked, ...added]
  const outcome = closeOutcome(line.paras, work.close.items, data.openItem)
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
    <section ref={editor} aria-label="What is this payment?" className="flex flex-col gap-4">
      <RadioGroupField
        label="What is this payment?"
        {...(suggestion === undefined ? {} : { description: `Suggested: ${suggestion.reason}` })}
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
                <p className="bidi-content m-0 border-0 border-y border-solid border-subtle py-3 text-sm text-secondary">
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
                  {outcomeLines(line, work.close.items, work.close.difference, money, data).map(
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
          layout="phone"
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
              layout="stacked"
            />
          }
        />
      )}
    </section>
  )
}

/** A sentence ending in a name: one full stop, also after "a.d." or "d.o.o.". */
function sentenceEnd(text: string): string {
  return text.endsWith('.') ? text : `${text}.`
}

// ── The chosen line ───────────────────────────────────────────────────────────────────────────

/** The Core's reasons for a proposal, as short labels. */
function WhyLabels({ labels }: { labels: readonly string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="bidi-content text-xs text-secondary">Why</span>
      <ul aria-label="Why" className="m-0 flex list-none flex-wrap gap-1.5 p-0">
        {labels.map((label) => (
          <li key={label}>
            <StatusBadge label={label} tone="neutral" withBorder />
          </li>
        ))}
      </ul>
    </div>
  )
}

function LineDetail({
  line,
  work,
  state,
  changing,
  undo,
  phone,
  onChange,
  onSearchAll,
  editor,
}: {
  line: BankLine
  work: LineWork
  state: LineState
  /** The full choice is open ("Change", or nothing was found). */
  changing: boolean
  /** The last decision's Undo, in place. */
  undo: ReactNode
  phone: boolean
  onChange: (patch: Partial<LineWork>) => void
  onSearchAll: () => void
  editor: RefObject<HTMLElement | null>
}) {
  const data = useContext(Statement)
  const { format, linkComponent: Link } = useLiro()
  const money = useMoney()
  const decision = decisionOf(work, line, data)
  const suggestion = data.suggestions[line.id]
  const proforma = data.proformas[line.id]
  const badge = STATE_BADGE[state]
  const incoming = line.paras > 0n

  return (
    <div className={phone ? 'flex flex-col gap-5' : 'flex flex-col gap-5 p-6'}>
      {undo}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="bidi-content m-0 text-h2 text-primary">{line.party}</h2>
          <p className="bidi-content m-0 text-sm text-secondary">
            {`${incoming ? 'Payer' : 'Payee'} · Line ${format.number(String(line.no))} of statement ${data.statement.number}`}
          </p>
        </div>
        <StatusBadge label={badge.label} tone={badge.tone} />
      </div>
      <bdi
        data-slot="line-amount"
        className="text-h3 font-semibold whitespace-nowrap text-primary tabular-nums"
      >
        {format.money(decimal(line.paras), 'RSD', { sign: 'always' })}
      </bdi>

      {/* What the payer wrote first; the proposal or the choice under it, in view. */}
      <KeyValueList
        columns={1}
        items={[
          { label: 'Purpose', value: line.purpose, fullWidth: true },
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
        ]}
      />

      {proforma !== undefined && work.done && (
        // The result in place: the new advance invoice and the documents it ties together.
        <section aria-label="Result" className="flex flex-col gap-4">
          <p className="m-0 flex items-start gap-2 text-md text-primary">
            <CircleCheck
              aria-hidden="true"
              className="mt-1 size-4 shrink-0 text-status-success-fg"
            />
            <span className="bidi-content">
              {'Advance invoice '}
              <Link
                href={`#/sales/advance-invoices/${proforma.advanceInvoice}`}
                className={LINK}
                dir="ltr"
              >
                {proforma.advanceInvoice}
              </Link>
              {` issued; ${money(line.paras)} is posted as an advance received from ${sentenceEnd(line.party)}`}
            </span>
          </p>
          <div className="flex flex-col gap-1">
            <h3 className="m-0 text-sm font-semibold text-primary">Related documents</h3>
            <RelatedDocuments
              label="Related documents"
              items={[
                {
                  key: 'proforma',
                  type: 'Proforma invoice',
                  number: proforma.proforma,
                  href: `#/sales/proforma-invoices/${proforma.proforma}`,
                  status: statusBadge('Paid'),
                },
                {
                  key: 'advance',
                  type: 'Advance invoice',
                  number: proforma.advanceInvoice,
                  href: `#/sales/advance-invoices/${proforma.advanceInvoice}`,
                  status: statusBadge('Issued'),
                },
              ]}
            />
          </div>
        </section>
      )}

      {proforma !== undefined && !work.done && !changing && (
        // The choice: one Confirm posts the advance and issues its invoice at once.
        <section aria-label="What it does" className="flex flex-col gap-3">
          <h3 className="m-0 text-h4 text-primary">What it does</h3>
          <ul className="m-0 flex list-none flex-col gap-1 p-0 text-md text-primary">
            <li className="bidi-content">
              {'Pays proforma invoice '}
              <Link
                href={`#/sales/proforma-invoices/${proforma.proforma}`}
                className={LINK}
                dir="ltr"
              >
                {proforma.proforma}
              </Link>
              .
            </li>
            <li className="bidi-content">
              {`${money(line.paras)} is posted as an advance received from ${sentenceEnd(line.party)}`}
            </li>
            <li className="flex items-start gap-2">
              <ReceiptText aria-hidden="true" className="mt-1 size-4 shrink-0 text-secondary" />
              <span className="bidi-content">The advance invoice is issued at once.</span>
            </li>
          </ul>
          {suggestion !== undefined && <WhyLabels labels={suggestion.labels} />}
        </section>
      )}

      {proforma === undefined && decision !== null && !changing && (
        <section aria-label="What it does" className="flex flex-col gap-3">
          <h3 className="m-0 text-h4 text-primary">
            {work.done ? 'What it does' : 'Proposed match'}
          </h3>
          <ul className="m-0 flex list-none flex-col gap-1 p-0 text-md text-primary">
            {resultLines(line, decision, money, data).map((text) => (
              <li key={text} className="bidi-content">
                {text}
              </li>
            ))}
          </ul>
          {suggestion !== undefined && !work.done && <WhyLabels labels={suggestion.labels} />}
        </section>
      )}

      {changing && !work.done && (
        <LineEditor
          line={line}
          work={work}
          onChange={onChange}
          onSearchAll={onSearchAll}
          editor={editor}
        />
      )}

      <section aria-label="From the bank" className="flex flex-col gap-2">
        <h3 className="m-0 text-h4 text-primary">From the bank</h3>
        <KeyValueList
          columns={1}
          items={[
            {
              label: incoming ? 'Payer’s account' : 'Payee’s account',
              value: <span dir="ltr">{line.partyAccount}</span>,
              numeric: true,
            },
            { label: 'Value date', value: <DateText value={line.valueDate} />, numeric: true },
            { label: 'Payment code', value: `${line.code} ${PAYMENT_CODES[line.code] ?? ''}` },
          ]}
        />
      </section>
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
  const data = useContext(Statement)
  const { format } = useLiro()
  const decided = data.lines.flatMap((line) => {
    const lineWork = work[line.id]
    const decision = lineWork === undefined ? null : decisionOf(lineWork, line, data)
    return decision === null ? [] : [{ line, decision }]
  })
  const closing = decided.filter((each) => each.decision.kind === 'close')
  const items = closing.reduce(
    (total, each) => total + (each.decision.kind === 'close' ? each.decision.items.length : 0),
    0,
  )
  const entries = decided.flatMap((each) => entryLines(each.line, each.decision, data))
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
            value: <MoneyText value={data.totals.incoming} currency="RSD" />,
            numeric: true,
          },
          {
            label: 'Money out',
            value: <MoneyText value={data.totals.outgoing} currency="RSD" />,
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
          virtualize={entries.length > 200}
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

/** The last action's Undo: a decided line (shown on the next line) or the accepted matches. */
interface LastAction {
  where: 'line' | 'queue'
  message: string
  onUndo: () => void
}

export function BankStatement({
  phone,
  data = STATEMENT_188,
  line: startLine,
  stage = 'start',
  issued = false,
}: {
  phone: boolean
  /** The statement (statement 188 by default). */
  data?: StatementData
  /** The line open when the screen opens (its number). */
  line?: number
  stage?: 'start' | 'decided'
  /** The proforma's advance invoice already issued (a restored screen). */
  issued?: boolean
}) {
  return (
    <Statement.Provider value={data}>
      <StatementScreen
        phone={phone}
        {...(startLine === undefined ? {} : { startLine })}
        stage={stage}
        issued={issued}
      />
    </Statement.Provider>
  )
}

function StatementScreen({
  phone,
  startLine,
  stage,
  issued,
}: {
  phone: boolean
  startLine?: number
  stage: 'start' | 'decided'
  issued: boolean
}) {
  const data = useContext(Statement)
  const { format, locale } = useLiro()
  const money = useMoney()
  const { statement, lines } = data
  const [work, setWork] = useState(() => startAll(data, stage, issued))
  const startId = startLine === undefined ? undefined : `b${String(startLine)}`
  // The first state that has lines (Needs you by default), or the state of the line opened.
  const [filter, setFilter] = useState<QueueFilter>(() => {
    const before = startAll(data, stage, false)
    const opened = lines.find((each) => each.id === startId)
    if (opened !== undefined) return stateOf(opened, before[opened.id], data)
    return (
      STATES.find((state) =>
        lines.some((each) => stateOf(each, before[each.id], data) === state),
      ) ?? 'needs'
    )
  })
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | undefined>(startId)
  const [changingId, setChangingId] = useState<string | null>(null)
  const [last, setLast] = useState<LastAction | null>(null)
  const [posted, setPosted] = useState(false)
  const [posting, setPosting] = useState(false)
  const [viewing, setViewing] = useState(false)
  const [searching, setSearching] = useState(false)
  const [lookupQuery, setLookupQuery] = useState('')
  const editor = useRef<HTMLElement>(null)

  const states = useMemo(
    () => new Map(lines.map((each) => [each.id, stateOf(each, work[each.id], data)])),
    [lines, work, data],
  )
  const stateIn = (each: BankLine, from: Record<string, LineWork> = work): LineState =>
    from === work ? (states.get(each.id) ?? 'needs') : stateOf(each, from[each.id], data)
  const counts = useMemo(() => {
    const result: Record<LineState, number> = { needs: 0, suggestion: 0, auto: 0, done: 0 }
    for (const state of states.values()) result[state] += 1
    return result
  }, [states])

  const amountText = (each: BankLine) =>
    format.money(decimal(each.paras), 'RSD', { sign: 'always' })
  const matches = (each: BankLine) => lineMatches(each, query, amountText(each), locale)
  // The queue: the chosen state's lines that match the search; a chosen line stays in it until
  // the user moves on (a proforma's result, a line found by the search).
  const shown = lines.filter(
    (each) =>
      matches(each) && (filter === 'all' || stateIn(each) === filter || each.id === selectedId),
  )
  const selected = phone
    ? selectedId
    : shown.some((each) => each.id === selectedId)
      ? selectedId
      : shown[0]?.id
  const line = lines.find((each) => each.id === selected)
  const lineWork = line === undefined ? undefined : work[line.id]
  const lineState = line === undefined ? 'needs' : stateIn(line)
  const changing = line !== undefined && (lineState === 'needs' || changingId === line.id)

  const change = (id: string, patch: Partial<LineWork>) => {
    setWork((current) => {
      const before = current[id]
      return before === undefined ? current : { ...current, [id]: { ...before, ...patch } }
    })
  }
  const choose = (id: string | undefined) => {
    setSelectedId(id)
    // A move to another line ends the last decision's Undo (the line's words would not fit).
    if (last?.where === 'line') setLast(null)
  }

  /**
   * After `id` is decided: the next line that waits — in the chosen state (and the search) first,
   * in the statement's order; then Needs you, Suggestion, Matched automatically. None: on a phone
   * back to the queue, on a desktop the decided line stays.
   */
  const advance = (id: string, after: Record<string, LineWork>) => {
    const inFilter = nextWorklistItem(
      lines,
      id,
      (each) =>
        (filter === 'all' ? stateIn(each, after) !== 'done' : stateIn(each, after) === filter) &&
        matches(each),
    )
    if (inFilter !== null) {
      setSelectedId(inFilter.id)
      return
    }
    for (const state of STATES) {
      if (state === 'done' || state === filter || filter === 'all') continue
      const next = nextWorklistItem(lines, id, (each) => stateIn(each, after) === state)
      if (next !== null) {
        setFilter(state)
        setQuery('')
        setSelectedId(next.id)
        return
      }
    }
    setSelectedId(phone ? undefined : id)
  }

  const confirm = (id: string) => {
    const each = lines.find((candidate) => candidate.id === id)
    const eachWork = work[id]
    if (each === undefined || eachWork === undefined || eachWork.done || posted) return
    const decision = decisionOf(eachWork, each, data)
    if (decision === null || problemOf(each, eachWork, money) !== null) {
      // Nothing to confirm yet: the choice takes the focus (Enter in the queue).
      setChangingId(id)
      requestAnimationFrame(() => {
        editor.current?.querySelector<HTMLElement>('input:not([disabled]), button')?.focus()
      })
      return
    }
    const before = stateIn(each)
    const after = { ...work, [id]: { ...eachWork, done: true } }
    setWork(after)
    setChangingId(null)
    // A proforma's payment: the advance invoice is issued at once, and the line stays to show the
    // result (its link and the related documents) with "Next line"; an issued invoice is
    // corrected by its own document, so there is no Undo.
    if (id in data.proformas && eachWork.kind === 'account') {
      setLast(null)
      setSelectedId(id)
      return
    }
    setLast({
      where: 'line',
      message: `Line ${format.number(String(each.no))} done: ${howText(each, decision, money, data)}.`,
      onUndo: () => {
        change(id, { done: false })
        // Under "All" the line is in view already; under a state the queue returns to its state.
        setFilter((current) => (current === 'all' ? current : before))
        setSelectedId(id)
        setLast(null)
      },
    })
    advance(id, after)
  }

  const exact = lines.filter((each) => stateIn(each) === 'auto')
  const acceptAll = () => {
    const ids = exact.map((each) => each.id)
    const after = { ...work }
    for (const id of ids) {
      const before = after[id]
      if (before !== undefined) after[id] = { ...before, done: true }
    }
    setWork(after)
    setLast({
      where: 'queue',
      message: `${format.number(String(ids.length))} ${ids.length === 1 ? 'line' : 'lines'} accepted.`,
      onUndo: () => {
        setWork((current) => {
          const next = { ...current }
          for (const id of ids) {
            const before = next[id]
            if (before !== undefined) next[id] = { ...before, done: false }
          }
          return next
        })
        setLast(null)
      },
    })
    if (filter === 'auto') {
      const next = STATES.find((state) =>
        lines.some(
          (each) => state !== 'auto' && state !== 'done' && stateIn(each, after) === state,
        ),
      )
      setFilter(next ?? 'done')
      setSelectedId(undefined)
    }
  }

  const done = counts.done
  const allDone = done === lines.length
  const statementStatus = statusBadge(posted ? 'Posted' : done === 0 ? 'Imported' : 'In progress')

  const items: WorklistItem[] = shown.map((each) => {
    const badge = STATE_BADGE[stateIn(each)]
    return {
      id: each.id,
      label: `Line ${String(each.no)}, ${each.party}`,
      title: each.party,
      subtitle: `${format.number(String(each.no))} · ${whatText(each, work[each.id], money, data)}`,
      figure: <bdi>{amountText(each)}</bdi>,
      status: <StatusBadge label={badge.label} tone={badge.tone} />,
    }
  })

  // The chosen line's decisions, the main one last.
  const proforma = line === undefined ? undefined : data.proformas[line.id]
  const problem =
    line === undefined || lineWork === undefined ? null : problemOf(line, lineWork, money)
  const confirmLabel =
    proforma !== undefined && !changing ? 'Post advance and issue invoice' : 'Confirm'
  const decisions =
    line === undefined || lineWork === undefined || posted ? undefined : lineWork.done ? (
      proforma !== undefined ? (
        // The advance invoice is issued: corrected only by its own document, so no "Change".
        lines.some((each) => stateIn(each) !== 'done') ? (
          <Button
            family="primary"
            icon={ArrowRight}
            emphasis="primary"
            label="Next line"
            onClick={() => {
              advance(line.id, work)
            }}
          />
        ) : undefined
      ) : (
        <Button
          intent="edit"
          label="Change"
          onClick={() => {
            change(line.id, { done: false })
            setChangingId(line.id)
            setLast(null)
          }}
        />
      )
    ) : (
      <>
        {!changing && (
          <Button
            family="neutral"
            icon={Pencil}
            label="Change"
            onClick={() => {
              setChangingId(line.id)
            }}
          />
        )}
        {problem === null ? (
          <Button
            family="primary"
            icon={CircleCheck}
            emphasis="primary"
            label={confirmLabel}
            onClick={() => {
              confirm(line.id)
            }}
          />
        ) : (
          <UnavailableAction
            family="primary"
            icon={CircleCheck}
            emphasis="primary"
            label={confirmLabel}
            reason={problem}
          />
        )}
      </>
    )

  const undoNode = (where: LastAction['where']) =>
    last?.where !== where ? undefined : (
      <InlineUndo message={last.message} onUndo={last.onUndo} icon={CircleCheck} />
    )

  // At the top of the queue: the bulk action while there are exact matches, else its Undo (or a
  // decided line's Undo once no line is open).
  const toolbar =
    exact.length > 0 && !posted ? (
      <div className="flex [&>*]:flex-1">
        <Button
          family="primary"
          icon={CheckCheck}
          label={`Accept all exact matches (${format.number(String(exact.length))})`}
          onClick={acceptAll}
        />
      </div>
    ) : (
      (undoNode('queue') ?? (line === undefined ? undoNode('line') : undefined))
    )

  const empty =
    query.trim() !== '' ? (
      <EmptyState
        variant="no-results"
        compact
        title="No lines match"
        description="Search by name, amount, reference or account."
        action={{
          label: 'Clear search',
          onClick: () => {
            setQuery('')
          },
        }}
      />
    ) : (
      <EmptyState compact title={EMPTY[filter].title} description={EMPTY[filter].description} />
    )

  const summary = (
    <WorklistSummary
      layout={phone ? 'phone' : 'desktop'}
      facts={[
        {
          key: 'opening',
          label: 'Opening balance',
          value: <MoneyText value={data.totals.opening} currency="RSD" />,
        },
        {
          key: 'in',
          label: 'Money in',
          value: <MoneyText value={data.totals.incoming} currency="RSD" />,
        },
        {
          key: 'out',
          label: 'Money out',
          value: <MoneyText value={data.totals.outgoing} currency="RSD" />,
        },
        {
          key: 'closing',
          label: 'Closing balance',
          value: <MoneyText value={data.totals.closing} currency="RSD" />,
        },
      ]}
      done={done}
      total={lines.length}
      note={
        data.totals.checksOut ? (
          <p className="bidi-content m-0 flex items-center gap-1.5 font-medium text-status-success-fg">
            <CircleCheck aria-hidden="true" className="size-3.5 shrink-0" />
            Balance checks out
          </p>
        ) : (
          <p className="bidi-content m-0 flex items-center gap-1.5 font-medium text-status-danger-fg">
            <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
            Balance does not check out
          </p>
        )
      }
      {...(allDone && !posted
        ? {
            action: (
              <Button
                family="primary"
                icon={BookCheck}
                emphasis="primary"
                label="Post statement"
                onClick={() => {
                  setPosting(true)
                }}
              />
            ),
          }
        : {})}
    />
  )

  const side = line === undefined || line.paras > 0n ? 'customer' : 'supplier'
  const found = data.openItems.filter(
    (item) =>
      item.side === side &&
      `${item.id} ${item.partner}`.toLowerCase().includes(lookupQuery.trim().toLowerCase()),
  )

  return (
    <Shell
      phone={phone}
      crumbs={[
        { label: 'Statements', href: '#/banking/statements' },
        { label: `Statement ${statement.number}` },
      ]}
      tabs={BANKING_TABS}
      // On a phone the line's decisions stand in the bottom bar, within thumb reach.
      {...(phone && selected !== undefined && decisions !== undefined
        ? { bottomBar: <div className="flex gap-2 [&>*]:flex-1">{decisions}</div> }
        : {})}
    >
      <WorklistPage
        layout={phone ? 'stacked' : 'split'}
        title={`Statement ${statement.number}`}
        status={statementStatus}
        subtitle={
          <>
            {statement.bank} · <span dir="ltr">{statement.account}</span> ·{' '}
            <DateText value={statement.date} />
          </>
        }
        actions={
          <Button
            intent="preview"
            label="Bank’s file"
            onClick={() => {
              setViewing(true)
            }}
          />
        }
        summary={summary}
        label={`Lines of statement ${statement.number}`}
        items={items}
        {...(selected === undefined ? {} : { selected })}
        onSelect={choose}
        onConfirm={confirm}
        {...(toolbar === undefined ? {} : { toolbar })}
        search={query}
        onSearchChange={setQuery}
        searchLabel="Name, amount, reference or account"
        filters={FILTERS.map((state) => ({
          value: state,
          label: state === 'all' ? 'All' : STATE_BADGE[state].label,
          count: state === 'all' ? lines.length : counts[state],
        }))}
        filter={filter}
        onFilterChange={(value) => {
          const state = FILTERS.find((each) => each === value) ?? 'needs'
          setFilter(state)
          choose(
            phone
              ? undefined
              : lines.find((each) => (state === 'all' || stateIn(each) === state) && matches(each))
                  ?.id,
          )
        }}
        filtersLabel="Show lines"
        empty={empty}
        {...(line === undefined || lineWork === undefined
          ? {}
          : {
              detail: (
                <LineDetail
                  key={line.id}
                  line={line}
                  work={lineWork}
                  state={lineState}
                  changing={changing}
                  undo={undoNode('line')}
                  phone={phone}
                  onChange={(patch) => {
                    change(line.id, patch)
                  }}
                  onSearchAll={() => {
                    setLookupQuery('')
                    setSearching(true)
                  }}
                  editor={editor}
                />
              ),
            })}
        {...(decisions === undefined || phone ? {} : { detailActions: decisions })}
        onBack={() => {
          choose(undefined)
        }}
        onPrevious={() => {
          const at = shown.findIndex((each) => each.id === selected)
          choose(shown[(at - 1 + shown.length) % shown.length]?.id)
        }}
        onNext={() => {
          const at = shown.findIndex((each) => each.id === selected)
          choose(shown[(at + 1) % shown.length]?.id)
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
        title="Post statement"
        subject={`Statement ${statement.number} · ${statement.bank}`}
        message="The journal entry below is posted and the open items are closed. A posted statement can only be corrected by a reversal."
        preview={<PostPreview work={work} phone={phone} />}
        confirmLabel="Post statement"
        onConfirm={() => {
          setPosted(true)
          setLast(null)
          notice.success(`Statement ${statement.number} posted.`)
        }}
      />
      <Dialog
        open={viewing}
        onOpenChange={setViewing}
        size="wide"
        title={statement.file}
        description={statement.imported}
      >
        <DocumentFrame
          title={`Statement ${statement.number}, ${statement.bank}`}
          srcDoc={data.viewer}
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
        onSearch={setLookupQuery}
        searchPlaceholder="Number or partner"
        columns={OPEN_ITEM_COLUMNS}
        rows={found.slice(0, 50)}
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
        // One compact row an item on a phone (P5.28): number; partner · due date; open amount.
        mobile={{
          title: (item) => <span dir="ltr">{item.id}</span>,
          subtitle: (item) => (
            <>
              {item.partner} · <DateText value={item.due} />
            </>
          ),
          badge: (item) => <MoneyText value={decimal(item.paras)} currency="RSD" />,
        }}
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
  { path: BANK_ROUTES.proforma, render: (phone) => <BankStatement phone={phone} line={9} /> },
  {
    path: BANK_ROUTES.proformaIssued,
    render: (phone) => <BankStatement phone={phone} line={9} issued />,
  },
  {
    path: BANK_ROUTES.large,
    render: (phone) => <BankStatement key="189" phone={phone} data={STATEMENT_189_DATA} />,
  },
]
