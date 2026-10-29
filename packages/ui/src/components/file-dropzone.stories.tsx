import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { AttachmentList, type Attachment } from './attachment-list'
import { SectionCard } from './cards'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { FileDropzone } from './file-dropzone'
import { ExampleProvider, expectContentDirection, PhoneFrame, StoryProvider } from './story-frames'

const MB = 1024 * 1024

/** A file as a browser gives it, of a given size (the content is not read). */
function file(name: string, type: string, size: number): File {
  const made = new File(['x'], name, { type })
  Object.defineProperty(made, 'size', { value: size })
  return made
}

/** The hidden file input of the dropzone in a story. */
function fileInput(canvasElement: HTMLElement): HTMLInputElement {
  const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]')
  if (input === null) throw new Error('No file input')
  return input
}

/** Sends one drag event with these files, as the browser does. */
function drag(target: Element, type: string, files: File[]) {
  // A real DataTransfer: Testing Library's fireEvent copies only own properties and loses files.
  const transfer = new DataTransfer()
  for (const item of files) transfer.items.add(item)
  target.dispatchEvent(
    new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: transfer }),
  )
}

/** Drops files on an element as the browser does (dragenter, dragover, drop). */
function drop(target: Element, files: File[]) {
  drag(target, 'dragenter', files)
  drag(target, 'dragover', files)
  drag(target, 'drop', files)
}

const meta = {
  title: 'Components/Files/FileDropzone',
  component: FileDropzone,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** adding files — to a document, a record, an import. What is accepted ' +
          'and how large a file may be are shown BEFORE choosing, in the application’s words ' +
          '("PDF, XML, JPG or PNG", "up to 10 MB"). "Choose files" is a real button, so the ' +
          'keyboard and every pointer reach it; dropping files on the zone is a shortcut, never ' +
          'the only way (phones show no drop text). Every file is checked again for its type, ' +
          'size and the number allowed (a dropped file never passes the dialog’s filter): ' +
          'accepted ones go to `onFiles`, the others to `onReject` and are named under the zone ' +
          'with the reason, from the provider’s messages.\n\n' +
          '**When:** wherever files are added; the files then live in an AttachmentList beside ' +
          'it, which shows their upload, virus check and state. `expected` lists the documents ' +
          'the application expects — a request’s proof, from its data ("Death certificate", ' +
          'required) — under the zone, each "Required" or "Optional", checked once attached.\n\n' +
          '**When not:** choosing one of the files already stored (a list or a lookup); a single ' +
          'image with a preview (a dedicated picker, not yet in the Design System).',
      },
    },
  },
  args: {
    label: 'Attachments',
    accept: ['.pdf', '.xml', 'image/jpeg', 'image/png'],
    acceptText: 'PDF, XML, JPG or PNG',
    maxSize: 10 * MB,
    maxSizeText: '10 MB',
    onFiles: fn(),
    onReject: fn(),
  },
  render: (args) => (
    <ExampleProvider>
      <div className="max-w-140">
        <FileDropzone {...args} />
      </div>
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof FileDropzone>

export default meta

type Story = StoryObj<typeof meta>

/**
 * Choosing with the button's file dialog: an accepted file goes to the application; a file of
 * another type is named under the zone with the reason, and reported.
 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'Choose files' })
    await expect(button).toHaveAccessibleDescription('PDF, XML, JPG or PNG, up to 10 MB')
    await expect(canvas.getByRole('group', { name: 'Attachments' })).toBeVisible()
    const input = fileInput(canvasElement)
    await expect(input).toHaveAttribute('accept', '.pdf,.xml,image/jpeg,image/png')
    await settle()
  },
}

export const DefaultInteraction: Story = {
  name: 'Default, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement, args }) => {
    await settle()
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'Choose files' })
    await expect(button).toHaveAccessibleDescription('PDF, XML, JPG or PNG, up to 10 MB')
    await expect(canvas.getByRole('group', { name: 'Attachments' })).toBeVisible()
    const input = fileInput(canvasElement)
    await expect(input).toHaveAttribute('accept', '.pdf,.xml,image/jpeg,image/png')
    await userEvent.upload(input, file('Ugovor 12-2026.pdf', 'application/pdf', 2 * MB))
    await expect(args.onFiles).toHaveBeenCalledOnce()
    // The file dialog can be switched to "All files": the type is checked again.
    await fireEvent.change(input, {
      target: { files: [file('setup.exe', 'application/x-msdownload', MB)] },
    })
    await expect(await canvas.findByText(/setup\.exe was not added/)).toBeVisible()
    await expect(args.onReject).toHaveBeenCalledOnce()
  },
}

/** Dropping files: the zone takes the neutral selection while files are over it. */
export const Dropping: Story = {
  tags: ['interaction'],
  play: async ({ canvasElement, args }) => {
    await settle()
    const zone = canvasElement.querySelector('[data-slot="file-dropzone"]')
    if (zone === null) throw new Error('No zone')
    drag(zone, 'dragenter', [])
    drag(zone, 'dragover', [])
    await waitFor(() => expect(zone).toHaveAttribute('data-dragging', 'true'))
    drag(zone, 'dragleave', [])
    await waitFor(() => expect(zone).not.toHaveAttribute('data-dragging'))
    drop(zone, [
      file('Situacija IS-2026-007.pdf', 'application/pdf', 4 * MB),
      file('Snimak gradilišta.jpg', 'image/jpeg', 14 * MB),
    ])
    await expect(args.onFiles).toHaveBeenCalledOnce()
    await expect(
      await within(canvasElement).findByText(
        'Snimak gradilišta.jpg was not added: it is larger than 10 MB.',
      ),
    ).toBeVisible()
  },
}

/** One file only: a second one is rejected for the count. */
export const SingleFile: Story = {
  name: 'One file',
  args: {
    label: 'Signed contract',
    multiple: false,
    accept: ['.pdf'],
    acceptText: 'PDF',
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Choose a file' })).toBeVisible()
    const zone = canvasElement.querySelector('[data-slot="file-dropzone"]')
    if (zone === null) throw new Error('No zone')
    await settle()
  },
}

export const SingleFileInteraction: Story = {
  name: 'One file, interaction',
  tags: ['interaction'],
  args: {
    label: 'Signed contract',
    multiple: false,
    accept: ['.pdf'],
    acceptText: 'PDF',
  },
  play: async ({ canvasElement, args }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Choose a file' })).toBeVisible()
    const zone = canvasElement.querySelector('[data-slot="file-dropzone"]')
    if (zone === null) throw new Error('No zone')
    drop(zone, [
      file('RU-2026-017 potpisan.pdf', 'application/pdf', MB),
      file('RU-2026-017 aneks.pdf', 'application/pdf', MB),
    ])
    await expect(args.onFiles).toHaveBeenCalledOnce()
    await expect(
      await canvas.findByText(
        'RU-2026-017 aneks.pdf was not added: at most one file can be attached.',
      ),
    ).toBeVisible()
  },
}

/** A limit counting the files already attached. */
export const CountLimit: Story = {
  name: 'Count limit',
  args: { maxFiles: 5, existing: 4, description: 'At most 5 files per document.' },
  play: async ({ canvasElement }) => {
    await settle()
    const zone = canvasElement.querySelector('[data-slot="file-dropzone"]')
    if (zone === null) throw new Error('No zone')
    await settle()
  },
}

export const CountLimitInteraction: Story = {
  name: 'Count limit, interaction',
  tags: ['interaction'],
  args: { maxFiles: 5, existing: 4, description: 'At most 5 files per document.' },
  play: async ({ canvasElement }) => {
    await settle()
    const zone = canvasElement.querySelector('[data-slot="file-dropzone"]')
    if (zone === null) throw new Error('No zone')
    drop(zone, [file('a.pdf', 'application/pdf', MB), file('b.pdf', 'application/pdf', MB)])
    await expect(
      await within(canvasElement).findByText(
        'b.pdf was not added: at most 5 files can be attached.',
      ),
    ).toBeVisible()
  },
}

/**
 * Files cannot be added now (P5.93): the zone grey, "Choose files" unavailable but focusable, the
 * reason in words under the zone.
 */
export const Unavailable: Story = {
  name: 'Unavailable with reason',
  args: {
    unavailableReason: 'The invoice is issued: attachments can no longer be added.',
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const choose = canvas.getByRole('button', { name: 'Choose files' })
    await expect(choose).toHaveAttribute('aria-disabled', 'true')
    await expect(choose).toHaveAccessibleDescription(/can no longer be added/)
    await expect(canvas.getByText(/can no longer be added/)).toBeVisible()
  },
}

/**
 * The documents the application expects (P5.94 item 3), from its data: a request's proof under
 * the zone, each "Required" or "Optional", the first already attached; the field is marked
 * required because one is.
 */
export const Expected: Story = {
  name: 'Expected documents',
  args: {
    label: 'Proof',
    accept: ['image/*', '.pdf'],
    acceptText: 'A photo or a PDF',
    maxSizeText: '10 MB',
    expected: [
      { key: 'death', label: 'Death certificate', required: true, attached: true },
      {
        key: 'kinship',
        label: 'Proof of kinship',
        detail: 'A birth or marriage certificate, when the surname differs',
      },
    ],
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const list = canvas.getByRole('list', { name: 'Attach' })
    await expect(within(list).getAllByRole('listitem')).toHaveLength(2)
    await expect(within(list).getByText('Attached')).toBeVisible()
    await expect(within(list).getByText('Optional')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Choose files' })).toHaveAccessibleDescription(
      /Death certificate ?, Attached.*Proof of kinship ?, Optional/,
    )
  },
}

/** Expected documents on a phone, with the camera: a paper certificate photographed. */
export const ExpectedPhone: Story = {
  name: 'Expected documents, phone',
  args: {
    label: 'Proof',
    accept: ['image/*', '.pdf'],
    acceptText: 'A photo or a PDF',
    maxSizeText: '10 MB',
    camera: true,
    expected: [{ key: 'note', label: 'Doctor’s note', required: true }],
  },
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="box-border p-4">
          <FileDropzone {...args} layout="phone" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** The application's error (required, nothing attached). */
export const Invalid: Story = {
  name: 'Error',
  args: { required: true, error: 'Attach the signed contract.' },
}

/**
 * With an AttachmentList, as the application wires them: each chosen file is uploaded, checked for
 * viruses, then available (the stories play the application with timers).
 */
export const WithList: Story = {
  name: 'With the attachment list',
  render: function Render(args) {
    const [files, setFiles] = useState<Attachment[]>([
      {
        id: 'contract',
        name: 'Ugovor 12-2026 Vojvođanka Mlin.pdf',
        sizeText: '1,8 MB',
        state: 'available',
      },
    ])
    const uploading = files.some((item) => item.state === 'uploading' || item.state === 'scanning')
    useEffect(() => {
      if (!uploading) return
      const timer = window.setInterval(() => {
        setFiles((current) =>
          current.map((item) => {
            if (item.state === 'uploading') {
              const progress = Math.min((item.progress ?? 0) + 25, 100)
              return progress === 100
                ? { ...item, state: 'scanning', progress }
                : { ...item, progress }
            }
            if (item.state === 'scanning') return { ...item, state: 'available' }
            return item
          }),
        )
      }, 120)
      return () => {
        window.clearInterval(timer)
      }
    }, [uploading])
    return (
      <ExampleProvider>
        <div className="max-w-140">
          <SectionCard title="Attachments" flush>
            <div className="flex flex-col gap-3 px-4 pb-4">
              <FileDropzone
                {...args}
                hideLabel
                existing={files.length}
                onFiles={(chosen) => {
                  setFiles((current) => [
                    ...current,
                    ...chosen.map((item) => ({
                      id: item.name,
                      name: item.name,
                      sizeText: '2,4 MB',
                      state: 'uploading' as const,
                      progress: 0,
                    })),
                  ])
                }}
              />
            </div>
            <AttachmentList
              label="Attachments"
              inCard
              files={files}
              onDownload={() => undefined}
              canRemove={() => true}
              onRemove={(removed) => {
                setFiles((current) => current.filter((item) => item.id !== removed.id))
              }}
            />
          </SectionCard>
        </div>
      </ExampleProvider>
    )
  },
  play: async () => {
    await settle()
  },
}

export const WithListInteraction: Story = {
  name: 'With the attachment list, interaction',
  tags: ['interaction'],
  render: function Render(args) {
    const [files, setFiles] = useState<Attachment[]>([
      {
        id: 'contract',
        name: 'Ugovor 12-2026 Vojvođanka Mlin.pdf',
        sizeText: '1,8 MB',
        state: 'available',
      },
    ])
    const uploading = files.some((item) => item.state === 'uploading' || item.state === 'scanning')
    useEffect(() => {
      if (!uploading) return
      const timer = window.setInterval(() => {
        setFiles((current) =>
          current.map((item) => {
            if (item.state === 'uploading') {
              const progress = Math.min((item.progress ?? 0) + 25, 100)
              return progress === 100
                ? { ...item, state: 'scanning', progress }
                : { ...item, progress }
            }
            if (item.state === 'scanning') return { ...item, state: 'available' }
            return item
          }),
        )
      }, 120)
      return () => {
        window.clearInterval(timer)
      }
    }, [uploading])
    return (
      <ExampleProvider>
        <div className="max-w-140">
          <SectionCard title="Attachments" flush>
            <div className="flex flex-col gap-3 px-4 pb-4">
              <FileDropzone
                {...args}
                hideLabel
                existing={files.length}
                onFiles={(chosen) => {
                  setFiles((current) => [
                    ...current,
                    ...chosen.map((item) => ({
                      id: item.name,
                      name: item.name,
                      sizeText: '2,4 MB',
                      state: 'uploading' as const,
                      progress: 0,
                    })),
                  ])
                }}
              />
            </div>
            <AttachmentList
              label="Attachments"
              inCard
              files={files}
              onDownload={() => undefined}
              canRemove={() => true}
              onRemove={(removed) => {
                setFiles((current) => current.filter((item) => item.id !== removed.id))
              }}
            />
          </SectionCard>
        </div>
      </ExampleProvider>
    )
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.upload(
      fileInput(canvasElement),
      file('Situacija IS-2026-007.pdf', 'application/pdf', 2 * MB),
    )
    await expect(await canvas.findByText(/Uploading/)).toBeVisible()
    await waitFor(
      () =>
        expect(
          canvas.getByRole('button', { name: 'Download Situacija IS-2026-007.pdf' }),
        ).toBeVisible(),
      { timeout: 4000 },
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Remove Situacija IS-2026-007.pdf' }))
    await expect(canvas.queryByText('Situacija IS-2026-007.pdf')).toBeNull()
  },
}

/** Long texts wrap inside the zone. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    label: LONG.label,
    description: LONG.description,
    acceptText: 'PDF, XML, JPG, PNG, TIFF, Microsoft Word documents and OpenDocument texts',
    maxSizeText: '25 MB per file and 100 MB per document',
  },
}

/** Phone width: no drop text (nothing to drop from), the button full in reach. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="box-border p-4">
          <FileDropzone {...args} layout="phone" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.queryByText('or drop them here')).toBeNull()
    await expect(canvas.getByRole('button', { name: 'Choose files' })).toBeVisible()
  },
}

/**
 * A photo from the camera on a phone (P5.28): "Take a photo" beside "Choose a file", for a paper
 * note; the photo is checked as any file. Desktops show only "Choose a file".
 */
export const PhoneCamera: Story = {
  name: 'Phone width, camera',
  args: {
    label: 'Doctor’s note',
    multiple: false,
    accept: ['image/*', '.pdf'],
    acceptText: 'A photo or a PDF',
    maxSizeText: '10 MB',
    camera: true,
  },
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="box-border p-4">
          <FileDropzone {...args} layout="phone" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Take a photo' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Choose a file' })).toBeVisible()
    await expect(canvasElement.querySelector('input[capture="environment"]')).not.toBeNull()
  },
}

/** Arabic sample text, right to left. */
export const Arabic: Story = {
  args: { label: ARABIC.label, description: ARABIC.description, acceptText: ARABIC.value },
  render: (args) => (
    <StoryProvider locale="ar">
      <div className="max-w-140">
        <FileDropzone {...args} />
      </div>
    </StoryProvider>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  args: { label: JAPANESE.label, description: JAPANESE.description, acceptText: JAPANESE.value },
  render: (args) => (
    <StoryProvider locale="ja">
      <div className="max-w-140">
        <FileDropzone {...args} />
      </div>
    </StoryProvider>
  ),
}

/** English in a right-to-left page (P3.6): the rejection keeps its word order. */
export const EnglishInRtl: Story = {
  name: 'English in RTL',
  render: (args) => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <div className="max-w-140">
          <FileDropzone {...args} />
        </div>
      </ExampleProvider>
    </StoryProvider>
  ),
  play: async () => {
    await settle()
  },
}

export const EnglishInRtlInteraction: Story = {
  name: 'English in RTL, interaction',
  tags: ['interaction'],
  render: (args) => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <div className="max-w-140">
          <FileDropzone {...args} />
        </div>
      </ExampleProvider>
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await fireEvent.change(fileInput(canvasElement), {
      target: { files: [file('setup.exe', 'application/x-msdownload', MB)] },
    })
    await expectContentDirection(
      canvas.getByText('or drop them here'),
      await canvas.findByText(/setup\.exe was not added/),
    )
  },
}
