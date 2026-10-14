import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Clock,
  Copy,
  Download,
  Eye,
  FolderInput,
  Info,
  Pencil,
  Share2,
  Star,
  Trash2,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test'
import { Button } from '../components/button'
import type { DataTableColumn } from '../components/data-table'
import type { DataTableSort } from '../components/data-table-logic'
import type { MenuEntry } from '../components/dropdown-menu'
import { FileDetails } from '../components/file-details'
import type { FileEntry, UploadedFile } from '../components/file-browser-logic'
import {
  FOLDERS,
  HANDOVER,
  HARBOUR,
  PHOTOS,
  RESULTS,
  TRASH,
  UPLOADS,
  VERSIONS,
} from '../components/file-story-data'
import { SignerList } from '../components/signer-list'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { UsageMeter } from '../components/usage-meter'
import { VersionList } from '../components/version-list'
import { useLiro } from '../provider/liro-provider'
import { settle } from '../primitives/story-helpers'
import { FileBrowser, type FileBrowserProps, type FilePlace } from './file-browser'

const PLACES: FilePlace[] = [
  { key: 'recent', label: 'Recent', icon: Clock },
  { key: 'favourites', label: 'Favourites', icon: Star, count: 4 },
  { key: 'shared', label: 'Shared with me', icon: Users },
  { key: 'trash', label: 'Trash', icon: Trash2, count: 2 },
]

const HARBOUR_PATH = [
  { label: 'Documents', href: '#files' },
  { label: 'Site documentation', href: '#files/site' },
  { label: 'Harbour Road site', href: '#files/site/harbour' },
]

const TYPE_FILTER = [
  {
    id: 'type',
    label: 'Type',
    type: 'multiSelect' as const,
    options: [
      { value: 'folder', label: 'Folders' },
      { value: 'pdf', label: 'PDF' },
      { value: 'image', label: 'Images' },
      { value: 'office', label: 'Office files' },
    ],
  },
]

const SORT_COLUMNS = [
  { id: 'name', label: 'Name' },
  { id: 'modified', label: 'Modified' },
  { id: 'size', label: 'Size' },
]

function itemMenu(entry: FileEntry): MenuEntry[] {
  return [
    ...(entry.kind === 'file'
      ? [
          { label: 'Preview', icon: Eye, onSelect: () => undefined },
          { label: 'Download', icon: Download, onSelect: () => undefined },
        ]
      : []),
    { label: 'Rename…', icon: Pencil, onSelect: () => undefined },
    { label: 'Move to…', icon: FolderInput, onSelect: () => undefined },
    { label: 'Copy to…', icon: Copy, onSelect: () => undefined },
    { label: 'Share…', icon: Share2, onSelect: () => undefined },
    { label: 'Details', icon: Info, onSelect: () => undefined },
    { type: 'separator' },
    { label: 'Delete', icon: Trash2, destructive: true, onSelect: () => undefined },
  ]
}

const BULK = [
  { key: 'download', intent: 'download' as const, label: 'Download as ZIP' },
  { key: 'move', family: 'neutral' as const, icon: FolderInput, label: 'Move to…' },
  { key: 'delete', intent: 'delete' as const, label: 'Delete', emphasis: 'secondary' as const },
]

function Storage() {
  return (
    <UsageMeter
      label="Storage"
      used="38.4"
      limit="50"
      unit="GB"
      note="Included in the Business plan: 50 GB."
    />
  )
}

/** The handover protocol's details: facts, links, signing, versions, sharing, activity. */
function HandoverDetails({ onClose }: { onClose?: () => void }) {
  const entry = HANDOVER
  return (
    <FileDetails
      entry={entry}
      created="2026-10-01T09:00:00+02:00"
      retention="Keep until 2036"
      tags={['Handover', 'Harbour Road']}
      actions={
        <>
          <Button intent="download" label="Download" />
          <Button family="neutral" icon={Share2} label="Share…" />
        </>
      }
      signing={
        <SignerList
          signers={[
            {
              id: 'lin',
              name: 'Grace Lin',
              role: 'Project manager',
              state: 'signed',
              at: '2026-10-12T13:40:00+02:00',
            },
            {
              id: 'client',
              name: 'Oliver Grant',
              role: 'Harbour Homes Ltd.',
              state: 'signed',
              at: '2026-10-12T14:02:00+02:00',
            },
          ]}
        />
      }
      versions={<VersionList versions={VERSIONS} onDownload={() => undefined} />}
      versionCount={VERSIONS.length}
      activity={[
        { key: '1', author: 'Oliver Grant', time: '12.10.2026. 14:02', text: 'Signed' },
        { key: '2', author: 'Grace Lin', time: '12.10.2026. 13:40', text: 'Signed' },
        { key: '3', author: 'Grace Lin', time: '08.10.2026. 10:22', text: 'Uploaded version 2' },
      ]}
      {...(onClose === undefined ? {} : { onClose })}
    />
  )
}

/** A browser that keeps its own selection, view, search and details, as an application would. */
type DemoProps = FileBrowserProps & {
  defaultSelection?: string[]
  defaultDetailsOpen?: boolean
  defaultSearch?: string
}

function Demo(props: DemoProps) {
  const { defaultSelection, defaultDetailsOpen, defaultSearch, ...rest } = props
  const [selection, setSelection] = useState<string[]>(defaultSelection ?? [])
  const [detailsOpen, setDetailsOpen] = useState(defaultDetailsOpen ?? false)
  const [search, setSearch] = useState(defaultSearch ?? props.search ?? '')
  const [scope, setScope] = useState(props.searchScope ?? 'folder')
  const [sort, setSort] = useState<DataTableSort>({ column: 'name', direction: 'asc' })
  const [filters, setFilters] = useState(props.filterValues ?? {})
  return (
    <FileBrowser
      {...rest}
      selection={selection}
      onSelectionChange={setSelection}
      search={search}
      onSearchChange={setSearch}
      searchScope={scope}
      onSearchScopeChange={setScope}
      sort={sort}
      onSortChange={setSort}
      filterValues={filters}
      onFilterValuesChange={setFilters}
      detailsOpen={detailsOpen}
      onDetailsOpenChange={setDetailsOpen}
      details={
        <HandoverDetails
          onClose={() => {
            setDetailsOpen(false)
          }}
        />
      }
    />
  )
}

const meta = {
  title: 'Templates/FileBrowser',
  component: Demo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**What for:** a company’s files and folders — contracts, staff files, a site’s ' +
          'documentation, a client’s uploads: the folder tree and quick places (Recent, ' +
          'Favourites, Shared with me, Trash) at the start, the path, the folder as a list or a ' +
          'grid of pictures, search in the folder or everywhere, upload of files and whole ' +
          'folders with each file’s progress, moving by drag (with “Move to…” for the keyboard), ' +
          'the details of one item at the end, the storage used. Everything is the ' +
          'application’s through props: the browser never sorts, filters, searches or adds up ' +
          'sizes, and every action is reported. Phones show the list, folders as rows and each ' +
          'item’s actions in a bottom sheet.\n\n' +
          '**When to use:** a place where people keep and find files. **When not:** the few ' +
          'files of one record (AttachmentList with FileDropzone); documents that arrive to be ' +
          'processed (the document inbox: ListPage with PageViewer); a document to sign ' +
          '(SigningPage).',
      },
    },
  },
  args: {
    label: 'Harbour Road site',
    title: 'Harbour Road site',
    path: HARBOUR_PATH,
    folders: FOLDERS,
    folder: 'harbour',
    places: PLACES,
    place: null,
    storage: <Storage />,
    entries: HARBOUR,
    filters: TYPE_FILTER,
    sortColumns: SORT_COLUMNS,
    actions: itemMenu,
    bulkActions: BULK,
    onOpen: () => undefined,
    onMove: () => undefined,
    onUpload: () => undefined,
    onNewFolder: () => undefined,
    uploadRules: { acceptText: 'Any file', maxSize: 100_000_000, maxSizeText: '100 MB' },
    layout: 'desktop',
  },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <div className="p-6">
          <Story />
        </div>
      </ExampleProvider>
    ),
  ],
  render: (args) => <Demo {...args} />,
  play: settle,
} satisfies Meta<typeof Demo>

export default meta

type Story = StoryObj<typeof meta>

/** The Harbour Road site's folder: three folders and six files, the tree, places and storage. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1, name: 'Harbour Road site' })).toBeVisible()
    const table = canvas.getByRole('table', { name: 'Harbour Road site' })
    await expect(within(table).getByText('Site handover protocol.pdf')).toBeVisible()
    await expect(within(table).getByText('1,8 MB')).toBeVisible()
    await expect(within(table).getByText('48 items')).toBeVisible()
    await expect(canvas.getByRole('treeitem', { name: 'Harbour Road site' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(canvas.getByText('38,4 GB of 50 GB')).toBeVisible()
  },
}

/** Photos as a grid of pictures. */
export const Grid: Story = {
  args: {
    title: 'Photos',
    label: 'Photos',
    folder: 'harbour-photos',
    entries: PHOTOS,
    defaultView: 'grid',
    path: [...HARBOUR_PATH, { label: 'Photos', href: '#files/site/harbour/photos' }],
  },
  play: async ({ canvasElement }) => {
    await settle()
    const grid = within(canvasElement).getByRole('list', { name: 'Photos' })
    await expect(grid.querySelectorAll('[data-file-tile]')).toHaveLength(8)
    await expect(within(canvasElement).getByRole('button', { name: 'Grid' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  },
}

/** Two items checked: the selection is neutral; the bulk bar offers its actions. */
export const Checked: Story = {
  args: { defaultSelection: ['handover', 'pour'] },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('2 selected')).toBeVisible()
    await expect(
      within(canvasElement).getByRole('button', { name: 'Download as ZIP' }),
    ).toBeVisible()
  },
}

/** The grid with two pictures checked. */
export const GridChecked: Story = {
  name: 'Grid, checked',
  args: {
    ...Grid.args,
    defaultSelection: ['photo-2', 'photo-3'],
  },
}

/** The details of the handover protocol at the end: signed, three versions, its order. */
export const Details: Story = {
  args: { defaultDetailsOpen: true, defaultFoldersHidden: true },
  play: async ({ canvasElement }) => {
    await settle()
    const details = within(canvasElement).getByRole('complementary', { name: 'Details' })
    await expect(within(details).getByText('Keep until 2036')).toBeVisible()
    await expect(within(details).getByRole('link', { name: 'Order SO-2026-118' })).toBeVisible()
    await expect(within(details).getByText('2 of 2 signed')).toBeVisible()
  },
}

/** Photos being uploaded: uploading, being checked, done, blocked. */
export const Uploading: Story = {
  args: { uploads: UPLOADS, onClearUploads: () => undefined },
  play: async ({ canvasElement }) => {
    await settle()
    const uploads = within(canvasElement).getByRole('region', { name: 'Uploads' })
    await expect(within(uploads).getByText('1 of 4 uploaded')).toBeVisible()
    await expect(within(uploads).getByText(/^Blocked/)).toBeVisible()
  },
}

/** "Upload" asked: the accepted files are said before choosing; a whole folder can be chosen. */
export const UploadDialog: Story = {
  name: 'Upload dialog',
  args: { defaultUploadOpen: true },
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog', { name: /^Upload files/ })
    await expect(within(dialog).getByText('Any file')).toBeVisible()
    await expect(within(dialog).getByRole('button', { name: 'Choose a folder' })).toBeVisible()
  },
}

/** A search everywhere: results with their folders. */
export const SearchEverywhere: Story = {
  name: 'Search everywhere',
  args: {
    title: 'Search results',
    entries: RESULTS,
    searchScope: 'everywhere',
    defaultSearch: 'handover',
    folder: null,
    path: [],
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Everywhere' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(canvas.getByText('Contracts / 2026')).toBeVisible()
  },
}

/** Nothing matches in the folder: search everywhere instead. */
export const NoResults: Story = {
  name: 'No results',
  args: { entries: [], defaultSearch: 'scaffold' },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('No files match')).toBeVisible()
  },
}

/** A new folder with nothing in it yet. */
export const EmptyFolder: Story = {
  name: 'Empty folder',
  args: {
    title: 'Daily logs',
    label: 'Daily logs',
    folder: 'harbour-logs',
    entries: [],
    path: [...HARBOUR_PATH, { label: 'Daily logs', href: '#files/site/harbour/logs' }],
  },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('This folder is empty')).toBeVisible()
  },
}

/** A staff file the user may not open: the application's reason and a way on. */
export const NoAccess: Story = {
  name: 'No access',
  args: {
    title: 'Ravi Patel',
    label: 'Ravi Patel',
    folder: 'staff-patel',
    entries: [],
    path: [
      { label: 'Documents', href: '#files' },
      { label: 'Staff files', href: '#files/staff' },
      { label: 'Ravi Patel', href: '#files/staff/patel' },
    ],
    noAccess: 'Only HR and the person themselves open staff files.',
    noAccessAction: { label: 'Ask HR for access', onClick: () => undefined },
  },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByText('You do not have access to this folder'),
    ).toBeVisible()
  },
}

/** The connection is lost: the last files loaded; Upload and New folder wait. */
export const Offline: Story = {
  args: { offline: true },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('You are offline')).toBeVisible()
    await expect(within(canvasElement).getAllByText('Not available while offline.')).toHaveLength(2)
  },
}

/** The folder loads. */
export const Loading: Story = {
  args: { entries: [], loading: true },
}

/** The folder could not be loaded. */
export const LoadError: Story = {
  name: 'Error',
  args: {
    entries: [],
    error: 'The document service did not answer.',
    onRetry: () => undefined,
  },
}

const DELETED_COLUMN: DataTableColumn<FileEntry> = {
  id: 'deleted',
  header: 'Deleted',
  numeric: true,
  cell: (entry) => {
    const deleted = TRASH.find((each) => each.id === entry.id)?.deleted
    return deleted === undefined ? null : <DeletedAt instant={deleted} />
  },
}

function DeletedAt({ instant }: { instant: string }) {
  const { format } = useLiro()
  return <span className="bidi-isolate whitespace-nowrap">{format.dateTime(instant)}</span>
}

/** Trash: where each item was, when it was deleted, Restore, and "Empty Trash". */
export const Trash: Story = {
  args: {
    title: 'Trash',
    label: 'Trash',
    folder: null,
    place: 'trash',
    path: [],
    entries: TRASH,
    columns: ['owner', 'size'],
    extraColumns: [DELETED_COLUMN],
    notice: 'Items in Trash are deleted for good after 30 days.',
    toolbarActions: <Button intent="delete" label="Empty Trash…" emphasis="secondary" />,
    actions: () => [
      { label: 'Restore', icon: FolderInput, onSelect: () => undefined },
      { label: 'Delete for good…', icon: Trash2, destructive: true, onSelect: () => undefined },
    ],
  },
  render: function Render(args) {
    // Nothing is uploaded or created in Trash.
    return <Demo {...args} onUpload={undefined as never} onNewFolder={undefined as never} />
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: /^Trash/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(canvas.getByText('Contracts / 2026')).toBeVisible()
  },
}

/** Long names, paths and owners. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    title: 'Harbour Road site, phase two: residential blocks C and D with the underground car park',
    entries: [
      {
        ...HANDOVER,
        name: 'Site handover protocol for the residential blocks C and D, signed by both parties after the second inspection round.pdf',
        owner: 'Grace Lin-Fairweather, project manager for the northern sites',
        links: [
          {
            key: 'so',
            label: 'Order SO-2026-118 for the residential blocks C and D',
            href: '#orders',
          },
        ],
      },
      ...HARBOUR.slice(4),
    ],
  },
}

const PHONE_DECORATORS: Story['decorators'] = [
  (Story) => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <Story />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
]

/** Phone width: the list, folders as rows, each item’s actions behind its button. */
export const Phone: Story = {
  args: { layout: 'phone', uploads: UPLOADS.slice(0, 2) },
  decorators: PHONE_DECORATORS,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('link', { name: 'Back to Site documentation' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Actions: Photos' })).toBeVisible()
    await expect(canvas.queryByRole('tree')).toBeNull()
  },
}

/** Arabic. */
export const Arabic: Story = {
  args: {
    title: 'موقع طريق الميناء',
    label: 'موقع طريق الميناء',
    path: [
      { label: 'المستندات', href: '#files' },
      { label: 'موقع طريق الميناء', href: '#files/harbour' },
    ],
    folders: [{ id: 'harbour', label: 'موقع طريق الميناء', children: [] }],
    places: [
      { key: 'recent', label: 'الأخيرة', icon: Clock },
      { key: 'trash', label: 'المهملات', icon: Trash2 },
    ],
    entries: [
      {
        id: 'photos',
        name: 'الصور',
        kind: 'folder',
        itemCount: 48,
        owner: 'سارة حداد',
        modified: '2026-10-14T08:52:00+02:00',
      },
      {
        id: 'handover',
        name: 'محضر التسليم.pdf',
        kind: 'file',
        owner: 'سارة حداد',
        modified: '2026-10-12T14:05:00+02:00',
        size: '1.8',
        sizeUnit: 'ميغابايت',
        badges: [{ label: 'موقّع', tone: 'success' }],
      },
    ],
  },
  decorators: [
    (Story) => (
      <StoryProvider locale="ar">
        <ExampleProvider>
          <div className="p-6">
            <Story />
          </div>
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

/** Japanese. */
export const Japanese: Story = {
  args: {
    title: 'ハーバーロード現場',
    label: 'ハーバーロード現場',
    path: [
      { label: '書類', href: '#files' },
      { label: 'ハーバーロード現場', href: '#files/harbour' },
    ],
    folders: [{ id: 'harbour', label: 'ハーバーロード現場', children: [] }],
    places: [
      { key: 'recent', label: '最近', icon: Clock },
      { key: 'trash', label: 'ごみ箱', icon: Trash2 },
    ],
    entries: [
      {
        id: 'photos',
        name: '写真',
        kind: 'folder',
        itemCount: 48,
        owner: '山田 花子',
        modified: '2026-10-14T08:52:00+02:00',
      },
      {
        id: 'handover',
        name: '引き渡し記録.pdf',
        kind: 'file',
        owner: '山田 花子',
        modified: '2026-10-12T14:05:00+02:00',
        size: '1.8',
        sizeUnit: 'MB',
        badges: [{ label: '署名済み', tone: 'success' }],
      },
    ],
  },
  decorators: [
    (Story) => (
      <StoryProvider locale="ja">
        <ExampleProvider>
          <div className="p-6">
            <Story />
          </div>
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

/** The pointer at an element's centre. */
function centre(element: Element) {
  const box = element.getBoundingClientRect()
  return { clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 }
}

/** A file dragged onto the Photos folder row is reported with the folder; Escape cancels. */
export const DragOntoFolder: Story = {
  name: 'Drag onto a folder, interaction',
  tags: ['interaction'],
  render: function Render(args) {
    const [moved, setMoved] = useState('')
    return (
      <>
        <Demo
          {...args}
          onMove={(ids, folder) => {
            setMoved(`${ids.join(', ')} → ${folder}`)
          }}
        />
        <p data-testid="moved">{moved}</p>
      </>
    )
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const table = canvas.getByRole('table', { name: 'Harbour Road site' })
    const source = within(table).getByText('Concrete pour schedule.xlsx')
    const target = within(table).getByText('Photos')
    const from = centre(source)
    const to = centre(target)
    await fireEvent.pointerDown(source, { ...from, button: 0, pointerType: 'mouse' })
    await fireEvent.pointerMove(window, { clientX: from.clientX + 10, clientY: from.clientY + 10 })
    await fireEvent.pointerMove(window, to)
    await waitFor(async () => {
      await expect(canvas.getByText('Move into Photos', { selector: 'span' })).toBeVisible()
    })
    await fireEvent.pointerUp(window, to)
    await expect(canvas.getByTestId('moved')).toHaveTextContent('pour → harbour-photos')
    // A drag released nowhere, or cancelled with Escape, moves nothing.
    await fireEvent.pointerDown(source, { ...from, button: 0, pointerType: 'mouse' })
    await fireEvent.pointerMove(window, to)
    await userEvent.keyboard('{Escape}')
    await fireEvent.pointerUp(window, to)
    await expect(canvas.getByTestId('moved')).toHaveTextContent('pour → harbour-photos')
    await expect(canvas.getByText('Move cancelled.')).toBeInTheDocument()
  },
}

/** Files chosen in the upload dialog arrive with their paths. */
export const UploadFiles: Story = {
  name: 'Upload, interaction',
  tags: ['interaction'],
  render: function Render(args) {
    const [uploaded, setUploaded] = useState<UploadedFile[]>([])
    return (
      <>
        <Demo {...args} onUpload={setUploaded} />
        <p data-testid="uploaded">{uploaded.map((each) => each.path).join(', ')}</p>
      </>
    )
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Upload' }))
    const dialog = await within(document.body).findByRole('dialog', { name: /^Upload files/ })
    const input = dialog.querySelector<HTMLInputElement>('[data-slot="file-dropzone"] input')
    if (input === null) throw new Error('The file input is missing')
    await userEvent.upload(input, [
      new File(['%PDF-1.7'], 'Daily log 14 Oct.pdf', { type: 'application/pdf' }),
    ])
    await expect(canvas.getByTestId('uploaded')).toHaveTextContent('Daily log 14 Oct.pdf')
  },
}

/** On a phone, an item's actions open in a bottom sheet titled with its name. */
export const PhoneActions: Story = {
  name: 'Phone actions, interaction',
  tags: ['interaction'],
  args: { layout: 'phone' },
  decorators: PHONE_DECORATORS,
  play: async ({ canvasElement }) => {
    await settle()
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Actions: Site handover protocol.pdf' }),
    )
    const sheet = await within(document.body).findByRole('dialog', {
      name: /^Actions Site handover protocol\.pdf/,
    })
    await expect(within(sheet).getByRole('button', { name: 'Move to…' })).toBeVisible()
    await userEvent.click(within(sheet).getByRole('button', { name: 'Download' }))
    await waitFor(async () => {
      await expect(within(document.body).queryByRole('dialog')).toBeNull()
    })
  },
}
