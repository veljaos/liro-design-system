import type { Meta, StoryObj } from '@storybook/react-vite'
import { Download } from 'lucide-react'
import { expect, within } from 'storybook/test'
import { AttachmentList } from '../components/attachment-list'
import { Button } from '../components/button'
import { DocumentFrame } from '../components/document-frame'
import { CONTRACT_VIEWER, viewer } from '../components/document-frame-story-data'
import { contractSigners, DECLINE_REASONS } from '../components/group-c-story-data'
import { KeyValueList } from '../components/cards'
import { SignerList } from '../components/signer-list'
import { StatusBadge } from '../components/status-badge'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { SigningPage, type SigningPageProps } from './signing-page'

/** The document's preview: DocumentFrame (P5.5) hosting the stories' viewer. */
function Preview({ title, viewerDocument }: { title: string; viewerDocument: string }) {
  return <DocumentFrame title={title} srcDoc={viewerDocument} allowedOrigin="null" />
}

/** The contract's attachments, downloaded at the click. */
function Attachments() {
  return (
    <AttachmentList
      label="Attachments"
      files={[
        { id: 'job', name: 'Job description — site engineer.pdf', sizeText: '182 KB' },
        { id: 'safety', name: 'Health and safety statement.pdf', sizeText: '96 KB' },
      ].map((file) => ({ ...file, state: 'available' as const }))}
      onDownload={() => undefined}
    />
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
      preview={<Preview title="Employment contract RU-2026-017" viewerDocument={CONTRACT_VIEWER} />}
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
          preview={
            <Preview
              title="عقد عمل"
              viewerDocument={viewer({
                title: 'عقد عمل',
                lang: 'ar',
                dir: 'rtl',
                pages: ['<h1>عقد عمل</h1><p>يتفق صاحب العمل والموظف على ما يلي.</p>'],
              })}
            />
          }
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
          preview={
            <Preview
              title="雇用契約書"
              viewerDocument={viewer({
                title: '雇用契約書',
                lang: 'ja',
                pages: ['<h1>雇用契約書</h1><p>使用者と従業員は次のとおり合意する。</p>'],
              })}
            />
          }
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
