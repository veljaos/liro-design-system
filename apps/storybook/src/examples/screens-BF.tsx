import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight, Check, Reply, UserRound } from 'lucide-react'
import { useContext, useState } from 'react'
import {
  ActionGroup,
  ActivityList,
  AttachmentList,
  Button,
  DateField,
  DateText,
  DetailPage,
  DueDate,
  FileDropzone,
  FormFullWidth,
  FormSection,
  KeyValueList,
  notice,
  RadioGroupField,
  RecordFormPage,
  RegisterPage,
  RelatedDocuments,
  SelectField,
  StatusBadge,
  TextAreaField,
  TextField,
  toneFor,
  useLiro,
  type ActionItem,
  type DataTableColumn,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate } from './example-shell'
import { RECORD_LINK, RecordsShell } from './screens-BE'
import {
  ASSIGNEES,
  BF_ROUTES,
  CLASSIFICATIONS,
  ENTRY_405_ACTIVITY,
  ENTRY_405_FILES,
  NEXT_REGISTRY_NUMBER,
  RECEIVED_BY,
  REGISTRY,
  REGISTRY_COUNT,
  REGISTRY_TONES,
  registryEntry,
  type RegistryEntry,
  type RegistryKind,
  type RegistryState,
} from './data-BF'
import { BE_ROUTES } from './data-BE'
import { BG_ROUTES } from './data-BG'

/*
 * Group BF's example screens (P5.68, the registry book — delovodnik): Kvadrat Gradnja d.o.o.'s
 * book for 2026 on 14 October 2026.
 * - The book (RegisterPage): number, date entered, incoming / outgoing / internal in words with
 *   an icon, the sender or recipient, the subject with the act's own number, who works on it, the
 *   due date (DueDate: "2 days overdue" in words), the state, the linked document; a wrong entry
 *   is corrected by a new one that refers to it (409 → 411), never deleted. "New entry" is the
 *   main action; outgoing acts take their number when a document is numbered (group BE).
 * - An entry (DetailPage): the act, the assignment with its history, the linked documents
 *   (RelatedDocuments: the reply drafted in group BE) and the files (AttachmentList).
 * - A new entry (RecordFormPage): incoming, outgoing or internal; for incoming the sender, their
 *   number and date, how it came; the subject, the classification of the archive's plan (group
 *   BG), who works on it and by when, the scanned act (FileDropzone). The number is the book's,
 *   given when the entry is saved.
 */

export { BF_ROUTES }

const KIND_ICONS: Record<RegistryKind, typeof ArrowDownLeft> = {
  Incoming: ArrowDownLeft,
  Outgoing: ArrowUpRight,
  Internal: ArrowRightLeft,
}

export function registryBadge(state: RegistryState) {
  return <StatusBadge label={state} tone={toneFor(state, REGISTRY_TONES)} />
}

/** "Incoming" with its arrow; the arrow mirrors in right to left. */
function KindText({ kind }: { kind: RegistryKind }) {
  const Icon = KIND_ICONS[kind]
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <Icon aria-hidden="true" className="size-3.5 shrink-0 text-secondary rtl:-scale-x-100" />
      {kind}
    </span>
  )
}

function SubjectCell({ entry }: { entry: RegistryEntry }) {
  return (
    <span className="flex flex-col gap-0.5">
      <span className="bidi-content">{entry.subject}</span>
      <span className="text-xs text-secondary">
        <bdi dir="ltr">{entry.actNumber}</bdi>
        {' · '}
        <DateText value={entry.actDate} />
      </span>
    </span>
  )
}

function LinkedCell({ entry }: { entry: RegistryEntry }) {
  const { linkComponent: Link, format } = useLiro()
  const files =
    entry.files === 0
      ? null
      : `${format.number(String(entry.files))} ${entry.files === 1 ? 'file' : 'files'}`
  return (
    <span className="flex flex-col gap-0.5">
      {entry.document === undefined ? null : (
        <Link href={entry.document.href} className={RECORD_LINK}>
          {entry.document.label}
        </Link>
      )}
      {files === null ? (
        entry.document === undefined ? (
          '—'
        ) : null
      ) : (
        <span className="text-xs text-secondary">{files}</span>
      )}
    </span>
  )
}

const COLUMNS: DataTableColumn<RegistryEntry>[] = [
  {
    id: 'entered',
    header: 'Entered',
    numeric: true,
    cell: (entry) => <DateText value={entry.entered} />,
  },
  { id: 'kind', header: 'Kind', cell: (entry) => <KindText kind={entry.kind} /> },
  {
    id: 'party',
    header: 'Sender or recipient',
    minWidth: 180,
    cell: (entry) => <span className="bidi-content">{entry.party}</span>,
  },
  {
    id: 'subject',
    header: 'Subject',
    minWidth: 260,
    cell: (entry) => <SubjectCell entry={entry} />,
  },
  { id: 'assignee', header: 'Assignee', cell: (entry) => entry.assignee },
  {
    id: 'due',
    header: 'Due date',
    cell: (entry) => <DueDate value={entry.due} settled={entry.done} />,
  },
  { id: 'state', header: 'State', cell: (entry) => registryBadge(entry.state) },
  { id: 'linked', header: 'Linked', cell: (entry) => <LinkedCell entry={entry} /> },
]

type Show = 'all' | 'incoming' | 'outgoing' | 'internal' | 'open'

function shows(entry: RegistryEntry, show: Show): boolean {
  if (show === 'all') return true
  if (show === 'open') return !entry.done
  return entry.kind.toLowerCase() === show
}

function RegistryBook({ phone, show: startShow }: { phone: boolean; show: Show }) {
  const navigate = useContext(Navigate)
  const { format } = useLiro()
  const [show, setShow] = useState<Show>(startShow)
  const [year, setYear] = useState('2026')
  const rows = REGISTRY.filter((entry) => shows(entry, show))
  const newEntry = (
    <Button
      intent="create"
      emphasis="primary"
      label="New entry"
      onClick={() => {
        navigate(BF_ROUTES.newEntry)
      }}
    />
  )
  return (
    <RecordsShell
      phone={phone}
      tab="registry"
      crumbs={[{ label: 'Registry book' }]}
      {...(phone ? { bottomBar: newEntry } : {})}
    >
      <RegisterPage
        layout={phone ? 'phone' : 'desktop'}
        title="Registry book 2026"
        subtitle={`Kvadrat Gradnja d.o.o. · ${format.number(String(REGISTRY_COUNT))} acts entered; entries are corrected, never deleted.`}
        actions={
          <>
            <Button intent="print" emphasis="secondary" label="Print" />
            <Button intent="export" label="Export" />
            {phone ? null : newEntry}
          </>
        }
        period={
          <SelectField
            label="Year"
            options={[
              { value: '2026', label: '2026' },
              { value: '2025', label: '2025, in the archive' },
            ]}
            value={year}
            onChange={(next) => {
              if (next === '2025') navigate(BG_ROUTES.book)
              else setYear(next)
            }}
            className="w-56"
          />
        }
        tools={
          <SelectField
            label="Show"
            options={[
              { value: 'all', label: 'All acts' },
              { value: 'open', label: 'Not done' },
              { value: 'incoming', label: 'Incoming' },
              { value: 'outgoing', label: 'Outgoing' },
              { value: 'internal', label: 'Internal' },
            ]}
            value={show}
            onChange={(next) => {
              setShow(next as Show)
            }}
            className="w-48"
          />
        }
        columns={COLUMNS}
        rows={rows}
        getRowId={(entry) => entry.number}
        getRowLabel={(entry) => `No. ${entry.number}, ${entry.subject}`}
        entry={(entry) => ({
          number: entry.number,
          ...(entry.corrects === undefined ? {} : { corrects: entry.corrects }),
          ...(entry.correctedBy === undefined ? {} : { correctedBy: entry.correctedBy }),
        })}
        rowActions={(entry) => [
          {
            label: 'Open',
            onSelect: () => {
              navigate(BF_ROUTES.entryOf(entry.number))
            },
          },
          ...(entry.kind === 'Incoming' && !entry.done
            ? [
                {
                  label: 'Reply',
                  onSelect: () => {
                    navigate(BE_ROUTES.draft('letter'))
                  },
                },
              ]
            : []),
          { label: 'Correct entry', onSelect: () => undefined },
        ]}
        onRowClick={(entry) => {
          navigate(BF_ROUTES.entryOf(entry.number))
        }}
        count={rows.length}
        mobile={{
          title: (entry) => entry.subject,
          subtitle: (entry) => (
            <span className="bidi-content">{`${entry.kind} · ${entry.party}`}</span>
          ),
          badge: (entry) => registryBadge(entry.state),
          details: ['entered', 'assignee', 'due'],
        }}
      />
    </RecordsShell>
  )
}

// ── One entry ─────────────────────────────────────────────────────────────────────────────────

function Entry({ phone, number }: { phone: boolean; number: string }) {
  const navigate = useContext(Navigate)
  const entry = registryEntry(number)
  const [done, setDone] = useState(entry?.done ?? false)
  if (entry === undefined) return null
  const state: RegistryState = done && !entry.done ? 'Answered' : entry.state
  const actions: ActionItem[] = [
    {
      key: 'reassign',
      label: 'Reassign',
      family: 'neutral',
      icon: UserRound,
      emphasis: 'secondary',
    },
    ...(entry.kind === 'Incoming'
      ? [
          {
            key: 'reply',
            label: 'Reply',
            family: 'document' as const,
            icon: Reply,
            emphasis: 'secondary' as const,
            onClick: () => {
              navigate(BE_ROUTES.draft('letter'))
            },
          },
        ]
      : []),
    ...(done
      ? []
      : [
          {
            key: 'done',
            label: 'Mark as done',
            family: 'positive' as const,
            icon: Check,
            emphasis: 'primary' as const,
            onClick: () => {
              setDone(true)
              notice.success(`No. ${entry.number} marked as done.`)
            },
          },
        ]),
  ]
  const related =
    entry.document === undefined
      ? []
      : [
          {
            key: 'doc',
            type: entry.kind === 'Incoming' ? 'Reply' : 'Document',
            number: entry.document.label,
            href: entry.document.href,
          },
        ]
  return (
    <RecordsShell
      phone={phone}
      tab="registry"
      crumbs={[{ label: 'Registry book', href: `#${BF_ROUTES.book}` }, { label: `No. ${number}` }]}
    >
      <DetailPage
        layout={phone ? 'phone' : 'desktop'}
        title={`No. ${entry.number}`}
        back={{ href: `#${BF_ROUTES.book}`, label: 'Registry book' }}
        status={registryBadge(state)}
        subtitle={<span className="bidi-content">{`${entry.kind} · ${entry.party}`}</span>}
        actions={<ActionGroup actions={actions} />}
        keyFigures={[
          { key: 'entered', label: 'Entered', value: <DateText value={entry.entered} /> },
          {
            key: 'due',
            label: 'Due date',
            value: <DueDate value={entry.due} settled={done} />,
          },
          { key: 'assignee', label: 'Assignee', value: entry.assignee },
        ]}
        sections={[
          {
            id: 'act',
            label: 'The act',
            content: (
              <KeyValueList
                items={[
                  { label: 'Subject', value: entry.subject },
                  { label: entry.kind === 'Incoming' ? 'Sender' : 'Recipient', value: entry.party },
                  {
                    label: entry.kind === 'Incoming' ? 'Their number' : 'Our number',
                    value: <bdi dir="ltr">{entry.actNumber}</bdi>,
                  },
                  { label: 'Dated', value: <DateText value={entry.actDate} /> },
                  {
                    label: 'Classification',
                    value: <bdi dir="ltr">{entry.classification}</bdi>,
                  },
                  {
                    label: 'Received',
                    value: entry.kind === 'Incoming' ? 'Registered post' : '—',
                  },
                ]}
              />
            ),
          },
          {
            id: 'linked',
            label: 'Linked documents',
            content:
              related.length === 0 ? (
                <p className="m-0 text-sm text-secondary">No document is linked yet.</p>
              ) : (
                <RelatedDocuments label="Linked documents" items={related} />
              ),
          },
          {
            id: 'files',
            label: 'Files',
            flush: true,
            content: (
              <AttachmentList
                label={`Files of no. ${entry.number}`}
                inCard
                files={entry.number === '405' ? ENTRY_405_FILES : []}
                onDownload={() => undefined}
                empty={<p className="m-0 p-4 text-sm text-secondary">No files.</p>}
              />
            ),
          },
          {
            id: 'history',
            label: 'History',
            content: (
              <ActivityList
                label={`History of no. ${entry.number}`}
                items={entry.number === '405' ? ENTRY_405_ACTIVITY : []}
                limit={3}
              />
            ),
          },
        ]}
      />
    </RecordsShell>
  )
}

// ── A new entry ───────────────────────────────────────────────────────────────────────────────

function NewEntry({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const { format } = useLiro()
  const [kind, setKind] = useState<RegistryKind>('Incoming')
  const [subject, setSubject] = useState('')
  const [tried, setTried] = useState(false)
  const [files, setFiles] = useState<string[]>([])
  const missing = subject.trim() === ''
  const actions: ActionItem[] = [
    {
      key: 'cancel',
      label: 'Cancel',
      intent: 'cancel',
      onClick: () => {
        navigate(BF_ROUTES.book)
      },
    },
    {
      key: 'save',
      label: 'Save entry',
      intent: 'save',
      emphasis: 'primary',
      onClick: () => {
        setTried(true)
        if (missing) return
        notice.success(`Entered as no. ${NEXT_REGISTRY_NUMBER}.`)
      },
    },
  ]
  return (
    <RecordsShell
      phone={phone}
      tab="registry"
      crumbs={[{ label: 'Registry book', href: `#${BF_ROUTES.book}` }, { label: 'New entry' }]}
    >
      <RecordFormPage
        layout={phone ? 'phone' : 'desktop'}
        title="New entry"
        subtitle={`Number ${NEXT_REGISTRY_NUMBER} is given when the entry is saved, on ${format.date('2026-10-14')}.`}
        back={{ href: `#${BF_ROUTES.book}`, label: 'Registry book' }}
        dirty={subject !== '' || files.length > 0}
        actions={<ActionGroup actions={actions} />}
      >
        <FormSection title="The act" headingLevel={2}>
          <FormFullWidth>
            <RadioGroupField
              label="Kind"
              required
              options={[
                { value: 'Incoming', label: 'Incoming', description: 'Received from outside.' },
                {
                  value: 'Outgoing',
                  label: 'Outgoing',
                  description: 'Sent by us; a document numbered in Documents is entered by itself.',
                },
                { value: 'Internal', label: 'Internal', description: 'Between our units.' },
              ]}
              value={kind}
              onChange={(next) => {
                setKind(next as RegistryKind)
              }}
            />
          </FormFullWidth>
          <TextField
            label={kind === 'Outgoing' ? 'Recipient' : kind === 'Internal' ? 'Unit' : 'Sender'}
            required
          />
          {kind === 'Incoming' ? (
            <SelectField label="Received by" options={RECEIVED_BY} defaultValue="post" />
          ) : null}
          <TextField
            label={kind === 'Incoming' ? 'Their number' : 'Our number'}
            direction="ltr"
            {...(kind === 'Incoming'
              ? {}
              : { description: 'Leave empty to use the book’s number.' })}
          />
          <DateField label="Dated" />
          <FormFullWidth>
            <TextAreaField
              label="Subject"
              required
              rows={2}
              value={subject}
              onChange={setSubject}
              {...(tried && missing ? { error: 'Write what the act is about.' } : {})}
            />
          </FormFullWidth>
          <SelectField
            label="Classification"
            description="From the archive’s classification plan."
            required
            options={CLASSIFICATIONS}
          />
        </FormSection>
        <FormSection title="Assignment" headingLevel={2}>
          <SelectField label="Assignee" options={ASSIGNEES} defaultValue="ana" />
          <DateField label="Due date" description="When an answer or the work is due." />
        </FormSection>
        <FormSection title="Files" headingLevel={2} columns={1}>
          <FileDropzone
            label="The scanned act and its enclosures"
            description="Filed with the entry; the application keeps them in the company’s documents."
            accept={['application/pdf', 'image/jpeg', 'image/png']}
            acceptText="PDF, JPG or PNG"
            maxSize={20 * 1024 * 1024}
            maxSizeText="20 MB"
            multiple
            camera
            layout={phone ? 'phone' : 'desktop'}
            onFiles={(chosen) => {
              setFiles((current) => [...current, ...chosen.map((file) => file.name)])
            }}
          />
          {files.length === 0 ? null : (
            <AttachmentList
              label="Files to file"
              files={files.map((name) => ({ id: name, name, state: 'available' as const }))}
              canRemove={() => true}
              onRemove={(file) => {
                setFiles((current) => current.filter((each) => each !== file.name))
              }}
            />
          )}
        </FormSection>
      </RecordFormPage>
    </RecordsShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_BF_ROUTES: ExampleRoute[] = [
  { path: BF_ROUTES.book, render: (phone) => <RegistryBook phone={phone} show="all" /> },
  { path: BF_ROUTES.open, render: (phone) => <RegistryBook phone={phone} show="open" /> },
  { path: BF_ROUTES.newEntry, render: (phone) => <NewEntry phone={phone} /> },
  ...REGISTRY.map((entry) => ({
    path: BF_ROUTES.entryOf(entry.number),
    render: (phone: boolean) => <Entry phone={phone} number={entry.number} />,
  })),
]
