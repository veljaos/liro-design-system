import { FileSignature, Send } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import {
  ActionGroup,
  Alert,
  Button,
  DataTable,
  DateRangeField,
  DocumentTotals,
  FormFullWidth,
  FormSection,
  KeyFigures,
  MoneyField,
  MoneyText,
  PeriodicRunPage,
  RadioGroupField,
  RecordFormPage,
  SelectField,
  StatusBadge,
  TextAreaField,
  toneFor,
  Toaster,
  notice,
  useLiro,
  type ActionItem,
  type DataTableColumn,
  type DateRange,
  type ModuleTab,
  type RunCheck,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Shell } from './example-shell'
import { Tenant } from './screens-G'
import {
  AT_ROUTES,
  AT_TODAY,
  CALCULATED_AMOUNT,
  CALCULATIONS,
  calculationKey,
  CONTRACTORS,
  KIND_LABELS,
  NEW_CONTRACT,
  NORMED_SHARES,
  PAYMENT_TONES,
  PROJECTS,
  RATES,
  RERUN_REASONS,
  RUN_CONTRACTS,
  RUN_PERIOD,
  RUN_STEPS,
  RUN_TOTALS,
  type AmountBasis,
  type ContractKind,
  type RunContract,
} from './data-AT'

/*
 * Group AT's example screens (P5.61, service and author contracts): Kvadrat Gradnja d.o.o. on 14
 * October 2026.
 * - A new contract (RecordFormPage): the person, the kind (service or author), the work, the
 *   period, the project; the amount agreed as gross or net and the normed costs' share the
 *   application offers for the kind; under it the calculation — gross, normed costs, tax base, tax,
 *   the pension and health contributions, net — as DocumentTotals, every figure the application's
 *   for the amount given (for an amount it has not calculated, "—" and why). Cancel, Save draft,
 *   Send for signature.
 * - The September 2026 run (PeriodicRunPage, a small payroll run): the lock, the steps, the checks
 *   in words (a payment held for a missing bank account), the preview — totals and every contract's
 *   calculation — and Rerun with a reason.
 */

export { AT_ROUTES }

type ContractsTab = 'new' | 'run'

function contractTabs(current: ContractsTab): ModuleTab[] {
  return [
    {
      key: 'new',
      label: 'Service and author contracts',
      href: `#${AT_ROUTES.newContract}`,
      current: current === 'new',
    },
    {
      key: 'run',
      label: 'Monthly run',
      href: `#${AT_ROUTES.run}`,
      current: current === 'run',
    },
  ]
}

function ContractsShell({
  phone,
  tab,
  crumbs,
  bottomBar,
  children,
}: {
  phone: boolean
  tab: ContractsTab
  crumbs: { label: string; href?: string }[]
  bottomBar?: ReactNode
  children: ReactNode
}) {
  return (
    <Tenant today={AT_TODAY}>
      <Shell
        phone={phone}
        crumbs={crumbs}
        tabs={contractTabs(tab)}
        {...(bottomBar === undefined ? {} : { bottomBar })}
      >
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

function money(value: string | null) {
  return <MoneyText value={value} currency="RSD" />
}

// ── A new contract ────────────────────────────────────────────────────────────────────────────

interface ContractDraft {
  person: string
  kind: ContractKind
  work: string
  period: DateRange
  project: string
  basis: AmountBasis
  amount: string | null
  share: string
}

export function NewServiceContract({ phone, basis }: { phone: boolean; basis?: AmountBasis }) {
  const { format } = useLiro()
  const [draft, setDraft] = useState<ContractDraft>({
    person: NEW_CONTRACT.person,
    kind: NEW_CONTRACT.kind,
    work: NEW_CONTRACT.work,
    period: { start: NEW_CONTRACT.start, end: NEW_CONTRACT.end },
    project: NEW_CONTRACT.project,
    basis: basis ?? NEW_CONTRACT.basis,
    amount: NEW_CONTRACT.amount,
    share: NEW_CONTRACT.share,
  })
  const [dirty, setDirty] = useState(false)
  const set = (next: Partial<ContractDraft>) => {
    setDraft((current) => ({ ...current, ...next }))
    setDirty(true)
  }
  const person = CONTRACTORS.find((each) => each.value === draft.person)
  const shares = NORMED_SHARES[draft.kind]
  // The application's calculation for what the form says; another amount waits for the save.
  const calculation =
    draft.amount === CALCULATED_AMOUNT
      ? CALCULATIONS[calculationKey(draft.kind, draft.share, draft.basis)]
      : undefined
  const value = (key: keyof NonNullable<typeof calculation>) => calculation?.[key] ?? null
  const percent = (rate: string) => format.percent(rate)
  const shareText = format.percent(draft.share)
  const actions: ActionItem[] = [
    {
      key: 'cancel',
      intent: 'cancel',
      label: 'Cancel',
      onClick: () => {
        setDirty(false)
      },
    },
    {
      key: 'save',
      intent: 'save',
      emphasis: 'secondary',
      label: 'Save draft',
      onClick: () => {
        setDirty(false)
        notice.success(`${NEW_CONTRACT.number} saved as a draft.`)
      },
    },
    {
      key: 'send',
      family: 'primary',
      icon: FileSignature,
      emphasis: 'primary',
      label: 'Send for signature',
      onClick: () => {
        setDirty(false)
        notice.success(`${NEW_CONTRACT.number} sent to ${person?.label ?? ''} for signature.`)
      },
    },
  ]
  const columns = phone ? 1 : 2
  return (
    <ContractsShell
      phone={phone}
      tab="new"
      crumbs={[
        { label: 'Service and author contracts', href: `#${AT_ROUTES.newContract}` },
        { label: 'New contract' },
      ]}
    >
      <RecordFormPage
        layout={phone ? 'phone' : 'desktop'}
        title="New contract"
        subtitle={<bdi>{NEW_CONTRACT.number}</bdi>}
        back={{ href: `#${AT_ROUTES.run}`, label: 'Service and author contracts' }}
        dirty={dirty}
        actions={<ActionGroup actions={actions} />}
      >
        <div className="flex flex-col gap-4">
          <FormSection title="Contract" columns={columns}>
            <SelectField
              label="Person"
              required
              options={CONTRACTORS}
              value={draft.person}
              onChange={(next) => {
                set({ person: next })
              }}
            />
            <RadioGroupField
              label="Kind"
              options={[
                {
                  value: 'author',
                  label: KIND_LABELS.author,
                  description: 'A work protected by copyright: a design, a text, a photograph.',
                },
                {
                  value: 'service',
                  label: KIND_LABELS.service,
                  description: 'A job done once: a survey, a translation, a training.',
                },
              ]}
              value={draft.kind}
              onChange={(next) => {
                const kind: ContractKind = next === 'service' ? 'service' : 'author'
                set({ kind, share: NORMED_SHARES[kind][0]?.value ?? '' })
              }}
            />
            <FormFullWidth>
              <TextAreaField
                label="Work"
                required
                rows={2}
                value={draft.work}
                onChange={(work) => {
                  set({ work })
                }}
              />
            </FormFullWidth>
            <DateRangeField
              label="Period"
              required
              value={draft.period}
              onChange={(period) => {
                set({ period })
              }}
            />
            <SelectField
              label="Project"
              options={PROJECTS}
              value={draft.project}
              onChange={(project) => {
                set({ project })
              }}
            />
          </FormSection>
          <FormSection title="Amount" columns={columns}>
            <RadioGroupField
              label="Agreed as"
              options={[
                {
                  value: 'gross',
                  label: 'Gross',
                  description: 'The company’s whole cost; taxes and contributions come out of it.',
                },
                {
                  value: 'net',
                  label: 'Net',
                  description: 'What the person receives; the application works out the gross.',
                },
              ]}
              value={draft.basis}
              onChange={(next) => {
                set({ basis: next === 'net' ? 'net' : 'gross' })
              }}
            />
            <MoneyField
              label={draft.basis === 'net' ? 'Net amount' : 'Gross amount'}
              required
              currency="RSD"
              value={draft.amount}
              onChange={(amount) => {
                set({ amount })
              }}
            />
            <SelectField
              label="Normed costs"
              description="The share of the gross not taxed, by the kind of work (illustrative)."
              options={shares}
              value={draft.share}
              {...(shares.length === 1 ? { readOnly: true } : {})}
              onChange={(share) => {
                set({ share })
              }}
            />
          </FormSection>
          <FormSection
            title="Calculation"
            description={`Rates valid from ${format.date(RATES.validFrom)} (illustrative). The application calculates; the figures are for the amount above.`}
            columns={1}
          >
            <div className="flex flex-col gap-4">
              {calculation === undefined && (
                <Alert tone="neutral" title="Calculated when the draft is saved">
                  The application calculates the taxes and contributions for a new amount.
                </Alert>
              )}
              <DocumentTotals
                label={`Calculation of ${NEW_CONTRACT.number}`}
                rows={[
                  {
                    key: 'gross',
                    label: 'Gross amount (cost to the company)',
                    value: value('gross'),
                    currency: 'RSD',
                  },
                  {
                    key: 'normed',
                    label: `Normed costs (${shareText})`,
                    value: value('normed'),
                    currency: 'RSD',
                  },
                  {
                    key: 'base',
                    label: 'Tax base',
                    value: value('base'),
                    currency: 'RSD',
                    group: true,
                  },
                  {
                    key: 'tax',
                    label: `Income tax (${percent(RATES.tax)})`,
                    value: value('tax'),
                    currency: 'RSD',
                  },
                  {
                    key: 'pension',
                    label: `Pension and disability insurance (${percent(RATES.pension)})`,
                    value: value('pension'),
                    currency: 'RSD',
                  },
                  {
                    key: 'health',
                    label: `Health insurance (${percent(RATES.health)})`,
                    value: value('health'),
                    currency: 'RSD',
                  },
                ]}
                total={{
                  key: 'net',
                  label: `Net to ${person?.label ?? 'the person'}`,
                  value: value('net'),
                  currency: 'RSD',
                }}
              />
            </div>
          </FormSection>
        </div>
      </RecordFormPage>
    </ContractsShell>
  )
}

// ── The September 2026 run ────────────────────────────────────────────────────────────────────

function paymentBadge(payment: RunContract['payment']) {
  return <StatusBadge label={payment} tone={toneFor(payment, PAYMENT_TONES)} />
}

const RUN_COLUMNS: DataTableColumn<RunContract>[] = [
  {
    id: 'contract',
    header: 'Contract',
    minWidth: 220,
    cell: (row) => (
      <span className="flex flex-col gap-0.5">
        <span className="bidi-content font-medium">{row.person}</span>
        <span className="bidi-content text-xs text-secondary">
          {`${KIND_LABELS[row.kind]} · ${row.number}`}
        </span>
      </span>
    ),
  },
  { id: 'gross', header: 'Gross', numeric: true, cell: (row) => money(row.gross) },
  { id: 'normed', header: 'Normed costs', numeric: true, cell: (row) => money(row.normed) },
  { id: 'tax', header: 'Tax', numeric: true, cell: (row) => money(row.tax) },
  {
    id: 'contributions',
    header: 'Contributions',
    numeric: true,
    cell: (row) => money(row.contributions),
  },
  { id: 'net', header: 'Net', numeric: true, cell: (row) => money(row.net) },
  { id: 'payment', header: 'Payment', cell: (row) => paymentBadge(row.payment) },
]

export function ContractRun({ phone, rerun: startRerun }: { phone: boolean; rerun?: string }) {
  const { format } = useLiro()
  const [rerun, setRerun] = useState<string | null>(startRerun ?? null)
  const running = rerun !== null
  const count = format.number(RUN_TOTALS.contracts)
  const checks: RunCheck[] = [
    {
      id: 'reports',
      label: 'Every contract has an approved work report',
      result: 'passed',
      detail: `${count} of ${count} contracts`,
    },
    {
      id: 'rates',
      label: 'Rates valid in September',
      result: 'passed',
      detail: `Tax ${format.percent(RATES.tax)}, pension ${format.percent(RATES.pension)}, health ${format.percent(RATES.health)} (illustrative).`,
    },
    {
      id: 'accounts',
      label: 'Bank accounts of the payees',
      result: 'warning',
      detail:
        'Mila Tošić has no bank account on file: her payment is held until she gives one. Taxes are paid.',
    },
    { id: 'return', label: `Tax return ${RUN_TOTALS.taxReturn} ready`, result: 'notRun' },
  ]
  const post = (
    <Button
      family="primary"
      icon={Send}
      emphasis="primary"
      label="Post and pay"
      onClick={() => {
        notice.success(`${RUN_PERIOD} posted; ${RUN_TOTALS.taxReturn} prepared.`)
      }}
    />
  )
  return (
    <ContractsShell
      phone={phone}
      tab="run"
      crumbs={[
        { label: 'Service and author contracts', href: `#${AT_ROUTES.run}` },
        { label: RUN_PERIOD },
      ]}
      {...(phone && !running ? { bottomBar: post } : {})}
    >
      <PeriodicRunPage
        layout={phone ? 'phone' : 'desktop'}
        title={`Service and author contracts ${RUN_PERIOD}`}
        status={<StatusBadge label={running ? 'Calculating' : 'In review'} tone="info" />}
        subtitle={`${count} contracts · paid on 15.10.2026`}
        steps={RUN_STEPS}
        active={running ? 1 : 2}
        lock={{
          state: 'open',
          detail: 'Opened by Marko Jelić (Knjigovodstvo Jelić) on 01.10.2026.',
        }}
        {...(running
          ? {
              progress: {
                label: 'Calculating the contracts',
                value: 0,
                max: Number(RUN_TOTALS.contracts),
                current: rerun,
              },
            }
          : {
              checks,
              ...(phone ? {} : { actions: post }),
              preview: {
                description: `The journal entry, the payments and tax return ${RUN_TOTALS.taxReturn} are made from these figures.`,
                summary: (
                  <KeyFigures
                    layout={phone ? 'phone' : 'desktop'}
                    items={[
                      { key: 'gross', label: 'Gross', value: money(RUN_TOTALS.gross) },
                      { key: 'tax', label: 'Tax', value: money(RUN_TOTALS.tax) },
                      {
                        key: 'contributions',
                        label: 'Contributions',
                        value: money(RUN_TOTALS.contributions),
                      },
                      { key: 'net', label: 'Net to pay', value: money(RUN_TOTALS.net) },
                    ]}
                  />
                ),
                table: (
                  <DataTable
                    label="Contracts of the run"
                    columns={RUN_COLUMNS}
                    rows={RUN_CONTRACTS}
                    getRowId={(row) => row.number}
                    getRowLabel={(row) => `${row.number} ${row.person}`}
                    inCard
                    layout={phone ? 'cards' : 'table'}
                    totalsLabel="Total"
                    totals={{
                      gross: money(RUN_TOTALS.gross),
                      normed: money(RUN_TOTALS.normed),
                      tax: money(RUN_TOTALS.tax),
                      contributions: money(RUN_TOTALS.contributions),
                      net: money(RUN_TOTALS.net),
                    }}
                    mobile={{
                      title: (row) => row.person,
                      subtitle: (row) => (
                        <span className="bidi-content">{`${KIND_LABELS[row.kind]} · ${row.number}`}</span>
                      ),
                      badge: (row) => paymentBadge(row.payment),
                      details: ['gross', 'tax', 'contributions', 'net'],
                    }}
                  />
                ),
              },
            })}
        rerun={{
          title: 'Rerun the contracts',
          subject: RUN_PERIOD,
          message:
            'The calculated figures of every contract are replaced. Nothing has been posted or paid.',
          confirmLabel: 'Rerun',
          reasonLabel: 'Reason for the rerun',
          reasons: RERUN_REASONS,
          onConfirm: (answer) => {
            const reason = RERUN_REASONS.find((each) => each.value === answer.reason)
            setRerun(answer.text === '' ? (reason?.label ?? '') : answer.text)
          },
          ...(running ? { unavailableReason: 'The contracts are being calculated.' } : {}),
        }}
      />
    </ContractsShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_AT_ROUTES: ExampleRoute[] = [
  { path: AT_ROUTES.newContract, render: (phone) => <NewServiceContract phone={phone} /> },
  {
    path: AT_ROUTES.newContractNet,
    render: (phone) => <NewServiceContract phone={phone} basis="net" />,
  },
  { path: AT_ROUTES.run, render: (phone) => <ContractRun phone={phone} /> },
]
