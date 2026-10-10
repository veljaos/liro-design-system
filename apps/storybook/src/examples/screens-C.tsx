import { LogOut, Send, UserPlus } from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  AppShell,
  AttachmentList,
  DocumentFrame,
  Button,
  DataTable,
  DateText,
  Drawer,
  instantText,
  KanbanBoard,
  KeyValueList,
  moveCard,
  notice,
  PageHeader,
  PermissionMatrix,
  PersonAvatar,
  SectionCard,
  SelectField,
  SetupChecklist,
  SignerList,
  SigningPage,
  StatusBadge,
  Tabs,
  TextField,
  Toaster,
  useLiro,
  type DataTableColumn,
  type KanbanColumn,
  type MenuEntry,
  type ModuleTab,
  type PermissionValue,
  type Signer,
} from '@veljaos/ui'
import { CONTRACT_VIEWER } from '../../../../packages/ui/src/components/document-frame-story-data'
import type { ExampleRoute } from './example-app'
import { BRAND, HR_TABS, Navigate, ROUTES, Shell, statusBadge, toneOf } from './example-shell'
import {
  ACTIONS,
  AREAS,
  C_ROUTES,
  CONTRACT_FILES,
  contractSigners,
  DECLINE_REASONS,
  INVITATIONS,
  MEMBERS,
  PERMISSIONS,
  permissionApplies,
  permissionUnavailable,
  roleName,
  ROLES,
  STANIC,
  STANIC_STEPS,
  STEFAN_SIGNS_AT,
  TASKS,
  type ExampleInvitation,
  type ExampleMember,
  type ExampleRole,
} from './data-C'

/*
 * Group C's example screens (P5.6, P5.7, P5.21): users and roles of Kvadrat Gradnja, the first-run
 * setup of Stanić Elektro STR, employment contract RU-2026-017 awaiting signatures (seen by Milica,
 * and by Stefan Nikolić from his e-mail link) and the tasks board. The sign-in screen's providers
 * are in screens-core (SignIn). Only the public entry point `@veljaos/ui` is used.
 */

// ── Shared pieces ─────────────────────────────────────────────────────────────────────────────

/** A page's frame inside the shell: 24px around (16px on phones), the content's width. */
function Frame({ phone, children }: { phone: boolean; children: ReactNode }) {
  return (
    <div
      className={
        phone
          ? 'box-border flex w-full flex-col gap-4 p-4'
          : 'mx-auto box-border flex w-full max-w-content flex-col gap-6 p-6'
      }
    >
      {children}
    </div>
  )
}

/** A count with its noun, the number through the provider's format (the application writes it). */
function useCount() {
  const { format } = useLiro()
  return (count: number, one: string, many: string) =>
    `${format.number(String(count))} ${count === 1 ? one : many}`
}

// ── Users and roles ───────────────────────────────────────────────────────────────────────────

const SETTINGS_TABS: ModuleTab[] = [
  { key: 'company', label: 'Company', href: '#/settings/company' },
  { key: 'users', label: 'Users and roles', href: `#${C_ROUTES.users}`, current: true },
  { key: 'numbering', label: 'Numbering', href: '#/settings/numbering' },
  { key: 'integrations', label: 'Integrations', href: '#/settings/integrations' },
]

function MembersTable({ phone, members }: { phone: boolean; members: ExampleMember[] }) {
  const { format } = useLiro()
  const columns: DataTableColumn<ExampleMember>[] = [
    {
      id: 'name',
      header: 'Name',
      cell: (member) => (
        <span className="flex items-center gap-2">
          <PersonAvatar name={member.name} size="sm" />
          <span className="flex min-w-0 flex-col">
            <span className="font-medium">{member.name}</span>
            <span className="text-xs text-secondary" dir="ltr">
              {member.email}
            </span>
          </span>
        </span>
      ),
    },
    { id: 'roles', header: 'Roles', cell: (member) => member.roles.map(roleName).join(', ') },
    {
      id: 'status',
      header: 'Status',
      cell: (member) => <StatusBadge label={member.status} tone={toneOf(member.status)} />,
    },
    {
      id: 'last',
      header: 'Last sign-in',
      label: 'Last sign-in',
      cell: (member) => (member.lastSignIn === null ? '—' : instantText(format, member.lastSignIn)),
    },
  ]
  return (
    <DataTable
      label="Members"
      layout={phone ? 'cards' : 'table'}
      inCard
      columns={columns}
      rows={members}
      getRowId={(member) => member.id}
      getRowLabel={(member) => member.name}
      rowActions={(member): MenuEntry[] => [
        { label: 'Change roles', onSelect: () => undefined },
        {
          label: member.status === 'Active' ? 'Deactivate' : 'Activate',
          onSelect: () => undefined,
        },
      ]}
      mobile={{
        title: (member) => member.name,
        subtitle: (member) => member.roles.map(roleName).join(', '),
        badge: (member) => <StatusBadge label={member.status} tone={toneOf(member.status)} />,
        details: ['last'],
      }}
    />
  )
}

function RolesTab({ phone }: { phone: boolean }) {
  const count = useCount()
  const [roleId, setRoleId] = useState('site-manager')
  const [saved, setSaved] = useState<Record<string, PermissionValue>>(PERMISSIONS)
  const [draft, setDraft] = useState<PermissionValue>(PERMISSIONS['site-manager'] ?? {})
  const role = ROLES.find((each) => each.id === roleId) ?? ROLES[0]
  const savedValue = saved[roleId] ?? {}
  const value = role?.builtIn === false ? draft : savedValue
  const dirty = role?.builtIn === false && JSON.stringify(draft) !== JSON.stringify(savedValue)
  const members = (id: string) => MEMBERS.filter((member) => member.roles.includes(id)).length
  const choose = (next: ExampleRole) => {
    setRoleId(next.id)
    setDraft(saved[next.id] ?? {})
  }
  const columns: DataTableColumn<ExampleRole>[] = [
    {
      id: 'name',
      header: 'Role',
      cell: (each) => (
        <span className="flex flex-col">
          <span className="font-medium">{each.name}</span>
          <span className="text-xs text-secondary">{each.builtIn ? 'Built-in' : 'Custom'}</span>
        </span>
      ),
    },
    { id: 'description', header: 'What it may do', cell: (each) => each.description },
    {
      id: 'members',
      header: 'Members',
      label: 'Members',
      cell: (each) => count(members(each.id), 'member', 'members'),
    },
  ]
  if (role === undefined) return null
  return (
    <div className="flex flex-col gap-4">
      <SectionCard flush>
        <DataTable
          label="Roles"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={columns}
          rows={ROLES}
          getRowId={(each) => each.id}
          getRowLabel={(each) => each.name}
          onRowClick={choose}
          mobile={{
            title: (each) => each.name,
            subtitle: (each) => each.description,
            details: ['members'],
          }}
        />
      </SectionCard>
      <SectionCard
        title={`Permissions: ${role.name}`}
        description={
          role.builtIn
            ? 'Built-in role: it cannot be changed. Duplicate it to make your own.'
            : `Custom role · ${count(members(role.id), 'member', 'members')}`
        }
        headingLevel={2}
        actions={
          role.builtIn ? (
            <Button intent="duplicate" label="Duplicate" />
          ) : dirty ? (
            <>
              <Button
                intent="cancel"
                label="Cancel"
                onClick={() => {
                  setDraft(savedValue)
                }}
              />
              <Button
                intent="save"
                label="Save"
                onClick={() => {
                  setSaved((current) => ({ ...current, [role.id]: draft }))
                  notice.success(`Permissions of ${role.name} saved.`)
                }}
              />
            </>
          ) : undefined
        }
      >
        <PermissionMatrix
          areas={AREAS}
          actions={ACTIONS}
          label={`Permissions of ${role.name}`}
          value={value}
          applies={permissionApplies}
          readOnly={role.builtIn}
          layout={phone ? 'phone' : 'desktop'}
          {...(role.builtIn
            ? {}
            : {
                unavailable: permissionUnavailable,
                onChange: (next: PermissionValue) => {
                  setDraft(next)
                },
              })}
        />
      </SectionCard>
    </div>
  )
}

function InvitationsTable({
  phone,
  invitations,
}: {
  phone: boolean
  invitations: ExampleInvitation[]
}) {
  const columns: DataTableColumn<ExampleInvitation>[] = [
    {
      id: 'email',
      header: 'E-mail',
      cell: (invitation) => <span dir="ltr">{invitation.email}</span>,
    },
    { id: 'role', header: 'Role', cell: (invitation) => roleName(invitation.role) },
    {
      id: 'by',
      header: 'Invited by',
      label: 'Invited by',
      cell: (invitation) => invitation.invitedBy,
    },
    {
      id: 'sent',
      header: 'Sent',
      label: 'Sent',
      cell: (invitation) => <DateText value={invitation.sent} />,
    },
    {
      id: 'expires',
      header: 'Expires',
      label: 'Expires',
      cell: (invitation) => <DateText value={invitation.expires} />,
    },
    {
      id: 'state',
      header: 'State',
      cell: (invitation) => statusBadge(invitation.state),
    },
  ]
  return (
    <DataTable
      label="Invitations"
      layout={phone ? 'cards' : 'table'}
      inCard
      columns={columns}
      rows={invitations}
      getRowId={(invitation) => invitation.id}
      getRowLabel={(invitation) => invitation.email}
      rowActions={(invitation): MenuEntry[] => [
        {
          label: 'Send again',
          icon: Send,
          onSelect: () => {
            notice.success(`Invitation sent again to ${invitation.email}.`)
          },
        },
        ...(invitation.state === 'Pending'
          ? [{ label: 'Revoke', destructive: true, onSelect: () => undefined }]
          : []),
      ]}
      mobile={{
        title: (invitation) => invitation.email,
        subtitle: (invitation) => roleName(invitation.role),
        badge: (invitation) => statusBadge(invitation.state),
        details: ['by', 'sent', 'expires'],
      }}
    />
  )
}

export function UsersScreen({ phone }: { phone: boolean }) {
  const [tab, setTab] = useState('members')
  const [inviting, setInviting] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('sales')
  const [invitations, setInvitations] = useState(INVITATIONS)
  const invite = (
    <Button
      family="primary"
      emphasis="primary"
      icon={UserPlus}
      label="Invite user"
      onClick={() => {
        setInviting(true)
      }}
    />
  )
  return (
    <Shell phone={phone} tabs={SETTINGS_TABS} {...(phone ? { bottomBar: invite } : {})}>
      <Frame phone={phone}>
        <PageHeader title="Users and roles" titleHidden {...(phone ? {} : { actions: invite })} />
        <Tabs
          label="Users and roles"
          value={tab}
          onValueChange={setTab}
          items={[
            {
              value: 'members',
              label: 'Members',
              content: (
                <SectionCard flush>
                  <MembersTable phone={phone} members={MEMBERS} />
                </SectionCard>
              ),
            },
            { value: 'roles', label: 'Roles', content: <RolesTab phone={phone} /> },
            {
              value: 'invitations',
              label: 'Invitations',
              content: (
                <SectionCard flush>
                  <InvitationsTable phone={phone} invitations={invitations} />
                </SectionCard>
              ),
            },
          ]}
        />
      </Frame>
      {/* At page level, outside the Tabs (D16). */}
      <Drawer
        side="end"
        open={inviting}
        onOpenChange={setInviting}
        title="Invite user"
        description="The invitation is valid for 7 days."
        actions={
          <>
            <Button
              intent="cancel"
              label="Cancel"
              onClick={() => {
                setInviting(false)
              }}
            />
            <Button
              family="primary"
              emphasis="primary"
              icon={Send}
              label="Send invitation"
              onClick={() => {
                setInvitations((list) => [
                  {
                    id: `i${String(list.length + 1)}`,
                    email,
                    role,
                    invitedBy: 'Milica Petrović',
                    sent: '2026-10-06',
                    expires: '2026-10-13',
                    state: 'Pending',
                  },
                  ...list,
                ])
                setInviting(false)
                setTab('invitations')
                notice.success(`Invitation sent to ${email}.`)
              }}
            />
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <TextField label="E-mail" type="email" value={email} onChange={setEmail} />
          <SelectField
            label="Role"
            value={role}
            onChange={setRole}
            options={ROLES.map((each) => ({ value: each.id, label: each.name }))}
          />
        </div>
      </Drawer>
      <Toaster layout={phone ? 'phone' : 'desktop'} />
    </Shell>
  )
}

// ── First-run setup ───────────────────────────────────────────────────────────────────────────

export function SetupScreen({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const importCustomers = (
    <Button
      intent="next"
      label="Import customers"
      onClick={() => {
        navigate('/sales/customers')
      }}
    />
  )
  return (
    <Shell phone={phone} company={STANIC.id} {...(phone ? { bottomBar: importCustomers } : {})}>
      <Frame phone={phone}>
        <PageHeader
          title={STANIC.name}
          subtitle={
            <span>
              PIB <bdi>{STANIC.taxId}</bdi> · {STANIC.address}
            </span>
          }
        />
        <SetupChecklist title="Set up the company" steps={STANIC_STEPS} className="max-w-180" />
      </Frame>
    </Shell>
  )
}

// ── Contract RU-2026-017 awaiting signatures ──────────────────────────────────────────────────

const CONTRACT_TABS: ModuleTab[] = HR_TABS.map((tab) => ({
  ...tab,
  current: tab.key === 'contracts',
}))

/** The contract's three pages in the document viewer (P5.5); the example's viewer is a srcdoc. */
function ContractPreview() {
  return (
    <DocumentFrame
      title="Employment contract RU-2026-017"
      srcDoc={CONTRACT_VIEWER}
      allowedOrigin="null"
    />
  )
}

/** The contract's attachments: available files, downloaded at the click (P5.5). */
function ContractFiles() {
  return (
    <AttachmentList
      label="Attachments"
      files={CONTRACT_FILES.map((file) => ({
        id: file.name,
        name: file.name,
        sizeText: file.size,
        state: 'available',
      }))}
      onDownload={(file) => {
        notice.info(`${file.name} is downloaded.`)
      }}
    />
  )
}

const CONTRACT_DETAILS = (
  <KeyValueList
    items={[
      { label: 'Employee', value: 'Stefan Nikolić, site engineer' },
      { label: 'Contract type', value: 'Indefinite term' },
      { label: 'Start of work', value: <DateText value="2026-11-02" /> },
      { label: 'Prepared by', value: 'Jelena Marković' },
    ]}
  />
)

/** Milica (finance manager and administrator) follows the signatures; she does not sign. */
export function ContractSigningScreen({ phone }: { phone: boolean }) {
  const reminder = (
    <Button
      family="verify"
      icon={Send}
      label="Send reminder"
      onClick={() => {
        notice.success('Reminder sent to Stefan Nikolić.')
      }}
    />
  )
  return (
    <Shell
      phone={phone}
      crumbs={[{ label: 'Contracts', href: '#/hr/contracts' }, { label: 'RU-2026-017' }]}
      tabs={CONTRACT_TABS}
      {...(phone ? { bottomBar: reminder } : {})}
    >
      <SigningPage
        layout={phone ? 'phone' : 'desktop'}
        title="RU-2026-017"
        back={{ href: '#/hr/contracts', label: 'Contracts' }}
        status={statusBadge('Awaiting signatures')}
        subtitle="Employment contract · Stefan Nikolić, site engineer"
        actions={
          <>
            <Button intent="download" label="Download PDF" />
            {phone ? null : reminder}
          </>
        }
        preview={<ContractPreview />}
        attachments={<ContractFiles />}
        sections={[{ id: 'details', label: 'Details', content: CONTRACT_DETAILS }]}
        signers={<SignerList signers={contractSigners('none')} />}
      />
      <Toaster layout={phone ? 'phone' : 'desktop'} />
    </Shell>
  )
}

/**
 * What Stefan Nikolić sees from the link in his e-mail: the same contract with his Decline and
 * Sign. He is not yet an employee, so the shell has no companies or modules. The signing itself is
 * Liro Bridge's; the example answers after a moment.
 */
export function SignerLinkScreen({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const [signers, setSigners] = useState<Signer[]>(contractSigners('stefan'))
  const stefan = (patch: Partial<Signer>) => {
    setSigners((list) => list.map((each) => (each.id === 'stefan' ? { ...each, ...patch } : each)))
  }
  return (
    <AppShell
      layout={phone ? 'phone' : 'desktop'}
      brand={BRAND}
      user={{
        name: 'Stefan Nikolić',
        email: 'stefan.nikolic@kvadratgradnja.rs',
        entries: [
          {
            label: 'Sign out',
            icon: LogOut,
            onSelect: () => {
              navigate(ROUTES.signIn)
            },
          },
        ],
      }}
    >
      <SigningPage
        layout={phone ? 'phone' : 'desktop'}
        title="RU-2026-017"
        status={
          signers.find((each) => each.id === 'stefan')?.state === 'signed'
            ? statusBadge('Signed by you')
            : statusBadge('Awaiting your signature')
        }
        subtitle="Employment contract from Kvadrat Gradnja d.o.o."
        actions={<Button intent="download" label="Download PDF" />}
        preview={<ContractPreview />}
        attachments={<ContractFiles />}
        signers={
          <SignerList
            signers={signers}
            declineReasons={DECLINE_REASONS}
            declineMessage="The contract goes back to Jelena Marković (HR) with your reason."
            onSign={() =>
              new Promise<void>((resolve) => {
                window.setTimeout(() => {
                  stefan({ state: 'signed', at: STEFAN_SIGNS_AT })
                  notice.success('RU-2026-017 signed. Jelena Marković signs next.')
                  resolve()
                }, 600)
              })
            }
            onDecline={(_signer, answer) => {
              const reason = DECLINE_REASONS.find((each) => each.value === answer.reason)?.label
              stefan({
                state: 'declined',
                at: STEFAN_SIGNS_AT,
                reason: [reason, answer.text].filter(Boolean).join(': '),
              })
            }}
          />
        }
      />
      <Toaster layout={phone ? 'phone' : 'desktop'} />
    </AppShell>
  )
}

// ── Tasks ─────────────────────────────────────────────────────────────────────────────────────

export function TasksScreen({ phone }: { phone: boolean }) {
  const count = useCount()
  const [columns, setColumns] = useState<readonly KanbanColumn[]>(TASKS)
  const create = <Button intent="create" label="New task" />
  return (
    <Shell phone={phone} {...(phone ? { bottomBar: create } : {})}>
      <Frame phone={phone}>
        <PageHeader title="Tasks" {...(phone ? {} : { actions: create })} />
        <KanbanBoard
          label="Tasks"
          layout={phone ? 'phone' : 'desktop'}
          columns={columns.map((column) => ({
            ...column,
            count: count(column.cards.length, 'task', 'tasks'),
          }))}
          onMove={(move) => {
            setColumns((current) => moveCard(current, move.cardId, move.to))
          }}
        />
      </Frame>
    </Shell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_C_ROUTES: ExampleRoute[] = [
  { path: C_ROUTES.users, render: (phone) => <UsersScreen phone={phone} /> },
  { path: C_ROUTES.setup, render: (phone) => <SetupScreen phone={phone} /> },
  { path: C_ROUTES.signing, render: (phone) => <ContractSigningScreen phone={phone} /> },
  { path: C_ROUTES.signerLink, render: (phone) => <SignerLinkScreen phone={phone} /> },
  { path: C_ROUTES.tasks, render: (phone) => <TasksScreen phone={phone} /> },
]
