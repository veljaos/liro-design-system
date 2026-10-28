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
import { useState, type ReactNode } from 'react'
import {
  Accordion,
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
  Drawer,
  EditableGrid,
  FormGrid,
  KeyFigures,
  KeyValueList,
  LookupDialog,
  MoneyText,
  ProgressBar,
  RadioGroupField,
  RelatedDocuments,
  SectionCard,
  SelectField,
  StatusBadge,
  TextField,
  Toaster,
  UnavailableAction,
  notice,
  useLiro,
  type Candidate,
  type DataTableColumn,
  type EditableGridColumn,
  type ModuleTab,
  type Tone,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Shell, statusBadge } from './example-shell'
import { Frame } from './screens-G'
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
  PROFORMA_PAYMENTS,
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
 * Bank statement 188 (P5.23; simplified "auto first" in P5.90 item 9, the owner's review). The
 * statement opens as one compact table of its lines, each with its state in words — Matched
 * automatically (amount and reference, a known fee, the salary batch), Suggestion (the Core's
 * best guess, to check), Needs you (nothing found) or Done — and what the line does in a few
 * words. "Accept all exact matches" takes every automatic match in one press, with Undo. Only
 * the lines that need the user are opened: a press opens the line in a Drawer (the whole screen
 * on a phone) with the proposal, "Confirm and next" and "Change" — the full choice (close open
 * items, post to an account, split) and the bank's details stay folded until asked for. A
 * payment against a proforma invoice is one step (P5.93 item 17): the Core proposes "post it as
 * an advance and issue the advance invoice"; one Confirm does both, and the drawer shows the
 * result — the new advance invoice's number as a link and the related documents — with "Next
 * line". On a phone the lines that need the user come first. "Post
 * statement" opens a confirmation with the journal entry once every line is done. The screen
 * plays the application: it keeps every line's draft and computes in whole paras
 * (data-bank.ts); the components show.
 */

const STATEMENT_PATH = `/banking/statements/${STATEMENT.number}`

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
}

const BANKING_TABS: ModuleTab[] = [
  { key: 'statements', label: 'Statements', href: '#/banking/statements', current: true },
  { key: 'payments', label: 'Payments', href: '#/banking/payments' },
  { key: 'accounts', label: 'Bank accounts', href: '#/banking/accounts' },
]

// Links stand inside sentences: underlined, never told by colour alone (WCAG 1.4.1).
const LINK = 'text-link underline visited:text-link'

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

function startAll(stage: 'start' | 'decided', issued: boolean): Record<string, LineWork> {
  return Object.fromEntries(
    BANK_LINES.map((line) => {
      const work = startWork(line)
      // The proforma's advance invoice already issued (a restored screen).
      if (issued && line.id in PROFORMA_PAYMENTS) work.done = true
      if (stage === 'decided') {
        // Every line decided: the matches accepted, the unknown payment as an advance.
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
      }
      return [line.id, work]
    }),
  )
}

type LineState = 'done' | 'auto' | 'suggestion' | 'needs'

function stateOf(line: BankLine, work: LineWork): LineState {
  if (work.done) return 'done'
  const suggestion = SUGGESTIONS[line.id]
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

/** Which lines come first on a phone: those that need the user. */
const ATTENTION: Record<LineState, number> = { needs: 0, suggestion: 1, auto: 2, done: 3 }

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

/** What a decided line does, in sentences: the items it closes, or where it is posted. */
function resultLines(line: BankLine, decision: Decision, money: (paras: bigint) => string) {
  return decision.kind === 'close'
    ? outcomeLines(line, decision.items, decision.difference, money)
    : [`${howText(line, decision, money)}.`]
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
}: {
  line: BankLine
  work: LineWork
  onChange: (patch: Partial<LineWork>) => void
  onSearchAll: () => void
}) {
  const money = useMoney()
  const incoming = line.paras > 0n
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
    <section aria-label="What is this payment?" className="flex flex-col gap-4">
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

// ── The line open in the drawer ───────────────────────────────────────────────────────────────

function LineDrawer({
  line,
  work,
  state,
  onChange,
  onSearchAll,
  onConfirm,
  onReopen,
  onNext,
  posted,
  onOpenChange,
}: {
  line: BankLine
  work: LineWork
  state: LineState
  onChange: (patch: Partial<LineWork>) => void
  onSearchAll: () => void
  /** Confirms the line and opens the next one that needs the user. */
  onConfirm: () => void
  /** A done line taken back, to be changed. */
  onReopen: () => void
  /** Opens the next line that needs the user (after a result shown in place); none: undefined. */
  onNext: (() => void) | undefined
  posted: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { format, linkComponent: Link } = useLiro()
  const money = useMoney()
  // The full choice is folded away until asked for, except where nothing was found.
  const [changing, setChanging] = useState(state === 'needs')
  const decision = decisionOf(work, line)
  const suggestion = SUGGESTIONS[line.id]
  const proforma = PROFORMA_PAYMENTS[line.id]
  const problem = problemOf(line, work, money)
  const badge = STATE_BADGE[state]
  // A proforma's payment: one Confirm posts the advance and issues its invoice (P5.93 item 17).
  const confirmLabel =
    proforma !== undefined && !changing ? 'Post advance and issue invoice' : 'Confirm and next'

  const actions = posted ? undefined : work.done ? (
    proforma !== undefined ? (
      // The advance invoice is issued: corrected only by its own document, so no "Change" here.
      onNext === undefined ? undefined : (
        <Button
          family="primary"
          icon={ArrowRight}
          emphasis="primary"
          label="Next line"
          onClick={onNext}
        />
      )
    ) : (
      <Button
        intent="edit"
        label="Change"
        onClick={() => {
          onReopen()
          setChanging(true)
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
            setChanging(true)
          }}
        />
      )}
      {problem === null ? (
        <Button
          family="primary"
          icon={CircleCheck}
          emphasis="primary"
          label={confirmLabel}
          onClick={onConfirm}
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

  return (
    <Drawer
      open
      onOpenChange={onOpenChange}
      side="end"
      title={work.done ? 'Payment' : state === 'needs' ? 'Decide payment' : 'Confirm payment'}
      subject={`Line ${format.number(String(line.no))} · ${line.party}`}
      {...(actions === undefined ? {} : { actions })}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <bdi className="text-h3 font-semibold whitespace-nowrap text-primary tabular-nums">
            {format.money(decimal(line.paras), 'RSD', { sign: 'always' })}
          </bdi>
          <StatusBadge label={badge.label} tone={badge.tone} />
        </div>

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
          <section aria-label="What it does" className="flex flex-col gap-1">
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
            {suggestion !== undefined && (
              <p className="bidi-content m-0 text-sm text-secondary">{`Why: ${suggestion.reason}`}</p>
            )}
          </section>
        )}

        {proforma === undefined && decision !== null && !changing && (
          <section aria-label="What it does" className="flex flex-col gap-1">
            <ul className="m-0 flex list-none flex-col gap-1 p-0 text-md text-primary">
              {resultLines(line, decision, money).map((text) => (
                <li key={text} className="bidi-content">
                  {text}
                </li>
              ))}
            </ul>
            {suggestion !== undefined && !work.done && (
              <p className="bidi-content m-0 text-sm text-secondary">{`Why: ${suggestion.reason}`}</p>
            )}
          </section>
        )}

        {changing && !work.done && (
          <LineEditor line={line} work={work} onChange={onChange} onSearchAll={onSearchAll} />
        )}

        <Accordion
          headingLevel={3}
          items={[
            {
              value: 'bank',
              title: 'From the bank',
              content: (
                <KeyValueList
                  columns={1}
                  items={[
                    {
                      label: 'Counterparty account',
                      value: <span dir="ltr">{line.partyAccount}</span>,
                      numeric: true,
                    },
                    {
                      label: 'Value date',
                      value: <DateText value={line.valueDate} />,
                      numeric: true,
                    },
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
              ),
            },
          ]}
        />
      </div>
    </Drawer>
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
        <span className="bidi-content text-sm font-medium text-primary">{progress}</span>
        <ProgressBar label={progress} value={done} max={total} />
        {STATEMENT_TOTALS.checksOut ? (
          <p className="bidi-content m-0 flex items-center gap-1.5 text-xs font-medium text-status-success-fg">
            <CircleCheck aria-hidden="true" className="size-3.5 shrink-0" />
            Balance checks out
          </p>
        ) : (
          <p className="bidi-content m-0 flex items-center gap-1.5 text-xs font-medium text-status-danger-fg">
            <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
            Balance does not check out
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

/** A line of the table: the bank's line, its state and what it does. */
interface Row {
  line: BankLine
  state: LineState
  what: ReactNode
}

export function BankStatement({
  phone,
  line: startLine,
  stage = 'start',
  issued = false,
}: {
  phone: boolean
  /** The line open when the screen opens (its number). */
  line?: number
  stage?: 'start' | 'decided'
  /** The proforma's advance invoice already issued (a restored screen). */
  issued?: boolean
}) {
  const { format, linkComponent: Link } = useLiro()
  const money = useMoney()
  const [work, setWork] = useState(() => startAll(stage, issued))
  const [posted, setPosted] = useState(false)
  const [openId, setOpenId] = useState<string | undefined>(
    startLine === undefined ? undefined : `b${String(startLine)}`,
  )
  const [posting, setPosting] = useState(false)
  const [viewing, setViewing] = useState(false)
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')

  const line = BANK_LINES.find((each) => each.id === openId)
  const lineWork = line === undefined ? undefined : work[line.id]
  const change = (id: string, patch: Partial<LineWork>) => {
    setWork((current) => {
      const before = current[id]
      return before === undefined ? current : { ...current, [id]: { ...before, ...patch } }
    })
  }
  const stateOfId = (id: string, from: Record<string, LineWork> = work): LineState => {
    const each = BANK_LINES.find((candidate) => candidate.id === id)
    const eachWork = from[id]
    return each === undefined || eachWork === undefined ? 'needs' : stateOf(each, eachWork)
  }

  const states = BANK_LINES.map((each) => stateOfId(each.id))
  const count = (state: LineState) => states.filter((each) => each === state).length
  const done = count('done')
  const exact = BANK_LINES.filter((each) => stateOfId(each.id) === 'auto')
  const open = BANK_LINES.length - done
  const lines = (value: number) =>
    `${format.number(String(value))} ${value === 1 ? 'line' : 'lines'}`
  const postReason = posted
    ? 'The statement is posted.'
    : open > 0
      ? `${lines(open)} still ${open === 1 ? 'needs' : 'need'} a decision.`
      : undefined
  // One primary button: "Accept all exact matches" while there are any, then "Post statement".
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
  const acceptAll =
    exact.length === 0 || posted ? null : (
      <Button
        family="primary"
        icon={CheckCheck}
        emphasis="primary"
        label={`Accept all exact matches (${format.number(String(exact.length))})`}
        onClick={() => {
          const ids = exact.map((each) => each.id)
          setWork((current) => {
            const next = { ...current }
            for (const id of ids) {
              const before = next[id]
              if (before !== undefined) next[id] = { ...before, done: true }
            }
            return next
          })
          notice.success(`${lines(ids.length)} accepted.`, {
            action: {
              label: 'Undo',
              onClick: () => {
                setWork((current) => {
                  const next = { ...current }
                  for (const id of ids) {
                    const before = next[id]
                    if (before !== undefined) next[id] = { ...before, done: false }
                  }
                  return next
                })
              },
            },
          })
        }}
      />
    )
  const statementStatus = statusBadge(posted ? 'Posted' : done === 0 ? 'Imported' : 'In progress')

  /** The next line that needs the user, after `id` in the statement's order. */
  const nextNeeding = (id: string, from: Record<string, LineWork>) => {
    const at = BANK_LINES.findIndex((each) => each.id === id)
    return [...BANK_LINES.slice(at + 1), ...BANK_LINES.slice(0, at)].find((each) => {
      const state = stateOfId(each.id, from)
      return each.id !== id && (state === 'needs' || state === 'suggestion')
    })
  }

  const confirm = () => {
    if (line === undefined || lineWork === undefined) return
    const decision = decisionOf(lineWork, line)
    if (decision === null) return
    const id = line.id
    const after = { ...work, [id]: { ...lineWork, done: true } }
    change(id, { done: true })
    // A proforma's payment: the advance invoice is issued at once and the drawer shows the
    // result (its link and the related documents) with "Next line"; nothing to undo by a toast.
    if (id in PROFORMA_PAYMENTS && lineWork.kind === 'account') return
    setOpenId(nextNeeding(id, after)?.id)
    notice.success(
      `Line ${format.number(String(line.no))} done: ${howText(line, decision, money)}.`,
      {
        // Until the statement is posted every decision can be taken back.
        action: {
          label: 'Undo',
          onClick: () => {
            change(id, { done: false })
          },
        },
      },
    )
  }

  const rows: Row[] = BANK_LINES.map((each, at) => {
    const eachWork = work[each.id]
    const state = states[at] ?? 'needs'
    const proforma = PROFORMA_PAYMENTS[each.id]
    const decision = eachWork === undefined ? null : decisionOf(eachWork, each)
    const what =
      proforma !== undefined && eachWork?.done === true ? (
        <>
          {'Advance invoice '}
          <Link
            href={`#/sales/advance-invoices/${proforma.advanceInvoice}`}
            className={LINK}
            dir="ltr"
          >
            {proforma.advanceInvoice}
          </Link>
          {' issued'}
        </>
      ) : proforma !== undefined && eachWork?.kind === 'account' ? (
        `Advance and its invoice for ${proforma.proforma}`
      ) : decision === null ? (
        'No match found'
      ) : (
        howText(each, decision, money)
      )
    return { line: each, state, what }
  })
  // On a phone the lines that need the user come first.
  const shownRows = phone
    ? [...rows].sort((a, b) => ATTENTION[a.state] - ATTENTION[b.state] || a.line.no - b.line.no)
    : rows

  const columns: DataTableColumn<Row>[] = [
    {
      id: 'no',
      header: 'No.',
      numeric: true,
      cell: (row) => format.number(String(row.line.no)),
    },
    { id: 'party', header: 'Counterparty', cell: (row) => row.line.party },
    {
      id: 'amount',
      header: 'Amount',
      align: 'end',
      numeric: true,
      cell: (row) => <bdi>{format.money(decimal(row.line.paras), 'RSD', { sign: 'always' })}</bdi>,
    },
    { id: 'what', header: 'What it does', cell: (row) => row.what },
    {
      id: 'state',
      header: 'State',
      cell: (row) => (
        <StatusBadge label={STATE_BADGE[row.state].label} tone={STATE_BADGE[row.state].tone} />
      ),
    },
  ]

  const countWords: Record<LineState, (value: number, text: string) => string> = {
    auto: (_, text) => `${text} matched automatically`,
    suggestion: (value, text) => `${text} ${value === 1 ? 'suggestion' : 'suggestions'}`,
    needs: (value, text) => `${text} ${value === 1 ? 'needs' : 'need'} you`,
    done: (_, text) => `${text} done`,
  }
  const counts = (['auto', 'suggestion', 'needs', 'done'] as const)
    .filter((state) => count(state) > 0)
    .map((state) => countWords[state](count(state), format.number(String(count(state)))))
    .join(' · ')

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
      {...(phone ? { bottomBar: acceptAll ?? post } : {})}
    >
      <Frame phone={phone} wide>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="bidi-content m-0 text-h2 text-primary">{`Statement ${STATEMENT.number}`}</h1>
              {statementStatus}
            </div>
            <p className="bidi-content m-0 text-sm text-secondary">
              {STATEMENT.bank} · <span dir="ltr">{STATEMENT.account}</span> ·{' '}
              <DateText value={STATEMENT.date} />
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              intent="preview"
              label="Bank’s file"
              onClick={() => {
                setViewing(true)
              }}
            />
            {!phone && (
              <>
                {acceptAll === null ? null : post}
                {acceptAll ?? post}
              </>
            )}
          </div>
        </div>
        <StatementSummary phone={phone} done={done} />
        <SectionCard
          title={`Lines of statement ${STATEMENT.number}`}
          headingLevel={2}
          description={counts}
          flush
        >
          <DataTable
            label={`Lines of statement ${STATEMENT.number}`}
            inCard
            layout={phone ? 'cards' : 'table'}
            columns={columns}
            rows={shownRows}
            getRowId={(row) => row.line.id}
            getRowLabel={(row) =>
              `Line ${String(row.line.no)}, ${row.line.party}, ${STATE_BADGE[row.state].label}`
            }
            onRowClick={(row) => {
              setOpenId(row.line.id)
            }}
            mobile={{
              title: (row) => row.line.party,
              subtitle: (row) => row.what,
              badge: (row) => (
                <StatusBadge
                  label={STATE_BADGE[row.state].label}
                  tone={STATE_BADGE[row.state].tone}
                />
              ),
              details: ['amount'],
            }}
          />
        </SectionCard>
      </Frame>
      {line !== undefined && lineWork !== undefined && (
        <LineDrawer
          key={line.id}
          line={line}
          work={lineWork}
          state={stateOfId(line.id)}
          posted={posted}
          onChange={(patch) => {
            change(line.id, patch)
          }}
          onSearchAll={() => {
            setQuery('')
            setSearching(true)
          }}
          onConfirm={confirm}
          onReopen={() => {
            change(line.id, { done: false })
          }}
          onNext={(() => {
            const next = nextNeeding(line.id, work)
            return next === undefined
              ? undefined
              : () => {
                  setOpenId(next.id)
                }
          })()}
          onOpenChange={(next) => {
            if (!next) setOpenId(undefined)
          }}
        />
      )}
      <ConfirmDialog
        open={posting}
        onOpenChange={setPosting}
        family="primary"
        actionIcon={BookCheck}
        tone="info"
        icon={BookCheck}
        size="wide"
        title="Post statement"
        subject={`Statement ${STATEMENT.number} · ${STATEMENT.bank}`}
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
]
