import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { settle } from '../primitives/story-helpers'
import {
  LEGAL_PANEL_KEYS,
  LegalArticleSummary,
  useLegalPanels,
  type LegalPanelsOptions,
} from './legal-panels'
import {
  ARABIC_ACT,
  ARABIC_PRACTICE,
  EMPTY_ACT,
  HIGHER,
  JAPANESE_ACT,
  JAPANESE_PRACTICE,
  LAW,
  LONG_ACT,
  LOWER,
  NOTES,
  PRACTICE,
  REFERRED_BY,
  REFERS_TO,
} from './legal-page-story-data'
import { SidePanels } from './side-panels'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

/** The panels as the page stands them: the summary (when narrowed) above, a 300px column. */
function Panels({
  open: initialOpen = LEGAL_PANEL_KEYS,
  onArticleClear,
  phone = false,
  ...options
}: LegalPanelsOptions & {
  open?: readonly string[]
  onArticleClear?: () => void
  phone?: boolean
}) {
  const [open, setOpen] = useState<readonly string[]>(initialOpen)
  const panels = useLegalPanels(options)
  return (
    <div className={phone ? 'flex flex-col gap-4 p-4' : 'flex w-[300px] flex-col gap-4'}>
      {options.selectedArticleId !== undefined && (
        <LegalArticleSummary
          act={options.act}
          articleId={options.selectedArticleId}
          {...(options.practice === undefined ? {} : { practice: options.practice })}
          {...(onArticleClear === undefined ? {} : { onArticleClear })}
        />
      )}
      <SidePanels panels={panels} open={open} onOpenChange={setOpen} />
    </div>
  )
}

const ALL: LegalPanelsOptions = {
  act: LAW,
  higher: HIGHER,
  lower: LOWER,
  refersTo: REFERS_TO,
  referredBy: REFERRED_BY,
  practice: PRACTICE,
  notes: NOTES,
}

const meta = {
  title: 'Components/Legal/LegalPanels',
  component: LegalArticleSummary,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the side panels of a legal act’s page (DocumentPage with LegalText, the legal act recipe in docs/recipes.md), as the invoice’s ' +
          'panels: `useLegalPanels` returns SidePanel entries — Versions, History of changes, ' +
          'Legal hierarchy, References, Court practice and opinions, My notes and bookmarks — ' +
          'and `LegalArticleSummary` stands above them while they are narrowed to one article.\n\n' +
          '**Versions:** every consolidated version, its days and the amending act; the version ' +
          'shown is the neutral selection; a press on another reports it (`onVersionChange`); ' +
          '"Compare with…" lists the others (`onCompare`). **History of changes:** per amending ' +
          'act the articles it changed (links), published and applies from. **Legal hierarchy** ' +
          'and **References:** related acts with their status and the application’s note ("Based ' +
          'on Article 63 of …"), references grouped by type. **Court practice and opinions:** ' +
          'issuer, number, date, summary; filtered by article. **My notes and bookmarks:** the ' +
          'user’s notes, "Add note" reports the article (nothing is saved here).\n\n' +
          '**Narrowed** (`selectedArticleId`): only the items whose `articleIds` name the article; ' +
          'the summary counts them ("Article 57: changed twice, 2 court decisions, 1 opinion") ' +
          'and "Back to the whole act" leaves.\n\n' +
          '**When not:** a business document’s panels (SidePanels with the panel lists).',
      },
    },
  },
  args: { act: LAW, articleId: 'a57' },
  render: () => (
    <ExampleProvider>
      <Panels {...ALL} onVersionChange={fn()} onCompare={fn()} onAddNote={fn()} />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof LegalArticleSummary>

export default meta

type Story = StoryObj<typeof meta>

/** Every panel open, for the whole act. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: /^Versions/ })).toBeVisible()
    await expect(canvas.getByRole('list', { name: 'Referred to by: Internal act' })).toBeVisible()
    await expect(canvas.getByText('Based on Article 63 of this Law')).toBeVisible()
    await expect(canvas.getByRole('combobox', { name: 'Article' })).toHaveTextContent(
      'All articles',
    )
  },
}

/** Narrowed to Article 57: the summary, and only its items. */
export const ArticleSelected: Story = {
  name: 'Article selected',
  render: () => (
    <ExampleProvider>
      <Panels {...ALL} selectedArticleId="a57" onArticleClear={fn()} onAddNote={fn()} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(
      canvas.getByText('Article 57: changed twice, 2 court decisions, 1 opinion'),
    ).toBeVisible()
    await expect(canvas.queryByRole('combobox', { name: 'Article' })).toBeNull()
    await expect(canvas.queryByText('Illustrative Constitution')).toBeNull()
    await expect(canvas.queryByText(/Check the signatures/)).toBeNull()
  },
}

/** The practice filtered to Article 12 (`defaultPracticeArticleId`). */
export const PracticeFiltered: Story = {
  name: 'Practice filtered by article',
  render: () => (
    <ExampleProvider>
      <Panels {...ALL} open={['practice']} defaultPracticeArticleId="a12" />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('combobox', { name: 'Article' })).toHaveTextContent('Article 12')
    await expect(canvas.queryByText('Illustrative Appellate Court')).toBeNull()
  },
}

/** Filtering, comparing, choosing a version and adding a note report through the callbacks. */
export const Interaction: Story = {
  name: 'Filter, compare and versions, interaction',
  tags: ['interaction'],
  args: { act: LAW, articleId: 'a57', onArticleClear: fn() },
  render: function Render() {
    const [versionId, setVersionId] = useState('v4')
    const [compared, setCompared] = useState('')
    const [article, setArticle] = useState('')
    return (
      <ExampleProvider>
        <Panels
          {...ALL}
          act={{ ...LAW, versionId }}
          onVersionChange={setVersionId}
          onCompare={setCompared}
          practiceArticleId={article}
          onPracticeArticleChange={setArticle}
        />
        <output className={cn('mt-2 block text-sm text-primary', TEXT_DIRECTION)}>
          {compared === '' ? 'Not compared' : `Compared with ${compared}`}
        </output>
      </ExampleProvider>
    )
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(document.body)
    await userEvent.click(canvas.getByRole('combobox', { name: 'Article' }))
    await userEvent.click(await body.findByRole('option', { name: 'Article 12' }))
    // The page is hidden from assistive technology until the list has closed.
    await waitFor(async () => {
      await expect(body.queryByRole('listbox')).toBeNull()
    })
    await expect(canvas.queryByText('Illustrative Appellate Court')).toBeNull()
    await expect(canvas.getByText('Illustrative Supreme Court')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Compare with…' }))
    await userEvent.click(await body.findByRole('menuitem', { name: '17.04.2021. – 09.02.2024.' }))
    await expect(canvas.getByText('Compared with v3')).toBeVisible()
    const versions = canvas.getByRole('list', { name: 'Versions' })
    await userEvent.click(within(versions).getByRole('button', { name: /^27\.02\.2016\./ }))
    await expect(within(versions).getByRole('button', { current: true })).toHaveTextContent(
      'Original text',
    )
  },
}

/** "Add note" reports the article the panel is narrowed to. */
const addNote = fn()

/** "Back to the whole act" and "Add note" report to the application. */
export const BackAndAddNote: Story = {
  name: 'Back and add note, interaction',
  tags: ['interaction'],
  args: { act: LAW, articleId: 'a57', onArticleClear: fn() },
  render: (args) => (
    <ExampleProvider>
      <Panels
        {...ALL}
        selectedArticleId="a57"
        {...(args.onArticleClear === undefined ? {} : { onArticleClear: args.onArticleClear })}
        onAddNote={addNote}
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement, args }) => {
    await settle()
    addNote.mockClear()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Add note' }))
    await expect(addNote).toHaveBeenCalledWith('a57')
    await userEvent.click(canvas.getByRole('button', { name: 'Back to the whole act' }))
    await expect(args.onArticleClear).toHaveBeenCalledTimes(1)
  },
}

/** A by-law with one version and nothing related: each panel says so in words. */
export const Empty: Story = {
  render: () => (
    <ExampleProvider>
      <Panels
        act={EMPTY_ACT}
        higher={[]}
        lower={[]}
        refersTo={[]}
        referredBy={[]}
        practice={[]}
        notes={[]}
        onAddNote={fn()}
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('No changes')).toBeVisible()
    await expect(canvas.getByText('No court decisions or opinions')).toBeVisible()
    await expect(canvas.getByText('No notes or bookmarks yet')).toBeVisible()
  },
}

/** Long titles and notes wrap inside the 300px column. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ExampleProvider>
      <Panels
        {...ALL}
        act={LONG_ACT}
        lower={LOWER.map((item) => ({
          ...item,
          title:
            'Rulebook on the Content, Form and Manner of Keeping Illustrative Site Records and the Building Book in Paper and Electronic Form',
          note: 'Based on Article 63 paragraph 2 and Article 90 paragraph 4 of the Law on Illustrative Building Works',
        }))}
      />
    </ExampleProvider>
  ),
}

/** Phone width: the panels full width, as in the page's sheet. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <Panels {...ALL} phone selectedArticleId="a57" onArticleClear={fn()} />
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** Arabic panels in a right-to-left page. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <Panels
          act={ARABIC_ACT}
          practice={ARABIC_PRACTICE}
          selectedArticleId="ar57"
          onArticleClear={fn()}
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Japanese panels. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <Panels act={JAPANESE_ACT} practice={JAPANESE_PRACTICE} onCompare={fn()} />
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** English in a right-to-left page: every text keeps its word order. */
export const EnglishInRightToLeft: Story = {
  name: 'English in right to left',
  render: () => (
    <StoryProvider direction="rtl">
      <ExampleProvider>
        <Panels {...ALL} onCompare={fn()} onAddNote={fn()} />
      </ExampleProvider>
    </StoryProvider>
  ),
}
