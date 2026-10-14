/*
 * Group AH's example data (P5.43, files and folders): Kvadrat Gradnja d.o.o.'s company documents
 * on 14 October 2026 at 09:40, seen by Milica Petrović — contracts, employee files, the site
 * documentation of "Residential building Liman 4", sales invoices and bank statements, the
 * company's records, and Trash. The model (`DriveItem`) is shared with group AI (the accounting
 * firm's client folders): every folder, file, owner, size, version, signer, share, retention
 * label and rule is the application's, played here; the components only show them. Every name,
 * number and amount is invented; PIBs are illustrative; e-mails at example.com. Not part of the
 * package. No classes here.
 */
import { photoUri } from '../../../../packages/ui/src/components/file-story-data'
import type {
  ActivityEntry,
  FileEntry,
  FileVersion,
  ShareAccess,
  ShareLinkState,
  Signer,
} from '@veljaos/ui'
import { FEATURED } from './examples-story-data'
import { C_ROUTES } from './data-C'
import { J_ROUTES } from './data-J'
import { ROUTES } from './example-shell'

/** The examples' today and now (the application's clock, never the device's). */
export const AH_TODAY = '2026-10-14'
export const AH_NOW = '2026-10-14T09:40:00+02:00'

// ── The model (shared with group AI) ──────────────────────────────────────────────────────────

/** How a file is previewed: a PDF or office file in the viewer, a picture, or not at all. */
export type PreviewKind = 'document' | 'image' | 'none'

/** A file or folder as the application keeps it: where it is and everything about it. */
export interface DriveItem extends FileEntry {
  /** The folder it is in; null at the top. */
  parent: string | null
  /** In Trash since this instant. */
  deleted?: string
  created?: string
  retention?: string
  tags?: string[]
  versions?: FileVersion[]
  signers?: Signer[]
  activity?: ActivityEntry[]
  access?: ShareAccess[]
  link?: ShareLinkState | null
  preview?: PreviewKind
}

/** What the application allows in a folder, in its words. */
export interface FolderRules {
  noAccess?: string
  uploadUnavailable?: string
  newFolderUnavailable?: string
  linkUnavailable?: string
  addUnavailable?: string
  /** A note above the folder's content. */
  notice?: string
  /** The files here can be opened and downloaded only (no rename, move, share or Trash). */
  readOnly?: boolean
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

const BASE = '/documents'

export const AH_ROUTES = {
  /** A folder of the company's documents. */
  folder: (id: string) => `${BASE}/${id}`,
  /** The top: every top-level folder. */
  root: BASE,
  /** A quick place. */
  place: (key: string) => `${BASE}/place/${key}`,
  /** The site's folder, the view's first screen. */
  liman4: `${BASE}/liman4`,
  /** The site photos as a grid. */
  photosGrid: `${BASE}/liman4-photos?view=grid`,
  /** The site's folder with two files checked. */
  liman4Checked: `${BASE}/liman4?checked`,
  /** The delivery note of F-2026-0412 with its details open. */
  deliveryNote: `${BASE}/liman4?details=ah-delivery`,
  /** The delivery note in the preview. */
  preview: `${BASE}/liman4?preview=ah-delivery`,
  /** A drawing that cannot be previewed. */
  previewDrawing: `${BASE}/liman4-drawings?preview=ah-foundations`,
  /** Nikola Marković's employee file, the contract's details open. */
  employee: `${BASE}/emp-markovic`,
  /** The director's file: no access. */
  director: `${BASE}/emp-kovacevic`,
  /** The site's inspections: an empty folder. */
  inspections: `${BASE}/liman4-inspections`,
  /** "Upload" asked in the site photos. */
  upload: `${BASE}/liman4-photos?ask=upload`,
  /** An upload under way, with P5.5's states. */
  uploading: `${BASE}/liman4-photos?uploading`,
  /** Three photos whose names are taken. */
  conflict: `${BASE}/liman4-photos?ask=conflict`,
  /** "Move to…" asked for the site's plan of works. */
  move: `${BASE}/liman4?ask=move`,
  /** "Share…" asked for the site's folder. */
  share: `${BASE}/sites?ask=share`,
  /** The maintenance contract waiting for Milica's signature. */
  sign: `${BASE}/contracts-customers?details=ah-toplana`,
  /** A search for "liman" everywhere. */
  search: `${BASE}/liman4?search=liman`,
  /** Trash, and "Empty Trash" asked. */
  trash: `${BASE}/place/trash`,
  emptyTrash: `${BASE}/place/trash?ask=empty`,
  /** The connection is lost. */
  offline: `${BASE}/liman4?offline`,
} as const

// ── People ────────────────────────────────────────────────────────────────────────────────────

export const AH_ME = 'Milica Petrović'
const DIRECTOR = 'Nenad Kovačević'
const SITE_MANAGER = 'Dragan Ilić'
const HR = 'Jelena Marković'

const at = (day: number, time: string) => `2026-10-${String(day).padStart(2, '0')}T${time}:00+02:00`
const sep = (day: number, time: string) =>
  `2026-09-${String(day).padStart(2, '0')}T${time}:00+02:00`

/** Who has access to the site's documentation (the application's sharing). */
export const SITE_ACCESS: ShareAccess[] = [
  {
    id: 'sa-ilic',
    name: SITE_MANAGER,
    kind: 'person',
    detail: 'Site manager, dragan.ilic@example.com',
    level: 'edit',
    owner: true,
  },
  {
    id: 'sa-office',
    name: 'Office',
    kind: 'role',
    detail: 'Milica Petrović, Jelena Marković',
    level: 'edit',
    inherited: 'From the company’s documents',
    fixedReason: 'Set for every folder by the director.',
  },
  {
    id: 'sa-stanogradnja',
    name: 'Stanogradnja Plus d.o.o.',
    kind: 'portal',
    detail: 'Customer portal: 2 people',
    level: 'view',
  },
]

export const AH_LEVELS = [
  { value: 'view', label: 'View' },
  { value: 'edit', label: 'Edit' },
]

export const AH_CANDIDATES = [
  { id: 'c-kovacevic', label: 'Nenad Kovačević, director' },
  { id: 'c-markovic', label: 'Jelena Marković, HR' },
  { id: 'c-popovic', label: 'Snežana Popović, site manager' },
  { id: 'c-sitemanagers', label: 'Site managers (role)' },
  { id: 'c-toplana', label: 'Gradska toplana Novi Sad (customer portal)' },
  { id: 'c-jelic', label: 'Knjigovodstvo Jelić (accountant’s portal)' },
]

// ── Rules ─────────────────────────────────────────────────────────────────────────────────────

/** What Milica may do in each folder (the application's rules, in its words). */
export function ahRules(folder: string | null, items: readonly DriveItem[]): FolderRules {
  const path = new Set<string>()
  let current = folder
  while (current !== null) {
    path.add(current)
    current = items.find((item) => item.id === current)?.parent ?? null
  }
  if (path.has('emp-kovacevic')) {
    return { noAccess: 'Only the director and HR open the director’s employee file.' }
  }
  if (path.has('employees')) {
    return {
      linkUnavailable: 'Employee files are never shared by link.',
      addUnavailable: 'Only HR gives access to employee files.',
      notice: 'Employee files hold personal data: every opening is recorded.',
    }
  }
  if (path.has('company')) {
    return {
      uploadUnavailable: 'Only the director adds company records.',
      newFolderUnavailable: 'Only the director adds company records.',
    }
  }
  return {}
}

// ── The documents ─────────────────────────────────────────────────────────────────────────────

const folder = (
  id: string,
  name: string,
  parent: string | null,
  owner: string,
  modified: string,
  extra: Partial<DriveItem> = {},
): DriveItem => ({ id, name, kind: 'folder', parent, owner, modified, ...extra })

const pdf = (
  id: string,
  name: string,
  parent: string,
  owner: string,
  modified: string,
  size: string,
  sizeUnit: string,
  extra: Partial<DriveItem> = {},
): DriveItem => ({
  id,
  name,
  kind: 'file',
  typeLabel: 'PDF document',
  parent,
  owner,
  modified,
  size,
  sizeUnit,
  preview: 'document',
  ...extra,
})

const SIGNED = { label: 'Signed', tone: 'success' as const }
const AWAITING = { label: 'Awaiting signatures', tone: 'warning' as const }

const PHOTO_TIMES = ['07:12', '07:31', '08:05', '08:26', '08:47', '09:02']

/** Kvadrat Gradnja d.o.o.'s documents, as the application keeps them. */
export const AH_ITEMS: DriveItem[] = [
  // The top.
  folder('contracts', 'Contracts', null, DIRECTOR, at(12, '14:20')),
  folder('employees', 'Employee files', null, HR, at(13, '11:05')),
  folder('sites', 'Site documentation', null, SITE_MANAGER, at(14, '09:02'), {
    shared: true,
    access: SITE_ACCESS,
  }),
  folder('finance', 'Finance', null, AH_ME, at(13, '16:40')),
  folder('company', 'Company records', null, DIRECTOR, sep(2, '10:00')),
  // Contracts.
  folder('contracts-customers', 'Customers', 'contracts', DIRECTOR, at(12, '14:20')),
  folder('contracts-suppliers', 'Suppliers', 'contracts', AH_ME, at(9, '10:15')),
  pdf(
    'ah-stanogradnja',
    'Ugovor_Stanogradnja_Plus_Liman_4.pdf',
    'contracts-customers',
    DIRECTOR,
    sep(18, '12:00'),
    '2.6',
    'MB',
    {
      badges: [SIGNED],
      retention: 'Keep until 2036',
      tags: ['Liman 4', 'Customer contract'],
      favourite: true,
    },
  ),
  pdf(
    'ah-toplana',
    'Ugovor_Gradska_toplana_odrzavanje_2026.pdf',
    'contracts-customers',
    DIRECTOR,
    at(12, '14:20'),
    '840',
    'KB',
    {
      badges: [AWAITING],
      retention: 'Keep until 2036',
      signers: [
        {
          id: 'kovacevic',
          name: DIRECTOR,
          role: 'Director, Kvadrat Gradnja d.o.o.',
          state: 'signed',
          at: at(12, '14:18'),
        },
        {
          id: 'petrovic',
          name: AH_ME,
          role: 'Finance manager, Kvadrat Gradnja d.o.o.',
          state: 'waiting',
          current: true,
        },
        {
          id: 'petkovic',
          name: 'Zoran Petković',
          role: 'Gradska toplana Novi Sad',
          state: 'waiting',
        },
      ],
      activity: [
        { key: '2', author: DIRECTOR, time: '12.10.2026. 14:18', text: 'Signed' },
        { key: '1', author: DIRECTOR, time: '12.10.2026. 14:10', text: 'Sent for signatures' },
      ],
    },
  ),
  pdf(
    'ah-betonmix',
    'Okvirni_ugovor_Beton_Mix_2026.pdf',
    'contracts-suppliers',
    AH_ME,
    at(9, '10:15'),
    '1.1',
    'MB',
    { badges: [SIGNED], retention: 'Keep until 2036' },
  ),
  pdf(
    'ah-elektro',
    'Ugovor_Elektro_Sistem_instalacije.pdf',
    'contracts-suppliers',
    AH_ME,
    sep(29, '13:40'),
    '960',
    'KB',
    { badges: [SIGNED] },
  ),
  // Employee files.
  folder('emp-markovic', 'Nikola Marković', 'employees', HR, at(13, '11:05')),
  folder('emp-nikolic', 'Stefan Nikolić', 'employees', HR, at(12, '09:30')),
  folder('emp-kovacevic', 'Nenad Kovačević', 'employees', HR, sep(1, '08:00')),
  pdf(
    'ah-ru044',
    'Ugovor_o_radu_RU-2025-044.pdf',
    'emp-markovic',
    HR,
    '2025-03-03T09:00:00+01:00',
    '310',
    'KB',
    {
      badges: [SIGNED],
      retention: 'Keep permanently',
      tags: ['Employment'],
      created: '2025-03-03T09:00:00+01:00',
      activity: [
        { key: '1', author: HR, time: '03.03.2025. 09:00', text: 'Uploaded the signed contract' },
      ],
    },
  ),
  pdf(
    'ah-safety',
    'Uverenje_bezbednost_i_zdravlje_na_radu.pdf',
    'emp-markovic',
    HR,
    at(13, '11:05'),
    '180',
    'KB',
    {
      retention: 'Keep permanently',
      links: [
        {
          key: 'course',
          label: 'Certificate: Occupational safety course',
          href: `#${J_ROUTES.certificate}`,
        },
      ],
    },
  ),
  pdf(
    'ah-medical',
    'Lekarsko_uverenje_2026.pdf',
    'emp-markovic',
    HR,
    sep(15, '10:20'),
    '95',
    'KB',
    { retention: 'Keep until 2031' },
  ),
  {
    id: 'ah-idcopy',
    name: 'Licna_karta_kopija.jpg',
    kind: 'file',
    typeLabel: 'JPEG image',
    parent: 'emp-markovic',
    owner: HR,
    modified: '2025-03-03T09:05:00+01:00',
    size: '420',
    sizeUnit: 'KB',
    badges: [{ label: 'Personal data', tone: 'neutral' }],
    preview: 'none',
  },
  pdf(
    'ah-ru017',
    'Ugovor_o_radu_RU-2026-017.pdf',
    'emp-nikolic',
    HR,
    at(12, '09:30'),
    '214',
    'KB',
    {
      badges: [AWAITING],
      links: [{ key: 'signing', label: 'Signing: RU-2026-017', href: `#${C_ROUTES.signing}` }],
    },
  ),
  // Site documentation.
  folder('liman4', 'Residential building Liman 4', 'sites', SITE_MANAGER, at(14, '09:02'), {
    shared: true,
  }),
  folder('liman4-permits', 'Permits', 'liman4', SITE_MANAGER, sep(22, '15:00')),
  folder('liman4-drawings', 'Drawings', 'liman4', SITE_MANAGER, at(6, '12:10')),
  folder('liman4-photos', 'Site photos', 'liman4', SITE_MANAGER, at(14, '09:02')),
  folder('liman4-diary', 'Site diary', 'liman4', SITE_MANAGER, at(13, '17:30')),
  folder('liman4-inspections', 'Inspections', 'liman4', SITE_MANAGER, at(1, '08:00')),
  pdf(
    'ah-delivery',
    'Otpremnica_uz_F-2026-0412.pdf',
    'liman4',
    AH_ME,
    at(6, '11:42'),
    '236',
    'KB',
    {
      links: [
        { key: 'invoice', label: `Invoice ${FEATURED}`, href: `#${ROUTES.invoice(FEATURED)}` },
      ],
      retention: 'Keep until 2036',
      tags: ['Liman 4', 'Delivery'],
      created: at(6, '11:40'),
      versions: [
        {
          id: 'v2',
          label: 'Version 2',
          at: at(6, '11:42'),
          by: AH_ME,
          size: '236',
          sizeUnit: 'KB',
          note: 'With the site manager’s signature',
          current: true,
        },
        {
          id: 'v1',
          label: 'Version 1',
          at: at(6, '11:40'),
          by: AH_ME,
          size: '228',
          sizeUnit: 'KB',
        },
      ],
      activity: [
        { key: '3', author: SITE_MANAGER, time: '13.10.2026. 08:15', text: 'Opened' },
        { key: '2', author: AH_ME, time: '06.10.2026. 11:42', text: 'Uploaded version 2' },
        { key: '1', author: AH_ME, time: '06.10.2026. 11:40', text: 'Uploaded' },
      ],
    },
  ),
  pdf('ah-situation', 'Situacija_IS-2026-007.pdf', 'liman4', AH_ME, at(5, '16:00'), '512', 'KB', {
    links: [{ key: 'is', label: 'Interim situation IS-2026-007', href: '#/projects/IS-2026-007' }],
    badges: [SIGNED],
  }),
  {
    id: 'ah-plan',
    name: 'Plan_radova_Liman_4.xlsx',
    kind: 'file',
    typeLabel: 'Excel workbook',
    parent: 'liman4',
    owner: SITE_MANAGER,
    modified: at(13, '17:28'),
    size: '96',
    sizeUnit: 'KB',
    shared: true,
    preview: 'document',
  },
  pdf(
    'ah-handover',
    'Zapisnik_o_uvodjenju_u_posao.pdf',
    'liman4',
    SITE_MANAGER,
    '2026-03-02T08:30:00+01:00',
    '380',
    'KB',
    { badges: [SIGNED], retention: 'Keep permanently' },
  ),
  pdf(
    'ah-permit',
    'Gradjevinska_dozvola_ROP-NSD-2025-117.pdf',
    'liman4-permits',
    SITE_MANAGER,
    '2025-11-20T10:00:00+01:00',
    '4.8',
    'MB',
    { retention: 'Keep permanently', badges: [SIGNED] },
  ),
  pdf(
    'ah-location',
    'Lokacijski_uslovi.pdf',
    'liman4-permits',
    SITE_MANAGER,
    '2025-08-14T10:00:00+02:00',
    '1.9',
    'MB',
    { retention: 'Keep permanently' },
  ),
  pdf(
    'ah-architecture',
    'Arhitektonski_projekat_rev_C.pdf',
    'liman4-drawings',
    SITE_MANAGER,
    at(6, '12:10'),
    '18.4',
    'MB',
  ),
  {
    id: 'ah-foundations',
    name: 'Konstrukcija_temelji_rev_B.dwg',
    kind: 'file',
    typeLabel: 'DWG drawing',
    parent: 'liman4-drawings',
    owner: SITE_MANAGER,
    modified: sep(30, '14:45'),
    size: '8.6',
    sizeUnit: 'MB',
    preview: 'none',
  },
  ...PHOTO_TIMES.map((time, index): DriveItem => ({
    id: `ah-photo-${String(index + 1)}`,
    name: `IMG_2026-10-14_${time.replace(':', '')}.jpg`,
    kind: 'file',
    typeLabel: 'JPEG image',
    parent: 'liman4-photos',
    owner: SITE_MANAGER,
    modified: at(14, time),
    size: `${String(3 + (index % 2))}.${String((index * 7) % 10)}`,
    sizeUnit: 'MB',
    thumbnail: photoUri(index),
    preview: 'image',
  })),
  pdf(
    'ah-diary-10',
    'Gradjevinski_dnevnik_oktobar_2026.pdf',
    'liman4-diary',
    SITE_MANAGER,
    at(13, '17:30'),
    '2.2',
    'MB',
  ),
  pdf(
    'ah-diary-09',
    'Gradjevinski_dnevnik_septembar_2026.pdf',
    'liman4-diary',
    SITE_MANAGER,
    sep(30, '17:10'),
    '3.1',
    'MB',
    { badges: [SIGNED], retention: 'Keep permanently' },
  ),
  // Finance.
  folder('finance-invoices', 'Sales invoices 2026', 'finance', AH_ME, at(9, '15:30')),
  folder('finance-statements', 'Bank statements', 'finance', AH_ME, at(13, '16:40')),
  pdf('ah-f0412', `${FEATURED}.pdf`, 'finance-invoices', AH_ME, at(6, '11:30'), '188', 'KB', {
    links: [{ key: 'invoice', label: `Invoice ${FEATURED}`, href: `#${ROUTES.invoice(FEATURED)}` }],
    retention: 'Keep until 2036',
  }),
  pdf('ah-f0418', 'F-2026-0418.pdf', 'finance-invoices', AH_ME, at(9, '15:30'), '201', 'KB', {
    links: [{ key: 'invoice', label: 'Invoice F-2026-0418', href: '#/sales/invoices/F-2026-0418' }],
    retention: 'Keep until 2036',
  }),
  pdf('ah-izvod-188', 'izvod-188.pdf', 'finance-statements', AH_ME, at(12, '16:20'), '144', 'KB', {
    links: [{ key: 'statement', label: 'Bank statement 188', href: '#/banking/statements/188' }],
    retention: 'Keep until 2036',
  }),
  pdf('ah-izvod-187', 'izvod-187.pdf', 'finance-statements', AH_ME, at(9, '16:05'), '138', 'KB', {
    retention: 'Keep until 2036',
  }),
  // Company records.
  pdf(
    'ah-apr',
    'Resenje_APR_registracija.pdf',
    'company',
    DIRECTOR,
    '2019-05-14T10:00:00+02:00',
    '220',
    'KB',
    {
      retention: 'Keep permanently',
    },
  ),
  pdf(
    'ah-pib',
    'Potvrda_o_PIB-u_108452317.pdf',
    'company',
    DIRECTOR,
    '2019-05-20T10:00:00+02:00',
    '96',
    'KB',
    {
      retention: 'Keep permanently',
    },
  ),
  // Trash.
  pdf(
    'ah-trash-1',
    'Zapisnik_primopredaje_lokacije_stari.pdf',
    'liman4',
    SITE_MANAGER,
    '2026-03-01T12:00:00+01:00',
    '350',
    'KB',
    { deleted: at(13, '16:10') },
  ),
  pdf(
    'ah-trash-2',
    'Ponuda_skela_Skele_Sistem.pdf',
    'contracts-suppliers',
    AH_ME,
    sep(20, '09:00'),
    '410',
    'KB',
    { deleted: at(8, '10:30') },
  ),
]

/** The storage used of the plan's quota, from the application. */
export const AH_STORAGE = {
  used: '38.4',
  limit: '50',
  unit: 'GB',
  note: 'Included in the Business plan: 50 GB.',
}
