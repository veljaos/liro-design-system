import type { Meta, StoryObj } from '@storybook/react-vite'
import { ListTree } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Alert } from '../components/alert'
import { Button } from '../components/button'
import type { LegalAct, LegalInline, LegalNode } from '../components/legal-model'
import {
  ARABIC_ACT,
  ARABIC_PRACTICE,
  EMPTY_ACT,
  GAZETTE_NAME,
  HIGHER,
  ILLUSTRATIVE_NOTE,
  JAPANESE_ACT,
  JAPANESE_PRACTICE,
  LAW,
  LONG_ACT,
  LOWER,
  NOTES,
  PRACTICE,
  REFERRED_BY,
  REFERS_TO,
} from '../components/legal-story-data'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { TextField } from '../components/text-field'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { settle } from '../primitives/story-helpers'
import { LegalActPage, type LegalActPageProps } from './legal-act-page'

/*
 * The act's text and toolbar here are stand-ins: the real ones (LegalText, LegalContents, the
 * search in the act) are P5.27's text components, joined by the lead. The stand-in draws the
 * headings, articles and paragraphs plainly, so the page's layout can be seen.
 */

function Inline({ content }: { content: readonly LegalInline[] }) {
  return (
    <>
      {content.map((part, index) =>
        typeof part === 'string' ? (
          part
        ) : part.kind === 'ref' ? (
          <a key={index} href={part.target.href} className="text-link">
            {part.text}
          </a>
        ) : part.kind === 'footnote' ? (
          <sup key={index}>{part.mark}</sup>
        ) : (
          <em key={index}>{part.text}</em>
        ),
      )}
    </>
  )
}

/** A plain stand-in for LegalText: headings, articles, paragraphs and points. */
function TextStandIn({
  act,
  selected,
  onSelect,
}: {
  act: LegalAct
  selected?: string | undefined
  onSelect?: (articleId: string) => void
}) {
  const nodes = (list: readonly LegalNode[], level: number): ReactNode =>
    list.map((node) => {
      if (node.kind === 'heading') {
        const Heading = `h${String(Math.min(level, 6))}` as 'h2'
        return (
          <section key={node.id} className="flex flex-col gap-4">
            <Heading className={cn('m-0 text-h3 text-primary', TEXT_DIRECTION)}>
              {node.label}
              {node.title === undefined ? '' : ` — ${node.title}`}
            </Heading>
            {nodes(node.children, level + 1)}
          </section>
        )
      }
      const Heading = `h${String(Math.min(level, 6))}` as 'h3'
      return (
        <article
          key={node.id}
          id={node.id}
          className={cn(
            'flex flex-col gap-2 rounded-md',
            selected === node.id && 'bg-surface-selected p-2',
          )}
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Heading className={cn('m-0 text-h4 text-primary', TEXT_DIRECTION)}>
              {node.label}
              {node.title === undefined ? '' : ` — ${node.title}`}
            </Heading>
            {onSelect !== undefined && (
              <Button
                family="neutral"
                emphasis="menu"
                icon={ListTree}
                label={`Show ${node.label} in the panel`}
                onClick={() => {
                  onSelect(node.id)
                }}
              />
            )}
          </div>
          {node.deleted !== undefined ? (
            <p className={cn('m-0 text-sm text-secondary italic', TEXT_DIRECTION)}>
              {node.deleted}
            </p>
          ) : (
            node.paragraphs.map((paragraph) => (
              <p key={paragraph.id} className={cn('m-0 text-md text-primary', TEXT_DIRECTION)}>
                {paragraph.label === undefined ? '' : `${paragraph.label} `}
                <Inline content={paragraph.content} />
              </p>
            ))
          )}
        </article>
      )
    })
  return <div className="flex max-w-[44rem] flex-col gap-6">{nodes(act.nodes, 2)}</div>
}

/** A stand-in for the text components' toolbar: Contents and the search in the act. */
function ToolbarStandIn() {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <Button family="neutral" icon={ListTree} label="Contents" />
      <TextField
        label="Search in the act"
        hideLabel
        placeholder="Search in the act"
        className="w-64"
      />
    </div>
  )
}

const noop = () => undefined

/** The law with every panel's data, the actions and the stand-ins; any prop may be replaced. */
function Law(props: Partial<LegalActPageProps>) {
  const act = props.act ?? LAW
  return (
    <LegalActPage
      act={act}
      gazetteName={GAZETTE_NAME}
      back={{ href: '#legal/acts', label: 'Legal acts' }}
      banner={<Alert tone="neutral" title={ILLUSTRATIVE_NOTE} />}
      onCompareVersions={noop}
      onCopyCitation={noop}
      onPrint={noop}
      onWatchChange={noop}
      onBookmarkChange={noop}
      higher={HIGHER}
      lower={LOWER}
      refersTo={REFERS_TO}
      referredBy={REFERRED_BY}
      practice={PRACTICE}
      notes={NOTES}
      onVersionChange={noop}
      onCompare={noop}
      onAddNote={noop}
      onArticleClear={noop}
      toolbar={<ToolbarStandIn />}
      text={<TextStandIn act={act} selected={props.selectedArticleId} />}
      layout="desktop"
      {...props}
    />
  )
}

const meta = {
  title: 'Templates/LegalActPage',
  component: LegalActPage,
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          '**What for:** one legal act — a law, a by-law, a decision, a company’s internal ' +
          'rulebook — read on its own page, in the invoice’s DocumentPage layout: the act at the ' +
          'start, the side panels at the end with "Hide panels". Every text, date, status and ' +
          'reference is the application’s (`LegalAct`); the page presents them and computes ' +
          'nothing legal.\n\n' +
          '**Header:** back, the title (h1, in the act’s language) and its status (In force, ' +
          'Partly in force …, the application’s tone, never blue), type and issuer, the gazette ' +
          'line with every reference (each a link when it has an address), "Version as of …" and ' +
          'the **version picker** — a SelectField over the versions, newest first, named by their ' +
          'days. Actions at the end, each shown when its callback is given: Compare versions, Copy ' +
          'citation, Print / PDF, Watch for changes, Bookmark (Watch and Bookmark say their state: ' +
          '"Stop watching", "Remove bookmark"). `banner` above everything (an "Illustrative" note, ' +
          'a repeal notice).\n\n' +
          '**Body:** one card, the `toolbar` (Contents, search in the act) on top, then the ' +
          '`text` — the text components’ LegalText; the stories use a plain stand-in.\n\n' +
          '**Panels:** Versions, History of changes, Legal hierarchy, References, Court practice ' +
          'and opinions, My notes and bookmarks (see Components/LegalPanels). With ' +
          '`selectedArticleId` they narrow to that article, with "Article 57: changed twice, 2 ' +
          'court decisions, 1 opinion" and "Back to the whole act" above them.\n\n' +
          '**Phones:** the act full width; "Details" in the header opens the panels in a ' +
          'full-screen sheet.\n\n' +
          '**When not:** a list or search of acts (the search page); a business document ' +
          '(DocumentPage); comparing two versions (the text components’ compare view).',
      },
    },
  },
  args: { act: LAW, text: null },
  render: () => (
    <ExampleProvider>
      <Law />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof LegalActPage>

export default meta

type Story = StoryObj<typeof meta>

/** The law in force (partly: Article 90 applies from 2027), every panel open. */
export const Default: Story = {
  render: () => (
    <ExampleProvider>
      <Law asOf="2026-10-11" />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Law on Illustrative Building Works' }),
    ).toBeVisible()
    await expect(canvas.getByText('Version as of 11.10.2026.')).toBeVisible()
    await expect(canvas.getByRole('link', { name: '47/2018' })).toHaveAttribute(
      'href',
      '#gazette/2018/47',
    )
    await expect(canvas.getByRole('complementary', { name: 'Panels' })).toBeVisible()
    const versions = canvas.getByRole('list', { name: 'Versions' })
    await expect(within(versions).getByRole('button', { current: true })).toHaveTextContent(
      'From 10.02.2024.',
    )
  },
}

/** Article 57 chosen in the text: the panels narrow to it, with the way back. */
export const ArticleSelected: Story = {
  name: 'Article selected',
  render: () => (
    <ExampleProvider>
      <Law selectedArticleId="a57" />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(
      canvas.getByText('Article 57: changed twice, 2 court decisions, 1 opinion'),
    ).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Back to the whole act' })).toBeVisible()
    await expect(canvas.queryByText('Illustrative Constitution')).toBeNull()
  },
}

/** Back to the whole act from the narrowed panel, and choosing another article. */
export const ArticleSelectedInteraction: Story = {
  name: 'Article selected, interaction',
  tags: ['interaction'],
  render: function Render() {
    const [selected, setSelected] = useState<string | undefined>('a57')
    return (
      <ExampleProvider>
        <Law
          selectedArticleId={selected}
          onArticleClear={() => {
            setSelected(undefined)
          }}
          text={<TextStandIn act={LAW} selected={selected} onSelect={setSelected} />}
        />
      </ExampleProvider>
    )
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Back to the whole act' }))
    await expect(canvas.queryByText(/^Article 57: changed/)).toBeNull()
    await expect(canvas.getByText('Illustrative Constitution')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Show Article 12 in the panel' }))
    await expect(
      canvas.getByText('Article 12: changed once, 1 court decision, 1 opinion'),
    ).toBeVisible()
  },
}

/** An older version shown: the picker and the Versions panel name it. */
export const OlderVersion: Story = {
  name: 'Older version',
  render: () => (
    <ExampleProvider>
      <Law act={{ ...LAW, versionId: 'v2' }} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Version as of 23.06.2018.')).toBeVisible()
    await expect(canvas.getByRole('combobox', { name: 'Version' })).toHaveTextContent(
      '23.06.2018. – 16.04.2021.',
    )
  },
}

/** Choosing a version in the picker and in the panel; watch and bookmark change their words. */
export const VersionsInteraction: Story = {
  name: 'Versions, watch and bookmark, interaction',
  tags: ['interaction'],
  render: function Render() {
    const [versionId, setVersionId] = useState('v4')
    const [watching, setWatching] = useState(false)
    const [bookmarked, setBookmarked] = useState(false)
    const act = { ...LAW, versionId }
    return (
      <ExampleProvider>
        <Law
          act={act}
          onVersionChange={setVersionId}
          watching={watching}
          onWatchChange={setWatching}
          bookmarked={bookmarked}
          onBookmarkChange={setBookmarked}
        />
      </ExampleProvider>
    )
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(document.body)
    await userEvent.click(canvas.getByRole('combobox', { name: 'Version' }))
    await userEvent.click(await body.findByRole('option', { name: '17.04.2021. – 09.02.2024.' }))
    await waitFor(async () => {
      await expect(body.queryByRole('listbox')).toBeNull()
    })
    await expect(canvas.getByText('Version as of 17.04.2021.')).toBeVisible()
    const versions = canvas.getByRole('list', { name: 'Versions' })
    await userEvent.click(within(versions).getByRole('button', { name: /^23\.06\.2018\./ }))
    await expect(canvas.getByText('Version as of 23.06.2018.')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Watch for changes' }))
    await expect(canvas.getByRole('button', { name: 'Stop watching' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Bookmark' }))
    await expect(canvas.getByRole('button', { name: 'Remove bookmark' })).toBeVisible()
  },
}

/** Watching and bookmarked: the actions say how to undo them. */
export const WatchedAndBookmarked: Story = {
  name: 'Watched and bookmarked',
  render: () => (
    <ExampleProvider>
      <Law watching bookmarked />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Stop watching' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Remove bookmark' })).toBeVisible()
  },
}

/** The side column hidden: the act takes the full width. */
export const PanelsHidden: Story = {
  name: 'Panels hidden',
  render: () => (
    <ExampleProvider>
      <Law defaultPanelsHidden />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('complementary', { name: 'Panels' })).toBeNull()
    await expect(canvas.getByRole('button', { name: 'Show panels' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  },
}

/** Hiding the column and closing a panel, both controlled (the application remembers them). */
export const PanelsHiddenInteraction: Story = {
  name: 'Panels hidden, interaction',
  tags: ['interaction'],
  render: function Render() {
    const [hidden, setHidden] = useState(false)
    const [open, setOpen] = useState<string[]>(['versions', 'history'])
    return (
      <ExampleProvider>
        <Law
          panelsHidden={hidden}
          onPanelsHiddenChange={setHidden}
          panelsOpen={open}
          onPanelsOpenChange={setOpen}
        />
      </ExampleProvider>
    )
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /^History of changes/ }))
    await expect(canvas.getByRole('button', { name: /^History of changes/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Hide panels' }))
    await expect(canvas.queryByRole('complementary', { name: 'Panels' })).toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: 'Show panels' }))
    await expect(canvas.getByRole('complementary', { name: 'Panels' })).toBeVisible()
  },
}

/** Some panels closed (`defaultPanelsOpen`): only their headers stay. */
export const PanelsClosed: Story = {
  name: 'Some panels closed',
  render: () => (
    <ExampleProvider>
      <Law defaultPanelsOpen={['versions', 'practice']} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByRole('button', { name: /^History of changes/ }),
    ).toHaveAttribute('aria-expanded', 'false')
  },
}

/** While the act loads: skeletons in the text's card. */
export const Loading: Story = {
  render: () => (
    <ExampleProvider>
      <Law loading />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('status', { name: 'Loading the act' }),
    ).toHaveAttribute('aria-busy', 'true')
  },
}

/** A by-law with one version and nothing related: every panel says so; no picker. */
export const EmptySections: Story = {
  name: 'Empty sections',
  render: () => (
    <ExampleProvider>
      <Law
        act={EMPTY_ACT}
        higher={[]}
        lower={[]}
        refersTo={[]}
        referredBy={[]}
        practice={[]}
        notes={[]}
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('No changes')).toBeVisible()
    await expect(canvas.getByText('No higher or lower acts')).toBeVisible()
    await expect(canvas.getByText('No references')).toBeVisible()
    await expect(canvas.getByText('No court decisions or opinions')).toBeVisible()
    await expect(canvas.getByText('No notes or bookmarks yet')).toBeVisible()
    await expect(canvas.queryByRole('combobox', { name: 'Version' })).toBeNull()
  },
}

/** A long title, issuer and gazette list wrap; the actions move into "More" when they must. */
export const LongTitle: Story = {
  name: 'Long title',
  render: () => (
    <ExampleProvider>
      <Law act={LONG_ACT} />
    </ExampleProvider>
  ),
}

/** Below 75em: the panels under the act. */
export const Narrow: Story = {
  render: () => (
    <ExampleProvider>
      <Law layout="narrow" />
    </ExampleProvider>
  ),
}

/** Phone width: the act full width, "Details" opens the panels. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <Law layout="phone" />
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Details' })).toBeVisible()
    await expect(canvas.queryByRole('complementary')).toBeNull()
  },
}

/** Phone width, the panels' sheet open (as restored, `defaultPanelSheetOpen`). */
export const PhonePanels: Story = {
  name: 'Phone width, panels open',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <Law layout="phone" defaultPanelSheetOpen />
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async () => {
    await settle()
    const sheet = within(document.body).getByRole('dialog', { name: 'Details' })
    await expect(within(sheet).getByRole('list', { name: 'Versions' })).toBeVisible()
  },
}

/** Phone width, an article chosen: the sheet narrowed to it. */
export const PhoneArticleSelected: Story = {
  name: 'Phone width, article selected',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <Law layout="phone" selectedArticleId="a57" defaultPanelSheetOpen />
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async () => {
    await settle()
    const sheet = within(document.body).getByRole('dialog', { name: 'Details' })
    await expect(
      within(sheet).getByText('Article 57: changed twice, 2 court decisions, 1 opinion'),
    ).toBeVisible()
  },
}

/** "Details" opens the sheet; Escape closes it and the focus returns to the button. */
export const PhonePanelsInteraction: Story = {
  name: 'Phone width, panels, interaction',
  tags: ['interaction'],
  render: function Render() {
    // Controlled, as an application that remembers the sheet.
    const [open, setOpen] = useState(false)
    return (
      <PhoneFrame>
        <ExampleProvider>
          <Law layout="phone" panelSheetOpen={open} onPanelSheetOpenChange={setOpen} />
        </ExampleProvider>
      </PhoneFrame>
    )
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(document.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Details' }))
    const sheet = await body.findByRole('dialog', { name: 'Details' })
    // The sheet slides in; it is checked once it stands.
    await settle()
    await expect(sheet).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await waitFor(async () => {
      await expect(body.queryByRole('dialog')).toBeNull()
    })
    await expect(canvas.getByRole('button', { name: 'Details' })).toHaveFocus()
  },
}

/** An Arabic act in a right-to-left page. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <LegalActPage
          act={ARABIC_ACT}
          gazetteName="الجريدة التوضيحية"
          layout="desktop"
          asOf="2026-10-11"
          banner={<Alert tone="neutral" title="توضيحي: قانون وجريدة وأرقام مخترعة." />}
          practice={ARABIC_PRACTICE}
          selectedArticleId="ar57"
          onArticleClear={noop}
          onPrint={noop}
          onBookmarkChange={noop}
          text={<TextStandIn act={ARABIC_ACT} selected="ar57" />}
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** A Japanese act. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <LegalActPage
          act={JAPANESE_ACT}
          gazetteName="例示官報"
          layout="desktop"
          asOf="2026-10-11"
          banner={<Alert tone="neutral" title="例示：架空の法令、官報、番号です。" />}
          practice={JAPANESE_PRACTICE}
          onPrint={noop}
          onBookmarkChange={noop}
          text={<TextStandIn act={JAPANESE_ACT} />}
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}

/**
 * English in right to left: an Arabic page whose texts fell back to English. Each text keeps its
 * own word order ("Version as of 11.10.2026.", "No. 12/2016"), the layout stays right to left.
 */
export const EnglishInRightToLeft: Story = {
  name: 'English in right to left',
  render: () => (
    <StoryProvider direction="rtl">
      <ExampleProvider>
        <Law selectedArticleId="a57" />
      </ExampleProvider>
    </StoryProvider>
  ),
}
