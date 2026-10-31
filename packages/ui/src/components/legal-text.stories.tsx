import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef, useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { LegalContents } from './legal-contents'
import type { LegalArticle } from './legal-model'
import {
  ARABIC_NODES,
  JAPANESE_NODES,
  LAW_FOOTNOTES,
  LAW_NODES,
  LONG_TEXT_NODES,
  longIllustrativeAct,
  resolveIllustrativeTarget,
  SERBIAN_CYRILLIC_NODES,
} from './legal-story-data'
import { LegalText, type LegalTextHandle, type LegalTextProps } from './legal-text'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

/*
 * Every act in these stories is invented and says so: the "Law on Illustrative Building Works"
 * in the "Illustrative Gazette" (legal-story-data.ts).
 */

const LAW_TITLE = 'Law on Illustrative Building Works (Illustrative)'

/** The application around the text: it keeps the selected article and the script. */
function Act(props: Partial<LegalTextProps> & { initialSelected?: string }) {
  const { initialSelected, ...rest } = props
  const [selected, setSelected] = useState<string | null>(initialSelected ?? null)
  return (
    <LegalText
      label={LAW_TITLE}
      nodes={LAW_NODES}
      footnotes={LAW_FOOTNOTES}
      lang="en"
      resolveTarget={resolveIllustrativeTarget}
      selectedArticleId={selected}
      onArticleSelect={setSelected}
      onCopyLink={fn()}
      articleActions={(article: LegalArticle) => [
        { label: 'Add a note', onSelect: fn() },
        { label: `Bookmark ${article.label}`, onSelect: fn() },
      ]}
      {...rest}
    />
  )
}

/** A long act with its contents: choosing an entry brings it into view and focuses it. */
function LongActWithContents({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [nodes] = useState(() => longIllustrativeAct(320))
  const text = useRef<LegalTextHandle>(null)
  const [current, setCurrent] = useState<string | null>('l1')
  return (
    <div className="flex flex-col gap-3">
      <LegalContents
        nodes={nodes}
        currentId={current}
        defaultOpen={defaultOpen}
        onNavigate={(id) => {
          setCurrent(id)
          text.current?.revealNode(id)
        }}
      />
      <LegalText
        ref={text}
        label="Illustrative long act (Illustrative)"
        nodes={nodes}
        lang="en"
        maxHeight="60vh"
        showSearch
      />
    </div>
  )
}

const meta = {
  title: 'Components/Legal/LegalText',
  component: LegalText,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the text of a legal act — a law, a by-law, a company’s rulebook — as ' +
          'the application gives it (`legal-model.ts`): parts, chapters and sections as ' +
          'headings, articles with their label and title, paragraphs, items and sub-items, ' +
          'footnotes, at a reading width of about 70 characters. The library presents the text ' +
          'and decides nothing legal: every word, date and reference is the application’s.\n\n' +
          '**Per article:** "Copy link" (`onCopyLink`, or the address on the clipboard with a ' +
          'toast); its label selects it (`onArticleSelect`; neutral selection with a bar); the ' +
          'application’s actions (`articleActions`, a note, a bookmark) in a menu — on phones ' +
          'one menu with all. Change marks under the heading ("Amended by No. 47/2018 · applies ' +
          'from 01.07.2018."), a date for an article not yet in force, a deleted article ' +
          'collapsed to its words with "Show text".\n\n' +
          '**References** are links (`linkComponent`); with `resolveTarget` a small button after ' +
          'each previews the target article in a popover — Tab to it, Enter, Escape; it never ' +
          'traps the focus.\n\n' +
          '**Search in the act** runs on the data, so it finds articles that are not drawn: ' +
          'hits marked, the current one underlined, "3 of 12", Enter / Shift+Enter. ' +
          'Case-, accent- and script-insensitive ("dnevnik" finds "дневник").\n\n' +
          '**Serbian:** a Latin / Cyrillic switch; Cyrillic is transliterated to Latin one to ' +
          'one; Latin to Cyrillic is the application’s (`onScriptChange`).\n\n' +
          '**Long acts:** `maxHeight` draws only the articles in view (300 and more). The table ' +
          'of contents is LegalContents, a start-side drawer opened by "Contents" on every width; ' +
          'it calls `revealNode` through the page.\n\n' +
          '**When:** reading an act. **When not:** comparing two versions (LegalCompare); a ' +
          'document the user writes (RichTextEditor); a list of acts (the search page).',
      },
    },
  },
  args: { nodes: LAW_NODES, label: LAW_TITLE },
  render: () => (
    <ExampleProvider>
      <Act />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof LegalText>

export default meta

type Story = StoryObj<typeof meta>

/**
 * The illustrative law: three parts, a deleted article, an article not yet in force, changes
 * from three amendments, references with their previews, a footnote.
 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('region', { name: LAW_TITLE })).toBeVisible()
    await expect(canvas.getByRole('heading', { level: 2, name: /Part One/ })).toBeVisible()
    await expect(canvas.getByRole('heading', { level: 3, name: /Chapter I\b/ })).toBeVisible()
    await expect(canvas.getByRole('heading', { level: 4, name: /Article 5/ })).toBeVisible()
    await expect(
      canvas.getAllByText('Amended by No. 47/2018 · applies from 01.07.2018.')[0],
    ).toBeVisible()
    await expect(canvas.getByText('Applies from 01.01.2027.')).toBeVisible()
    await expect(canvas.getByText('Deleted (No. 33/2021)')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Show text' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    await expect(canvas.getByRole('link', { name: 'Article 12' })).toHaveAttribute(
      'href',
      '#/legal/acts/building-works/article-12',
    )
    await expect(
      canvas.getByRole('button', { name: 'Preview of Article 12' }).getBoundingClientRect().width,
    ).toBeGreaterThanOrEqual(24)
    await expect(canvas.getByRole('link', { name: 'Footnote 1' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Copy link to Article 1' })).toBeVisible()
    const body = canvasElement.querySelector('[data-slot="legal-text-body"]')
    await expect(body?.getBoundingClientRect().width).toBeLessThanOrEqual(
      Number.parseFloat(getComputedStyle(body ?? document.body).fontSize) * 70,
    )
  },
}

/** An article selected (the side panel narrows to it): neutral, with the bar at its start. */
export const Selected: Story = {
  name: 'Article selected',
  render: () => (
    <ExampleProvider>
      <Act initialSelected="a5" />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const label = canvas.getByRole('button', { name: 'Article 5', pressed: true })
    await expect(label.closest('article')).toHaveAttribute('data-liro-surface', 'selected')
  },
}

/** A deleted article with its earlier text shown, struck by nothing but its muted colour. */
export const DeletedShown: Story = {
  name: 'Deleted article, text shown',
  render: () => (
    <ExampleProvider>
      <Act defaultShownDeleted={['a6']} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Hide text' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    await expect(
      canvas.getByText('A temporary permit could be issued for works lasting less than one year.'),
    ).toBeVisible()
  },
}

/** A reference's preview standing open (a restored state): the rulebook's article. */
export const ReferencePreview: Story = {
  name: 'Reference preview',
  render: () => (
    <ExampleProvider>
      <Act defaultPreview="#/legal/acts/site-records/article-4" />
    </ExampleProvider>
  ),
  play: async () => {
    await settle()
    const preview = within(document.body).getByRole('dialog', {
      name: 'Preview of Article 4 of the Rulebook on Illustrative Site Records',
    })
    await expect(within(preview).getByText(/Keeping of records/)).toBeVisible()
    await expect(within(preview).getByRole('link', { name: 'Open Article 4' })).toHaveAttribute(
      'href',
      '#/legal/acts/site-records/article-4',
    )
  },
}

/** The preview by keyboard: Tab to its button, Enter, Escape returns to the button. */
export const ReferencePreviewKeyboard: Story = {
  name: 'Reference preview, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const [button] = canvas.getAllByRole('button', { name: 'Preview of Article 4' })
    if (button === undefined) throw new Error('no preview button')
    button.focus()
    await userEvent.keyboard('{Enter}')
    const preview = await within(document.body).findByRole('dialog', {
      name: 'Preview of Article 4',
    })
    await settle()
    await expect(within(preview).getByText(/Permit required/)).toBeVisible()
    // The preview takes the focus; Tab reaches its link; Escape returns to the button.
    await expect(preview).toHaveFocus()
    await userEvent.keyboard('{Tab}')
    await expect(within(preview).getByRole('link', { name: 'Open Article 4' })).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(button).toHaveFocus())
    await expect(within(document.body).queryByRole('dialog')).toBeNull()
  },
}

/** A target the application does not hold: the preview says so. */
export const ReferenceMissing: Story = {
  name: 'Reference preview, text not available',
  render: () => (
    <ExampleProvider>
      <Act defaultPreview="#/legal/acts/building-works/article-12" />
    </ExampleProvider>
  ),
  play: async () => {
    await settle()
    const preview = within(document.body).getByRole('dialog', { name: 'Preview of Article 12' })
    await expect(within(preview).getByText('This text is not available here.')).toBeVisible()
  },
}

/** A search restored: "permit", the third of twelve hits current (underlined). */
export const Search: Story = {
  name: 'Search with hits',
  render: () => (
    <ExampleProvider>
      <Act defaultSearch="permit" defaultHit={2} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('searchbox', { name: 'Search in the text' })).toHaveValue(
      'permit',
    )
    await expect(canvas.getByText('3 of 12')).toBeVisible()
    const hits = canvasElement.querySelectorAll('mark[data-legal-hit]')
    await expect(hits).toHaveLength(12)
    const current = canvasElement.querySelector('mark[aria-current]')
    await expect(current).toHaveAttribute('data-legal-hit', '2')
    await expect(getComputedStyle(current ?? document.body).textDecorationLine).toBe('underline')
  },
}

/** The search by keyboard: typing, Enter for the next hit, Shift+Enter for the previous. */
export const SearchKeyboard: Story = {
  name: 'Search, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const field = canvas.getByRole('searchbox', { name: 'Search in the text' })
    await userEvent.type(field, 'site diary')
    await expect(canvas.getByText(/^1 of \d+$/)).toBeVisible()
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByText(/^2 of \d+$/)).toBeVisible()
    await userEvent.keyboard('{Shift>}{Enter}{/Shift}')
    await expect(canvas.getByText(/^1 of \d+$/)).toBeVisible()
    await userEvent.keyboard('{Shift>}{Enter}{/Shift}')
    const last = canvasElement.querySelector('mark[aria-current]')
    await expect(last).not.toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: 'Next match' }))
    await expect(canvas.getByText(/^1 of \d+$/)).toBeVisible()
    await userEvent.clear(field)
    await userEvent.type(field, 'zzzz')
    await expect(canvas.getByText('No matches')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Next match' })).toBeDisabled()
  },
}

/** The application's copy-link handler in the actions story. */
const copiedLinks = fn()

/** Article actions: copy the link, select by the label, the application’s menu. */
export const ArticleActions: Story = {
  name: 'Article actions, interaction',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <Act onCopyLink={copiedLinks} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Copy link to Article 7' }))
    await expect(copiedLinks).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'a7' }))
    const label = canvas.getByRole('button', { name: 'Article 7' })
    await userEvent.click(label)
    await expect(label).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(label)
    await expect(label).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(canvas.getByRole('button', { name: 'Actions for Article 7' }))
    const menu = await within(document.body).findByRole('menu')
    await settle()
    await expect(within(menu).getByRole('menuitem', { name: 'Bookmark Article 7' })).toBeVisible()
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Select' }))
    await expect(label).toHaveAttribute('aria-pressed', 'true')
  },
}

/** An invented Serbian rulebook in Cyrillic, with the Latin / Cyrillic switch. */
export const SerbianCyrillic: Story = {
  name: 'Serbian, Cyrillic',
  render: () => (
    <StoryProvider locale="sr-Cyrl">
      <LegalText
        label="Правилник о илустративној евиденцији градилишта (илустративно)"
        nodes={SERBIAN_CYRILLIC_NODES}
        lang="sr-Cyrl"
        showSearch
      />
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('radio', { name: 'Cyrillic' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await expect(canvas.getByRole('heading', { name: /Џепна књига налога/ })).toBeVisible()
  },
}

/** The same rulebook shown in Latin: transliterated one to one, its `lang` sr-Latn. */
export const SerbianLatin: Story = {
  name: 'Serbian, Cyrillic shown in Latin',
  render: () => (
    <StoryProvider locale="sr-Latn">
      <LegalText
        label="Pravilnik o ilustrativnoj evidenciji gradilišta (ilustrativno)"
        nodes={SERBIAN_CYRILLIC_NODES}
        lang="sr-Cyrl"
        defaultScript="latin"
        defaultSearch="dnevnik"
      />
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('radio', { name: 'Latin' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await expect(canvas.getByRole('heading', { name: /Džepna knjiga naloga/ })).toBeVisible()
    await expect(canvas.getByRole('heading', { name: /LJUDSTVO I NJEGOVE OBAVEZE/ })).toBeVisible()
    await expect(canvas.getByText('1 of 3')).toBeVisible()
    // The page is Serbian Latin: the text needs no `lang` of its own.
    await expect(canvasElement.querySelector('[data-slot="legal-text-body"]')).not.toHaveAttribute(
      'lang',
    )
  },
}

/** The switch, by the reader: Cyrillic to Latin and back. */
export const ScriptSwitch: Story = {
  name: 'Script switch, interaction',
  tags: ['interaction'],
  render: () => {
    const onScriptChange = fn()
    return (
      <LegalText
        label="Правилник о илустративној евиденцији градилишта (илустративно)"
        nodes={SERBIAN_CYRILLIC_NODES}
        lang="sr-Cyrl"
        onScriptChange={onScriptChange}
      />
    )
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('radio', { name: 'Latin' }))
    await expect(canvas.getByRole('heading', { name: /Član 1/ })).toBeVisible()
    await expect(canvasElement.querySelector('[data-slot="legal-text-body"]')).toHaveAttribute(
      'lang',
      'sr-Latn',
    )
    await userEvent.click(canvas.getByRole('radio', { name: 'Cyrillic' }))
    await expect(canvas.getByRole('heading', { name: /Члан 1/ })).toBeVisible()
  },
}

/** A long act of 320 articles: only those in view are drawn; it scrolls inside its height. */
export const LongAct: Story = {
  name: 'Long act, 320 articles',
  render: () => (
    <LegalText
      label="Illustrative long act (Illustrative)"
      nodes={longIllustrativeAct(320)}
      lang="en"
      maxHeight="60vh"
    />
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const region = within(canvasElement).getByRole('region', {
      name: 'Illustrative long act (Illustrative)',
    })
    const drawn = region.querySelectorAll('article').length
    await expect(drawn).toBeGreaterThan(0)
    await expect(drawn).toBeLessThan(40)
    await expect(region.scrollHeight).toBeGreaterThan(region.clientHeight * 10)
  },
}

/**
 * The long act's search finds an article far from view, and the contents go to another: each is
 * drawn and brought into view.
 */
export const LongActSearch: Story = {
  name: 'Long act, search and contents, interaction',
  tags: ['interaction'],
  render: () => <LongActWithContents />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const region = canvas.getByRole('region', { name: 'Illustrative long act (Illustrative)' })
    const started = performance.now()
    await userEvent.type(
      canvas.getByRole('searchbox', { name: 'Search in the text' }),
      'site store (318)',
    )
    await expect(canvas.getByText('1 of 1')).toBeVisible()
    await waitFor(() =>
      expect(region.querySelector('[data-legal-node="l318"] mark[aria-current]')).not.toBeNull(),
    )
    await expect(performance.now() - started).toBeLessThan(10_000)
    await userEvent.click(canvas.getByRole('button', { name: 'Contents' }))
    const drawer = await within(document.body).findByRole('dialog', { name: 'Contents' })
    await userEvent.click(within(drawer).getByRole('treeitem', { name: /^Article 25\b/ }))
    await waitFor(() =>
      expect(region.querySelector('[data-legal-node="l25"] [data-legal-heading]')).toHaveFocus(),
    )
    await expect(within(document.body).queryByRole('dialog')).toBeNull()
  },
}

/** The table of contents open, the current article marked. */
export const Contents: Story = {
  name: 'Contents open',
  render: () => (
    <div className="flex flex-col gap-3">
      <LegalContents nodes={LAW_NODES} currentId="a5" defaultOpen onNavigate={fn()} />
      <LegalText label={LAW_TITLE} nodes={LAW_NODES} lang="en" showSearch={false} />
    </div>
  ),
  play: async () => {
    await settle()
    const drawer = within(document.body).getByRole('dialog', { name: 'Contents' })
    await expect(
      within(drawer).getByRole('treeitem', { name: /^Article 5/, selected: true }),
    ).toBeVisible()
    await expect(
      within(drawer).getByRole('treeitem', { name: /Deleted \(No\. 33\/2021\)/ }),
    ).toBeVisible()
  },
}

/** Long titles and a long paragraph wrap at the reading width. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ExampleProvider>
      <Act nodes={LONG_TEXT_NODES} footnotes={[]} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const article = canvasElement.querySelector('article')
    await expect(article?.scrollWidth).toBeLessThanOrEqual((article?.clientWidth ?? 0) + 1)
  },
}

/** Phone width: one menu per article (Copy link, Select, the application's actions). */
export const Phone: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div style={{ height: '100%', overflowY: 'auto', padding: 16, boxSizing: 'border-box' }}>
          <Act layout="phone" defaultSearch="permit" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('button', { name: 'Copy link to Article 1' })).toBeNull()
    await expect(canvas.getByRole('button', { name: 'Actions for Article 1' })).toBeVisible()
    await expect(canvas.getByRole('searchbox').getBoundingClientRect().width).toBeGreaterThan(300)
  },
}

/**
 * A reference's preview on a phone: a bottom sheet with the article's text and
 * "Open Article 4" at its foot — never a popover over the text.
 */
export const PhoneReferencePreview: Story = {
  name: 'Phone width, reference preview',
  tags: ['!dev'],
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div style={{ height: '100%', overflowY: 'auto', padding: 16, boxSizing: 'border-box' }}>
          <Act layout="phone" defaultPreview="#/legal/acts/site-records/article-4" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async () => {
    await settle()
    const sheet = within(document.body).getByRole('dialog', {
      name: 'Article 4 · Keeping of records',
    })
    await expect(within(sheet).getByText(/Site records are kept/)).toBeVisible()
    const open = within(sheet).getByRole('link', { name: 'Open Article 4' })
    await expect(open).toHaveAttribute('href', '#/legal/acts/site-records/article-4')
    // Edge to edge at the screen's foot, the action across it.
    const box = sheet.getBoundingClientRect()
    await expect(box.width).toBeGreaterThan(380)
    await expect(open.getBoundingClientRect().width).toBeGreaterThan(300)
  },
}

/** The phone's article menu open. */
export const PhoneMenu: Story = {
  name: 'Phone width, article menu, interaction',
  tags: ['interaction'],
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div style={{ height: '100%', overflowY: 'auto', padding: 16, boxSizing: 'border-box' }}>
          <Act layout="phone" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Actions for Article 3' }),
    )
    const menu = await within(document.body).findByRole('menu')
    await settle()
    await expect(
      within(menu).getByRole('menuitem', { name: 'Copy link to Article 3' }),
    ).toBeVisible()
    await expect(within(menu).getByRole('menuitem', { name: 'Select' })).toBeVisible()
    await expect(within(menu).getByRole('menuitem', { name: 'Add a note' })).toBeVisible()
  },
}

/** Arabic: an invented act from the right, a change mark and a reference. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar" today="2026-10-06">
      <LegalText
        label="قانون الأشغال التوضيحية (توضيحي)"
        nodes={ARABIC_NODES}
        lang="ar"
        resolveTarget={(target) =>
          ARABIC_NODES.flatMap((node) => (node.kind === 'heading' ? node.children : [node])).find(
            (node): node is LegalArticle => node.kind === 'article' && node.id === target.articleId,
          )
        }
      />
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: /المادة 1/ })).toBeVisible()
    await expect(getComputedStyle(canvas.getByRole('region')).direction).toBe('rtl')
  },
}

/** Japanese: an invented act, an article not yet in force. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja" today="2026-10-06">
      <LegalText label="例示建設工事法（例示）" nodes={JAPANESE_NODES} lang="ja" />
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('heading', { name: /第二条/ })).toBeVisible()
  },
}

/**
 * English in a right-to-left page (an untranslated act): the layout from the right, every
 * paragraph in its own word order.
 */
export const EnglishInRtl: Story = {
  name: 'English in RTL',
  render: () => (
    <StoryProvider locale="ar" today="2026-10-06">
      <Act defaultSearch="permit" />
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const paragraph = within(canvasElement).getByText(/sets out illustrative rules/)
    await expect(getComputedStyle(paragraph).unicodeBidi).toBe('plaintext')
    await expect(getComputedStyle(paragraph).direction).toBe('rtl')
  },
}
