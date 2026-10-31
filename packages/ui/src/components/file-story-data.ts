import type { FileEntry } from './file-browser-logic'
import type { NameConflict } from './name-conflict-dialog'
import type { ShareAccess, ShareCandidate, ShareLevel } from './share-dialog'
import type { TreeNode } from './tree-logic'
import type { FileVersion } from './version-list'

/*
 * The files and folders stories' data: Northwind Building Ltd.'s documents — contracts,
 * staff files, the Harbour Road site's documentation — fictitious throughout. The thumbnails are
 * drawn here as grey SVG pictures (`photoUri`), the application's pictures of its photos. Not part
 * of the package. No classes here.
 */

/** A grey picture of a building site (a photo's thumbnail), different for each seed. */
export function photoUri(seed: number): string {
  const floors = 2 + (seed % 4)
  const width = 60 + ((seed * 17) % 50)
  const x = 30 + ((seed * 29) % 60)
  const rects = Array.from({ length: floors }, (_, index) => {
    const y = 110 - (index + 1) * 18
    return `<rect x="${String(x)}" y="${String(y)}" width="${String(width)}" height="16" fill-opacity="${String(0.35 + index * 0.1)}"/>`
  }).join('')
  const crane =
    seed % 2 === 0
      ? `<g stroke="currentColor" stroke-opacity="0.6" stroke-width="2"><line x1="${String(x + width + 15)}" y1="110" x2="${String(x + width + 15)}" y2="20"/><line x1="${String(x - 10)}" y1="24" x2="${String(x + width + 40)}" y2="24"/></g>`
      : ''
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150" width="200" height="150">' +
    '<rect width="200" height="150" fill="white"/>' +
    '<rect width="200" height="110" fill="currentColor" fill-opacity="0.08"/>' +
    `<g fill="currentColor">${rects}</g>` +
    crane +
    '<rect y="110" width="200" height="40" fill="currentColor" fill-opacity="0.22"/>' +
    '</svg>'
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/** The company's folders. Finance's children load on demand. */
export const FOLDERS: TreeNode[] = [
  {
    id: 'contracts',
    label: 'Contracts',
    children: [
      { id: 'contracts-2025', label: '2025', children: [] },
      { id: 'contracts-2026', label: '2026', children: [] },
    ],
  },
  {
    id: 'staff',
    label: 'Staff files',
    children: [
      { id: 'staff-clarke', label: 'Anna Clarke', children: [] },
      { id: 'staff-patel', label: 'Ravi Patel', children: [] },
    ],
  },
  {
    id: 'site',
    label: 'Site documentation',
    children: [
      {
        id: 'harbour',
        label: 'Harbour Road site',
        children: [
          { id: 'harbour-photos', label: 'Photos', children: [] },
          { id: 'harbour-drawings', label: 'Drawings', children: [] },
          { id: 'harbour-logs', label: 'Daily logs', children: [] },
        ],
      },
    ],
  },
  { id: 'finance', label: 'Finance', hasChildren: true },
]

/** The daily logs folder, shared with the site managers. */
export const LOGS: FileEntry = {
  id: 'harbour-logs',
  name: 'Daily logs',
  kind: 'folder',
  itemCount: 31,
  owner: 'Tom Hughes',
  modified: '2026-10-13T17:05:00+02:00',
  shared: true,
}

/** The signed handover protocol, linked to its order. */
export const HANDOVER: FileEntry = {
  id: 'handover',
  name: 'Site handover protocol.pdf',
  kind: 'file',
  typeLabel: 'PDF document',
  owner: 'Grace Lin',
  modified: '2026-10-12T14:05:00+02:00',
  size: '1.8',
  sizeUnit: 'MB',
  badges: [{ label: 'Signed', tone: 'success' }],
  links: [{ key: 'so', label: 'Order SO-2026-118', href: '#orders/SO-2026-118' }],
  favourite: true,
}

/** The Harbour Road site's folder: three folders, then its files. */
export const HARBOUR: FileEntry[] = [
  {
    id: 'harbour-photos',
    name: 'Photos',
    kind: 'folder',
    itemCount: 48,
    owner: 'Tom Hughes',
    modified: '2026-10-14T08:52:00+02:00',
  },
  {
    id: 'harbour-drawings',
    name: 'Drawings',
    kind: 'folder',
    itemCount: 12,
    owner: 'Grace Lin',
    modified: '2026-10-09T15:20:00+02:00',
  },
  LOGS,
  HANDOVER,
  {
    id: 'pour',
    name: 'Concrete pour schedule.xlsx',
    kind: 'file',
    typeLabel: 'Spreadsheet',
    owner: 'Tom Hughes',
    modified: '2026-10-11T09:30:00+02:00',
    size: '86',
    sizeUnit: 'KB',
    shared: true,
  },
  {
    id: 'safety',
    name: 'Safety plan.docx',
    kind: 'file',
    typeLabel: 'Word document',
    owner: 'Anna Clarke',
    modified: '2026-10-02T11:15:00+02:00',
    size: '420',
    sizeUnit: 'KB',
    badges: [{ label: 'Awaiting signatures', tone: 'warning' }],
  },
  {
    id: 'crane',
    name: 'Crane inspection.jpg',
    kind: 'file',
    typeLabel: 'JPEG image',
    owner: 'Tom Hughes',
    modified: '2026-10-10T07:48:00+02:00',
    size: '3.2',
    sizeUnit: 'MB',
    thumbnail: photoUri(2),
  },
  {
    id: 'progress',
    name: 'Progress photo 14 Oct.jpg',
    kind: 'file',
    typeLabel: 'JPEG image',
    owner: 'Tom Hughes',
    modified: '2026-10-14T08:50:00+02:00',
    size: '2.9',
    sizeUnit: 'MB',
    thumbnail: photoUri(5),
  },
  {
    id: 'archive',
    name: 'Site archive 2025.zip',
    kind: 'file',
    typeLabel: 'ZIP archive',
    owner: 'Grace Lin',
    modified: '2026-01-15T10:00:00+01:00',
    size: '214.6',
    sizeUnit: 'MB',
  },
]

/** The photos folder: pictures only. */
export const PHOTOS: FileEntry[] = Array.from({ length: 8 }, (_, index) => ({
  id: `photo-${String(index + 1)}`,
  name: `IMG_20261014_${String(812 + index * 7)}.jpg`,
  kind: 'file' as const,
  typeLabel: 'JPEG image',
  owner: 'Tom Hughes',
  modified: `2026-10-14T08:${String(10 + index * 5)}:00+02:00`,
  size: `${String(2 + (index % 3))}.${String((index * 3) % 10)}`,
  sizeUnit: 'MB',
  thumbnail: photoUri(index),
}))

/** Search results from everywhere: each with its folder. */
export const RESULTS: FileEntry[] = [
  {
    ...HANDOVER,
    location: 'Site documentation / Harbour Road site',
  },
  {
    id: 'handover-old',
    name: 'Handover protocol template.docx',
    kind: 'file',
    typeLabel: 'Word document',
    owner: 'Grace Lin',
    modified: '2026-03-02T10:00:00+01:00',
    size: '64',
    sizeUnit: 'KB',
    location: 'Contracts / 2026',
  },
]

/** The handover protocol's current version. */
export const CURRENT_VERSION: FileVersion = {
  id: 'v3',
  label: 'Version 3',
  at: '2026-10-12T14:05:00+02:00',
  by: 'Grace Lin',
  size: '1.8',
  sizeUnit: 'MB',
  note: 'Signed by both parties',
  current: true,
}

/** The handover protocol's versions, newest first. */
export const VERSIONS: FileVersion[] = [
  CURRENT_VERSION,
  {
    id: 'v2',
    label: 'Version 2',
    at: '2026-10-08T10:22:00+02:00',
    by: 'Tom Hughes',
    size: '1.7',
    sizeUnit: 'MB',
  },
  {
    id: 'v1',
    label: 'Version 1',
    at: '2026-10-01T09:00:00+02:00',
    by: 'Grace Lin',
    size: '1.5',
    sizeUnit: 'MB',
  },
]

/** View or edit: the application's levels. */
export const LEVELS: ShareLevel[] = [
  { value: 'view', label: 'View' },
  { value: 'edit', label: 'Edit' },
]

export const CANDIDATES: ShareCandidate[] = [
  { id: 'p-hughes', label: 'Tom Hughes, site manager' },
  { id: 'p-patel', label: 'Ravi Patel, quantity surveyor' },
  { id: 'r-site', label: 'Site managers (role)' },
  { id: 'portal-client', label: 'Harbour Homes Ltd. (client portal)' },
]

export const ACCESS: ShareAccess[] = [
  {
    id: 'a-lin',
    name: 'Grace Lin',
    kind: 'person',
    detail: 'grace.lin@example.com',
    level: 'edit',
    owner: true,
  },
  {
    id: 'a-site',
    name: 'Site managers',
    kind: 'role',
    detail: '3 people',
    level: 'edit',
    inherited: 'From the folder Site documentation',
    fixedReason: 'Change it on the folder.',
  },
  {
    id: 'a-hughes',
    name: 'Tom Hughes',
    kind: 'person',
    detail: 'tom.hughes@example.com',
    level: 'view',
  },
  {
    id: 'a-portal',
    name: 'Harbour Homes Ltd.',
    kind: 'portal',
    detail: 'Client portal: 2 people',
    level: 'view',
  },
]

/** A photo whose name is taken. */
export const CRANE_CONFLICT: NameConflict = {
  id: 'c-1',
  name: 'Crane inspection.jpg',
  folder: 'Harbour Road site',
  keepBothName: 'Crane inspection (1).jpg',
  existing: {
    size: '3.2',
    sizeUnit: 'MB',
    modified: '2026-10-10T07:48:00+02:00',
    owner: 'Tom Hughes',
  },
  incoming: { size: '3.4', sizeUnit: 'MB', modified: '2026-10-14T09:31:00+02:00' },
}

/** Three photos whose names are taken in the folder. */
export const CONFLICTS: NameConflict[] = [
  CRANE_CONFLICT,
  {
    id: 'c-2',
    name: 'Site handover protocol.pdf',
    folder: 'Harbour Road site',
    keepBothName: 'Site handover protocol (1).pdf',
    existing: {
      size: '1.8',
      sizeUnit: 'MB',
      modified: '2026-10-12T14:05:00+02:00',
      owner: 'Grace Lin',
    },
    incoming: { size: '1.6', sizeUnit: 'MB', modified: '2026-10-14T09:31:00+02:00' },
    replaceUnavailable: 'Signed documents cannot be replaced; upload it as a new version.',
  },
  {
    id: 'c-3',
    name: 'Safety plan.docx',
    folder: 'Harbour Road site',
    keepBothName: 'Safety plan (1).docx',
    existing: { size: '420', sizeUnit: 'KB', modified: '2026-10-02T11:15:00+02:00' },
    incoming: { size: '436', sizeUnit: 'KB', modified: '2026-10-14T09:30:00+02:00' },
  },
]
