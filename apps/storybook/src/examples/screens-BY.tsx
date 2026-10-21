import { CircleSlash, RefreshCw, ShieldAlert } from 'lucide-react'
import { useContext, useMemo, useState, type ReactNode } from 'react'
import {
  BulkActionBar,
  Button,
  DataTable,
  DateText,
  DetailPage,
  EmptyState,
  FilterBar,
  HistoryList,
  KeyFigures,
  KeyValueList,
  notice,
  ReasonConfirmDialog,
  StatusBadge,
  useLiro,
  ValueComparison,
  WorklistPage,
  type DataTableColumn,
  type FilterDefinition,
  type HistoryEntry,
  type WorklistItem,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate } from './example-shell'
import { useExampleState } from './example-state'
import { AmlLink, AmlShell, ConfidentialNote, useAmlClient, useAmlClients } from './aml-shared'
import {
  AML_CLIENTS,
  AML_LISTS,
  AML_OFFICER,
  AML_ROUTES,
  amlAt,
  amlClient,
  amlList,
  screenedParties,
  AML_TODAY,
  type AmlClient,
  type AmlList,
} from './data-aml'
import {
  decidedHits,
  FALSE_POSITIVE_REASONS,
  HIT_TONES,
  rescreening,
  SCREENING_HITS,
  TRUE_MATCH_REASONS,
  type HitDecision,
  type HitState,
  type ScreeningHit,
} from './data-BY'

/*
 * Group BY's example screens (P5.84, screening), Snežana Jelić on 14 October 2026:
 * - The potential matches (WorklistPage), decided one by one: each match names the screened
 *   person or company, its client, the list and the application's score; its detail holds the
 *   confidentiality reminder (the client must not be told), the listed entry, and the client's
 *   record beside the entry line by line with the application's marks (ValueComparison). "False
 *   positive…" and "True match…" ask for the reason the application requires
 *   (ReasonConfirmDialog); a true match says what follows for the client. The next match opens
 *   after a decision; several can be marked false positive at once. On a phone the list comes
 *   first and the decisions stand in the bottom bar.
 * - A client's screening (DetailPage): every screened party against every list with the result in
 *   words (a potential match links to its review), the lists and their versions, and the
 *   re-screening history (HistoryList), the decisions included.
 * The examples decide Kvadrat Gradnja d.o.o.'s director's sanctions match a false positive and
 * Panonija Agro d.o.o.'s owner's PEP match a true match; Adria Commodities d.o.o.'s owner and
 * Stanić Elektro STR stay to decide. Nothing here matches or scores: data-BY.ts holds the
 * application's matches.
 */

/** The matches as the application keeps them in this session. */
function useHits(decided: boolean) {
  return useExampleState<readonly ScreeningHit[]>('aml.hits', () =>
    decided ? decidedHits(SCREENING_HITS) : SCREENING_HITS,
  )
}

function hitBadge(state: HitState) {
  return <StatusBadge label={state} tone={HIT_TONES[state]} />
}

/** The decisions on a client's matches, as history entries. */
function decisionEntries(hits: readonly ScreeningHit[], clientId: string): HistoryEntry[] {
  return hits.flatMap((hit) => {
    const decision = hit.decision
    if (hit.clientId !== clientId || decision === undefined) return []
    return [
      {
        id: `${hit.id}-decision`,
        at: decision.at,
        actor: { name: decision.by },
        text: `${hit.party.name} on the ${amlList(hit.list).name}: ${decision.state.toLocaleLowerCase('en')} (${decision.reason.toLocaleLowerCase('en')}).`,
      },
    ]
  })
}

/** The client after a decision: its history, its open matches and, for a PEP, its status. */
function decidedClient(client: AmlClient, hit: ScreeningHit, decision: HitDecision): AmlClient {
  const open = Math.max(0, client.screening.open - 1)
  const pep = hit.list === 'pep' && decision.state === 'True match'
  return {
    ...client,
    screening: {
      ...client.screening,
      open,
      note:
        open === 0
          ? 'No potential matches to decide'
          : `${String(open)} potential match${open === 1 ? '' : 'es'} to decide`,
    },
    ...(pep
      ? {
          pep: {
            status: 'PEP' as const,
            note: `${hit.party.name}, an owner, is a politically exposed person: ${hit.entry.reason}`,
          },
          owners: client.owners.map((owner) =>
            owner.name === hit.party.name ? { ...owner, pep: 'PEP' as const } : owner,
          ),
        }
      : client.pep.status === 'Potential match' && hit.list === 'pep'
        ? { pep: { status: 'Not a PEP' as const, note: client.pep.note } }
        : {}),
  }
}

// ── The potential matches ─────────────────────────────────────────────────────────────────────

type StateFilter = 'open' | 'decided' | 'all'

const FILTERS: FilterDefinition[] = [
  {
    id: 'state',
    label: 'State',
    type: 'select',
    options: [
      { value: 'open', label: 'To decide' },
      { value: 'decided', label: 'Decided' },
      { value: 'all', label: 'All' },
    ],
  },
  {
    id: 'list',
    label: 'List',
    type: 'multiSelect',
    options: AML_LISTS.map((list) => ({ value: list.id, label: list.name })),
  },
]

function filterHits(
  hits: readonly ScreeningHit[],
  search: string,
  values: Record<string, unknown>,
): ScreeningHit[] {
  const query = search.trim().toLocaleLowerCase('sr-Latn')
  const state = (values.state ?? 'all') as StateFilter
  const lists = Array.isArray(values.list) ? (values.list as string[]) : []
  return hits.filter((hit) => {
    if (state === 'open' && hit.state !== 'To decide') return false
    if (state === 'decided' && hit.state === 'To decide') return false
    if (lists.length > 0 && !lists.includes(hit.list)) return false
    if (query === '') return true
    const client = amlClient(hit.clientId)
    return [hit.party.name, client.name, hit.entry.name].some((text) =>
      text.toLocaleLowerCase('sr-Latn').includes(query),
    )
  })
}

/** A value of the comparison as the tenant writes it. */
function lineValue(value: string | null, kind: 'date' | undefined): ReactNode {
  if (value === null) return null
  return kind === 'date' ? (
    <DateText value={value} />
  ) : (
    <span className="bidi-content">{value}</span>
  )
}

function HitDetail({ hit, phone }: { hit: ScreeningHit; phone: boolean }) {
  const { format } = useLiro()
  const client = amlClient(hit.clientId)
  const list = amlList(hit.list)
  const decision = hit.decision
  return (
    <div className={phone ? 'flex flex-col gap-4' : 'flex flex-col gap-6 p-6'}>
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="bidi-content m-0 text-h2 text-primary">{hit.party.name}</h2>
        <p className="bidi-content m-0 text-sm text-secondary">
          {`${hit.party.role} · `}
          <AmlLink href={AML_ROUTES.client(client.id)}>{client.name}</AmlLink>
        </p>
      </div>
      {decision === undefined ? (
        <ConfidentialNote>
          Do not tell the client or the screened person about a potential match while it is
          reviewed, nor about its outcome.
        </ConfidentialNote>
      ) : (
        <KeyValueList
          columns={phone ? 1 : 2}
          items={[
            { key: 'decision', label: 'Decision', value: hitBadge(decision.state) },
            {
              key: 'by',
              label: 'Decided by',
              value: (
                <span className="bidi-content">{`${decision.by}, ${format.dateTime(decision.at)}`}</span>
              ),
            },
            { key: 'reason', label: 'Reason', value: decision.reason },
            {
              key: 'details',
              label: 'Details',
              value: decision.details === '' ? null : decision.details,
              fullWidth: true,
            },
          ]}
        />
      )}
      <KeyValueList
        columns={phone ? 1 : 2}
        items={[
          { key: 'list', label: 'List', value: `${list.name}, ${list.version}` },
          {
            key: 'score',
            label: 'Match score',
            value: <span className="bidi-isolate">{`${hit.score} of 100`}</span>,
            numeric: true,
          },
          { key: 'entry', label: 'Listed entry', value: hit.entry.name },
          {
            key: 'reference',
            label: 'Entry reference',
            value: <bdi>{hit.entry.reference}</bdi>,
            numeric: true,
          },
          { key: 'kind', label: 'Entry kind', value: hit.entry.kind },
          {
            key: 'since',
            label: 'Listed since',
            value: <DateText value={hit.entry.listedSince} />,
            numeric: true,
          },
          {
            key: 'reason',
            label: hit.list === 'pep' ? 'Public function' : 'Listed for',
            value: hit.entry.reason,
            fullWidth: true,
          },
          {
            key: 'found',
            label: 'Found',
            value: <span className="bidi-content">{format.dateTime(hit.found)}</span>,
          },
        ]}
      />
      <section aria-labelledby={`${hit.id}-comparison`} className="flex flex-col gap-2">
        <h3 id={`${hit.id}-comparison`} className="bidi-content m-0 text-h4 text-primary">
          Side by side
        </h3>
        <ValueComparison
          label={`${hit.party.name} and ${hit.entry.name}`}
          layout={phone ? 'phone' : 'desktop'}
          columns={['Client’s record', list.name]}
          rowHeader="Detail"
          rows={hit.lines.map((line) => ({
            id: line.id,
            label: line.label,
            values: [lineValue(line.client, line.kind), lineValue(line.listed, line.kind)],
            ...(line.differs === true ? { differs: true } : {}),
            ...(line.note === undefined ? {} : { note: line.note }),
          }))}
        />
        <p className="bidi-content m-0 text-sm text-secondary">{hit.summary}</p>
      </section>
    </div>
  )
}

interface ScreeningStart {
  hit?: string
  decide?: 'false-positive' | 'true-match'
  /** After the examples' two decisions, on the "Decided" filter. */
  decided?: boolean
}

export function AmlScreening({ phone, start = {} }: { phone: boolean; start?: ScreeningStart }) {
  const { format } = useLiro()
  const [hits, setHits] = useHits(start.decided === true)
  const { update } = useAmlClients()
  const [search, setSearch] = useState('')
  const [values, setValues] = useState<Record<string, unknown>>({
    state:
      start.decided === true
        ? 'decided'
        : // A match already decided is opened among all of them.
          start.hit !== undefined &&
            hits.find((each) => each.id === start.hit)?.state !== 'To decide'
          ? 'all'
          : 'open',
  })
  const rows = useMemo(() => filterHits(hits, search, values), [hits, search, values])
  const [selected, setSelected] = useState<string | undefined>(
    start.hit ?? (phone ? undefined : rows[0]?.id),
  )
  const [checked, setChecked] = useState<string[]>([])
  const [deciding, setDeciding] = useState<{
    ids: readonly string[]
    decision: 'false-positive' | 'true-match'
    open: boolean
  }>({
    ids: start.hit === undefined ? [] : [start.hit],
    decision: start.decide ?? 'false-positive',
    open: start.decide !== undefined && start.hit !== undefined,
  })
  const hit = rows.find((each) => each.id === selected)
  const index = rows.findIndex((each) => each.id === selected)
  const deciding1 =
    deciding.ids.length === 1 ? hits.find((each) => each.id === deciding.ids[0]) : undefined
  const truth = deciding.decision === 'true-match'

  const ask = (ids: readonly string[], decision: 'false-positive' | 'true-match') => {
    setDeciding({ ids, decision, open: true })
  }
  /** Records the decisions; the next match in the queue opens at the same place. */
  const decide = (ids: readonly string[], decision: HitDecision) => {
    const next = hits.map((each) =>
      ids.includes(each.id) ? { ...each, state: decision.state, decision } : each,
    )
    setHits(next)
    for (const each of hits.filter((one) => ids.includes(one.id))) {
      update(each.clientId, (client) => decidedClient(client, each, decision))
    }
    setChecked([])
    const after = filterHits(next, search, values)
    if (!phone || selected !== undefined) {
      setSelected(
        after.some((each) => each.id === selected)
          ? selected
          : after[Math.min(Math.max(index, 0), after.length - 1)]?.id,
      )
    }
  }

  const items: WorklistItem[] = rows.map((each) => ({
    id: each.id,
    label: `${each.party.name}, ${amlList(each.list).name}`,
    title: <span className="bidi-content">{each.party.name}</span>,
    subtitle: (
      <span className="bidi-content">
        {`${amlClient(each.clientId).name} · ${amlList(each.list).name}`}
      </span>
    ),
    figure: <span className="bidi-isolate">{`Score ${each.score}`}</span>,
    status: hitBadge(each.state),
  }))
  const decisions =
    hit?.state !== 'To decide' ? undefined : (
      <>
        <Button
          family="neutral"
          icon={CircleSlash}
          label="False positive…"
          onClick={() => {
            ask([hit.id], 'false-positive')
          }}
        />
        <Button
          family="caution"
          icon={ShieldAlert}
          label="True match…"
          onClick={() => {
            ask([hit.id], 'true-match')
          }}
        />
      </>
    )
  const count = (list: AmlList['id']) =>
    hits.filter((each) => each.list === list && each.state === 'To decide').length
  const decidedToday = hits.filter(
    (each) => each.decision?.at.startsWith(AML_TODAY) === true,
  ).length

  return (
    <AmlShell
      phone={phone}
      tab="screening"
      crumbs={[{ label: 'Screening' }]}
      {...(phone && decisions !== undefined && hit !== undefined
        ? { bottomBar: <div className="flex gap-2 [&>*]:flex-1">{decisions}</div> }
        : {})}
    >
      <WorklistPage
        layout={phone ? 'stacked' : 'split'}
        title="Potential matches"
        label="Potential matches"
        summary={
          <KeyFigures
            layout={phone ? 'phone' : 'desktop'}
            items={[
              {
                key: 'sanctions',
                label: 'Sanctions, to decide',
                value: format.number(String(count('sanctions'))),
                ...(count('sanctions') > 0 ? { tone: 'danger' as const } : {}),
              },
              { key: 'pep', label: 'PEP, to decide', value: format.number(String(count('pep'))) },
              {
                key: 'watch',
                label: 'Watch list, to decide',
                value: format.number(String(count('watch'))),
              },
              {
                key: 'today',
                label: 'Decided today',
                value: format.number(String(decidedToday)),
              },
            ]}
          />
        }
        toolbar={
          <FilterBar
            layout={phone ? 'phone' : 'desktop'}
            filters={FILTERS}
            inline={0}
            values={values}
            onValuesChange={(next) => {
              setValues(next)
            }}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Person, company or listed name"
          />
        }
        items={items}
        {...(selected === undefined ? {} : { selected })}
        onSelect={setSelected}
        checked={checked}
        onCheckedChange={setChecked}
        bulkBar={
          <BulkActionBar
            count={checked.length}
            onClear={() => {
              setChecked([])
            }}
            actions={[
              {
                key: 'false-positive',
                family: 'neutral',
                icon: CircleSlash,
                label: 'False positive…',
                onClick: () => {
                  ask(checked, 'false-positive')
                },
              },
            ]}
          />
        }
        empty={
          <EmptyState
            variant="no-results"
            title="No potential matches"
            description="Nothing matches the search and the filters."
          />
        }
        {...(hit === undefined ? {} : { detail: <HitDetail hit={hit} phone={phone} /> })}
        {...(decisions === undefined || phone ? {} : { detailActions: decisions })}
        onBack={() => {
          setSelected(undefined)
        }}
        onPrevious={() => {
          setSelected(rows[(index - 1 + rows.length) % rows.length]?.id)
        }}
        onNext={() => {
          setSelected(rows[(index + 1) % rows.length]?.id)
        }}
      />
      <ReasonConfirmDialog
        open={deciding.open}
        onOpenChange={(open) => {
          setDeciding((current) => ({ ...current, open }))
        }}
        {...(truth
          ? { family: 'caution' as const, actionIcon: ShieldAlert }
          : { family: 'neutral' as const, actionIcon: CircleSlash })}
        {...(deciding1 === undefined
          ? {
              title: `Mark ${format.number(String(deciding.ids.length))} potential matches as false positives?`,
            }
          : {
              title: truth ? 'Confirm a true match' : 'Mark as false positive',
              subject: `${deciding1.party.name} · ${amlList(deciding1.list).name}`,
            })}
        message={
          truth && deciding1 !== undefined
            ? deciding1.consequence
            : 'The client stays as it is. The decision and its reason are kept; the same entry is not raised again unless the list or the client’s record changes.'
        }
        reasons={truth ? TRUE_MATCH_REASONS : FALSE_POSITIVE_REASONS}
        reasonLabel="Reason"
        detailsLabel="Details"
        confirmLabel={truth ? 'True match' : 'False positive'}
        onConfirm={({ reason, text }) => {
          const reasons = truth ? TRUE_MATCH_REASONS : FALSE_POSITIVE_REASONS
          decide(deciding.ids, {
            state: truth ? 'True match' : 'False positive',
            reason: reasons.find((each) => each.value === reason)?.label ?? text,
            details: text,
            by: AML_OFFICER.name,
            at: amlAt(AML_TODAY, '09:40'),
          })
          notice.success(
            deciding.ids.length > 1
              ? `${format.number(String(deciding.ids.length))} potential matches marked as false positives.`
              : truth
                ? 'Decided: true match.'
                : 'Decided: false positive.',
          )
        }}
      />
    </AmlShell>
  )
}

// ── A client's screening ──────────────────────────────────────────────────────────────────────

type PartyRow = ReturnType<typeof screenedParties>[number]

/** One party against one list: the match's state in words, a match to decide links to it. */
function ListResult({ hit }: { hit: ScreeningHit | undefined }) {
  if (hit === undefined) return <span className="bidi-content text-tertiary">No match</span>
  if (hit.state !== 'To decide') return hitBadge(hit.state)
  return (
    <span className="flex flex-col items-start gap-1">
      <StatusBadge label="Potential match" tone="warning" />
      <AmlLink href={AML_ROUTES.screeningHit(hit.id)}>Review</AmlLink>
    </span>
  )
}

function partyColumns(hits: readonly ScreeningHit[]): DataTableColumn<PartyRow>[] {
  const find = (party: PartyRow, list: AmlList['id']) =>
    hits.find((hit) => hit.party.name === party.name && hit.list === list)
  return [
    {
      id: 'name',
      header: 'Screened',
      minWidth: 200,
      cell: (party) => (
        <span className="flex flex-col gap-0.5">
          <span className="bidi-content font-medium">{party.name}</span>
          <span className="bidi-content text-xs text-secondary">{party.role}</span>
        </span>
      ),
    },
    ...AML_LISTS.map((list): DataTableColumn<PartyRow> => ({
      id: list.id,
      header: list.kind,
      minWidth: 140,
      cell: (party) => <ListResult hit={find(party, list.id)} />,
    })),
  ]
}

export function AmlClientScreening({ phone, clientId }: { phone: boolean; clientId: string }) {
  const { format } = useLiro()
  const navigate = useContext(Navigate)
  const [client] = useAmlClient(clientId)
  const [hits] = useHits(false)
  const [requested, setRequested] = useState<HistoryEntry[]>([])
  const mine = hits.filter((hit) => hit.clientId === client.id)
  const parties = screenedParties(client)
  const history = [...requested, ...decisionEntries(hits, client.id), ...rescreening(client.id)]
  const open = mine.filter((hit) => hit.state === 'To decide').length
  return (
    <AmlShell
      phone={phone}
      tab="clients"
      crumbs={[
        { label: 'Clients', href: `#${AML_ROUTES.clients}` },
        { label: client.name, href: `#${AML_ROUTES.client(client.id)}` },
        { label: 'Screening' },
      ]}
    >
      <DetailPage
        layout={phone ? 'phone' : 'desktop'}
        title="Screening"
        back={{ href: `#${AML_ROUTES.client(client.id)}`, label: client.name }}
        status={
          open > 0 ? (
            <StatusBadge label="Potential match to decide" tone="warning" />
          ) : (
            <StatusBadge label="No open matches" tone="neutral" />
          )
        }
        subtitle={<span className="bidi-content">{`${client.name} · PIB ${client.taxId}`}</span>}
        actions={
          <div className="flex flex-wrap gap-2">
            {open > 0 && (
              <Button
                family="neutral"
                icon={ShieldAlert}
                label="Review matches"
                onClick={() => {
                  const first = mine.find((hit) => hit.state === 'To decide')
                  if (first !== undefined) navigate(AML_ROUTES.screeningHit(first.id))
                }}
              />
            )}
            <Button
              family="neutral"
              icon={RefreshCw}
              label="Screen again"
              onClick={() => {
                setRequested((list) => [
                  {
                    id: `${client.id}-request-${String(list.length)}`,
                    at: amlAt(AML_TODAY, '09:40'),
                    actor: { name: AML_OFFICER.name },
                    text: 'Screening asked for: the results arrive here and in Screening.',
                  },
                  ...list,
                ])
                notice.info(`Screening of ${client.name} started.`)
              }}
            />
          </div>
        }
        keyFigures={[
          {
            key: 'last',
            label: 'Last screened',
            value: (
              <span className="bidi-content tabular-nums">
                {format.dateTime(client.screening.lastRun)}
              </span>
            ),
          },
          {
            key: 'parties',
            label: 'Screened',
            value: <span className="bidi-isolate">{format.number(String(parties.length))}</span>,
          },
          {
            key: 'open',
            label: 'To decide',
            value: <span className="bidi-isolate">{format.number(String(open))}</span>,
            ...(open > 0 ? { tone: 'warning' as const } : {}),
          },
          {
            key: 'lists',
            label: 'Lists',
            value: <span className="bidi-isolate">{format.number(String(AML_LISTS.length))}</span>,
          },
        ]}
        sections={[
          {
            id: 'results',
            label: 'Results',
            description: 'The client, its owners and its representative against every list.',
            flush: true,
            content: (
              <DataTable
                label={`Screening results of ${client.name}`}
                layout={phone ? 'cards' : 'table'}
                inCard
                columns={partyColumns(mine)}
                rows={parties}
                getRowId={(party) => party.id}
                getRowLabel={(party) => party.name}
                mobile={{
                  title: (party) => party.name,
                  subtitle: (party) => <span className="bidi-content">{party.role}</span>,
                  details: AML_LISTS.map((list) => list.id),
                }}
              />
            ),
          },
          {
            id: 'lists',
            label: 'Lists',
            content: (
              <KeyValueList
                columns={1}
                items={AML_LISTS.map((list) => ({
                  key: list.id,
                  label: list.name,
                  value: (
                    <span className="bidi-content">
                      {`${list.version}, loaded ${format.dateTime(list.updated)}`}
                    </span>
                  ),
                }))}
              />
            ),
          },
          {
            id: 'history',
            label: 'Re-screening history',
            content: (
              <HistoryList label={`Screening history of ${client.name}`} entries={history} />
            ),
          },
        ]}
      />
    </AmlShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_BY_ROUTES: ExampleRoute[] = [
  { path: AML_ROUTES.screening, render: (phone) => <AmlScreening phone={phone} /> },
  {
    path: AML_ROUTES.screeningDecided,
    render: (phone) => <AmlScreening phone={phone} start={{ decided: true }} />,
  },
  ...SCREENING_HITS.flatMap((hit) => [
    {
      path: AML_ROUTES.screeningHit(hit.id),
      render: (phone: boolean) => <AmlScreening phone={phone} start={{ hit: hit.id }} />,
    },
    {
      path: AML_ROUTES.screeningDecide(hit.id, 'false-positive'),
      render: (phone: boolean) => (
        <AmlScreening phone={phone} start={{ hit: hit.id, decide: 'false-positive' }} />
      ),
    },
    {
      path: AML_ROUTES.screeningDecide(hit.id, 'true-match'),
      render: (phone: boolean) => (
        <AmlScreening phone={phone} start={{ hit: hit.id, decide: 'true-match' }} />
      ),
    },
  ]),
  ...AML_CLIENTS.map((client) => ({
    path: AML_ROUTES.clientScreening(client.id),
    render: (phone: boolean) => <AmlClientScreening phone={phone} clientId={client.id} />,
  })),
]
