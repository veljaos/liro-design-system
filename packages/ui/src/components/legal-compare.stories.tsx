import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { LegalCompare } from './legal-compare'
import {
  ARABIC_EARLIER_NODES,
  ARABIC_NODES,
  COMPANY_2022_NODES,
  COMPANY_2025_NODES,
  JAPANESE_EARLIER_NODES,
  JAPANESE_NODES,
  LAW_2018_NODES,
  LAW_NODES,
  LONG_TEXT_NODES,
  SERBIAN_CYRILLIC_NODES,
} from './legal-story-data'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

/*
 * Every act in these stories is invented: the "Law on Illustrative Building Works" in the
 * "Illustrative Gazette", and Kvadrat Gradnja d.o.o.'s illustrative work rulebook
 * (legal-story-data.ts).
 */

const BEFORE = { label: 'version of 01.07.2018. (Illustrative)', nodes: LAW_2018_NODES }
const AFTER = { label: 'version of 01.03.2024. (Illustrative)', nodes: LAW_NODES }

const meta = {
  title: 'Components/Legal/LegalCompare',
  component: LegalCompare,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** what changed between two versions of an act — a law after an ' +
          'amendment, a company’s rulebook from one year to the next. Inline, in one column on ' +
          'every width: an insertion underlined, a deletion struck through, each with a word ' +
          'for assistive technology ("Added:", "Deleted:") and a visible legend; colour only ' +
          'helps. Articles added or deleted whole are labelled.\n\n' +
          '**Changes only** by default: a run of unchanged articles between the changes is one ' +
          'line ("8 unchanged articles") that opens; "Show all" shows every article. The word ' +
          'diff is computed by the library from the two texts it is given (`wordDiff`); what ' +
          'the change means is the application’s.\n\n' +
          '**When:** comparing two versions of the same act. **When not:** reading one ' +
          'version (LegalText); the list of changes by amending act (the act page’s history).',
      },
    },
  },
  args: { before: BEFORE, after: AFTER },
  render: (args) => (
    <ExampleProvider>
      <LegalCompare {...args} lang="en" />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof LegalCompare>

export default meta

type Story = StoryObj<typeof meta>

/** The law from 2018 to 2024: Article 5 changed, Article 6 deleted, Article 8 added. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('heading', {
        level: 2,
        name: 'Changes from version of 01.07.2018. (Illustrative) to version of 01.03.2024. (Illustrative)',
      }),
    ).toBeVisible()
    await expect(canvas.getByText('Changed: 1 · Added: 1 · Deleted: 1')).toBeVisible()
    const a5 = canvasElement.querySelector('[data-legal-compare="a5"]')
    await expect(a5).toHaveAttribute('data-kind', 'changed')
    const inserted = a5?.querySelector('ins')
    await expect(inserted).toHaveTextContent('Added: 30')
    await expect(getComputedStyle(inserted ?? document.body).textDecorationLine).toBe('underline')
    const deleted = a5?.querySelector('del')
    await expect(deleted).toHaveTextContent('Deleted: 60')
    await expect(getComputedStyle(deleted ?? document.body).textDecorationLine).toBe('line-through')
    await expect(canvasElement.querySelector('[data-legal-compare="a6"]')).toHaveAttribute(
      'data-kind',
      'removed',
    )
    await expect(canvasElement.querySelector('[data-legal-compare="a8"]')).toHaveAttribute(
      'data-kind',
      'added',
    )
    await expect(canvas.getByRole('button', { name: '4 unchanged articles' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    await expect(canvasElement.querySelector('[data-legal-compare="a1"]')).toBeNull()
  },
}

/** Every article, the unchanged ones as they are. */
export const ShowAll: Story = {
  name: 'Show all',
  render: (args) => (
    <ExampleProvider>
      <LegalCompare {...args} lang="en" defaultShowAll />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement.querySelectorAll('[data-legal-compare]')).toHaveLength(11)
    await expect(
      within(canvasElement).getByRole('button', { name: 'Show changes only' }),
    ).toBeVisible()
  },
}

/** Opening a run of unchanged articles, then every article and back. */
export const Toggle: Story = {
  name: 'Show all, interaction',
  tags: ['interaction'],
  args: { onShowAllChange: fn() },
  play: async ({ canvasElement, args }) => {
    await settle()
    const canvas = within(canvasElement)
    const run = canvas.getByRole('button', { name: '4 unchanged articles' })
    await userEvent.click(run)
    await expect(run).toHaveAttribute('aria-expanded', 'true')
    await expect(canvasElement.querySelector('[data-legal-compare="a1"]')).not.toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: 'Show all' }))
    await expect(args.onShowAllChange).toHaveBeenCalledWith(true)
    await expect(canvasElement.querySelectorAll('[data-legal-compare]')).toHaveLength(11)
    await userEvent.click(canvas.getByRole('button', { name: 'Show changes only' }))
    await expect(args.onShowAllChange).toHaveBeenLastCalledWith(false)
  },
}

/** Kvadrat Gradnja d.o.o.'s illustrative work rulebook, 2022 to 2025. */
export const CompanyRulebook: Story = {
  name: 'Company rulebook, 2022 to 2025',
  args: {
    before: { label: '2022 (Illustrative)', nodes: COMPANY_2022_NODES },
    after: { label: '2025 (Illustrative)', nodes: COMPANY_2025_NODES },
  },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByText('Changed: 2 · Added: 1 · Deleted: 1'),
    ).toBeVisible()
    await expect(canvasElement.querySelector('[data-legal-compare="k2"] ins')).toHaveTextContent(
      '15:30',
    )
  },
}

/** Two versions with the same text. */
export const NoChanges: Story = {
  name: 'No changes',
  args: { after: { label: '01.07.2018. (Illustrative)', nodes: LAW_2018_NODES } },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByText('The two versions have the same text.'),
    ).toBeVisible()
  },
}

/** Long words and titles wrap inside the column. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    before: { label: 'the first illustrative version of a long article', nodes: [] },
    after: { label: 'the second illustrative version of a long article', nodes: LONG_TEXT_NODES },
  },
  play: async ({ canvasElement }) => {
    await settle()
    const article = canvasElement.querySelector('article')
    await expect(article?.scrollWidth).toBeLessThanOrEqual((article?.clientWidth ?? 0) + 1)
  },
}

/** A Cyrillic act's versions shown in Latin. */
export const SerbianLatin: Story = {
  name: 'Serbian, Cyrillic shown in Latin',
  args: {
    before: { label: '2023 (ilustrativno)', nodes: SERBIAN_CYRILLIC_NODES.slice(0, 1) },
    after: { label: '2025 (ilustrativno)', nodes: SERBIAN_CYRILLIC_NODES },
  },
  render: (args) => (
    <StoryProvider locale="sr-Latn">
      <LegalCompare {...args} lang="sr-Cyrl" script="latin" />
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByRole('heading', { name: /Džepna knjiga naloga/ }),
    ).toBeVisible()
  },
}

/** Phone width: the same single column. */
export const Phone: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <div style={{ height: '100%', overflowY: 'auto', padding: 16, boxSizing: 'border-box' }}>
          <LegalCompare {...args} lang="en" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const section = canvasElement.querySelector('[data-slot="legal-compare"]')
    await expect(section?.scrollWidth).toBeLessThanOrEqual((section?.clientWidth ?? 0) + 1)
  },
}

/** Arabic: an invented act's two versions, from the right. */
export const Arabic: Story = {
  args: {
    before: { label: '2018 (توضيحي)', nodes: ARABIC_EARLIER_NODES },
    after: { label: '2024 (توضيحي)', nodes: ARABIC_NODES },
  },
  render: (args) => (
    <StoryProvider locale="ar">
      <LegalCompare {...args} lang="ar" />
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement.querySelector('[data-legal-compare="ar2"] ins')).not.toBeNull()
  },
}

/** Japanese: an invented act's two versions. */
export const Japanese: Story = {
  args: {
    before: { label: '2018年版（例示）', nodes: JAPANESE_EARLIER_NODES },
    after: { label: '2024年版（例示）', nodes: JAPANESE_NODES },
  },
  render: (args) => (
    <StoryProvider locale="ja">
      <LegalCompare {...args} lang="ja" />
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement.querySelector('[data-legal-compare="ja1"]')).toHaveAttribute(
      'data-kind',
      'changed',
    )
  },
}
