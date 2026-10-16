import { FileText, Hash, Landmark, Mail, Scale, Send } from 'lucide-react'
import { useContext, useRef, useState, type ReactNode } from 'react'
import {
  ActionGroup,
  Alert,
  Button,
  CategoryGrid,
  ConfirmDialog,
  DataTable,
  DefinedForm,
  definedFormState,
  DocumentFrame,
  KeyValueList,
  MoneyText,
  notice,
  PageHeader,
  RecordFormPage,
  SectionCard,
  SignerList,
  SigningPage,
  StatusBadge,
  Toaster,
  toneFor,
  useLiro,
  type ActionItem,
  type DataTableColumn,
  type DefinedFormHandle,
  type DefinedValue,
  type DefinedValues,
  type ModuleTab,
  type Signer,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate, Shell } from './example-shell'
import { Frame, Tenant } from './screens-G'
import {
  BE_ROUTES,
  BE_TODAY,
  DOCUMENT_TYPES,
  documentType,
  LEAVE_MISSING,
  LEAVE_NUMBER,
  LEAVE_SIGNED,
  LEAVE_SIGNERS,
  LEAVE_VALUES,
  previewDocument,
  PROFORMA_LINES,
  PROFORMA_TOTAL,
  type DocumentType,
} from './data-BE'
import { BF_ROUTES } from './data-BF'
import { BG_ROUTES } from './data-BG'
import { BH_ROUTES } from './data-BH'
import { BI_ROUTES } from './data-BI'

/*
 * Group BE's example screens (P5.66, a document from a JSON definition): Kvadrat Gradnja d.o.o.
 * on 14 October 2026, Milica Petrović at work.
 * - New document: the application's types by group (CategoryGrid in section cards), each with
 *   what it is for.
 * - A draft: DefinedForm draws the type's definitions (sections, field types, required,
 *   conditions); the preview beside it is DocumentFrame showing what the application's renderer
 *   (liro-core-pdf) returns — loading, ready, failed —, refreshed by "Update preview" after a
 *   check. "Assign number" takes the next number from the registry book (group BF) after a
 *   confirmation; the numbered document is read-only and goes to signing.
 * - Signing: SigningPage with the preview and SignerList (the director, then the employee
 *   confirming receipt).
 * The screens never render a document and never compute: the definitions, values, numbers and
 * pages are the application's (data-BE.ts).
 */

export { BE_ROUTES }

/** An inline link's classes (every state named, as the other examples). */
export const RECORD_LINK = 'text-link no-underline visited:text-link hover:underline'

/** The Records module's tabs (groups BE–BI). */
export function recordsTabs(
  current: 'registry' | 'documents' | 'archive' | 'contracts' | 'meetings',
): ModuleTab[] {
  return [
    { key: 'registry', label: 'Registry book', href: `#${BF_ROUTES.book}` },
    { key: 'documents', label: 'Documents', href: `#${BE_ROUTES.types}` },
    { key: 'contracts', label: 'Contracts', href: `#${BI_ROUTES.list}` },
    { key: 'meetings', label: 'Meetings', href: `#${BH_ROUTES.list}` },
    { key: 'archive', label: 'Archive', href: `#${BG_ROUTES.book}` },
  ].map((tab) => ({ ...tab, current: tab.key === current }))
}

/** The document states' tones (the application's map). */
export const DOCUMENT_TONES = {
  Draft: 'neutral',
  Numbered: 'info',
  'Awaiting signatures': 'warning',
  Signed: 'success',
} as const

export type DocumentState = keyof typeof DOCUMENT_TONES

export function documentBadge(state: DocumentState) {
  return <StatusBadge label={state} tone={toneFor(state, DOCUMENT_TONES)} />
}

/** The frame of every Records screen: the tenant's clock, the shell with the module's tabs. */
export function RecordsShell({
  phone,
  tab,
  crumbs,
  bottomBar,
  children,
}: {
  phone: boolean
  tab: Parameters<typeof recordsTabs>[0]
  crumbs: { label: string; href?: string }[]
  bottomBar?: ReactNode
  children: ReactNode
}) {
  return (
    <Tenant today={BE_TODAY}>
      <Shell
        phone={phone}
        crumbs={[{ label: 'Records' }, ...crumbs]}
        tabs={recordsTabs(tab)}
        {...(bottomBar === undefined ? {} : { bottomBar })}
      >
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

// ── New document: the types ───────────────────────────────────────────────────────────────────

const GROUP_ICONS: Record<string, typeof FileText> = {
  'Decisions and conclusions': Scale,
  Letters: Mail,
  'Commercial documents outside SEF': Hash,
  'Internal acts and records': FileText,
  'Company bodies': Landmark,
}

function DocumentTypes({ phone }: { phone: boolean }) {
  const groups = [...new Set(DOCUMENT_TYPES.map((type) => type.group))]
  return (
    <RecordsShell phone={phone} tab="documents" crumbs={[{ label: 'New document' }]}>
      <Frame phone={phone}>
        <PageHeader
          title="New document"
          subtitle="Choose the type: its form comes from the type’s template, and the application makes the document."
        />
        {groups.map((group) => (
          <SectionCard key={group} title={group} headingLevel={2}>
            <CategoryGrid
              label={group}
              layout={phone ? 'phone' : 'desktop'}
              categories={DOCUMENT_TYPES.filter((type) => type.group === group).map((type) => ({
                id: type.id,
                title: type.label,
                description: type.description,
                href: `#${BE_ROUTES.draft(type.id)}`,
                ...(GROUP_ICONS[group] === undefined ? {} : { icon: GROUP_ICONS[group] }),
              }))}
            />
          </SectionCard>
        ))}
      </Frame>
    </RecordsShell>
  )
}

// ── A draft and its preview ───────────────────────────────────────────────────────────────────

interface ProformaLine {
  id: string
  item: string
  quantity: string
  unit: string
  price: string
  amount: string
}

/** The commercial documents' lines: the application's, drawn in the form's custom field. */
function CommercialLines({ currency }: { currency: string }) {
  const { format } = useLiro()
  const columns: DataTableColumn<ProformaLine>[] = [
    { id: 'item', header: 'Item', minWidth: 220, cell: (line) => line.item },
    {
      id: 'quantity',
      header: 'Quantity',
      numeric: true,
      cell: (line) => <bdi>{`${format.number(line.quantity)} ${line.unit}`}</bdi>,
    },
    {
      id: 'price',
      header: 'Price',
      numeric: true,
      cell: (line) => <MoneyText value={line.price} currency={currency} />,
    },
    {
      id: 'amount',
      header: 'Amount',
      numeric: true,
      cell: (line) => <MoneyText value={line.amount} currency={currency} />,
    },
  ]
  return (
    <div className="flex flex-col gap-3">
      <DataTable
        label="Lines"
        columns={columns}
        rows={PROFORMA_LINES}
        getRowId={(line) => line.id}
        getRowLabel={(line) => line.item}
        mobile={{ title: (line) => line.item, details: ['quantity', 'price', 'amount'] }}
      />
      <KeyValueList
        columns={1}
        items={[
          {
            label: 'Total',
            value: <MoneyText value={PROFORMA_TOTAL} currency={currency} />,
            numeric: true,
          },
        ]}
      />
    </div>
  )
}

export type DraftStart = 'draft' | 'missing' | 'loading' | 'failed' | 'numbered'

/** The values a type's draft opens with (the application's). */
function startValues(type: DocumentType, start: DraftStart): DefinedValues {
  if (type.id === 'decision-leave') return start === 'missing' ? LEAVE_MISSING : LEAVE_VALUES
  return type.start
}

/** What the values say about the document, for its subtitle. */
function draftSubject(type: DocumentType, values: DefinedValues): string {
  if (type.id === 'decision-leave') return `${type.label} · Nikola Marković`
  const named = values.buyer ?? values.company ?? values.subject ?? values.recipient
  return typeof named === 'string' && named !== '' ? `${type.label} · ${named}` : type.label
}

/** Values without context keys, as a submitted set (the shown fields come from the form). */
function submittedOf(values: DefinedValues): Record<string, DefinedValue> {
  const out: Record<string, DefinedValue> = {}
  for (const [key, value] of Object.entries(values)) out[key] = value ?? null
  return out
}

/** The number the registry book gives each type's draft (the application's next numbers). */
const NEXT_NUMBERS: Record<string, string> = {
  'decision-leave': LEAVE_NUMBER,
  'business-letter': '01-413/2026',
  proforma: 'PR-2026-0087',
  'invoice-abroad': 'F-2026-0438',
  'minutes-supervisory-board': '01-414/2026',
}

function DocumentDraft({
  phone,
  typeId,
  start,
}: {
  phone: boolean
  typeId: string
  start: DraftStart
}) {
  const navigate = useContext(Navigate)
  const { format } = useLiro()
  const type = documentType(typeId)
  const form = useRef<DefinedFormHandle>(null)
  const initial = type === undefined ? {} : { ...startValues(type, start), ...type.context }
  const [values, setValues] = useState<DefinedValues>(initial)
  const [shown, setShown] = useState<Readonly<Record<string, DefinedValue>>>(
    () => definedFormState(type?.sections ?? [], initial).submitted,
  )
  const [stale, setStale] = useState(false)
  const [preview, setPreview] = useState<'ready' | 'loading' | 'failed'>(
    start === 'loading' ? 'loading' : start === 'failed' ? 'failed' : 'ready',
  )
  const [attempt, setAttempt] = useState(0)
  const [number, setNumber] = useState<string | null>(start === 'numbered' ? LEAVE_NUMBER : null)
  const [asking, setAsking] = useState(false)
  if (type === undefined) return null
  const numbered = number !== null
  const next = NEXT_NUMBERS[type.id] ?? '01-415/2026'

  const refresh = () => {
    const check = form.current?.check()
    if (check?.valid !== true) return
    setShown({ ...check.values })
    setStale(false)
    setPreview('ready')
    setAttempt((count) => count + 1)
  }

  const actions: ActionItem[] = numbered
    ? [
        { key: 'pdf', label: 'Download PDF', intent: 'pdf', emphasis: 'secondary' },
        {
          key: 'sign',
          label: 'Send for signature',
          family: 'primary',
          icon: Send,
          emphasis: 'primary',
          onClick: () => {
            if (type.id === 'decision-leave') navigate(BE_ROUTES.leaveSigning)
            else notice.success(`${number} sent for signature.`)
          },
        },
      ]
    : [
        { key: 'save', label: 'Save draft', intent: 'save', emphasis: 'secondary' },
        {
          key: 'number',
          label: 'Assign number',
          family: 'primary',
          icon: Hash,
          emphasis: 'primary',
          onClick: () => {
            const check = form.current?.check()
            if (check?.valid === true) setAsking(true)
          },
        },
      ]

  const previewCard = (
    <SectionCard
      title="Preview"
      headingLevel={2}
      description="The document as the application renders it."
      actions={
        numbered ? undefined : (
          <Button intent="refresh" emphasis="secondary" label="Update preview" onClick={refresh} />
        )
      }
      className={phone ? '' : 'xl:sticky xl:top-[calc(var(--liro-shell-top,0px)+16px)]'}
    >
      <div className="flex flex-col gap-3">
        {stale && preview === 'ready' ? (
          <Alert title="The preview shows the values before your last change." />
        ) : null}
        <DocumentFrame
          key={attempt}
          title={number === null ? type.label : `${type.label} ${number}`}
          srcDoc={previewDocument(type, shown, number, preview)}
          allowedOrigin="null"
          className={phone ? 'h-[440px]' : 'h-[640px]'}
        />
      </div>
    </SectionCard>
  )

  return (
    <RecordsShell
      phone={phone}
      tab="documents"
      crumbs={[
        { label: 'Documents', href: `#${BE_ROUTES.types}` },
        { label: number ?? type.label },
      ]}
    >
      <RecordFormPage
        layout={phone ? 'phone' : 'desktop'}
        title={number ?? `New ${type.label.toLowerCase()}`}
        status={documentBadge(numbered ? 'Numbered' : 'Draft')}
        subtitle={draftSubject(type, values)}
        back={
          numbered
            ? { href: `#${BF_ROUTES.book}`, label: 'Registry book' }
            : { href: `#${BE_ROUTES.types}`, label: 'New document' }
        }
        dirty={stale && !numbered}
        stickyActions={numbered ? 'never' : 'auto'}
        actions={<ActionGroup actions={actions} />}
      >
        <div className={phone ? 'flex flex-col gap-4' : 'grid items-start gap-6 xl:grid-cols-2'}>
          <div className="flex min-w-0 flex-col gap-4">
            {numbered ? (
              <Alert tone="info" title={`Entered in the registry book as outgoing act ${number}`}>
                A numbered document is no longer changed: a change is a new document that refers to
                this one.
              </Alert>
            ) : null}
            <DefinedForm
              ref={form}
              sections={type.sections}
              values={values}
              onChange={(next) => {
                setValues(next)
                setStale(true)
              }}
              showMissing={start === 'missing'}
              readOnly={numbered}
              renderCustom={(field) =>
                field.id === 'lines' ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold">{field.label}</span>
                    <CommercialLines
                      currency={typeof values.currency === 'string' ? values.currency : 'EUR'}
                    />
                  </div>
                ) : null
              }
            />
          </div>
          {previewCard}
        </div>
      </RecordFormPage>
      <ConfirmDialog
        open={asking}
        onOpenChange={setAsking}
        family="primary"
        actionIcon={Hash}
        tone="info"
        title="Assign number"
        subject={draftSubject(type, values)}
        message={`The document is entered in the registry book as outgoing act ${next} on ${format.date(BE_TODAY)} and can no longer be changed.`}
        confirmLabel="Assign number"
        onConfirm={() => {
          const check = form.current?.check()
          if (check !== undefined) setShown({ ...check.values })
          setNumber(next)
          setStale(false)
          setPreview('ready')
          setAttempt((count) => count + 1)
          notice.success(`Numbered ${next}.`)
        }}
      />
    </RecordsShell>
  )
}

// ── Signing ───────────────────────────────────────────────────────────────────────────────────

function DocumentSigning({ phone, signed }: { phone: boolean; signed: boolean }) {
  const { format, linkComponent: Link } = useLiro()
  const type = documentType('decision-leave')
  const [signers] = useState<readonly Signer[]>(signed ? LEAVE_SIGNED : LEAVE_SIGNERS)
  if (type === undefined) return null
  const done = signers.every((signer) => signer.state === 'signed')
  return (
    <RecordsShell
      phone={phone}
      tab="documents"
      crumbs={[{ label: 'Registry book', href: `#${BF_ROUTES.book}` }, { label: LEAVE_NUMBER }]}
    >
      <SigningPage
        layout={phone ? 'phone' : 'desktop'}
        title={LEAVE_NUMBER}
        back={{ href: `#${BF_ROUTES.book}`, label: 'Registry book' }}
        status={documentBadge(done ? 'Signed' : 'Awaiting signatures')}
        subtitle={`${type.label} · Nikola Marković`}
        actions={
          <ActionGroup
            actions={[
              { key: 'pdf', label: 'Download PDF', intent: 'pdf', emphasis: 'secondary' },
              ...(done
                ? []
                : [
                    {
                      key: 'remind',
                      label: 'Send reminder',
                      family: 'neutral' as const,
                      icon: Mail,
                      emphasis: 'secondary' as const,
                      onClick: () => {
                        notice.success('Reminder sent to Nenad Kovačević.')
                      },
                    },
                  ]),
            ]}
          />
        }
        preview={
          <DocumentFrame
            title={`${type.label} ${LEAVE_NUMBER}`}
            srcDoc={previewDocument(type, submittedOf(LEAVE_VALUES), LEAVE_NUMBER, 'ready')}
            allowedOrigin="null"
          />
        }
        signers={<SignerList signers={signers} />}
        sections={[
          {
            id: 'registry',
            label: 'Registry book',
            content: (
              <KeyValueList
                columns={1}
                items={[
                  {
                    label: 'Entry',
                    value: (
                      <Link href={`#${BF_ROUTES.entryOf('412')}`} className={RECORD_LINK}>
                        <bdi>{LEAVE_NUMBER}</bdi>
                      </Link>
                    ),
                  },
                  { label: 'Kind', value: 'Outgoing' },
                  { label: 'Entered by', value: `Milica Petrović, ${format.date(BE_TODAY)} 09:40` },
                  {
                    label: 'Delivered',
                    value: done
                      ? `In person, ${format.date(BE_TODAY)} 13:05`
                      : 'After the director signs',
                  },
                ]}
              />
            ),
          },
        ]}
      />
    </RecordsShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_BE_ROUTES: ExampleRoute[] = [
  { path: BE_ROUTES.types, render: (phone) => <DocumentTypes phone={phone} /> },
  ...DOCUMENT_TYPES.map((type) => ({
    path: BE_ROUTES.draft(type.id),
    render: (phone: boolean) => <DocumentDraft phone={phone} typeId={type.id} start="draft" />,
  })),
  {
    path: BE_ROUTES.leaveMissing,
    render: (phone) => <DocumentDraft phone={phone} typeId="decision-leave" start="missing" />,
  },
  {
    path: BE_ROUTES.leaveLoading,
    render: (phone) => <DocumentDraft phone={phone} typeId="decision-leave" start="loading" />,
  },
  {
    path: BE_ROUTES.leaveFailed,
    render: (phone) => <DocumentDraft phone={phone} typeId="decision-leave" start="failed" />,
  },
  {
    path: BE_ROUTES.leaveNumbered,
    render: (phone) => <DocumentDraft phone={phone} typeId="decision-leave" start="numbered" />,
  },
  {
    path: BE_ROUTES.leaveSigning,
    render: (phone) => <DocumentSigning phone={phone} signed={false} />,
  },
  {
    path: BE_ROUTES.leaveSigned,
    render: (phone) => <DocumentSigning phone={phone} signed />,
  },
]
