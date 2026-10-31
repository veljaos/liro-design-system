import { FileText, Landmark, Receipt, Search, Server } from 'lucide-react'
import type { AnswerBlock } from './assistant-logic'
import { CodeBlock } from './code-block'
import { MaskedValue } from './masked-value'
import type { QueueItem, TraceSource, TraceStep } from './trace-logic'

/*
 * Story data of the assistant's work display: a fictitious company's assistant reading
 * its records. Not part of the package. Every word is what an application would pass.
 */

const noop = () => undefined

/** The SEF answer a step read: secrets were masked by the application before it got here. */
export const SEF_RESPONSE = `{
  "invoiceNumber": "F-2026-0398",
  "status": "Rejected",
  "code": 4012,
  "message": "Buyer's tax number 101234567 is not registered for e-invoicing.",
  "receivedAt": "2026-10-14T09:31:04+02:00",
  "apiKey": "••••••••"
}`

/** A webhook's call as the integration log keeps it. */
export const WEBHOOK_EXAMPLE = `POST /hooks/bank-statements HTTP/1.1
Host: api.example.rs
Content-Type: application/json
X-Signature: sha256=••••••••

{"statement": 188, "account": "160-0000000012345-67", "lines": 42}`

/** A failed nightly import's log, with a terminal's colours. */
const ESC = String.fromCharCode(27)
export const IMPORT_LOG = [
  `${ESC}[90m02:00:01${ESC}[0m Import of bank statements started`,
  `${ESC}[90m02:00:03${ESC}[0m ${ESC}[32m✓${ESC}[0m Statement 187 read, 38 lines`,
  `${ESC}[90m02:00:04${ESC}[0m ${ESC}[32m✓${ESC}[0m Statement 188 read, 42 lines`,
  `${ESC}[90m02:00:09${ESC}[0m ${ESC}[33m!${ESC}[0m Line 17: payer's account is not in the register`,
  `${ESC}[90m02:00:31${ESC}[0m ${ESC}[1;31m✗ Statement 189: the bank's server did not answer in 20 s${ESC}[0m`,
  `${ESC}[90m02:00:31${ESC}[0m Import stopped: 2 of 3 statements read`,
].join('\n')

/** The records the answer used: one twice (shown once) and an external page. */
export const RECORD_SOURCES: TraceSource[] = [
  {
    id: 'f-0412',
    label: 'Invoice F-2026-0412',
    detail: 'Sales invoices · 14.10.2026.',
    href: '#/sales/invoices/F-2026-0412',
    icon: Receipt,
  },
  {
    id: 'acc-2040',
    label: 'Account 2040 – Customers in the country',
    detail: 'Chart of accounts',
    href: '#/ledger/accounts/2040',
    icon: Landmark,
  },
  {
    id: 'st-188',
    label: 'Bank statement 188',
    detail: 'Banca Intesa · 13.10.2026.',
    href: '#/bank/statements/188',
    icon: FileText,
  },
  {
    id: 'f-0412-again',
    label: 'Invoice F-2026-0412',
    href: '#/sales/invoices/F-2026-0412',
  },
  {
    id: 'nbs',
    label: 'NBS middle exchange rate list',
    detail: 'nbs.rs',
    href: 'https://www.nbs.rs/en/finansijsko_trziste/medjubankarsko-devizno-trziste/kursna-lista/',
  },
]

/** The steps of a reconciliation as they happen: one done, one running, two waiting. */
const READ_STEP: TraceStep = {
  id: 'read',
  title: 'Read bank statement 188',
  description: '42 lines',
  icon: FileText,
  href: '#/bank/statements/188',
}
const FIND_STEP: TraceStep = {
  id: 'find',
  title: 'Found 214 open invoices of the customers on the statement',
  icon: Search,
}

export const MATCHING_STEPS: TraceStep[] = [
  READ_STEP,
  FIND_STEP,
  {
    id: 'match',
    title: 'Matching payments to invoices',
    description: '31 of 42',
    status: 'running',
  },
  { id: 'check', title: 'Check the payments without a reference', status: 'pending' },
  { id: 'propose', title: 'Propose the matches for your approval', status: 'pending' },
]

/** The same task done. */
export const MATCHED_STEPS: TraceStep[] = [
  READ_STEP,
  FIND_STEP,
  { id: 'match', title: 'Matched 38 payments to invoices', description: '38 of 42' },
  { id: 'check', title: 'Checked 4 payments without a reference' },
  { id: 'propose', title: 'Proposed the matches for your approval' },
]

/** A chain of thought whose steps hold a tool's output and a masked value. */
export function overdueReasonSteps(): TraceStep[] {
  return [
    {
      id: 'sef',
      title: 'Asked SEF why invoice F-2026-0398 was rejected',
      description: 'Rejected, code 4012',
      icon: Server,
      detail: <CodeBlock code={SEF_RESPONSE} language="json" title="SEF response" size="sm" />,
    },
    {
      id: 'buyer',
      title: 'Read the buyer’s record',
      description: 'Drina Prevoz d.o.o.',
      href: '#/customers/drina-prevoz',
    },
    {
      id: 'iban',
      title: 'Compared the bank account on the invoice with the buyer’s record',
      detail: (
        <MaskedValue
          label="Bank account"
          sentenceLabel="bank account"
          subject="Drina Prevoz d.o.o."
          onReveal={noop}
          reasons={[{ value: 'check', label: 'Checking a rejected invoice' }]}
        />
      ),
    },
    {
      id: 'register',
      title: 'Could not open the e-invoicing register',
      description: 'The register did not answer',
      status: 'error',
    },
  ]
}

/** A month-end close the assistant plans. */
export const CLOSE_PLAN: TraceStep[] = [
  { id: 'bank', title: 'Match the September bank statements' },
  { id: 'accruals', title: 'Post the accruals' },
  { id: 'depreciation', title: 'Posting depreciation for September', status: 'running' },
  { id: 'fx', title: 'Revalue foreign-currency balances', status: 'pending' },
  { id: 'trial', title: 'Run the trial balance', status: 'pending' },
]

/** The statement lines left to match. */
export const MATCH_QUEUE: QueueItem[] = [
  {
    id: 'l4',
    title: 'Line 4 · Stanogradnja Plus d.o.o.',
    done: true,
    description: '236.000,00 RSD',
  },
  {
    id: 'l9',
    title: 'Line 9 · Gradska toplana Novi Sad',
    done: true,
    description: '184.800,00 RSD',
  },
  { id: 'l17', title: 'Line 17 · unknown payer', done: false, description: '12.500,00 RSD' },
  { id: 'l23', title: 'Line 23 · Drina Prevoz d.o.o.', done: false, description: '91.600,00 RSD' },
  { id: 'l31', title: 'Line 31 · Beton Mix d.o.o.', done: false, description: '48.000,00 RSD' },
]

/** The bank matcher's own steps. */
export const SUBAGENT_STEPS: TraceStep[] = [
  { id: 'rules', title: 'Applied 6 matching rules' },
  { id: 'refs', title: 'Matched 34 lines by their reference number' },
  { id: 'amounts', title: 'Matched 4 lines by amount and payer' },
]

/** An answer that shows a payload: why an invoice did not reach SEF. */
export const QUESTION_SEF = 'Why did invoice F-2026-0398 not reach SEF?'
export const SEF_BLOCKS: AnswerBlock[] = [
  {
    kind: 'text',
    text: 'SEF rejected it: the buyer’s tax number is not registered for e-invoicing. Send it on paper, or ask Drina Prevoz d.o.o. to register.',
  },
  { kind: 'code', code: SEF_RESPONSE, language: 'json', title: 'SEF response' },
  {
    kind: 'sources',
    items: [
      { id: 'f-0398', label: 'Invoice F-2026-0398', href: '#/sales/invoices/F-2026-0398' },
      { id: 'log', label: 'SEF connection log, 14.10.2026.', href: '#/admin/connections/sef' },
    ],
  },
]
