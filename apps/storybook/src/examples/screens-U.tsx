import {
  Ban,
  Camera,
  CircleCheck,
  Clock,
  Copy,
  KeyRound,
  ListChecks,
  PencilLine,
  ScanSearch,
} from 'lucide-react'
import {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import {
  ActionGroup,
  Alert,
  Button,
  CandidateList,
  DataTable,
  DateField,
  Dialog,
  DuplicateWarning,
  EditableGrid,
  EmptyState,
  FileDropzone,
  FilterBar,
  FormGrid,
  instantText,
  ListPage,
  LookupField,
  MoneyField,
  MoneyText,
  PageViewer,
  PasswordField,
  ProgressBar,
  QuickPreview,
  ReasonConfirmDialog,
  RecognizedField,
  Skeleton,
  Spinner,
  StatusBadge,
  TextField,
  toneFor,
  Toaster,
  notice,
  useLiro,
  WorklistPage,
  type ActionItem,
  type Candidate,
  type DataTableColumn,
  type DataTableFilters,
  type EditableGridColumn,
  type FilterDefinition,
  type GridDetail,
  type GridMessage,
  type LiroFormat,
  type LookupOption,
  type ModuleTab,
  type WorklistItem,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate, Shell } from './example-shell'
import { useExampleState } from './example-state'
import { Tenant } from './screens-G'
import {
  CONDITION_TEXT,
  COST_ACCOUNTS,
  DOC_KINDS,
  DOC_SOURCES,
  DOC_TONES,
  DOCUMENTS,
  INBOX_ADDRESS,
  INBOX_VIEWS,
  inInboxView,
  isToReview,
  originalCandidates,
  REJECT_REASONS,
  SUPPLIERS,
  supplierOption,
  U_ROUTES,
  U_TODAY,
  type DocState,
  type InboxDoc,
  type InboxView,
  type ReadLine,
  type ReadValue,
} from './data-U'

/*
 * Group U's example screens (P5.31, the document inbox with recognition): Kvadrat Gradnja
 * d.o.o.'s accounting on 14 October 2026 at 09:40, seen by Milica Petrović.
 * - The inbox (ListPage): documents uploaded, e-mailed to the inbox address, scanned or received
 *   through SEF; type, sender, received, source and state (New, Recognised, Needs review, Posted,
 *   Rejected, Duplicate), a new document's condition in words under its state; views To review,
 *   Posted, Rejected and duplicates, All; "Choose files" (FileDropzone; dropping is the shortcut,
 *   "Take a photo" on phones) above the card; checked rows are reviewed or rejected together.
 * - The review (WorklistPage, as the bank statement's lines): the documents to review at the
 *   side, one in focus — its page (PageViewer) beside the recognised fields (RecognizedField: the
 *   service's confidence, the uncertain readings it names, "Show where it was read"), the
 *   supplier matched in the catalog by its tax number or "+ Create supplier", VAT by rate, the
 *   lines with the suggested accounts; Save for later, Reject (with a reason), Mark as duplicate
 *   (with the original), Confirm and post — the main one last. Enter in a field confirms, then
 *   the next document opens; Tab goes through the fields. The conditions: recognising,
 *   recognition failed (entered by hand), a PDF locked with a password, an unreadable scan.
 * The screens play the application (data-U.ts): they keep the documents above the screens
 * (`useExampleState`), decide what may be confirmed and move to the next document; the
 * components show and report.
 */

export { U_ROUTES }

// ── The accounting module's shell (shared with group W) ──────────────────────────────────────

export type AccountingTab = 'inbox' | 'ios'

const ACCOUNTING_TABS: { key: AccountingTab; label: string; path: string }[] = [
  { key: 'inbox', label: 'Document inbox', path: U_ROUTES.inbox },
  { key: 'ios', label: 'Statements of open items', path: '/accounting/ios' },
]

export function accountingTabs(current: AccountingTab): ModuleTab[] {
  return ACCOUNTING_TABS.map((tab) => ({
    key: tab.key,
    label: tab.label,
    href: `#${tab.path}`,
    current: tab.key === current,
  }))
}

/** Milica's accounting at Kvadrat Gradnja d.o.o. on 14 October 2026. */
export function AccountingShell({
  phone,
  tab,
  crumbs,
  bottomBar,
  children,
}: {
  phone: boolean
  tab: AccountingTab
  crumbs: { label: string; href?: string }[]
  bottomBar?: ReactNode
  children: ReactNode
}) {
  return (
    <Tenant today={U_TODAY}>
      <Shell
        phone={phone}
        crumbs={crumbs}
        tabs={accountingTabs(tab)}
        {...(bottomBar === undefined ? {} : { bottomBar })}
      >
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

// ── Shared pieces ─────────────────────────────────────────────────────────────────────────────

/** The documents as the application keeps them, above the screens. */
function useDocuments() {
  return useExampleState<InboxDoc[]>('U.documents', () => DOCUMENTS)
}

function stateBadge(state: DocState) {
  return <StatusBadge label={state} tone={toneFor(state, DOC_TONES)} />
}

/** A document's name in a list or a title: the sender, or that it is unknown. */
function senderOf(doc: InboxDoc): string {
  return doc.sender ?? 'Unknown sender'
}

/** "Supplier invoice 2026-1187" or the file's name. */
function documentName(doc: InboxDoc): string {
  return doc.number === undefined ? doc.file : `${doc.kind} ${doc.number}`
}

/** The next posting number the Core would give (illustrative). */
function postedAsFor(doc: InboxDoc, count: number): string {
  if (doc.kind === 'Bank statement') return `Statement ${doc.number ?? ''}`.trim()
  if (doc.kind === 'Contract' || doc.kind === 'Other') {
    return `File 2026-${String(311 + count)}`
  }
  return `UF-2026-${String(1231 + count)}`
}

/** The main decision's words by kind. */
function confirmLabel(doc: InboxDoc): string {
  if (doc.kind === 'Bank statement') return 'Confirm and import'
  if (doc.kind === 'Contract' || doc.kind === 'Other') return 'Confirm and file'
  return 'Confirm and post'
}

// ── The inbox ─────────────────────────────────────────────────────────────────────────────────

const INBOX_FILTERS: FilterDefinition[] = [
  {
    id: 'kind',
    label: 'Type',
    type: 'multiSelect',
    options: DOC_KINDS.map((kind) => ({ value: kind, label: kind })),
  },
  {
    id: 'source',
    label: 'Source',
    type: 'select',
    options: DOC_SOURCES.map((source) => ({ value: source, label: source })),
  },
]

function matchesInbox(doc: InboxDoc, search: string, filters: DataTableFilters): boolean {
  const query = search.trim().toLocaleLowerCase('sr-Latn')
  if (
    query !== '' &&
    ![doc.sender ?? '', doc.number ?? '', doc.file, doc.senderDetail ?? ''].some((text) =>
      text.toLocaleLowerCase('sr-Latn').includes(query),
    )
  ) {
    return false
  }
  const kinds = filters.kind
  if (Array.isArray(kinds) && kinds.length > 0 && !kinds.includes(doc.kind)) return false
  const source = filters.source
  return typeof source !== 'string' || source === '' || source === doc.source
}

function Received({ instant }: { instant: string }) {
  const { format } = useLiro()
  return <span className="bidi-isolate whitespace-nowrap">{instantText(format, instant)}</span>
}

const INBOX_COLUMNS: DataTableColumn<InboxDoc>[] = [
  {
    id: 'document',
    header: 'Document',
    minWidth: 220,
    cell: (doc) => (
      <span className="flex flex-col gap-0.5">
        <span className="bidi-content font-medium">{doc.kind}</span>
        <span className="bidi-isolate text-xs text-secondary">{doc.number ?? doc.file}</span>
      </span>
    ),
  },
  {
    id: 'sender',
    header: 'Sender',
    minWidth: 200,
    cell: (doc) => (
      <span className="flex flex-col gap-0.5">
        {doc.sender === null ? (
          <span className="bidi-content text-tertiary">Unknown sender</span>
        ) : (
          <span className="bidi-content">{doc.sender}</span>
        )}
        {doc.senderDetail !== undefined && (
          <span className="bidi-isolate text-xs text-secondary">{doc.senderDetail}</span>
        )}
      </span>
    ),
  },
  {
    id: 'received',
    header: 'Received',
    numeric: true,
    cell: (doc) => <Received instant={doc.received} />,
  },
  { id: 'source', header: 'Source', cell: (doc) => doc.source },
  {
    id: 'total',
    header: 'Amount',
    align: 'end',
    numeric: true,
    cell: (doc) =>
      doc.total === undefined ? null : <MoneyText value={doc.total ?? null} currency="RSD" />,
  },
  {
    id: 'state',
    header: 'State',
    minWidth: 180,
    cell: (doc) => (
      <span className="flex flex-col items-start gap-1">
        {stateBadge(doc.state)}
        {doc.condition !== undefined && (
          <span className="bidi-content text-xs text-secondary">
            {CONDITION_TEXT[doc.condition]}
          </span>
        )}
      </span>
    ),
  },
]

/** What a done document's preview shows. */
function outcomeOf(doc: InboxDoc, documents: readonly InboxDoc[], format: LiroFormat): string {
  if (doc.state === 'Posted') return `Posted as ${doc.postedAs ?? ''}`.trim()
  if (doc.state === 'Rejected') return doc.rejectReason ?? 'Rejected'
  const original = documents.find((each) => each.id === doc.duplicateOf)
  return original === undefined
    ? 'Duplicate'
    : `Duplicate of ${documentName(original)}, received ${instantText(format, original.received)}`
}

export function DocumentInbox({
  phone,
  start,
}: {
  phone: boolean
  start: { view: InboxView; checked?: number }
}) {
  const navigate = useContext(Navigate)
  const { format } = useLiro()
  const [documents, setDocuments] = useDocuments()
  const [view, setView] = useState<InboxView>(start.view)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<DataTableFilters>({})
  const rows = useMemo(
    () =>
      documents
        .filter((doc) => inInboxView(doc, view) && matchesInbox(doc, search, filters))
        .sort((a, b) => b.received.localeCompare(a.received)),
    [documents, view, search, filters],
  )
  const [selection, setSelection] = useState<string[]>(() =>
    rows
      .filter(isToReview)
      .slice(0, start.checked ?? 0)
      .map((doc) => doc.id),
  )
  const [rejecting, setRejecting] = useState(false)
  const [previewing, setPreviewing] = useState<InboxDoc | null>(null)
  const toReview = documents.filter(isToReview)
  const added = useRef(0)

  const addFiles = (files: File[]) => {
    const now = '2026-10-14T09:40'
    const fresh: InboxDoc[] = files.map((file) => {
      added.current += 1
      return {
        id: `new-${String(added.current)}`,
        kind: 'Other',
        source: 'Upload',
        sender: null,
        senderDetail: 'Uploaded by Milica Petrović',
        received: now,
        file: file.name,
        state: 'New',
        condition: 'processing',
        pages: [],
        regions: [],
      }
    })
    setDocuments((list) => [...fresh, ...list])
    setView('review')
    const count = format.number(String(files.length))
    notice.info(
      `${count} ${files.length === 1 ? 'document is' : 'documents are'} being recognised.`,
    )
  }

  const checkedText = `${format.number(String(selection.length))} ${selection.length === 1 ? 'document' : 'documents'}`

  return (
    <AccountingShell
      phone={phone}
      tab="inbox"
      crumbs={[{ label: 'Accounting' }, { label: 'Document inbox' }]}
    >
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Document inbox"
        actions={
          <>
            <FileDropzone
              label="Add documents"
              description={`Or forward them to ${INBOX_ADDRESS}. Recognition starts at once.`}
              accept={['.pdf', '.xml', 'image/jpeg', 'image/png']}
              acceptText="PDF, XML, JPG or PNG"
              maxSize={20 * 1024 * 1024}
              maxSizeText="20 MB"
              camera
              layout={phone ? 'phone' : 'desktop'}
              onFiles={addFiles}
              className="min-w-0 flex-1 basis-80"
            />
            {toReview.length === 0 ? null : (
              <Button
                family="primary"
                icon={ListChecks}
                emphasis="primary"
                label={`Review ${format.number(String(toReview.length))} documents`}
                onClick={() => {
                  navigate(U_ROUTES.review)
                }}
              />
            )}
          </>
        }
        views={INBOX_VIEWS.map((each) => ({
          id: each.id,
          label: each.label,
          count: documents.filter((doc) => inInboxView(doc, each.id)).length,
        }))}
        view={view}
        onViewChange={(id) => {
          setView(id as InboxView)
          setSelection([])
        }}
        filterBar={
          <FilterBar
            inCard
            layout={phone ? 'phone' : 'desktop'}
            filters={INBOX_FILTERS}
            inline={2}
            values={filters}
            onValuesChange={setFilters}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Sender, number or file"
          />
        }
      >
        <DataTable
          label="Documents"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={INBOX_COLUMNS}
          rows={rows}
          getRowId={(doc) => doc.id}
          getRowLabel={(doc) => `${senderOf(doc)}, ${doc.number ?? doc.file}`}
          filters={{ ...filters, search }}
          onFiltersChange={() => {
            setFilters({})
            setSearch('')
          }}
          count={rows.length}
          onRowClick={(doc) => {
            if (isToReview(doc)) navigate(U_ROUTES.reviewOf(doc.id))
            else setPreviewing(doc)
          }}
          selection={selection}
          onSelectionChange={setSelection}
          onSelectAll={() => {
            setSelection(rows.map((doc) => doc.id))
          }}
          bulkActions={[
            {
              key: 'reject',
              family: 'destructive',
              icon: Ban,
              label: 'Reject…',
              onClick: () => {
                setRejecting(true)
              },
            },
            {
              key: 'review',
              family: 'neutral',
              icon: ListChecks,
              label: 'Review',
              ...(selection.some((id) => documents.some((doc) => doc.id === id && isToReview(doc)))
                ? {}
                : { unavailableReason: 'None of the checked documents waits for a review.' }),
              onClick: () => {
                const first = rows.find((doc) => selection.includes(doc.id) && isToReview(doc))
                if (first !== undefined) navigate(U_ROUTES.reviewOf(first.id))
              },
            },
          ]}
          mobile={{
            title: (doc) => senderOf(doc),
            subtitle: (doc) => (
              <span className="bidi-isolate">
                {doc.kind} · {doc.number ?? doc.file}
              </span>
            ),
            badge: (doc) => stateBadge(doc.state),
            details: ['received', 'total'],
          }}
        />
      </ListPage>
      <ReasonConfirmDialog
        open={rejecting}
        onOpenChange={setRejecting}
        family="destructive"
        actionIcon={Ban}
        title={`Reject ${checkedText}?`}
        message="Rejected documents stay in the inbox under Rejected and duplicates, with the reason."
        confirmLabel="Reject"
        reasons={REJECT_REASONS}
        onConfirm={(answer) => {
          const reason = REJECT_REASONS.find((each) => each.value === answer.reason)?.label ?? ''
          setDocuments((list) =>
            list.map((doc) =>
              selection.includes(doc.id)
                ? {
                    ...doc,
                    state: 'Rejected',
                    rejectReason: answer.text === '' ? reason : `${reason}: ${answer.text}`,
                  }
                : doc,
            ),
          )
          notice.success(`${checkedText} rejected.`)
          setSelection([])
        }}
      />
      {previewing !== null && (
        <QuickPreview
          open
          onOpenChange={(open) => {
            if (!open) setPreviewing(null)
          }}
          title={documentName(previewing)}
          description={stateBadge(previewing.state)}
          items={[
            { label: 'Sender', value: senderOf(previewing) },
            { label: 'Received', value: <Received instant={previewing.received} />, numeric: true },
            { label: 'Source', value: previewing.source },
            { label: 'File', value: <span dir="ltr">{previewing.file}</span> },
            { label: 'Outcome', value: outcomeOf(previewing, documents, format), fullWidth: true },
          ]}
          onOpenRecord={() => {
            setPreviewing(null)
          }}
        >
          <PageViewer
            label={`${documentName(previewing)}, ${senderOf(previewing)}`}
            pages={previewing.pages}
            className="h-96"
          />
        </QuickPreview>
      )}
    </AccountingShell>
  )
}

// ── The review ────────────────────────────────────────────────────────────────────────────────

/** What the user made of a document so far. */
interface Draft {
  supplier: LookupOption | null
  values: Record<string, string | null>
  /** The values the user changed. */
  changed: string[]
  lines: ReadLine[]
  /** Entered by hand (recognition failed, or the scan was unreadable). */
  manual: boolean
  /** The password was given: the file opens. */
  unlocked: boolean
}

/** The fields a document entered by hand asks for. */
const MANUAL_FIELDS: ReadValue[] = [
  { id: 'number', label: 'Number', kind: 'text', value: null, ltr: true },
  { id: 'issueDate', label: 'Issue date', kind: 'date', value: null },
  { id: 'dueDate', label: 'Due date', kind: 'date', value: null },
  { id: 'vat20', label: 'VAT at 20%', kind: 'money', value: null },
  { id: 'total', label: 'Total', kind: 'money', value: null },
]

function startDraft(doc: InboxDoc): Draft {
  const recognition = doc.recognition
  const values: Record<string, string | null> = {}
  for (const field of [...(recognition?.facts ?? []), ...(recognition?.amounts ?? [])]) {
    values[field.id] = field.value
  }
  return {
    supplier: supplierOption(recognition?.supplier?.match ?? null),
    values,
    changed: [],
    lines: recognition?.lines ?? [],
    manual: doc.condition === 'failed',
    unlocked: false,
  }
}

/** Why the document cannot be confirmed yet, or null. */
function problemOf(doc: InboxDoc, draft: Draft): string | null {
  if (doc.condition === 'processing') return 'Recognition is still running.'
  if (doc.condition === 'password' && !draft.unlocked) return 'The file is locked with a password.'
  if (doc.condition === 'unreadable' && !draft.manual) {
    return 'The scan cannot be read: upload a better copy or enter it by hand.'
  }
  if (doc.kind === 'Supplier invoice' || doc.kind === 'Receipt' || draft.manual) {
    const missing = [
      draft.supplier === null ? 'the supplier' : null,
      (draft.values.number ?? null) === null ? 'the number' : null,
      (draft.values.total ?? null) === null ? 'the total' : null,
    ].filter((each) => each !== null)
    if (missing.length > 0) {
      return `Enter ${missing.join(', ').replace(/, ([^,]*)$/, ' and $1')}.`
    }
  }
  return null
}

const LINE_COLUMNS: EditableGridColumn<ReadLine>[] = [
  {
    id: 'description',
    header: 'Description',
    type: 'text',
    width: 220,
    value: (line) => line.description,
  },
  { id: 'unit', header: 'Unit', type: 'text', width: 72, value: (line) => line.unit },
  {
    id: 'quantity',
    header: 'Quantity',
    type: 'number',
    width: 96,
    value: (line) => line.quantity,
  },
  {
    id: 'price',
    header: 'Price',
    type: 'number',
    width: 120,
    decimals: 2,
    value: (line) => line.price,
  },
  {
    id: 'amount',
    header: 'Amount',
    type: 'number',
    width: 130,
    decimals: 2,
    value: (line) => line.amount,
  },
  {
    id: 'account',
    header: 'Account',
    type: 'combobox',
    width: 230,
    value: (line) => COST_ACCOUNTS.find((each) => each.value === line.account) ?? null,
    options: COST_ACCOUNTS,
  },
]

/** One field of the review: what was read, with its confidence, as the right kind of field. */
function ReadField({
  field,
  draft,
  shown,
  onShow,
  onChange,
}: {
  field: ReadValue
  draft: Draft
  shown: string | null
  onShow: (region: string) => void
  onChange: (id: string, value: string | null) => void
}) {
  const value = draft.values[field.id] ?? null
  const control = (describedBy?: string) => {
    const common = {
      label: field.label,
      ...(describedBy === undefined ? {} : { describedBy }),
    }
    if (field.kind === 'date') {
      return (
        <DateField
          {...common}
          value={value}
          onChange={(next) => {
            onChange(field.id, next)
          }}
        />
      )
    }
    if (field.kind === 'money') {
      return (
        <MoneyField
          {...common}
          currency="RSD"
          value={value}
          onChange={(next) => {
            onChange(field.id, next)
          }}
        />
      )
    }
    return (
      <TextField
        {...common}
        {...(field.ltr === true ? { direction: 'ltr' as const } : {})}
        value={value ?? ''}
        onChange={(next) => {
          onChange(field.id, next === '' ? null : next)
        }}
      />
    )
  }
  if (draft.manual) return control()
  const region = field.region
  return (
    <RecognizedField
      {...(field.confidence === undefined ? {} : { confidence: field.confidence })}
      low={field.low === true}
      {...(field.lowLabel === undefined ? {} : { lowLabel: field.lowLabel })}
      changed={draft.changed.includes(field.id)}
      {...(region === undefined
        ? {}
        : {
            sourceShown: shown === region,
            onShowSource: () => {
              onShow(region)
            },
          })}
    >
      {(describedBy) => control(describedBy)}
    </RecognizedField>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="bidi-content m-0 text-h4 text-primary">{children}</h3>
}

function ReviewDetail({
  doc,
  draft,
  phone,
  documents,
  shown,
  onShow,
  onChange,
  onUnlock,
  onMarkDuplicate,
}: {
  doc: InboxDoc
  draft: Draft
  phone: boolean
  documents: readonly InboxDoc[]
  shown: string | null
  onShow: (region: string | null) => void
  onChange: (patch: Partial<Draft>) => void
  onUnlock: () => void
  onMarkDuplicate: () => void
}) {
  const { format } = useLiro()
  const recognition = doc.recognition
  const supplier = recognition?.supplier
  const [query, setQuery] = useState('')
  const results = SUPPLIERS.filter((each) =>
    `${each.label} ${each.description ?? ''}`
      .toLocaleLowerCase('sr-Latn')
      .includes(query.trim().toLocaleLowerCase('sr-Latn')),
  )
  const done = !isToReview(doc)
  const original = documents.find((each) => each.id === doc.duplicateOf)
  const toggle = (region: string) => {
    onShow(shown === region ? null : region)
  }
  const setValue = (id: string, value: string | null) => {
    onChange({
      values: { ...draft.values, [id]: value },
      changed: draft.changed.includes(id) ? draft.changed : [...draft.changed, id],
    })
  }

  const viewer = (
    <PageViewer
      key={doc.id}
      label={`${documentName(doc)}, ${senderOf(doc)}`}
      pages={doc.pages}
      regions={doc.regions}
      highlight={shown}
      className={phone ? 'h-80' : 'h-[30rem]'}
      {...(doc.condition === 'password' && !draft.unlocked
        ? {
            unavailable: (
              <EmptyState
                compact
                icon={KeyRound}
                title="This PDF is locked with a password"
                description="Ask the sender for the password, or for a copy without one."
                action={{ label: 'Enter the password…', onClick: onUnlock }}
              />
            ),
          }
        : {})}
    />
  )

  const facts = draft.manual ? MANUAL_FIELDS.slice(0, 3) : (recognition?.facts ?? [])
  const amounts = draft.manual ? MANUAL_FIELDS.slice(3) : (recognition?.amounts ?? [])
  const supplierField =
    doc.kind === 'Bank statement' || doc.kind === 'Contract' ? null : (
      <LookupField
        label="Supplier"
        {...(supplier === undefined
          ? {}
          : {
              description:
                supplier.match === null
                  ? `Not in your suppliers: tax number ${supplier.taxId} was read. Create it from “${supplier.name}”.`
                  : `Matched in your suppliers by tax number ${supplier.taxId}.`,
            })}
        value={draft.supplier}
        onChange={(option) => {
          onChange({ supplier: option })
        }}
        onSearch={setQuery}
        results={results}
        recent={SUPPLIERS.slice(0, 3)}
        create={[{ kind: 'supplier', noun: 'supplier' }]}
        onCreate={(_kind, text) => {
          const name = text.trim() === '' ? (supplier?.name ?? '') : text.trim()
          onChange({
            supplier: {
              value: 'created',
              label: name,
              description: supplier === undefined ? '' : `PIB ${supplier.taxId}`,
              kind: 'supplier',
            },
          })
          notice.success(`Supplier ${name} created.`)
        }}
        {...(supplier?.match === null ? { defaultQuery: supplier.name } : {})}
      />
    )

  const linesMessages: Record<string, GridMessage[]> = {}
  const linesDetails: Record<string, GridDetail[]> = {}
  for (const line of draft.lines) {
    if (line.uncertain !== undefined && !draft.changed.includes(`line-${line.id}`)) {
      linesMessages[line.id] = [
        { tone: 'warning', text: line.uncertain.text, columns: line.uncertain.columns },
      ]
    }
    if (line.accountNote !== undefined) linesDetails[line.id] = [{ text: line.accountNote }]
  }

  return (
    <div className={phone ? 'flex flex-col gap-6' : 'flex flex-col gap-6 p-6'}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="bidi-content m-0 text-h2 text-primary">{senderOf(doc)}</h2>
          <p className="bidi-content m-0 text-sm text-secondary">
            {doc.kind} · <span dir="ltr">{doc.number ?? doc.file}</span> · {doc.source},{' '}
            <Received instant={doc.received} />
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {doc.total !== undefined && doc.total !== null && (
            <bdi className="text-xl font-semibold whitespace-nowrap text-primary tabular-nums">
              {format.money(doc.total, 'RSD')}
            </bdi>
          )}
          {stateBadge(doc.state)}
        </div>
      </div>

      {done && (
        <Alert tone={doc.state === 'Posted' ? 'success' : 'neutral'} title={doc.state}>
          {outcomeOf(doc, documents, format)}
        </Alert>
      )}
      {!done && original !== undefined && doc.state !== 'Duplicate' && (
        <DuplicateWarning
          message="Same supplier, number and total as a document already in the inbox."
          matches={[
            {
              key: original.id,
              href: `#${U_ROUTES.reviewOf(original.id)}`,
              type: original.kind,
              number: original.number ?? original.file,
              status: stateBadge(original.state),
            },
          ]}
          createAnywayLabel="Mark as duplicate…"
          onCreateAnyway={onMarkDuplicate}
        />
      )}
      {doc.condition === 'processing' && (
        <Alert icon={Clock} title="Recognising the document">
          This takes about a minute. The fields appear here when it is done; you may go on with the
          next document.
        </Alert>
      )}
      {doc.condition === 'failed' && (
        <Alert tone="warning" title="The document could not be recognised">
          Its text is handwritten in part. Enter the supplier, number, dates and amounts by hand
          from the page.
        </Alert>
      )}
      {doc.condition === 'unreadable' && !draft.manual && (
        <Alert
          tone="warning"
          title="The scan cannot be read"
          actions={
            <>
              <Button
                family="neutral"
                icon={Camera}
                label="Upload a better copy"
                onClick={() => {
                  notice.info('Choose a sharper photo or scan of the same document.')
                }}
              />
              <Button
                family="neutral"
                icon={PencilLine}
                label="Enter by hand"
                onClick={() => {
                  onChange({ manual: true })
                }}
              />
            </>
          }
        >
          The photo is out of focus. Take it again in good light, or enter its details by hand.
        </Alert>
      )}
      {doc.condition === 'password' && !draft.unlocked && (
        <Alert icon={KeyRound} title="Locked with a password">
          Once the password is entered, the document is recognised like the others.
        </Alert>
      )}

      <div className="@container min-w-0">
        <div className="grid grid-cols-1 gap-6 @3xl:grid-cols-2">
          <section aria-label="The document" className="min-w-0">
            {viewer}
          </section>
          <section aria-label="Recognised values" className="flex min-w-0 flex-col gap-6">
            {doc.condition === 'processing' ? (
              <div className="flex flex-col gap-4" aria-busy="true">
                <Spinner size="sm">Recognising the document…</Spinner>
                {[0, 1, 2, 3].map((index) => (
                  <Skeleton key={index} className="h-9 w-full" />
                ))}
              </div>
            ) : doc.condition === 'password' && !draft.unlocked ? null : doc.condition ===
                'unreadable' && !draft.manual ? null : (
              <>
                {(supplierField !== null || facts.length > 0) && (
                  <div className="flex flex-col gap-3">
                    <SectionTitle>Details</SectionTitle>
                    <FormGrid columns={1}>
                      {supplierField !== null &&
                        (draft.manual || supplier === undefined ? (
                          supplierField
                        ) : (
                          <RecognizedField
                            confidence={supplier.confidence}
                            changed={(draft.supplier?.value ?? null) !== supplier.match}
                            sourceShown={shown === supplier.region}
                            onShowSource={() => {
                              toggle(supplier.region)
                            }}
                          >
                            {() => supplierField}
                          </RecognizedField>
                        ))}
                      {facts.map((field) => (
                        <ReadField
                          key={field.id}
                          field={field}
                          draft={draft}
                          shown={shown}
                          onShow={toggle}
                          onChange={setValue}
                        />
                      ))}
                    </FormGrid>
                  </div>
                )}
                {amounts.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <SectionTitle>Amounts and VAT by rate</SectionTitle>
                    <FormGrid columns={1}>
                      {amounts.map((field) => (
                        <ReadField
                          key={field.id}
                          field={field}
                          draft={draft}
                          shown={shown}
                          onShow={toggle}
                          onChange={setValue}
                        />
                      ))}
                    </FormGrid>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      {draft.lines.length > 0 && (
        <section aria-label="Lines" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionTitle>Lines and accounts</SectionTitle>
            {doc.regions.some((region) => region.id === 'lines') && (
              <Button
                family="neutral"
                icon={ScanSearch}
                label={
                  shown === 'lines' ? 'Hide the lines on the page' : 'Show the lines on the page'
                }
                onClick={() => {
                  toggle('lines')
                }}
              />
            )}
          </div>
          <EditableGrid
            label={`Lines of ${documentName(doc)}`}
            layout={phone ? 'phone' : 'desktop'}
            columns={LINE_COLUMNS}
            rows={draft.lines}
            getRowId={(line) => line.id}
            onCellChange={(rowId, columnId, value) => {
              onChange({
                lines: draft.lines.map((line) => {
                  if (line.id !== rowId) return line
                  if (columnId === 'account') {
                    const option = value as LookupOption | null
                    return { ...line, account: option?.value ?? null }
                  }
                  return { ...line, [columnId]: value as string | null }
                }),
                changed: draft.changed.includes(`line-${rowId}`)
                  ? draft.changed
                  : [...draft.changed, `line-${rowId}`],
              })
            }}
            onAddRow={(index) => {
              onChange({
                lines: [
                  ...draft.lines.slice(0, index),
                  {
                    id: `l${String(draft.lines.length + 1)}-${String(index)}`,
                    description: '',
                    unit: '',
                    quantity: null,
                    price: null,
                    amount: null,
                    account: null,
                  },
                  ...draft.lines.slice(index),
                ],
              })
            }}
            onRemoveRow={(rowId) => {
              onChange({ lines: draft.lines.filter((line) => line.id !== rowId) })
            }}
            minRows={1}
            messages={linesMessages}
            details={linesDetails}
          />
        </section>
      )}
    </div>
  )
}

/** The review's starting state from its route. */
interface ReviewStart {
  doc?: string
  source?: string
  ask?: 'reject' | 'duplicate'
}

export function DocumentReview({ phone, start }: { phone: boolean; start: ReviewStart }) {
  const { format } = useLiro()
  const [documents, setDocuments] = useDocuments()
  // The queue is fixed when the review opens: decided documents stay in it with their state.
  const [queue] = useState(() =>
    documents
      .filter(isToReview)
      .sort((a, b) => a.received.localeCompare(b.received))
      .map((doc) => doc.id),
  )
  const first = start.doc ?? (phone ? undefined : 'u1')
  const [selected, setSelected] = useState<string | undefined>(first)
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [shown, setShown] = useState<string | null>(start.source ?? null)
  const [asking, setAsking] = useState<'reject' | 'duplicate' | 'password' | null>(
    start.ask ?? null,
  )
  const [password, setPassword] = useState('')
  // The application preselects the original it found ("Mark as duplicate…" asked by the route).
  const [original, setOriginal] = useState<string[]>(() => {
    const asked = documents.find((each) => each.id === first)?.duplicateOf
    return start.ask === 'duplicate' && asked !== undefined ? [asked] : []
  })

  const docs = queue.flatMap((id) => {
    const doc = documents.find((each) => each.id === id)
    return doc === undefined ? [] : [doc]
  })
  const index = docs.findIndex((doc) => doc.id === selected)
  const doc = docs[index]
  const draft = doc === undefined ? undefined : (drafts[doc.id] ?? startDraft(doc))
  const change = (patch: Partial<Draft>) => {
    if (doc === undefined || draft === undefined) return
    setDrafts((current) => ({ ...current, [doc.id]: { ...draft, ...patch } }))
  }
  const choose = (id: string | undefined) => {
    setSelected(id)
    setShown(null)
  }
  const move = (step: number) => {
    const next = docs[(index + step + docs.length) % docs.length]
    if (next !== undefined) choose(next.id)
  }
  const nextOpen = (afterId: string) => {
    const at = docs.findIndex((each) => each.id === afterId)
    return [...docs.slice(at + 1), ...docs.slice(0, at)].find(
      (each) => each.id !== afterId && isToReview(each),
    )
  }
  const setState = (id: string, patch: Partial<InboxDoc>) => {
    setDocuments((list) => list.map((each) => (each.id === id ? { ...each, ...patch } : each)))
  }
  const decided = docs.filter((each) => !isToReview(each)).length
  const posted = documents.filter((each) => each.state === 'Posted').length

  const problem = doc === undefined || draft === undefined ? null : problemOf(doc, draft)
  const confirm = () => {
    if (doc === undefined || draft === undefined || problem !== null || !isToReview(doc)) return
    const before = doc
    const postedAs = postedAsFor(doc, posted)
    setState(doc.id, {
      state: 'Posted',
      postedAs,
      ...(draft.supplier === null ? {} : { sender: draft.supplier.label }),
    })
    const next = nextOpen(doc.id)
    if (next !== undefined) choose(next.id)
    notice.success(
      `${documentName(doc)} ${doc.kind === 'Bank statement' ? 'imported' : 'posted'} as ${postedAs}.`,
      {
        action: {
          label: 'Undo',
          onClick: () => {
            setState(before.id, before)
            choose(before.id)
          },
        },
      },
    )
  }
  const saveForLater = () => {
    if (doc === undefined) return
    const next = nextOpen(doc.id)
    if (next !== undefined) choose(next.id)
    notice.info(`${documentName(doc)} is saved for later, with your changes.`)
  }

  // Enter in a field confirms (after the field has read its text), then the next document opens.
  const latest = useRef(confirm)
  useEffect(() => {
    latest.current = confirm
  })
  const onFormKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    if (event.key !== 'Enter' || event.defaultPrevented || event.shiftKey) return
    if (target.tagName !== 'INPUT') return
    if (target.getAttribute('aria-expanded') === 'true') return
    if (target.closest('[data-slot="editable-grid"]') !== null) return
    window.setTimeout(() => {
      latest.current()
    }, 0)
  }

  const actions: ActionItem[] =
    doc === undefined || !isToReview(doc)
      ? []
      : [
          {
            key: 'later',
            family: 'neutral',
            icon: Clock,
            label: 'Save for later',
            onClick: saveForLater,
          },
          {
            key: 'duplicate',
            family: 'neutral',
            icon: Copy,
            label: 'Mark as duplicate…',
            onClick: () => {
              setOriginal(doc.duplicateOf === undefined ? [] : [doc.duplicateOf])
              setAsking('duplicate')
            },
          },
          {
            key: 'reject',
            family: 'destructive',
            icon: Ban,
            label: 'Reject…',
            onClick: () => {
              setAsking('reject')
            },
          },
          {
            key: 'confirm',
            family: 'primary',
            icon: CircleCheck,
            emphasis: 'primary',
            label: confirmLabel(doc),
            ...(problem === null ? {} : { unavailableReason: problem }),
            onClick: confirm,
          },
        ]
  const decisions = actions.length === 0 ? undefined : <ActionGroup actions={actions} />

  const items: WorklistItem[] = docs.map((each) => ({
    id: each.id,
    label: `${senderOf(each)}, ${each.number ?? each.file}`,
    title: senderOf(each),
    subtitle: (
      <>
        <span className="bidi-content block">
          {each.kind} · {each.number ?? each.file}
        </span>
        <span className="bidi-content block">
          {each.condition === undefined ? (
            <Received instant={each.received} />
          ) : (
            CONDITION_TEXT[each.condition]
          )}
        </span>
      </>
    ),
    ...(each.total === undefined || each.total === null
      ? {}
      : { figure: <bdi>{format.money(each.total, 'RSD')}</bdi> }),
    status: stateBadge(each.state),
  }))

  const progress = `${format.number(String(decided))} of ${format.number(String(docs.length))} documents done`
  const candidates: Candidate[] =
    doc === undefined
      ? []
      : originalCandidates(doc, documents).map((other) => ({
          id: other.id,
          title: <span dir="ltr">{other.number ?? other.file}</span>,
          label: `${senderOf(other)}, ${other.number ?? other.file}`,
          subtitle: (
            <>
              {senderOf(other)} · {other.source}, <Received instant={other.received} /> ·{' '}
              {other.state}
            </>
          ),
          reason: 'Same supplier, number and total',
          ...(other.total === undefined || other.total === null
            ? {}
            : { figure: <MoneyText value={other.total} currency="RSD" /> }),
        }))
  const subject = doc === undefined ? '' : `${documentName(doc)} · ${senderOf(doc)}`

  return (
    <AccountingShell
      phone={phone}
      tab="inbox"
      crumbs={[{ label: 'Document inbox', href: `#${U_ROUTES.inbox}` }, { label: 'Review' }]}
      {...(phone && doc !== undefined && decisions !== undefined ? { bottomBar: decisions } : {})}
    >
      <WorklistPage
        layout={phone ? 'stacked' : 'split'}
        title="Review documents"
        back={{ href: `#${U_ROUTES.inbox}`, label: 'Document inbox' }}
        subtitle="Kvadrat Gradnja d.o.o. · recognised by Liro; check what is marked, then confirm"
        summary={
          <div className="flex min-w-60 flex-col gap-2">
            <span className="bidi-content text-sm font-medium text-primary">{progress}</span>
            <ProgressBar label={progress} value={decided} max={docs.length} />
          </div>
        }
        label="Documents to review"
        items={items}
        {...(selected === undefined ? {} : { selected })}
        onSelect={choose}
        {...(doc === undefined || draft === undefined
          ? {}
          : {
              detail: (
                // Enter in a field confirms; the keys of open lists and of the grid stay theirs.
                <div onKeyDown={onFormKey} role="presentation">
                  <ReviewDetail
                    key={doc.id}
                    doc={doc}
                    draft={draft}
                    phone={phone}
                    documents={documents}
                    shown={shown}
                    onShow={setShown}
                    onChange={change}
                    onUnlock={() => {
                      setPassword('')
                      setAsking('password')
                    }}
                    onMarkDuplicate={() => {
                      setOriginal(doc.duplicateOf === undefined ? [] : [doc.duplicateOf])
                      setAsking('duplicate')
                    }}
                  />
                </div>
              ),
            })}
        {...(decisions === undefined || phone ? {} : { detailActions: decisions })}
        onBack={() => {
          choose(undefined)
        }}
        onPrevious={() => {
          move(-1)
        }}
        onNext={() => {
          move(1)
        }}
      />
      {doc !== undefined && (
        <>
          <ReasonConfirmDialog
            open={asking === 'reject'}
            onOpenChange={(open) => {
              setAsking(open ? 'reject' : null)
            }}
            family="destructive"
            actionIcon={Ban}
            title="Reject"
            subject={subject}
            message="The document is not posted. It stays in the inbox under Rejected and duplicates, with the reason."
            confirmLabel="Reject"
            reasons={REJECT_REASONS}
            onConfirm={(answer) => {
              const reason =
                REJECT_REASONS.find((each) => each.value === answer.reason)?.label ?? ''
              setState(doc.id, {
                state: 'Rejected',
                rejectReason: answer.text === '' ? reason : `${reason}: ${answer.text}`,
              })
              const next = nextOpen(doc.id)
              if (next !== undefined) choose(next.id)
              notice.success(`${documentName(doc)} rejected.`)
            }}
          />
          <Dialog
            open={asking === 'duplicate'}
            onOpenChange={(open) => {
              setAsking(open ? 'duplicate' : null)
            }}
            title="Mark as duplicate"
            subject={subject}
            description="Choose the original. The duplicate is not posted; it keeps a link to the original."
            actions={
              <>
                <Button
                  intent="cancel"
                  label="Cancel"
                  onClick={() => {
                    setAsking(null)
                  }}
                />
                <Button
                  family="primary"
                  icon={Copy}
                  emphasis="primary"
                  label="Mark as duplicate"
                  disabled={original.length === 0}
                  onClick={() => {
                    const of = original[0]
                    if (of === undefined) return
                    setState(doc.id, { state: 'Duplicate', duplicateOf: of })
                    setAsking(null)
                    const next = nextOpen(doc.id)
                    if (next !== undefined) choose(next.id)
                    notice.success(`${documentName(doc)} marked as a duplicate.`)
                  }}
                />
              </>
            }
          >
            <CandidateList
              label="The original"
              multiple={false}
              candidates={candidates}
              selected={original}
              onSelectedChange={setOriginal}
              empty={
                <p className="bidi-content m-0 text-sm text-secondary">
                  No document in the inbox has the same supplier and number.
                </p>
              }
            />
          </Dialog>
          <Dialog
            open={asking === 'password'}
            onOpenChange={(open) => {
              setAsking(open ? 'password' : null)
            }}
            title="Open the locked PDF"
            subject={doc.file}
            description="The password is used once to open the file and is not kept."
            actions={
              <>
                <Button
                  intent="cancel"
                  label="Cancel"
                  onClick={() => {
                    setAsking(null)
                  }}
                />
                <Button
                  family="primary"
                  icon={KeyRound}
                  emphasis="primary"
                  label="Open"
                  disabled={password === ''}
                  onClick={() => {
                    change({ unlocked: true })
                    setState(doc.id, { condition: 'processing' })
                    setAsking(null)
                    notice.info(`${doc.file} is open and being recognised.`)
                  }}
                />
              </>
            }
          >
            <PasswordField label="Password" value={password} onChange={setPassword} />
          </Dialog>
        </>
      )}
    </AccountingShell>
  )
}

export const GROUP_U_ROUTES: ExampleRoute[] = [
  {
    path: U_ROUTES.inbox,
    render: (phone) => <DocumentInbox phone={phone} start={{ view: 'review' }} />,
  },
  {
    path: U_ROUTES.inboxAll,
    render: (phone) => <DocumentInbox phone={phone} start={{ view: 'all' }} />,
  },
  {
    path: U_ROUTES.inboxChecked,
    render: (phone) => <DocumentInbox phone={phone} start={{ view: 'review', checked: 3 }} />,
  },
  { path: U_ROUTES.review, render: (phone) => <DocumentReview phone={phone} start={{}} /> },
  {
    path: U_ROUTES.reviewSource,
    render: (phone) => <DocumentReview phone={phone} start={{ doc: 'u1', source: 'dueDate' }} />,
  },
  {
    path: U_ROUTES.reviewReject,
    render: (phone) => <DocumentReview phone={phone} start={{ doc: 'u1', ask: 'reject' }} />,
  },
  {
    path: U_ROUTES.reviewDuplicate,
    render: (phone) => <DocumentReview phone={phone} start={{ doc: 'u6', ask: 'duplicate' }} />,
  },
  ...['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9', 'u16', 'u17'].map((id) => ({
    path: U_ROUTES.reviewOf(id),
    render: (phone: boolean) => <DocumentReview phone={phone} start={{ doc: id }} />,
  })),
]
