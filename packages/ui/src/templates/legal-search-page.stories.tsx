import type { Meta, StoryObj } from '@storybook/react-vite'
import { BookmarkPlus } from 'lucide-react'
import { useState, type ComponentProps } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Button } from '../components/button'
import type { DataTableFilters } from '../components/data-table-logic'
import {
  ExampleProvider,
  expectContentDirection,
  PhoneFrame,
  StoryProvider,
} from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { LegalSearchPage } from './legal-search-page'
import {
  ACTIVE_VALUES,
  ARABIC_RESULTS,
  JAPANESE_RESULTS,
  LEGAL_FILTERS,
  LONG_RESULTS,
  RESULTS,
  SORTS,
  VIEWS,
} from './legal-search-story-data'

type PageProps = ComponentProps<typeof LegalSearchPage>

/**
 * The search page as an application keeps it: the search, the filters, the sort and the view in
 * state; the results are the stories' (the application searches on the server).
 */
function Search(
  props: Partial<PageProps> & { initialValues?: DataTableFilters; initialSearch?: string },
) {
  const { initialValues, initialSearch, ...rest } = props
  const [search, setSearch] = useState(initialSearch ?? 'site records')
  const [values, setValues] = useState<DataTableFilters>(initialValues ?? {})
  const [sort, setSort] = useState('relevance')
  const [view, setView] = useState('all')
  return (
    <LegalSearchPage
      title="Legal information"
      layout="desktop"
      views={VIEWS}
      view={view}
      onViewChange={setView}
      saveView={<Button family="neutral" icon={BookmarkPlus} label="Save view" emphasis="menu" />}
      searchPlaceholder="Search acts…"
      filters={LEGAL_FILTERS}
      inline={2}
      results={RESULTS}
      count={38}
      sortOptions={SORTS}
      sort={sort}
      onSortChange={setSort}
      hasPrevious={false}
      hasNext
      onPrevious={() => undefined}
      onNext={() => undefined}
      {...rest}
      search={search}
      onSearchChange={setSearch}
      values={values}
      onValuesChange={setValues}
    />
  )
}

const meta = {
  title: 'Templates/LegalSearchPage',
  component: LegalSearchPage,
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          '**What for:** a full-text search across legal acts — laws, by-laws, court decisions, ' +
          'opinions and a company’s internal acts (BUILD-PLAN P5.27 e). On ListPage: saved ' +
          'views, then the FilterBar (search at the start; type, status and issuer in the row; ' +
          'the area as a tree, the gazette’s year and number and the date in force in the ' +
          'drawer), then the results: the type, issuer and status; the title as a link; the ' +
          'gazette references; the snippet with each match marked (semibold on the warning ' +
          'background, never blue, never colour alone); "Found in Article 57" linking to the ' +
          'article. The count and "Sort: …" over the list, cursor paging under it.\n\n' +
          '**How:** the application searches, filters, sorts and pages; the page reports the ' +
          'query (after a 300ms pause), the filter values, the sort and the view, and shows the ' +
          'results it is given with their snippets (marked segments, or `snippetFromRanges` ' +
          'from the engine’s ranges).\n\n' +
          '**When not:** a search inside one act (the act page’s own search); a list of records ' +
          'with columns to compare (ListPage with DataTable); what is new in the gazette ' +
          '(GazetteIssues).',
      },
    },
  },
  args: {
    title: 'Legal information',
    search: '',
    onSearchChange: () => undefined,
    filters: [],
    values: {},
    onValuesChange: () => undefined,
    results: [],
  },
  render: () => (
    <ExampleProvider>
      <Search />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof LegalSearchPage>

export default meta

type Story = StoryObj<typeof meta>

/** "site records": six of 38 acts, the best first; each match marked, with its article. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('38 results')).toBeVisible()
    const list = canvas.getByRole('list', { name: 'Search results' })
    await expect(within(list).getAllByRole('heading', { level: 2 })).toHaveLength(6)
    await expect(
      canvas.getByRole('link', { name: 'Law on Illustrative Building Works' }),
    ).toHaveAttribute('href', '#/legal/acts/building-works')
    await expect(canvas.getByRole('link', { name: 'Found in Article 57' })).toBeVisible()
    await expect(
      canvas.getByText('Illustrative Gazette No. 12/2016, 47/2018, 33/2021, 9/2024'),
    ).toBeVisible()
    const marks = canvasElement.querySelectorAll('mark')
    await expect(marks).toHaveLength(6)
    await expect(getComputedStyle(marks[0] as Element).fontWeight).toBe('600')
  },
}

/**
 * Filters set: laws and rulebooks in force (in the row, summed up on one line), the area
 * "Building works" from the tree, the gazette year and the date in force as pills.
 */
export const ActiveFilters: Story = {
  name: 'Active filters',
  render: () => (
    <ExampleProvider>
      <Search
        initialValues={ACTIVE_VALUES}
        results={RESULTS.slice(0, 2)}
        count={2}
        hasNext={false}
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Area: Building works')).toBeVisible()
    await expect(canvas.getByText('Gazette year: 2016')).toBeVisible()
    await expect(canvas.getByText('In force between: 01.01.2026. –')).toBeVisible()
    await expect(canvas.queryByRole('button', { name: 'Next' })).toBeNull()
  },
}

/** The filters drawer open: the area tree with "Building works" checked, its branch open. */
export const FiltersDrawer: Story = {
  name: 'Active filters, drawer',
  render: () => (
    <ExampleProvider>
      <Search
        initialValues={ACTIVE_VALUES}
        results={RESULTS.slice(0, 2)}
        count={2}
        hasNext={false}
        defaultFiltersOpen
      />
    </ExampleProvider>
  ),
  play: async () => {
    const drawer = await within(document.body).findByRole('dialog', { name: 'Filters' })
    await settle()
    const tree = within(drawer).getByRole('tree', { name: 'Area' })
    await expect(within(tree).getByRole('treeitem', { name: /^Building works/ })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await expect(
      within(tree).getByRole('treeitem', { name: /^Construction and spatial planning/ }),
    ).toHaveAttribute('aria-checked', 'mixed')
  },
}

/** Nothing matches the words and filters: "Clear filters" widens the search. */
export const NoResults: Story = {
  name: 'No results',
  render: () => (
    <ExampleProvider>
      <Search
        initialSearch="site recrods"
        initialValues={ACTIVE_VALUES}
        results={[]}
        count={0}
        hasNext={false}
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Nothing matches')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Clear filters' })).toBeVisible()
  },
}

/** Before anything is searched and nothing to show: the empty state. */
export const Empty: Story = {
  render: () => (
    <ExampleProvider>
      <Search initialSearch="" results={[]} hasNext={false} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('Nothing here yet')).toBeVisible()
  },
}

/** The first page is loading: skeleton results. */
export const Loading: Story = {
  render: () => (
    <ExampleProvider>
      <Search results={[]} loading hasNext={false} />
    </ExampleProvider>
  ),
}

/** A new search runs while the old results stand: the refetch loader beside the count. */
export const Refetching: Story = {
  render: () => (
    <ExampleProvider>
      <Search loading />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const loader = canvasElement.querySelector('[data-slot="refetch-loader"]')
    await expect(loader).toHaveTextContent('Updating…')
  },
}

/** The search failed: the error with its case number and "Try again". */
export const Failed: Story = {
  name: 'Error',
  render: () => (
    <ExampleProvider>
      <Search error errorCaseId="LS-2026-10-11-0042" onRetry={() => undefined} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Try again' })).toBeVisible()
    await expect(canvas.queryByRole('list', { name: 'Search results' })).toBeNull()
  },
}

/** Long titles, issuer, gazette references and article: everything wraps, nothing is cut. */
export const LongTitles: Story = {
  name: 'Long titles',
  render: () => (
    <ExampleProvider>
      <Search results={LONG_RESULTS} count={12345} countIsExact={false} hasPrevious />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('More than 10.000 results')).toBeVisible()
  },
}

/** Phone: one column of results; every filter in the drawer, the views in one select. */
export const Phone: Story = {
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <Search layout="phone" initialValues={{ area: ['works', 'site-records', 'site-safety'] }} />
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Filters' })).toBeVisible()
    await expect(canvas.getByText('Area: Building works')).toBeVisible()
  },
}

/** Phone: the filters drawer, full width, the tree with touch rows. */
export const PhoneFilters: Story = {
  name: 'Phone, filters',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <Search layout="phone" initialValues={ACTIVE_VALUES} defaultFiltersOpen />
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async () => {
    await within(document.body).findByRole('dialog', { name: 'Filters' })
    await settle()
  },
}

/** Arabic acts: titles, snippets and the article in their own direction. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <Search
          initialSearch="سجلات الموقع"
          results={ARABIC_RESULTS}
          count={2}
          hasNext={false}
          title="المعلومات القانونية"
          searchPlaceholder="ابحث في القوانين…"
          views={[{ id: 'all', label: 'كل القوانين', count: 1284 }]}
          sortOptions={[{ value: 'relevance', label: 'الصلة' }]}
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Japanese acts. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <Search
          initialSearch="現場記録"
          results={JAPANESE_RESULTS}
          count={2}
          hasNext={false}
          title="法令情報"
          searchPlaceholder="法令を検索…"
          views={[{ id: 'all', label: 'すべての法令', count: 1284 }]}
          sortOptions={[{ value: 'relevance', label: '関連度' }]}
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}

/**
 * English in a right-to-left page: the layout mirrors (status at the start, sort at the start),
 * every text keeps its reading order ("38 results", "Found in Article 57", the gazette numbers).
 */
export const EnglishInRtl: Story = {
  name: 'English in RTL',
  render: () => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <Search initialValues={{ area: ['works', 'site-records', 'site-safety'] }} />
      </ExampleProvider>
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expectContentDirection(
      canvas.getByText('38 results'),
      canvas.getByRole('link', { name: 'Found in Article 57' }),
      canvas.getByText('Illustrative Gazette No. 12/2016, 47/2018, 33/2021, 9/2024'),
    )
  },
}

/** Typing reports the search; choosing a sort and removing a pill report the change. */
export const SearchInteraction: Story = {
  name: 'Search, sort and filters, interaction',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <Search initialSearch="" initialValues={{ area: ['permits'] }} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(document.body)
    const search = canvas.getByRole('textbox', { name: 'Search acts…' })
    await userEvent.type(search, 'site records')
    await expect(search).toHaveValue('site records')
    await userEvent.click(canvas.getByRole('button', { name: 'Sort: Relevance' }))
    await userEvent.click(await body.findByRole('menuitemradio', { name: 'Newest first' }))
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Sort: Newest first' })).toBeVisible(),
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Remove filter: Area' }))
    await expect(canvas.queryByText('Area: Building permits')).toBeNull()
  },
}

/** The area tree from the keyboard: Filters, then check "Site safety" with Space. */
export const TreeFilterInteraction: Story = {
  name: 'Area tree, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Filters' }))
    const drawer = await within(document.body).findByRole('dialog', { name: 'Filters' })
    const tree = within(drawer).getByRole('tree', { name: 'Area' })
    const construction = within(tree).getByRole('treeitem', {
      name: /^Construction and spatial planning/,
    })
    construction.focus()
    await userEvent.keyboard(' ')
    await expect(construction).toHaveAttribute('aria-checked', 'true')
    await userEvent.keyboard('{Escape}')
    await expect(canvas.getByText('Area: Construction and spatial planning')).toBeVisible()
  },
}
