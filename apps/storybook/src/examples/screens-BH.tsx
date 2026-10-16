import { Mail, Vote as VoteIcon } from 'lucide-react'
import { useContext, useState } from 'react'
import {
  ActionGroup,
  Alert,
  AttachmentList,
  Button,
  DataTable,
  DateText,
  DetailPage,
  Dialog,
  KeyValueList,
  ListPage,
  notice,
  RadioGroupField,
  RelatedDocuments,
  SignerList,
  StatusBadge,
  toneFor,
  useLiro,
  type ActionItem,
  type DataTableColumn,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate } from './example-shell'
import { RECORD_LINK, RecordsShell, Words } from './screens-BE'
import {
  AGENDA,
  AGENDA_VOTING,
  BH_ROUTES,
  BOARD,
  MEETING_TONES,
  MEETINGS,
  MINUTES_SIGNERS,
  SB4,
  SB5_AGENDA,
  SB5_INVITATION,
  type AgendaItem,
  type Meeting,
  type MeetingState,
  type Member,
  type Vote,
} from './data-BH'
import { BE_ROUTES } from './data-BE'
import { BF_ROUTES } from './data-BF'

/*
 * Group BH's example screens (P5.70, meetings of company bodies): Kvadrat Gradnja d.o.o. on
 * 14 October 2026.
 * - The schedule (ListPage): the meetings of the general assembly and the supervisory board, with
 *   their date, place, the application's line about who comes and the state in words.
 * - A held meeting (DetailPage): the invitation (numbered in the registry book, group BF) and the
 *   agenda with each item's materials (AttachmentList); attendance and the quorum in the
 *   application's words; the votes on each item — for, against, abstain — and the result in the
 *   application's words, each member's vote in a dialog; the minutes and decisions (documents of
 *   group BE) and the minutes' signatures (SignerList). While the meeting runs, "Record votes"
 *   asks each present member's vote and the application answers with the result.
 * - The next meeting: the invitation sent, the agenda, each member's answer.
 * The screens never count votes or decide a quorum: every figure and word is the application's.
 */

export { BH_ROUTES }

export function meetingBadge(state: MeetingState) {
  return <StatusBadge label={state} tone={toneFor(state, MEETING_TONES)} />
}

function DateTime({ date, time }: { date: string; time: string }) {
  return (
    <bdi dir="ltr" className="whitespace-nowrap">
      <DateText value={date} /> {time}
    </bdi>
  )
}

const LIST_COLUMNS: DataTableColumn<Meeting>[] = [
  {
    id: 'meeting',
    header: 'Meeting',
    minWidth: 240,
    cell: (meeting) => (
      <span className="flex flex-col gap-0.5">
        <span className="bidi-content font-medium">{meeting.title}</span>
        <span className="bidi-content text-xs text-secondary">{meeting.body}</span>
      </span>
    ),
  },
  {
    id: 'when',
    header: 'When',
    numeric: true,
    cell: (meeting) => <DateTime date={meeting.date} time={meeting.time} />,
  },
  {
    id: 'place',
    header: 'Place',
    minWidth: 200,
    cell: (meeting) => <Words>{meeting.place}</Words>,
  },
  {
    id: 'attendance',
    header: 'Attendance',
    cell: (meeting) => <Words>{meeting.attendance}</Words>,
  },
  { id: 'state', header: 'State', cell: (meeting) => meetingBadge(meeting.state) },
]

type ListView = 'upcoming' | 'held' | 'all'

function MeetingList({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const [view, setView] = useState<ListView>('upcoming')
  const upcoming = (meeting: Meeting) => meeting.date >= '2026-10-14'
  const rows = MEETINGS.filter((meeting) =>
    view === 'all' ? true : upcoming(meeting) === (view === 'upcoming'),
  )
  return (
    <RecordsShell phone={phone} tab="meetings" crumbs={[{ label: 'Meetings' }]}>
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Meetings of company bodies"
        titleHidden={false}
        actions={<Button intent="create" emphasis="primary" label="New meeting" />}
        views={[
          { id: 'upcoming', label: 'Upcoming', count: MEETINGS.filter(upcoming).length },
          {
            id: 'held',
            label: 'Held',
            count: MEETINGS.filter((meeting) => !upcoming(meeting)).length,
          },
          { id: 'all', label: 'All', count: MEETINGS.length },
        ]}
        view={view}
        onViewChange={(id) => {
          setView(id as ListView)
        }}
      >
        <DataTable
          label="Meetings"
          inCard
          layout={phone ? 'cards' : 'table'}
          columns={LIST_COLUMNS}
          rows={rows}
          getRowId={(meeting) => meeting.id}
          getRowLabel={(meeting) => meeting.title}
          count={rows.length}
          onRowClick={(meeting) => {
            if (meeting.route !== undefined) navigate(meeting.route)
          }}
          mobile={{
            title: (meeting) => meeting.title,
            subtitle: (meeting) => <DateTime date={meeting.date} time={meeting.time} />,
            badge: (meeting) => meetingBadge(meeting.state),
            details: ['place', 'attendance'],
          }}
        />
      </ListPage>
    </RecordsShell>
  )
}

// ── A meeting ─────────────────────────────────────────────────────────────────────────────────

const VOTE_TONES = { For: 'success', Against: 'danger', Abstain: 'neutral' } as const

function Agenda({ items }: { items: readonly AgendaItem[] }) {
  return (
    <ol className="m-0 flex list-none flex-col gap-4 p-0">
      {items.map((item) => (
        <li key={item.number} className="flex flex-col gap-2">
          <span className="flex flex-col gap-0.5">
            <span className="bidi-content font-medium">{`${item.number}. ${item.title}`}</span>
            <span className="bidi-content text-xs text-secondary">{`Presented by ${item.presenter}`}</span>
          </span>
          <AttachmentList
            label={`Materials for item ${item.number}`}
            files={item.materials}
            onDownload={() => undefined}
          />
        </li>
      ))}
    </ol>
  )
}

const MEMBER_COLUMNS: DataTableColumn<Member>[] = [
  { id: 'name', header: 'Member', cell: (member) => member.name },
  { id: 'role', header: 'Role', cell: (member) => member.role },
  {
    id: 'attendance',
    header: 'Attendance',
    cell: (member) => (
      <StatusBadge
        label={member.attendance}
        tone={member.attendance === 'Absent, excused' ? 'neutral' : 'success'}
      />
    ),
  },
]

function Count({ value }: { value: string | undefined }) {
  const { format } = useLiro()
  return value === undefined ? '—' : <bdi className="tabular-nums">{format.number(value)}</bdi>
}

const PRESENT = BOARD.filter((member) => member.attendance !== 'Absent, excused')

function BoardMeeting({ phone, mode }: { phone: boolean; mode: 'held' | 'voting' | 'recording' }) {
  const navigate = useContext(Navigate)
  const { linkComponent: Link } = useLiro()
  const [agenda, setAgenda] = useState<readonly AgendaItem[]>(
    mode === 'held' ? AGENDA : AGENDA_VOTING,
  )
  const [recording, setRecording] = useState(mode === 'recording')
  const [shownVotes, setShownVotes] = useState<AgendaItem | null>(null)
  const [votes, setVotes] = useState<Record<string, Vote>>({})
  const pending = agenda.find((item) => item.number === '4')?.result === null
  const voteColumns: DataTableColumn<AgendaItem>[] = [
    {
      id: 'item',
      header: 'Item',
      minWidth: 240,
      cell: (item) => <span className="bidi-content">{`${item.number}. ${item.title}`}</span>,
    },
    { id: 'for', header: 'For', numeric: true, cell: (item) => <Count value={item.counts?.for} /> },
    {
      id: 'against',
      header: 'Against',
      numeric: true,
      cell: (item) => <Count value={item.counts?.against} />,
    },
    {
      id: 'abstain',
      header: 'Abstain',
      numeric: true,
      cell: (item) => <Count value={item.counts?.abstain} />,
    },
    {
      id: 'result',
      header: 'Result',
      minWidth: 220,
      cell: (item) =>
        item.result === null ? (
          <StatusBadge label="Not voted on yet" tone="warning" />
        ) : (
          <StatusBadge label={item.result} tone={item.resultTone ?? 'neutral'} />
        ),
    },
  ]
  const actions: ActionItem[] = [
    { key: 'print', label: 'Print', intent: 'print', emphasis: 'secondary' },
    {
      key: 'minutes',
      label: 'Open the minutes',
      intent: 'view',
      emphasis: 'secondary',
      onClick: () => {
        navigate(BE_ROUTES.boardMinutes)
      },
    },
  ]
  return (
    <RecordsShell
      phone={phone}
      tab="meetings"
      crumbs={[{ label: 'Meetings', href: `#${BH_ROUTES.list}` }, { label: SB4.number }]}
    >
      <DetailPage
        layout={phone ? 'phone' : 'desktop'}
        title="4th meeting of the supervisory board"
        back={{ href: `#${BH_ROUTES.list}`, label: 'Meetings' }}
        status={meetingBadge(mode === 'held' ? 'Minutes to sign' : 'In session')}
        subtitle={
          <>
            <DateTime date="2026-10-08" time="10:00" />
            {' · Meeting room, Bulevar oslobođenja 102'}
          </>
        }
        actions={<ActionGroup actions={actions} />}
        keyFigures={[
          { key: 'present', label: 'Present', value: <Words>{'4 of 5'}</Words> },
          { key: 'quorum', label: 'Quorum', value: <Words>{'Yes, at least 3'}</Words> },
          { key: 'items', label: 'Agenda items', value: '4' },
        ]}
        sections={[
          {
            id: 'invitation',
            label: 'Invitation and agenda',
            content: (
              <div className="flex flex-col gap-4">
                <KeyValueList
                  items={[
                    {
                      label: 'Invitation',
                      value: (
                        <Link href={`#${BF_ROUTES.entryOf('403')}`} className={RECORD_LINK}>
                          <bdi>{SB4.invitation}</bdi>
                        </Link>
                      ),
                    },
                    { label: 'Sent', value: <DateText value={SB4.invitationSent} /> },
                  ]}
                />
                <Agenda items={agenda} />
              </div>
            ),
          },
          {
            id: 'attendance',
            label: 'Attendance and quorum',
            content: (
              <div className="flex flex-col gap-3">
                <Alert tone="success" title={SB4.quorum}>
                  {SB4.majority}
                </Alert>
                <DataTable
                  label="Attendance"
                  layout={phone ? 'cards' : 'table'}
                  columns={MEMBER_COLUMNS}
                  rows={BOARD}
                  getRowId={(member) => member.id}
                  getRowLabel={(member) => member.name}
                  mobile={{
                    title: (member) => member.name,
                    subtitle: (member) => member.role,
                    details: ['attendance'],
                  }}
                />
                <p className="bidi-content m-0 text-sm text-secondary">
                  Also present: Nenad Kovačević, Director, invited; Ana Marić, taking the minutes.
                </p>
              </div>
            ),
          },
          {
            id: 'voting',
            label: 'Voting',
            ...(pending
              ? {
                  actions: (
                    <Button
                      family="primary"
                      icon={VoteIcon}
                      emphasis="primary"
                      label="Record votes on item 4"
                      onClick={() => {
                        setRecording(true)
                      }}
                    />
                  ),
                }
              : {}),
            flush: true,
            content: (
              <DataTable
                label="Votes by agenda item"
                inCard
                layout={phone ? 'cards' : 'table'}
                columns={voteColumns}
                rows={agenda}
                getRowId={(item) => item.number}
                getRowLabel={(item) => `Item ${item.number}, ${item.title}`}
                rowActions={(item) =>
                  item.votes === null
                    ? []
                    : [
                        {
                          label: 'Show each vote',
                          onSelect: () => {
                            setShownVotes(item)
                          },
                        },
                      ]
                }
                mobile={{
                  title: (item) => `${item.number}. ${item.title}`,
                  badge: (item) =>
                    item.result === null ? (
                      <StatusBadge label="Not voted on yet" tone="warning" />
                    ) : (
                      <StatusBadge label={item.result} tone={item.resultTone ?? 'neutral'} />
                    ),
                  details: ['for', 'against', 'abstain'],
                }}
              />
            ),
          },
          {
            id: 'minutes',
            label: 'Minutes and decisions',
            content: (
              <div className="flex flex-col gap-4">
                <RelatedDocuments
                  label="Minutes and decisions"
                  items={[
                    {
                      key: 'minutes',
                      type: 'Minutes',
                      number: SB4.minutes,
                      href: `#${BE_ROUTES.boardMinutes}`,
                      status: <StatusBadge label="Awaiting signatures" tone="warning" />,
                    },
                    ...agenda
                      .filter((item) => item.decision !== undefined)
                      .map((item) => ({
                        key: `decision-${item.number}`,
                        type: `Decision, item ${item.number}`,
                        number: item.decision?.label ?? '',
                        href: item.decision?.href ?? '',
                        status: <StatusBadge label="Draft" tone="neutral" />,
                      })),
                  ]}
                />
                {mode === 'held' ? <SignerList signers={MINUTES_SIGNERS} /> : null}
              </div>
            ),
          },
        ]}
      />
      <Dialog
        open={shownVotes !== null}
        onOpenChange={(open) => {
          if (!open) setShownVotes(null)
        }}
        title="Votes"
        subject={shownVotes === null ? undefined : `${shownVotes.number}. ${shownVotes.title}`}
      >
        {shownVotes?.votes === undefined || shownVotes.votes === null ? null : (
          <div className="flex flex-col gap-3">
            <KeyValueList
              columns={1}
              items={PRESENT.map((member) => {
                const vote = shownVotes.votes?.[member.id]
                return {
                  label: member.name,
                  value:
                    vote === undefined ? '—' : <StatusBadge label={vote} tone={VOTE_TONES[vote]} />,
                }
              })}
            />
            <p className="bidi-content m-0 text-sm text-secondary">{shownVotes.result}</p>
          </div>
        )}
      </Dialog>
      <Dialog
        open={recording}
        onOpenChange={setRecording}
        title="Record votes"
        subject="4. Rulebook on business travel"
        description="Each present member’s vote; the application counts them and gives the result."
        actions={
          <ActionGroup
            actions={[
              {
                key: 'cancel',
                label: 'Cancel',
                intent: 'cancel',
                onClick: () => {
                  setRecording(false)
                },
              },
              {
                key: 'save',
                label: 'Save votes',
                intent: 'save',
                emphasis: 'primary',
                ...(Object.keys(votes).length < PRESENT.length
                  ? { unavailableReason: 'Choose a vote for every member present.' }
                  : {}),
                onClick: () => {
                  setAgenda(AGENDA)
                  setRecording(false)
                  notice.success('Item 4: adopted, 3 of 4 present for.')
                },
              },
            ]}
          />
        }
      >
        <div className="flex flex-col gap-4">
          {PRESENT.map((member) => (
            <RadioGroupField
              key={member.id}
              label={member.name}
              options={[
                { value: 'For', label: 'For' },
                { value: 'Against', label: 'Against' },
                { value: 'Abstain', label: 'Abstain' },
              ]}
              value={votes[member.id] ?? ''}
              onChange={(next) => {
                setVotes((current) => ({ ...current, [member.id]: next as Vote }))
              }}
            />
          ))}
        </div>
      </Dialog>
    </RecordsShell>
  )
}

// ── The next meeting ──────────────────────────────────────────────────────────────────────────

const ANSWER_TONES = {
  Confirmed: 'success',
  'Not answered': 'warning',
  Apologised: 'neutral',
} as const

const ANSWER_COLUMNS: DataTableColumn<Member>[] = [
  { id: 'name', header: 'Member', cell: (member) => member.name },
  { id: 'role', header: 'Role', cell: (member) => member.role },
  {
    id: 'answer',
    header: 'Answer',
    cell: (member) => <StatusBadge label={member.answer} tone={ANSWER_TONES[member.answer]} />,
  },
]

function NextMeeting({ phone }: { phone: boolean }) {
  const { linkComponent: Link } = useLiro()
  return (
    <RecordsShell
      phone={phone}
      tab="meetings"
      crumbs={[{ label: 'Meetings', href: `#${BH_ROUTES.list}` }, { label: 'SB-5/2026' }]}
    >
      <DetailPage
        layout={phone ? 'phone' : 'desktop'}
        title="5th meeting of the supervisory board"
        back={{ href: `#${BH_ROUTES.list}`, label: 'Meetings' }}
        status={meetingBadge('Invitation sent')}
        subtitle={
          <>
            <DateTime date="2026-10-22" time="10:00" />
            {' · Meeting room, Bulevar oslobođenja 102'}
          </>
        }
        actions={
          <ActionGroup
            actions={[
              {
                key: 'remind',
                label: 'Remind who has not answered',
                family: 'neutral',
                icon: Mail,
                emphasis: 'secondary',
                onClick: () => {
                  notice.success('Reminder sent to Jasmina Lukić.')
                },
              },
            ]}
          />
        }
        keyFigures={[
          { key: 'confirmed', label: 'Confirmed', value: <Words>{'3 of 5'}</Words> },
          {
            key: 'quorum',
            label: 'Quorum',
            value: <Words>{'Expected: 3 confirmed, at least 3 needed'}</Words>,
          },
        ]}
        sections={[
          {
            id: 'invitation',
            label: 'Invitation',
            content: (
              <div className="flex flex-col gap-4">
                <KeyValueList
                  items={[
                    {
                      label: 'Invitation',
                      value: (
                        <Link href={`#${BE_ROUTES.types}`} className={RECORD_LINK}>
                          <bdi>{SB5_INVITATION}</bdi>
                        </Link>
                      ),
                    },
                    { label: 'Sent', value: <DateText value="2026-10-13" /> },
                    { label: 'Materials', value: 'Sent with the invitation by 19.10.2026' },
                  ]}
                />
                <ol className="m-0 flex flex-col gap-1 ps-5 text-sm">
                  {SB5_AGENDA.map((item) => (
                    <li key={item} className="bidi-content">
                      {item}
                    </li>
                  ))}
                </ol>
              </div>
            ),
          },
          {
            id: 'answers',
            label: 'Answers',
            flush: true,
            content: (
              <DataTable
                label="Answers to the invitation"
                inCard
                layout={phone ? 'cards' : 'table'}
                columns={ANSWER_COLUMNS}
                rows={BOARD}
                getRowId={(member) => member.id}
                getRowLabel={(member) => member.name}
                mobile={{
                  title: (member) => member.name,
                  subtitle: (member) => member.role,
                  badge: (member) => (
                    <StatusBadge label={member.answer} tone={ANSWER_TONES[member.answer]} />
                  ),
                  details: [],
                }}
              />
            ),
          },
        ]}
      />
    </RecordsShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_BH_ROUTES: ExampleRoute[] = [
  { path: BH_ROUTES.list, render: (phone) => <MeetingList phone={phone} /> },
  { path: BH_ROUTES.held, render: (phone) => <BoardMeeting phone={phone} mode="held" /> },
  { path: BH_ROUTES.voting, render: (phone) => <BoardMeeting phone={phone} mode="voting" /> },
  { path: BH_ROUTES.recording, render: (phone) => <BoardMeeting phone={phone} mode="recording" /> },
  { path: BH_ROUTES.invited, render: (phone) => <NextMeeting phone={phone} /> },
]
