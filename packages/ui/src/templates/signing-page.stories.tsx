import type { Meta, StoryObj } from '@storybook/react-vite'
import { Download } from 'lucide-react'
import { expect, within } from 'storybook/test'
import { Button } from '../components/button'
import { contractSigners, DECLINE_REASONS } from '../components/group-c-story-data'
import { KeyValueList } from '../components/cards'
import { SignerList } from '../components/signer-list'
import { StatusBadge } from '../components/status-badge'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { SigningPage, type SigningPageProps } from './signing-page'

/**
 * The document's preview. INTEGRATION: DocumentFrame (P5.5) hosts the real viewer; the story
 * shows the first page as the viewer would.
 */
function Preview({ lines }: { lines: readonly string[] }) {
  return (
    <div className="bg-surface-sunken p-4 sm:p-6">
      <article className="mx-auto flex max-w-150 flex-col gap-3 bg-surface-raised p-6 text-sm text-primary shadow-xs sm:p-10">
        {lines.map((line, index) =>
          index === 0 ? (
            <h3 key={line} className="m-0 text-center text-h5">
              {line}
            </h3>
          ) : (
            <p key={line} className="m-0">
              {line}
            </p>
          ),
        )}
      </article>
    </div>
  )
}

const CONTRACT = [
  'Employment contract RU-2026-017',
  'Kvadrat Gradnja d.o.o., Novi Sad, PIB 108452317, represented by director Nenad Kovačević (the employer), and Stefan Nikolić (the employee) agree:',
  'Article 1. The employee works as a site engineer from 02.11.2026., for an indefinite term.',
  'Article 2. The place of work is the office in Novi Sad; the work is hybrid, with three office days a week.',
  'Article 3. The probation period is three months.',
  'Article 4. The gross salary is 185.000,00 RSD a month.',
]

/** INTEGRATION: AttachmentList (P5.5) — a temporary simple list of the files. */
function Attachments() {
  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {[
        ['Job description — site engineer.pdf', '182 KB'],
        ['Health and safety statement.pdf', '96 KB'],
      ].map(([name, size]) => (
        <li
          key={name}
          className="flex justify-between gap-3 border-0 border-b border-solid border-subtle py-2 text-sm first:pt-0 last:border-b-0 last:pb-0"
        >
          <a
            href={`#files/${String(name)}`}
            className="text-link no-underline visited:text-link hover:text-link hover:underline active:text-link"
          >
            {name}
          </a>
          <span className="text-xs text-secondary">{size}</span>
        </li>
      ))}
    </ul>
  )
}

function Page(props: Partial<SigningPageProps> & { current?: 'stefan' | 'jelena' | 'none' }) {
  return (
    <SigningPage
      title="RU-2026-017"
      back={{ href: '#contracts', label: 'Contracts' }}
      status={<StatusBadge label="Awaiting signatures" tone="warning" />}
      subtitle="Employment contract · Stefan Nikolić, site engineer"
      actions={<Button intent="download" label="Download PDF" />}
      preview={<Preview lines={CONTRACT} />}
      signers={
        <SignerList
          signers={contractSigners(props.current ?? 'none')}
          declineReasons={DECLINE_REASONS}
          onSign={() => undefined}
          onDecline={() => undefined}
        />
      }
      attachments={<Attachments />}
      sections={[
        {
          id: 'details',
          label: 'Details',
          content: (
            <KeyValueList
              items={[
                { label: 'Prepared by', value: 'Jelena Marković' },
                { label: 'Prepared on', value: '05.10.2026.' },
                { label: 'Start of work', value: '02.11.2026.' },
              ]}
            />
          ),
        },
      ]}
      {...props}
    />
  )
}

const meta = {
  title: 'Templates/SigningPage',
  component: SigningPage,
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          '**What for:** a document awaiting signatures: the header (back, number, status, ' +
          'actions), the document’s preview edge to edge (`preview`: the application’s viewer, ' +
          'DocumentFrame of P5.5), the attachments (`attachments`: an AttachmentList), further ' +
          'sections, and the signers (`signers`: a SignerList) in the 300px side column — first ' +
          'on phones, where the person came to sign. Built on DetailPage.\n\n' +
          '**The signing itself** is done by the Core or Liro Bridge (SignerList’s callbacks).\n\n' +
          '**When not:** an approval without signatures (WorklistPage); editing the document ' +
          '(DocumentPage, a record’s DetailPage).',
      },
    },
  },
  args: {
    title: 'RU-2026-017',
    preview: null,
    signers: null,
  },
  render: () => (
    <ExampleProvider>
      <Page current="stefan" />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof SigningPage>

export default meta

type Story = StoryObj<typeof meta>

/** Stefan Nikolić's turn: the document, the files and Decline – Sign in the side column. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1, name: 'RU-2026-017' })).toBeVisible()
    await expect(canvas.getByRole('heading', { level: 2, name: 'Signatures' })).toBeVisible()
    await expect(canvas.getByRole('heading', { level: 2, name: 'Document' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Sign' })).toBeVisible()
  },
}

/** Viewed by HR, not a signer: who has signed, no actions. */
export const NotASigner: Story = {
  name: 'Not a signer',
  render: () => (
    <ExampleProvider>
      <Page current="none" />
    </ExampleProvider>
  ),
}

/** Without attachments or further sections. */
export const Minimal: Story = {
  render: () => (
    <ExampleProvider>
      <Page current="stefan" attachments={undefined} sections={[]} />
    </ExampleProvider>
  ),
}

/** Long title and subtitle wrap. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ExampleProvider>
      <Page
        current="stefan"
        title="RU-2026-017-A2"
        subtitle="Annex 2 to the employment contract of Stefan Nikolić, site engineer on the Hall B extension at Temerinski put 51, Novi Sad"
      />
    </ExampleProvider>
  ),
}

/** On a phone: the signers first, then the document and the files. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <Page current="stefan" layout="phone" />
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const headings = within(canvasElement)
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.textContent)
    await expect(headings.slice(0, 3)).toEqual(['Signatures', 'Document', 'Attachments'])
    const page = canvasElement.querySelector<HTMLElement>('[data-slot="detail-page"]')
    if (page !== null) await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth)
  },
}

/** Arabic texts in a right-to-left page. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <Page
          current="stefan"
          subtitle="عقد عمل · ستيفان نيكوليتش"
          preview={<Preview lines={['عقد عمل', 'يتفق صاحب العمل والموظف على ما يلي.']} />}
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Japanese texts. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <Page
          current="stefan"
          subtitle="雇用契約書 · ステファン・ニコリッチ"
          preview={<Preview lines={['雇用契約書', '使用者と従業員は次のとおり合意する。']} />}
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** The download action on its own: the header keeps the application's actions. */
export const Actions: Story = {
  render: () => (
    <ExampleProvider>
      <Page
        current="none"
        actions={
          <>
            <Button family="neutral" icon={Download} label="Download with signatures" />
            <Button intent="next" label="Send reminder" />
          </>
        }
      />
    </ExampleProvider>
  ),
}
