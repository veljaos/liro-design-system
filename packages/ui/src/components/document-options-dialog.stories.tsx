import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { PAGE_SIZES } from './document-areas'
import { DocumentOptionsDialog, type DocumentOptionsValue } from './document-options-dialog'
import { PageViewer } from './page-viewer'
import { A4_SAMPLE, samplePages } from './sample-pages-story-data'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

const TYPES = [
  { value: 'invoice', label: 'Invoice' },
  { value: 'delivery-note', label: 'Delivery note' },
  { value: 'proforma', label: 'Proforma invoice' },
]
const LANGUAGES = [
  { value: 'sr-Latn', label: 'Srpski (latinica)', lang: 'sr-Latn' },
  { value: 'sr-Cyrl', label: 'Српски (ћирилица)', lang: 'sr-Cyrl' },
  { value: 'en', label: 'English', lang: 'en' },
]
const MARKS = [
  { value: 'copy', label: 'Copy' },
  { value: 'draft', label: 'Draft' },
  { value: 'confidential', label: 'Confidential' },
]
const SIGNATURES = [
  { value: 'line', label: 'Handwritten signature line' },
  { value: 'e-signature', label: 'E-signature field' },
]
const PAPERS = [
  { value: 'a4', label: 'A4' },
  { value: 'a5', label: 'A5' },
  { value: 'thermal-80', label: 'Thermal roll, 80 mm' },
]
const START: DocumentOptionsValue = {
  type: 'invoice',
  languages: ['sr-Latn'],
  marks: [],
  qr: true,
  signature: 'line',
  paper: 'a4',
}

/** The dialog with its state: the preview follows the paper, as the application would redraw it. */
function Options({
  expanded = false,
  preview = false,
  layout,
  start = START,
  types = TYPES,
  subject = 'Invoice F-2026-0412',
}: {
  expanded?: boolean
  preview?: boolean
  layout?: 'desktop' | 'phone'
  start?: DocumentOptionsValue
  types?: typeof TYPES
  subject?: string
}) {
  const [open, setOpen] = useState(true)
  const [value, setValue] = useState(start)
  const [remember, setRemember] = useState(true)
  const [done, setDone] = useState('')
  const size =
    value.paper === 'a5'
      ? PAGE_SIZES.a5
      : value.paper === 'thermal-80'
        ? PAGE_SIZES.thermal80
        : null
  return (
    <>
      <p className="m-0 font-sans text-sm text-secondary">{done}</p>
      <DocumentOptionsDialog
        open={open}
        onOpenChange={setOpen}
        subject={subject}
        types={types}
        languages={LANGUAGES}
        maxLanguages={2}
        marks={MARKS}
        qr
        signatureModes={SIGNATURES}
        papers={PAPERS}
        value={value}
        onChange={setValue}
        remember={{ checked: remember, onChange: setRemember }}
        defaultExpanded={expanded}
        {...(layout === undefined ? {} : { layout })}
        {...(preview
          ? {
              preview: (
                <PageViewer
                  label="Preview"
                  pages={size === null ? A4_SAMPLE : samplePages(1, size)}
                  className="h-96"
                />
              ),
            }
          : {})}
        actions={[
          {
            id: 'print',
            label: 'Print',
            intent: 'print',
            onClick: () => {
              setDone('Sent to the printer')
              setOpen(false)
            },
          },
          {
            id: 'pdf',
            label: 'Download PDF',
            intent: 'download',
            onClick: (chosen) => {
              setDone(`Download PDF: ${chosen.type}, ${chosen.languages.join(' + ')}`)
              setOpen(false)
            },
          },
        ]}
      />
    </>
  )
}

const meta = {
  title: 'Components/Overlays/DocumentOptionsDialog',
  component: DocumentOptionsDialog,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the options of a document before it is printed or exported ("Print / ' +
          'Export"). Every choice and its options come from the application: the document type, ' +
          'one language or two for a bilingual document, status marks (Copy, Draft, Confidential), ' +
          'the QR code, the signature mode and the paper. Simplicity first: only the type and the ' +
          'actions show; the rest is under "More options". "Remember these options for …" shows ' +
          'when the application keeps the choice per type; the preview is the application’s, ' +
          'redrawn from `onChange`. A dialog on a desktop, a full-screen sheet on phones.\n\n' +
          '**When to use:** before "Download PDF" or "Print" of a document with choices. ' +
          '**When not:** a document with nothing to choose (download it at once).',
      },
    },
  },
  args: {
    open: true,
    onOpenChange: () => undefined,
    types: TYPES,
    value: START,
    onChange: () => undefined,
    actions: [],
  },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <Story />
      </ExampleProvider>
    ),
  ],
  play: settle,
} satisfies Meta<typeof DocumentOptionsDialog>

export default meta

type Story = StoryObj<typeof meta>

/** By default only the type and the actions: Cancel, Print, Download PDF (the main one last). */
export const Default: Story = {
  render: () => <Options />,
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog', { name: /Print or export/ })
    await expect(within(dialog).getByRole('button', { name: 'More options' })).toBeVisible()
    await expect(within(dialog).queryByText('Paper')).toBeNull()
  },
}

/** "More options" open: a bilingual document, marks, QR code, signature mode, paper. */
export const MoreOptions: Story = {
  name: 'More options',
  render: () => (
    <Options expanded start={{ ...START, languages: ['sr-Latn', 'en'], marks: ['copy'] }} />
  ),
}

/** With the application's preview beside the options; a thermal roll's preview follows the paper. */
export const WithPreview: Story = {
  name: 'With a preview',
  render: () => <Options expanded preview start={{ ...START, paper: 'thermal-80' }} />,
}

/** Choosing and downloading: the application gets the options with "Download PDF". */
export const Choose: Story = {
  name: 'Choose and download, interaction',
  tags: ['interaction'],
  render: () => <Options />,
  play: async ({ canvasElement }) => {
    await settle()
    const body = within(document.body)
    await userEvent.click(body.getByRole('button', { name: 'More options' }))
    await expect(body.getByRole('radio', { name: 'A5' })).toBeVisible()
    await userEvent.click(body.getByRole('button', { name: 'Download PDF' }))
    await waitFor(() =>
      expect(within(canvasElement).getByText('Download PDF: invoice, sr-Latn')).toBeVisible(),
    )
  },
}

/** Phone width: a full-screen sheet. */
export const Phone: Story = {
  render: () => (
    <PhoneFrame>
      <Options layout="phone" expanded />
    </PhoneFrame>
  ),
}

/** Arabic, right to left. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <Options
          expanded
          subject="فاتورة F-2026-0412"
          types={[
            { value: 'invoice', label: 'فاتورة' },
            { value: 'delivery-note', label: 'إشعار تسليم' },
            { value: 'proforma', label: 'فاتورة مبدئية' },
          ]}
          start={{ ...START, languages: ['en'] }}
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <Options
          expanded
          subject="請求書 F-2026-0412"
          types={[
            { value: 'invoice', label: '請求書' },
            { value: 'delivery-note', label: '納品書' },
            { value: 'proforma', label: '見積請求書' },
          ]}
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}
