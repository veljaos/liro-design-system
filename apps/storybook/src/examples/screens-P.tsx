import { Newspaper, Search } from 'lucide-react'
import { useContext, useMemo, useState } from 'react'
import { Button, GazetteIssues, LegalSearchPage, PageHeader } from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate, Shell } from './example-shell'
import { Frame } from './screens-G'
import {
  FILTERS,
  ISSUE_PAGE,
  ISSUES,
  P_ROUTES,
  PAGE_SIZE,
  searchActs,
  SORTS,
  START,
  VIEWS,
} from './data-P'

/*
 * Group P's example screens (P5.27, legal information): the search across acts — "site records"
 * in building works, in force today — and "New in the Illustrative Gazette", issue by issue. Each
 * screen plays the application: it searches, filters, sorts and pages its dataset (data-P.ts) and
 * loads older issues; LegalSearchPage and GazetteIssues only show and report. Every act is
 * invented and labelled "Illustrative". The results link to the act page's routes (group O):
 * `/legal/acts/<id>` and `/legal/acts/<id>/article-<n>`.
 */

export { P_ROUTES }

const LEGAL = 'Legal information'

// ── 1. The search ─────────────────────────────────────────────────────────────────────────────

export function LegalSearch({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const [search, setSearch] = useState(START.search)
  const [values, setValues] = useState(START.values)
  const [sort, setSort] = useState('relevance')
  const [view, setView] = useState('all')
  const [page, setPage] = useState(0)
  const found = useMemo(
    () =>
      searchActs(search, view === 'in-force' ? { ...values, status: ['in-force'] } : values, sort),
    [search, values, sort, view],
  )
  const shown = found.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  return (
    <Shell phone={phone} crumbs={[{ label: LEGAL }]}>
      <LegalSearchPage
        title={LEGAL}
        titleHidden={false}
        layout={phone ? 'phone' : 'desktop'}
        actions={
          <Button
            family="neutral"
            icon={Newspaper}
            label="New in the Illustrative Gazette"
            onClick={() => {
              navigate(P_ROUTES.gazette)
            }}
          />
        }
        views={VIEWS}
        view={view}
        onViewChange={(next) => {
          setView(next)
          setPage(0)
        }}
        search={search}
        onSearchChange={(next) => {
          setSearch(next)
          setPage(0)
        }}
        searchPlaceholder="Search acts…"
        filters={FILTERS}
        inline={2}
        values={values}
        onValuesChange={(next) => {
          setValues(next)
          setPage(0)
        }}
        results={shown}
        count={found.length}
        sortOptions={SORTS}
        sort={sort}
        onSortChange={(next) => {
          setSort(next)
          setPage(0)
        }}
        hasPrevious={page > 0}
        hasNext={(page + 1) * PAGE_SIZE < found.length}
        onPrevious={() => {
          setPage((current) => Math.max(0, current - 1))
        }}
        onNext={() => {
          setPage((current) => current + 1)
        }}
      />
    </Shell>
  )
}

// ── 2. New in the Illustrative Gazette ────────────────────────────────────────────────────────

export function GazetteNews({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const [count, setCount] = useState(ISSUE_PAGE)
  return (
    <Shell
      phone={phone}
      crumbs={[
        { label: LEGAL, href: `#${P_ROUTES.search}` },
        { label: 'New in the Illustrative Gazette' },
      ]}
    >
      <Frame phone={phone}>
        <PageHeader
          title="New in the Illustrative Gazette"
          subtitle="Illustrative data: invented acts in an invented gazette"
          actions={
            <Button
              family="neutral"
              icon={Search}
              label="Search acts"
              onClick={() => {
                navigate(P_ROUTES.search)
              }}
            />
          }
        />
        <GazetteIssues
          title="Latest issues"
          issues={ISSUES.slice(0, count)}
          hasMore={count < ISSUES.length}
          onLoadMore={() => {
            setCount((current) => current + ISSUE_PAGE)
          }}
        />
      </Frame>
    </Shell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_P_ROUTES: ExampleRoute[] = [
  { path: P_ROUTES.search, render: (phone) => <LegalSearch phone={phone} /> },
  { path: P_ROUTES.gazette, render: (phone) => <GazetteNews phone={phone} /> },
]
