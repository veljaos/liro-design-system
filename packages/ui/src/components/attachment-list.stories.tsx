import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { AttachmentList, type Attachment } from './attachment-list'
import { SectionCard } from './cards'
import { CheckboxField } from './checkbox-field'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { SidePanels } from './side-panels'
import { ExampleProvider, expectContentDirection, PhoneFrame, StoryProvider } from './story-frames'

/** The files of the final invoice F-2026-0418 to Vojvođanka Mlin a.d., in every state. */
const FILES: Attachment[] = [
  {
    id: 'contract',
    name: 'Ugovor 12-2026 Vojvođanka Mlin.pdf',
    sizeText: '1,8 MB',
    state: 'available',
    detail: 'Added by Nenad Kovačević',
  },
  {
    id: 'specification',
    name: 'Specifikacija radova IS-2026-007.docx',
    sizeText: '640 KB',
    state: 'available',
    flag: { label: 'Not an archival format', tone: 'warning' },
  },
  {
    id: 'photos',
    name: 'Fotografije hale B.zip',
    sizeText: '18,2 MB',
    state: 'uploading',
    progress: 45,
  },
  { id: 'delivery', name: 'Otpremnica 2026-0931.pdf', sizeText: '220 KB', state: 'scanning' },
  { id: 'macro', name: 'Obracun.xlsm', sizeText: '96 KB', state: 'quarantined' },
  {
    id: 'scan',
    name: 'Zapisnik o primopredaji.pdf',
    sizeText: '3,1 MB',
    state: 'failed',
    error: 'The connection was lost.',
  },
]

/** The signed contract stays: the application allows removing every other file. */
const canRemove = (file: Attachment) => file.id !== 'contract'

const meta = {
  title: 'Components/Files/AttachmentList',
  component: AttachmentList,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the files of a record or a document, each with its state and its next ' +
          'step in words — uploading (a bar and the percentage), checking for viruses, available ' +
          '(the name downloads), blocked after the check (it cannot be opened: upload a clean ' +
          'copy), or not uploaded (with "Upload again"). A flag beside a name says something the ' +
          'application knows ("Not an archival format"). Downloads go through `onDownload(file)` ' +
          'at the moment of the click, so the application fetches a short-lived link then; ' +
          'remove only where `canRemove(file)` allows it. Sizes are the application’s text. ' +
          '`extra(file)` adds the application’s control per file — "Send with the e-invoice". ' +
          'Rows divided by lines, never cards; `inCard` pads them for a card’s edges.\n\n' +
          '**When:** wherever files belong to something: a document’s attachments block, a side ' +
          'panel, a signing page; with a FileDropzone to add more.\n\n' +
          '**When not:** related records (RelatedDocuments: links to documents, not files); a ' +
          'long list of files to search and sort (a DataTable).',
      },
    },
  },
  args: {
    label: 'Attachments',
    files: FILES,
    canRemove,
    onRemove: fn(),
    onRetry: fn(),
    onDownload: fn(
      () =>
        new Promise<void>((resolve) => {
          window.setTimeout(resolve, 600)
        }),
    ),
  },
  render: (args) => (
    <ExampleProvider>
      <div className="max-w-140">
        <AttachmentList {...args} />
      </div>
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof AttachmentList>

export default meta

type Story = StoryObj<typeof meta>

/**
 * Every state (uploading, scanning, available, quarantined, failed — the error) with its next
 * step; only available files download; the contract cannot be removed.
 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const list = canvas.getByRole('list', { name: 'Attachments' })
    await expect(within(list).getAllByRole('listitem')).toHaveLength(6)
    await expect(canvas.getByRole('progressbar', { name: 'Fotografije hale B.zip' })).toBeVisible()
    await expect(canvas.getByText('Uploading, 45%. It is checked for viruses next.')).toBeVisible()
    await expect(canvas.getByText(/Checking for viruses/)).toBeVisible()
    await expect(canvas.getByText(/a threat was found/)).toBeVisible()
    // Only available files download.
    await expect(canvas.getAllByRole('button', { name: /^Download / })).toHaveLength(2)
    await expect(canvas.queryByRole('button', { name: 'Download Obracun.xlsm' })).toBeNull()
    // The application's rule: the signed contract stays.
    await expect(
      canvas.queryByRole('button', { name: 'Remove Ugovor 12-2026 Vojvođanka Mlin.pdf' }),
    ).toBeNull()
    await settle()
  },
}

export const DefaultInteraction: Story = {
  name: 'Default, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement, args }) => {
    await settle()
    const canvas = within(canvasElement)
    const list = canvas.getByRole('list', { name: 'Attachments' })
    await expect(within(list).getAllByRole('listitem')).toHaveLength(6)
    await expect(canvas.getByRole('progressbar', { name: 'Fotografije hale B.zip' })).toBeVisible()
    await expect(canvas.getByText('Uploading, 45%. It is checked for viruses next.')).toBeVisible()
    await expect(canvas.getByText(/Checking for viruses/)).toBeVisible()
    await expect(canvas.getByText(/a threat was found/)).toBeVisible()
    // Only available files download.
    await expect(canvas.getAllByRole('button', { name: /^Download / })).toHaveLength(2)
    await expect(canvas.queryByRole('button', { name: 'Download Obracun.xlsm' })).toBeNull()
    // The application's rule: the signed contract stays.
    await expect(
      canvas.queryByRole('button', { name: 'Remove Ugovor 12-2026 Vojvođanka Mlin.pdf' }),
    ).toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: 'Remove Obracun.xlsm' }))
    await expect(args.onRemove).toHaveBeenCalledOnce()
    await userEvent.click(
      canvas.getByRole('button', { name: 'Upload Zapisnik o primopredaji.pdf again' }),
    )
    await expect(args.onRetry).toHaveBeenCalledOnce()
  },
}

/**
 * Downloading: the application fetches a short-lived link at the click; while it does, the name is
 * busy with a small spinner.
 */
export const Download: Story = {
  tags: ['interaction'],
  play: async ({ canvasElement, args }) => {
    await settle()
    const canvas = within(canvasElement)
    const name = canvas.getByRole('button', { name: 'Download Ugovor 12-2026 Vojvođanka Mlin.pdf' })
    await userEvent.click(name)
    await expect(args.onDownload).toHaveBeenCalledWith(FILES[0])
    await expect(name).toHaveAttribute('aria-busy', 'true')
    await waitFor(() => expect(name).not.toHaveAttribute('aria-busy'), { timeout: 3000 })
  },
}

/**
 * In the document's card, with the application's control per file: "Send with the e-invoice" (the
 * final invoice's attachments, P5.18).
 */
export const InACardWithControl: Story = {
  name: 'In a card, a control per file',
  render: function Render(args) {
    const [sent, setSent] = useState<readonly string[]>(['contract'])
    return (
      <ExampleProvider>
        <div className="max-w-160">
          <SectionCard title="Attachments" flush>
            <AttachmentList
              {...args}
              files={FILES.filter(
                (file) => file.state === 'available' || file.state === 'scanning',
              )}
              inCard
              extra={(file) =>
                file.state === 'available' ? (
                  <CheckboxField
                    label="Send with the e-invoice"
                    checked={sent.includes(file.id)}
                    onChange={(checked) => {
                      setSent(checked ? [...sent, file.id] : sent.filter((id) => id !== file.id))
                    }}
                    {...(file.flag === undefined
                      ? {}
                      : {
                          disabled: true,
                          disabledReason: 'SEF accepts PDF attachments only.',
                        })}
                  />
                ) : null
              }
            />
          </SectionCard>
        </div>
      </ExampleProvider>
    )
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const boxes = canvas.getAllByRole('checkbox', { name: 'Send with the e-invoice' })
    await expect(boxes).toHaveLength(2)
    await expect(boxes[0]).toBeChecked()
    await expect(boxes[1]).toBeDisabled()
    await expect(canvas.getByText('SEF accepts PDF attachments only.')).toBeVisible()
  },
}

/** In a side panel: the panel's edge rule holds (no space of the list's own at its edges). */
export const InASidePanel: Story = {
  name: 'In a side panel',
  render: function Render(args) {
    const [open, setOpen] = useState<string[]>(['files'])
    return (
      <ExampleProvider>
        <div className="max-w-75">
          <SidePanels
            open={open}
            onOpenChange={setOpen}
            panels={[
              {
                key: 'files',
                title: 'Attachments',
                count: 2,
                content: <AttachmentList {...args} files={FILES.slice(0, 2)} />,
              },
            ]}
          />
        </div>
      </ExampleProvider>
    )
  },
}

/** While the list loads: skeleton rows. */
export const Loading: Story = {
  args: { loading: true },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('list')).toHaveAttribute('aria-busy', 'true')
  },
}

/** No files: the provider's text, or the application's. */
export const Empty: Story = {
  render: () => (
    <ExampleProvider>
      <div className="flex max-w-140 flex-col gap-4">
        <AttachmentList label="Attachments" files={[]} />
        <AttachmentList
          label="Attachments"
          files={[]}
          empty="Nothing attached yet. The signed contract is added after signing."
        />
      </div>
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('No attachments')).toBeVisible()
  },
}

/** Long names wrap at word ends; the remove button stays at the end. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    files: [
      {
        id: 'long',
        name: 'Izvestaj_o_izvrsenim_radovima_na_prosirenju_hale_B_Temerinski_put_51_septembar_2026_konacna_verzija.pdf',
        sizeText: '12,4 MB',
        state: 'available',
        flag: { label: LONG.label, tone: 'neutral' },
        detail: LONG.description,
      },
      { id: 'failed', name: LONG.value, state: 'failed', error: LONG.error },
    ],
  },
}

/** Phone width: the same rows, full width. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="box-border p-4">
          <SectionCard title="Attachments" flush>
            <AttachmentList {...args} inCard />
          </SectionCard>
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const list = within(canvasElement).getByRole('list', { name: 'Attachments' })
    await expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth)
  },
}

/** Arabic sample text, right to left. */
export const Arabic: Story = {
  args: {
    files: [
      {
        id: 'a',
        name: `${ARABIC.value}.pdf`,
        sizeText: '1,2 MB',
        state: 'available',
        detail: ARABIC.description,
      },
      { id: 'b', name: `${ARABIC.label}.pdf`, state: 'uploading', progress: 70 },
      { id: 'c', name: `${ARABIC.reason}.pdf`, state: 'failed', error: ARABIC.error },
    ],
  },
  render: (args) => (
    <StoryProvider locale="ar">
      <div className="max-w-140">
        <AttachmentList {...args} />
      </div>
    </StoryProvider>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  args: {
    files: [
      {
        id: 'a',
        name: `${JAPANESE.value}.pdf`,
        sizeText: '1,2 MB',
        state: 'available',
        detail: JAPANESE.description,
      },
      { id: 'b', name: `${JAPANESE.label}.pdf`, state: 'scanning' },
      { id: 'c', name: `${JAPANESE.reason}.pdf`, state: 'quarantined' },
    ],
  },
  render: (args) => (
    <StoryProvider locale="ja">
      <div className="max-w-140">
        <AttachmentList {...args} />
      </div>
    </StoryProvider>
  ),
}

/** English in a right-to-left page (P3.6). */
export const EnglishInRtl: Story = {
  name: 'English in RTL',
  render: (args) => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <div className="max-w-140">
          <AttachmentList {...args} />
        </div>
      </ExampleProvider>
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expectContentDirection(
      canvas.getByText(/Checking for viruses/),
      canvas.getByText('Added by Nenad Kovačević'),
    )
  },
}
