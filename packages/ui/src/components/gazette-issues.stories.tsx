import type { Meta, StoryObj } from '@storybook/react-vite'
import { Bell } from 'lucide-react'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { ISSUES } from './gazette-story-data'
import { Button } from './button'
import { GazetteIssues, type GazetteIssue } from './gazette-issues'
import { ExampleProvider, expectContentDirection, PhoneFrame, StoryProvider } from './story-frames'

const meta = {
  title: 'Components/Legal/GazetteIssues',
  component: GazetteIssues,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** what is new in an official gazette, issue by issue, the newest first ' +
          '(BUILD-PLAN P5.27 e): each issue’s number (a link), its day and how many acts it ' +
          'holds, then its acts — type, status, the title as a link, and the application’s ' +
          'short note ("Amends …"). "Show more issues" pages from the application.\n\n' +
          '**When to use:** beside the legal search, on a start page, in a watch list. ' +
          '**When not:** a search across acts (the legal search recipe); the history of one act ' +
          '(the act page’s side panel).',
      },
    },
  },
  args: { title: 'New in the Illustrative Gazette', issues: ISSUES },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <div className="max-w-180">
          <Story />
        </div>
      </ExampleProvider>
    ),
  ],
  play: settle,
} satisfies Meta<typeof GazetteIssues>

export default meta

type Story = StoryObj<typeof meta>

/** Three issues, newest first; more can be loaded. */
export const Default: Story = {
  args: {
    description: 'Illustrative data: invented acts in an invented gazette.',
    hasMore: true,
    onLoadMore: () => undefined,
    actions: <Button family="neutral" icon={Bell} label="Watch" emphasis="menu" />,
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('heading', { level: 3 })).toHaveLength(3)
    await expect(canvas.getByRole('link', { name: 'No. 9/2024' })).toBeVisible()
    await expect(canvas.getByText(/Published 15\.02\.2024\./)).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Show more issues' })).toBeVisible()
  },
}

/** Older issues are loading: a spinner where "Show more issues" stood. */
export const LoadingMore: Story = {
  name: 'Loading more',
  args: { hasMore: true, onLoadMore: () => undefined, loading: true },
}

/** The first issues are loading: skeletons. */
export const Loading: Story = {
  args: { issues: [], loading: true },
}

/** Nothing new. */
export const Empty: Story = {
  args: { issues: [] },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('No new issues')).toBeVisible()
  },
}

/** The issues could not be loaded: "Try again". */
export const Failed: Story = {
  name: 'Error',
  args: { issues: [], error: true, onRetry: () => undefined },
}

/** Long titles and notes wrap; nothing is cut. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    headingLevel: 3,
    issues: [
      {
        id: 'long',
        label: 'No. 141/2024 (special issue for the Illustrative Autonomous Province)',
        published: '2024-12-30',
        acts: [
          {
            id: 'l1',
            type: 'Law on ratification of an illustrative international agreement',
            title:
              'Law amending and supplementing the Law on Illustrative Building Works, Illustrative Spatial Planning and the Illustrative Supervision of Construction Sites in the Transitional Period',
            href: '#/legal/acts/long',
            status: { id: 'partly', label: 'Partly in force', tone: 'warning' },
            note: 'Amends Articles 4, 12, 17a, 33, 57, 58, 90 and 141; adds Articles 157a to 157f; Articles 33 and 90 apply from 01.01.2027.',
          },
        ],
      },
    ],
  },
}

/** Phone width: the same list, full width. */
export const Phone: Story = {
  args: { hasMore: true, onLoadMore: () => undefined },
  decorators: [
    (Story) => (
      <PhoneFrame>
        <ExampleProvider>
          <div className="p-4">
            <Story />
          </div>
        </ExampleProvider>
      </PhoneFrame>
    ),
  ],
}

const ARABIC_ISSUES: GazetteIssue[] = [
  {
    id: 'a',
    label: 'العدد 9/2024',
    published: '2024-02-15',
    acts: [
      {
        id: 'a1',
        type: 'قانون',
        title: 'قانون بتعديل قانون الأعمال الإنشائية التوضيحي',
        href: '#a1',
        status: { id: 'in-force', label: 'ساري المفعول', tone: 'success' },
        note: 'يعدل المواد 12 و57 و90',
      },
    ],
  },
]

/** Arabic issues. */
export const Arabic: Story = {
  args: { title: 'جديد الجريدة التوضيحية', issues: ARABIC_ISSUES },
  decorators: [
    (Story) => (
      <StoryProvider locale="ar">
        <ExampleProvider>
          <Story />
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

const JAPANESE_ISSUES: GazetteIssue[] = [
  {
    id: 'j',
    label: '第9/2024号',
    published: '2024-02-15',
    acts: [
      {
        id: 'j1',
        type: '法律',
        title: '例示建設工事法の一部を改正する法律',
        href: '#j1',
        status: { id: 'in-force', label: '施行中', tone: 'success' },
        note: '第12条、第57条及び第90条を改正',
      },
    ],
  },
]

/** Japanese issues. */
export const Japanese: Story = {
  args: { title: '例示官報の新着', issues: JAPANESE_ISSUES },
  decorators: [
    (Story) => (
      <StoryProvider locale="ja">
        <ExampleProvider>
          <Story />
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

/** English in a right-to-left page: "No. 9/2024" and "Published 15.02.2024. · 2 acts" keep their order. */
export const EnglishInRtl: Story = {
  name: 'English in RTL',
  decorators: [
    (Story) => (
      <StoryProvider locale="ar">
        <ExampleProvider>
          <Story />
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expectContentDirection(
      canvas.getByRole('heading', { name: 'No. 9/2024' }),
      canvas.getByText(/Published 15\.02\.2024\./),
    )
  },
}

/** "Show more issues" asks the application, which adds the older issues. */
export const ShowMoreInteraction: Story = {
  name: 'Show more, interaction',
  tags: ['interaction'],
  render: (args) => {
    function Paged() {
      const [issues, setIssues] = useState(ISSUES.slice(0, 1))
      return (
        <GazetteIssues
          {...args}
          issues={issues}
          hasMore={issues.length < ISSUES.length}
          onLoadMore={() => {
            setIssues(ISSUES)
          }}
        />
      )
    }
    return <Paged />
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('heading', { level: 3 })).toHaveLength(1)
    await userEvent.click(canvas.getByRole('button', { name: 'Show more issues' }))
    await expect(canvas.getAllByRole('heading', { level: 3 })).toHaveLength(3)
    await expect(canvas.queryByRole('button', { name: 'Show more issues' })).toBeNull()
  },
}
