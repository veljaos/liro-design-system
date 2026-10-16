import { BellRing, FileText, House, Languages, LogOut, PenLine } from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  Button,
  DataTable,
  DateText,
  DetailPage,
  Dialog,
  dueState,
  DueDate,
  ipsAccountValid,
  KeyValueList,
  normalizeIpsAccount,
  notice,
  PageHeader,
  PersonName,
  PortalShell,
  PrintPage,
  PrintSection,
  PrintTitle,
  SectionCard,
  SetupChecklist,
  SignerList,
  SigningPage,
  StatusBadge,
  TextField,
  Toaster,
  toneFor,
  useLiro,
  type DataTableColumn,
  type MenuEntry,
  type PortalSection,
  type SetupStep,
  type Signer,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate, ROUTES } from './example-shell'
import { useExampleState } from './example-state'
import { HrShell } from './screens-BJ'
import { Tenant } from './screens-G'
import {
  BK_ROUTES,
  BK_TODAY,
  CATEGORIES,
  DECLINE_REASONS,
  FIRST_DAY,
  NEWCOMER,
  SIGN_DOCUMENTS,
  TASK_TONES,
  TASKS,
  type OnboardingTask,
  type SignDocument,
  type TaskState,
} from './data-BK'

/*
 * Group BK's example screens (P5.65, onboarding a new employee): Teodora Lazić starts at Kvadrat
 * Gradnja d.o.o. on 19.10.2026; today is 14.10.2026, 09:40.
 * - HR's checklist (DetailPage, Jelena Marković): the first day, then one section per kind of
 *   task — equipment, accounts, training, documents to sign — each a DataTable of tasks with their
 *   owner (PersonName), due date (DueDate: overdue in words) and state; a row's menu marks it done
 *   or reminds its owner. A DataTable and not SetupChecklist: these tasks run side by side, each
 *   owned by someone else, and HR scans them by owner, due date and state — SetupChecklist is one
 *   person's steps in order, with one step to do now, and keeps that job on the employee's side.
 * - Teodora's side in the employees' portal (PortalShell, on her phone first): her first day and
 *   "Before you start" (SetupChecklist: her own steps, the next highlighted, the blocked ones with
 *   their reason), her salary account (a Dialog; the account checked as the application does,
 *   MOD 97), her documents and each document on SigningPage with SignerList.
 * What Teodora does reaches HR's checklist: the tasks are kept above the screens, as the
 * application keeps them.
 */

export { BK_ROUTES }

function useTasks() {
  return useExampleState<OnboardingTask[]>('BK.tasks', () => TASKS)
}

function setState(tasks: OnboardingTask[], id: string, state: TaskState, doneNote?: string) {
  return tasks.map((each) =>
    each.id === id ? { ...each, state, ...(doneNote === undefined ? {} : { doneNote }) } : each,
  )
}

function taskBadge(state: TaskState) {
  return <StatusBadge label={state} tone={toneFor(state, TASK_TONES)} />
}

// ── HR's checklist ────────────────────────────────────────────────────────────────────────────

const TASK_COLUMNS: DataTableColumn<OnboardingTask>[] = [
  {
    id: 'task',
    header: 'Task',
    minWidth: 240,
    cell: (row) => (
      <span className="flex flex-col">
        <span className="bidi-content font-medium">{row.title}</span>
        {row.state === 'Done' && row.doneNote !== undefined && (
          <span className="bidi-content text-xs text-secondary">{row.doneNote}</span>
        )}
        {row.state === 'Blocked' && row.blockedBy !== undefined && (
          <span className="bidi-content text-xs text-secondary">{row.blockedBy}</span>
        )}
      </span>
    ),
  },
  {
    id: 'owner',
    header: 'Owner',
    minWidth: 180,
    cell: (row) => <PersonName name={row.owner} description={row.ownerRole} />,
  },
  {
    id: 'due',
    header: 'Due',
    numeric: true,
    cell: (row) =>
      row.state === 'Done' ? <DateText value={row.due} /> : <DueDate value={row.due} />,
  },
  { id: 'state', header: 'State', cell: (row) => taskBadge(row.state) },
]

export function OnboardingScreen({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const [tasks, setTasks] = useTasks()
  const done = tasks.filter((each) => each.state === 'Done').length
  const overdue = tasks.filter(
    (each) => each.state !== 'Done' && dueState(each.due, BK_TODAY, false, 0).kind === 'overdue',
  ).length
  const waiting = tasks.filter((each) => each.state === 'Waiting for Teodora').length
  const remind = (row: OnboardingTask) => {
    notice.success(`${row.owner} is reminded of "${row.title}".`)
  }
  const actions = (row: OnboardingTask): MenuEntry[] => {
    if (row.state === 'Done') {
      return [
        {
          label: 'Mark as not done',
          onSelect: () => {
            setTasks((list) => setState(list, row.id, 'To do'))
          },
        },
      ]
    }
    const reminder: MenuEntry = {
      label: `Remind ${row.owner}`,
      icon: BellRing,
      onSelect: () => {
        remind(row)
      },
    }
    if (row.state === 'Blocked') return [reminder]
    return [
      {
        label: 'Mark as done',
        onSelect: () => {
          setTasks((list) =>
            setState(list, row.id, 'Done', `Done ${format.date(BK_TODAY)} by Jelena Marković`),
          )
          notice.success(`"${row.title}" is done.`)
        },
      },
      reminder,
    ]
  }
  const remindAll = (
    <Button
      family="neutral"
      emphasis="secondary"
      icon={BellRing}
      label="Remind Teodora"
      onClick={() => {
        notice.success('Teodora Lazić is reminded of what she still has to do.')
      }}
    />
  )
  const add = <Button intent="create" label="Add task" />
  return (
    <HrShell
      phone={phone}
      tab="onboarding"
      crumbs={[{ label: 'Onboarding' }, { label: NEWCOMER.name }]}
      {...(phone
        ? {
            bottomBar: (
              <>
                {remindAll}
                {add}
              </>
            ),
          }
        : {})}
    >
      <DetailPage
        layout={phone ? 'phone' : 'desktop'}
        title={NEWCOMER.name}
        status={<StatusBadge label="Onboarding" tone="info" />}
        subtitle={`${NEWCOMER.role} · starts ${format.date(NEWCOMER.start)}`}
        keyFigures={[
          { label: 'Done', value: `${String(done)} of ${String(tasks.length)}` },
          {
            label: 'Overdue',
            value: String(overdue),
            ...(overdue > 0 ? { tone: 'danger' as const } : {}),
          },
          { label: 'Waiting for Teodora', value: String(waiting) },
          { label: 'First day', value: <DateText value={NEWCOMER.start} /> },
        ]}
        {...(phone
          ? {}
          : {
              actions: (
                <>
                  {remindAll}
                  {add}
                </>
              ),
            })}
        sections={[
          {
            id: 'first-day',
            label: 'First day',
            content: (
              <KeyValueList
                columns={phone ? 1 : 2}
                items={[
                  { label: 'When', value: FIRST_DAY.when },
                  { label: 'Where', value: FIRST_DAY.where },
                  { label: 'Manager', value: NEWCOMER.manager },
                  { label: 'Buddy', value: NEWCOMER.buddy },
                  { label: 'E-mail', value: <bdi dir="ltr">{NEWCOMER.email}</bdi> },
                  { label: 'Hired through', value: <bdi dir="ltr">{NEWCOMER.opening}</bdi> },
                ]}
              />
            ),
          },
          ...CATEGORIES.map((category) => {
            const rows = tasks.filter((each) => each.category === category.id)
            const finished = rows.filter((each) => each.state === 'Done').length
            return {
              id: category.id,
              label: category.title,
              description: `${category.description} ${String(finished)} of ${String(rows.length)} done.`,
              flush: true,
              content: (
                <DataTable
                  label={category.title}
                  layout={phone ? 'cards' : 'table'}
                  inCard
                  columns={TASK_COLUMNS}
                  rows={rows}
                  getRowId={(row) => row.id}
                  getRowLabel={(row) => row.title}
                  rowActions={actions}
                  mobile={{
                    title: (row) => row.title,
                    subtitle: (row) => `${row.owner} · ${row.ownerRole}`,
                    badge: (row) => taskBadge(row.state),
                    details: ['due'],
                  }}
                />
              ),
            }
          }),
        ]}
      />
    </HrShell>
  )
}

// ── Teodora's portal ──────────────────────────────────────────────────────────────────────────

type PortalKey = 'home' | 'documents'

function TeodoraPortal({
  phone,
  current,
  toSign,
  children,
}: {
  phone: boolean
  current: PortalKey
  toSign: number
  children: ReactNode
}) {
  const navigate = useContext(Navigate)
  const sections: PortalSection[] = [
    { key: 'home', label: 'Home', href: `#${BK_ROUTES.portal}`, icon: House },
    {
      key: 'documents',
      label: 'Documents',
      href: `#${BK_ROUTES.documents}`,
      icon: PenLine,
      ...(toSign > 0 ? { note: `${String(toSign)} to sign` } : {}),
    },
  ]
  return (
    <Tenant today={BK_TODAY}>
      <PortalShell
        layout={phone ? 'phone' : 'desktop'}
        brand={{
          brandName: 'Kvadrat Gradnja',
          productName: 'Employees',
          href: `#${BK_ROUTES.portal}`,
        }}
        participant={{ name: NEWCOMER.name, detail: `${NEWCOMER.role} · Kvadrat Gradnja d.o.o.` }}
        menu={[
          { label: 'Language: English', icon: Languages, onSelect: () => undefined },
          { type: 'separator' },
          {
            label: 'Sign out',
            icon: LogOut,
            onSelect: () => {
              navigate(ROUTES.signIn)
            },
          },
        ]}
        sections={sections.map((section) =>
          section.key === current ? { ...section, current: true } : section,
        )}
        footer="Questions? Jelena Marković, HR · Illustrative data"
      >
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </PortalShell>
    </Tenant>
  )
}

/** A portal page: one column, centred on wide screens. */
function Page({ wide = false, children }: { wide?: boolean; children: ReactNode }) {
  return (
    <div
      className={`mx-auto box-border flex w-full min-w-0 flex-col gap-4 p-4 sm:gap-6 sm:p-6 ${wide ? 'max-w-6xl' : 'max-w-3xl'}`}
    >
      {children}
    </div>
  )
}

function stateOf(tasks: readonly OnboardingTask[], id: string): TaskState {
  return tasks.find((each) => each.id === id)?.state ?? 'To do'
}

function toSignCount(tasks: readonly OnboardingTask[]) {
  return SIGN_DOCUMENTS.filter((each) => stateOf(tasks, each.task) !== 'Done').length
}

/** Teodora's salary account: typed, checked as the application checks it (MOD 97). */
function AccountDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (account: string) => void
}) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Your salary account"
      description="Your first salary is paid to this account. Payroll sees it; you can change it later."
      actions={
        <>
          <Button
            intent="cancel"
            label="Cancel"
            onClick={() => {
              onOpenChange(false)
            }}
          />
          <Button
            intent="save"
            label="Save"
            onClick={() => {
              const account = normalizeIpsAccount(text)
              if (text.trim() === '') setError('Enter your account number.')
              else if (account === null || !ipsAccountValid(account))
                setError('This account number is not valid. Check it on your bank card.')
              else onSave(account)
            }}
          />
        </>
      }
    >
      <TextField
        label="Account number"
        description="18 digits, as on your bank card: 160-0000000123456-54"
        required
        direction="ltr"
        autoComplete="off"
        value={text}
        onChange={(next) => {
          setText(next)
          setError(null)
        }}
        {...(error === null ? {} : { error })}
      />
    </Dialog>
  )
}

export function WelcomeScreen({
  phone,
  accountOpen = false,
}: {
  phone: boolean
  accountOpen?: boolean
}) {
  const { format } = useLiro()
  const [tasks, setTasks] = useTasks()
  const [dialog, setDialog] = useState(accountOpen)
  const docStep = (document: SignDocument): SetupStep => {
    const signed = stateOf(tasks, document.task) === 'Done'
    return {
      id: document.id,
      title: `Sign the ${document.kind.toLocaleLowerCase()}`,
      description: `${document.id} · sign by ${format.date(document.due)}`,
      state: signed ? 'done' : 'todo',
      ...(signed
        ? { doneNote: `Signed ${format.date(BK_TODAY)}` }
        : { action: { label: 'Open and sign', href: `#${document.path}` } }),
    }
  }
  const accountDone = stateOf(tasks, 'bank') === 'Done'
  const steps: SetupStep[] = [
    {
      id: 'photo',
      title: 'Send a photo for your access card',
      state: 'done',
      doneNote: 'Sent 12.10.2026',
    },
    ...SIGN_DOCUMENTS.map(docStep),
    {
      id: 'account',
      title: 'Enter your salary account',
      description: `By ${format.date('2026-10-16')}, for your first salary`,
      state: accountDone ? 'done' : 'todo',
      ...(accountDone
        ? { doneNote: `Entered ${format.date(BK_TODAY)}` }
        : {
            action: {
              label: 'Enter account',
              onClick: () => {
                setDialog(true)
              },
            },
          }),
    },
    {
      id: 'safety',
      title: 'Safety at work training',
      description: 'About 40 minutes, online',
      state: 'blocked',
      blockedReason: `Opens on your first day, ${format.date(NEWCOMER.start)}.`,
    },
    {
      id: 'safety-statement',
      title: 'Sign the safety at work statement',
      state: 'blocked',
      blockedReason: 'After the safety training.',
    },
  ]
  return (
    <TeodoraPortal phone={phone} current="home" toSign={toSignCount(tasks)}>
      <Page>
        <PageHeader
          title={`Welcome, ${NEWCOMER.first}`}
          subtitle={`You start at Kvadrat Gradnja d.o.o. on ${format.date(NEWCOMER.start)}. Until then, a few things to do here.`}
        />
        <SetupChecklist
          title="Before you start"
          description="Do them in any order; the training opens on your first day."
          steps={steps}
        />
        <SectionCard title="Your first day" headingLevel={2}>
          <KeyValueList
            items={[
              { label: 'When', value: FIRST_DAY.when },
              { label: 'Where', value: FIRST_DAY.where },
              { label: 'Ask for', value: FIRST_DAY.askFor },
              { label: 'Bring', value: FIRST_DAY.bring },
            ]}
          />
        </SectionCard>
      </Page>
      <AccountDialog
        open={dialog}
        onOpenChange={setDialog}
        onSave={() => {
          setTasks((list) =>
            setState(list, 'bank', 'Done', `Done ${format.date(BK_TODAY)} by Teodora Lazić`),
          )
          setDialog(false)
          notice.success('Your salary account is saved.')
        }}
      />
    </TeodoraPortal>
  )
}

export function DocumentsScreen({ phone }: { phone: boolean }) {
  const { format, linkComponent: Link } = useLiro()
  const [tasks] = useTasks()
  return (
    <TeodoraPortal phone={phone} current="documents" toSign={toSignCount(tasks)}>
      <Page>
        <PageHeader
          title="Documents"
          subtitle="What waits for your signature, and what you signed."
        />
        <SectionCard title="Documents" headingLevel={2}>
          <ul className="m-0 flex list-none flex-col p-0">
            {SIGN_DOCUMENTS.map((document) => {
              const signed = stateOf(tasks, document.task) === 'Done'
              return (
                <li
                  key={document.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 border-0 border-b border-solid border-subtle py-3 last:border-b-0"
                >
                  <FileText aria-hidden="true" className="size-4 shrink-0 text-secondary" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`#${document.path}`}
                      className="bidi-content self-start rounded-sm font-medium text-link no-underline visited:text-link hover:underline"
                    >
                      {document.title}
                    </Link>
                    <span className="bidi-content text-xs text-secondary">
                      {signed
                        ? `${document.kind} · signed ${format.date(BK_TODAY)}`
                        : `${document.kind} · sign by ${format.date(document.due)}`}
                    </span>
                  </span>
                  {signed ? (
                    <StatusBadge label="Signed" tone="success" />
                  ) : (
                    <StatusBadge label="To sign" tone="warning" />
                  )}
                </li>
              )
            })}
          </ul>
        </SectionCard>
      </Page>
    </TeodoraPortal>
  )
}

/** The document as it is signed: its text on a sheet (what the application renders). */
function DocumentSheet({ document }: { document: SignDocument }) {
  return (
    <PrintPage title={document.title} pageNumbers={false}>
      <div className="flex flex-col gap-4">
        <PrintTitle
          title={document.title}
          subtitle="Kvadrat Gradnja d.o.o. · Novi Sad · illustrative"
        />
        <p className="bidi-content m-0 text-sm text-primary">{document.parties}</p>
        {document.articles.map((article) => (
          <PrintSection key={article.heading} title={article.heading} headingLevel={3}>
            <p className="bidi-content m-0 text-sm text-primary">{article.text}</p>
          </PrintSection>
        ))}
      </div>
    </PrintPage>
  )
}

export function SignDocumentScreen({ phone, id }: { phone: boolean; id: string }) {
  const { format } = useLiro()
  const [tasks, setTasks] = useTasks()
  const document = SIGN_DOCUMENTS.find((each) => each.id === id)
  const [declined, setDeclined] = useState<string | null>(null)
  if (document === undefined) return null
  const signed = stateOf(tasks, document.task) === 'Done'
  const me: Signer = {
    id: 'teodora',
    name: NEWCOMER.name,
    role: 'Employee',
    state: signed ? 'signed' : declined === null ? 'waiting' : 'declined',
    current: true,
    ...(signed || declined !== null ? { at: '2026-10-14T09:42:00+02:00' } : {}),
    ...(declined === null ? {} : { reason: declined }),
  }
  return (
    <TeodoraPortal phone={phone} current="documents" toSign={toSignCount(tasks)}>
      <Page wide>
        <SigningPage
          layout={phone ? 'phone' : 'desktop'}
          title={document.id}
          back={{ href: `#${BK_ROUTES.documents}`, label: 'Documents' }}
          status={
            signed ? (
              <StatusBadge label="Signed by you" tone="success" />
            ) : declined !== null ? (
              <StatusBadge label="Declined" tone="danger" />
            ) : (
              <StatusBadge label="To sign" tone="warning" />
            )
          }
          subtitle={`${document.kind} · sign by ${format.date(document.due)}`}
          actions={
            <Button
              intent="download"
              label="Download PDF"
              onClick={() => {
                notice.success(`${document.id}.pdf is downloaded.`)
              }}
            />
          }
          preview={<DocumentSheet document={document} />}
          signers={
            <SignerList
              signers={[...document.before, me]}
              declineReasons={DECLINE_REASONS}
              declineMessage="The document goes back to Jelena Marković (HR) with your reason."
              declineSubject={document.title}
              onSign={() => {
                setTasks((list) =>
                  setState(
                    list,
                    document.task,
                    'Done',
                    `Signed ${format.date(BK_TODAY)} by Teodora Lazić`,
                  ),
                )
                notice.success(`${document.title} is signed.`)
              }}
              onDecline={(_signer, answer) => {
                const reason = DECLINE_REASONS.find((each) => each.value === answer.reason)?.label
                setDeclined([reason, answer.text].filter(Boolean).join(': '))
              }}
            />
          }
        />
      </Page>
    </TeodoraPortal>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_BK_ROUTES: ExampleRoute[] = [
  { path: BK_ROUTES.onboarding, render: (phone) => <OnboardingScreen phone={phone} /> },
  { path: BK_ROUTES.portal, render: (phone) => <WelcomeScreen phone={phone} /> },
  { path: BK_ROUTES.portalAccount, render: (phone) => <WelcomeScreen phone={phone} accountOpen /> },
  { path: BK_ROUTES.documents, render: (phone) => <DocumentsScreen phone={phone} /> },
  ...SIGN_DOCUMENTS.map((document) => ({
    path: document.path,
    render: (phone: boolean) => <SignDocumentScreen phone={phone} id={document.id} />,
  })),
]
