/*
 * Group AI's example data (P5.43, files and folders): Knjigovodstvo Jelić's client folders on
 * 14 October 2026 at 09:40. Snežana Jelić keeps a folder per client; Kvadrat Gradnja d.o.o.'s
 * contact Milica Petrović sees two of its folders in the client portal — "Sent to the
 * accountant", where she uploads (from her phone's camera or files), and "Sent by the
 * accountant". Both sides read the same files (group AH's `DriveItem`), so what she uploads is in
 * Snežana's folder at once; the uploads answer the firm's request REQ-2026-118 (group V) and
 * reach Kvadrat Gradnja's document inbox (group U). Every name, number and amount is invented;
 * e-mails at example.com. Not part of the package. No classes here.
 */
import type { ShareAccess } from '@veljaos/ui'
import { photoUri } from '../../../../packages/ui/src/components/file-story-data'
import { ACCOUNTANTS, FIRM, PORTAL_PERSON, V_ROUTES } from './data-V'
import { U_ROUTES } from './data-U'
import type { DriveItem, FolderRules } from './data-AH'

export const AI_TODAY = '2026-10-14'
export const AI_NOW = '2026-10-14T09:40:00+02:00'

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

const FIRM_BASE = '/accountant/files'
const PORTAL_BASE = '/client-portal/files'

export const AI_ROUTES = {
  /** The firm's folders: a folder, the top, a place. */
  folder: (id: string) => `${FIRM_BASE}/${id}`,
  root: FIRM_BASE,
  place: (key: string) => `${FIRM_BASE}/place/${key}`,
  /** Kvadrat Gradnja d.o.o.'s uploads of October: the view's first screen. */
  clientUploads: `${FIRM_BASE}/kv-sent-10`,
  /** The same with the invoice's details open. */
  clientUploadDetails: `${FIRM_BASE}/kv-sent-10?details=ai-betonmix`,
  /** "Share…" asked for Kvadrat Gradnja's folder. */
  clientShare: `${FIRM_BASE}/cl-kvadrat?ask=share`,
  /** Marko Jelić's client: no access. */
  otherClient: `${FIRM_BASE}/cl-vojvodjanka`,
  /** The client portal's files: a folder and the top. */
  portalFolder: (id: string) => `${PORTAL_BASE}/${id}`,
  portalRoot: PORTAL_BASE,
  /** Milica's uploads of October, the portal's first screen. */
  portalUploads: `${PORTAL_BASE}/kv-sent-10`,
  /** "Upload" asked in the portal. */
  portalUpload: `${PORTAL_BASE}/kv-sent-10?ask=upload`,
  /** Uploads under way in the portal. */
  portalUploading: `${PORTAL_BASE}/kv-sent-10?uploading`,
  /** The accountant's folder: nothing to upload there. */
  portalFromFirm: `${PORTAL_BASE}/kv-by-firm`,
  /** The portal offline. */
  portalOffline: `${PORTAL_BASE}/kv-sent-10?offline`,
} as const

// ── People ────────────────────────────────────────────────────────────────────────────────────

export const AI_ME = ACCOUNTANTS.snezana.name
const MARKO = ACCOUNTANTS.marko.name
export const AI_CLIENT_ME = PORTAL_PERSON.name

const at = (day: number, time: string) => `2026-10-${String(day).padStart(2, '0')}T${time}:00+02:00`
const sep = (day: number, time: string) =>
  `2026-09-${String(day).padStart(2, '0')}T${time}:00+02:00`

/** Who has access to Kvadrat Gradnja's folder at the firm. */
export const CLIENT_ACCESS: ShareAccess[] = [
  {
    id: 'acc-snezana',
    name: AI_ME,
    kind: 'person',
    detail: 'Accountant, snezana.jelic@example.com',
    level: 'edit',
    owner: true,
  },
  {
    id: 'acc-marko',
    name: MARKO,
    kind: 'person',
    detail: 'Accountant, marko.jelic@example.com',
    level: 'view',
  },
  {
    id: 'acc-portal',
    name: 'Kvadrat Gradnja d.o.o.',
    kind: 'portal',
    detail: `Client portal: ${AI_CLIENT_ME}`,
    level: 'edit',
    fixedReason: 'Sees only “Sent to the accountant” and “Sent by the accountant”.',
  },
]

export const AI_LEVELS = [
  { value: 'view', label: 'View' },
  { value: 'edit', label: 'Edit' },
]

export const AI_CANDIDATES = [
  { id: 'c-marko', label: `${MARKO}, accountant` },
  { id: 'c-accountants', label: 'Accountants (role)' },
  { id: 'c-portal-kvadrat', label: 'Kvadrat Gradnja d.o.o. (client portal)' },
]

// ── Rules ─────────────────────────────────────────────────────────────────────────────────────

function pathIds(folder: string | null, items: readonly DriveItem[]): Set<string> {
  const path = new Set<string>()
  let current = folder
  while (current !== null) {
    path.add(current)
    current = items.find((item) => item.id === current)?.parent ?? null
  }
  return path
}

/** What Snežana may do in the firm's folders (the application's rules). */
export function firmRules(folder: string | null, items: readonly DriveItem[]): FolderRules {
  const path = pathIds(folder, items)
  if (path.has('cl-vojvodjanka')) {
    return {
      noAccess: `${MARKO} keeps Vojvođanka Mlin a.d.’s folders. Ask him to share them with you.`,
    }
  }
  if (path.has('kv-sent')) {
    return {
      notice: `${AI_CLIENT_ME} uploads to this folder from Kvadrat Gradnja d.o.o.’s client portal.`,
      linkUnavailable: 'Client documents are never shared by link.',
    }
  }
  if (path.has('clients')) return { linkUnavailable: 'Client documents are never shared by link.' }
  return {}
}

/** What Milica may do in the portal (the application's rules). */
export function portalRules(folder: string | null, items: readonly DriveItem[]): FolderRules {
  const path = pathIds(folder, items)
  const closed = {
    linkUnavailable: 'Documents in the portal are not shared by link.',
    addUnavailable: `Only ${FIRM.name} gives access to these folders.`,
  }
  if (folder === null) {
    return {
      ...closed,
      readOnly: true,
      uploadUnavailable: 'Open “Sent to the accountant” to upload.',
      newFolderUnavailable: 'Folders are made in “Sent to the accountant”.',
    }
  }
  if (path.has('kv-by-firm')) {
    return {
      ...closed,
      readOnly: true,
      uploadUnavailable: `Only ${FIRM.name} adds files here.`,
      newFolderUnavailable: `Only ${FIRM.name} adds files here.`,
    }
  }
  return {
    ...closed,
    notice: `${FIRM.name} sees what you upload here at once.`,
  }
}

// ── The folders ───────────────────────────────────────────────────────────────────────────────

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

const REQUEST_LINK = {
  key: 'checklist',
  label: 'Month-end checklist: Kvadrat Gradnja d.o.o.',
  href: `#${V_ROUTES.close('kvadrat')}`,
}

/** The firm's folders and the client's uploads, as the application keeps them. */
export const AI_ITEMS: DriveItem[] = [
  folder('clients', 'Clients', null, AI_ME, at(14, '09:38')),
  folder('firm', FIRM.name, null, AI_ME, sep(30, '12:00')),
  folder('cl-kvadrat', 'Kvadrat Gradnja d.o.o.', 'clients', AI_ME, at(14, '09:38'), {
    shared: true,
    access: CLIENT_ACCESS,
  }),
  folder('cl-medic', 'Medic Lab Niš d.o.o.', 'clients', AI_ME, at(12, '14:45')),
  folder('cl-rakic', 'Rakić Pekara SZR', 'clients', AI_ME, at(2, '10:00')),
  folder('cl-vojvodjanka', 'Vojvođanka Mlin a.d.', 'clients', MARKO, at(13, '10:05')),
  // Kvadrat Gradnja d.o.o.
  folder('kv-sent', 'Sent to the accountant', 'cl-kvadrat', AI_CLIENT_ME, at(14, '09:38'), {
    shared: true,
  }),
  folder('kv-by-firm', 'Sent by the accountant', 'cl-kvadrat', AI_ME, at(10, '13:20'), {
    shared: true,
  }),
  folder('kv-vat', 'VAT returns', 'cl-kvadrat', AI_ME, at(10, '13:20')),
  folder('kv-payroll', 'Payroll', 'cl-kvadrat', AI_ME, at(9, '11:00')),
  folder('kv-annual', 'Annual accounts 2025', 'cl-kvadrat', AI_ME, '2026-03-30T15:00:00+02:00'),
  folder('kv-sent-10', 'October 2026', 'kv-sent', AI_CLIENT_ME, at(14, '09:38')),
  folder('kv-sent-09', 'September 2026', 'kv-sent', AI_CLIENT_ME, sep(8, '12:40')),
  pdf(
    'ai-betonmix',
    'Beton_Mix_racun_2026-1187.pdf',
    'kv-sent-10',
    AI_CLIENT_ME,
    at(14, '08:55'),
    '312',
    'KB',
    {
      tags: ['REQ-2026-118'],
      retention: 'Keep until 2036',
      created: at(14, '08:55'),
      links: [
        REQUEST_LINK,
        {
          key: 'inbox',
          label: 'Document inbox: Beton Mix d.o.o., invoice 2026-1187',
          href: `#${U_ROUTES.reviewOf('u1')}`,
        },
      ],
      activity: [
        {
          key: '2',
          author: 'Liro',
          time: '14.10.2026. 08:56',
          text: 'Sent to Kvadrat Gradnja d.o.o.’s document inbox',
        },
        {
          key: '1',
          author: AI_CLIENT_ME,
          time: '14.10.2026. 08:55',
          text: 'Uploaded in the client portal for REQ-2026-118',
        },
      ],
    },
  ),
  pdf(
    'ai-izvod-189',
    'Izvod_189_Banca_Intesa.pdf',
    'kv-sent-10',
    AI_CLIENT_ME,
    at(14, '08:57'),
    '148',
    'KB',
    {
      tags: ['REQ-2026-118'],
      links: [
        REQUEST_LINK,
        {
          key: 'inbox',
          label: 'Document inbox: Banca Intesa, statement 189',
          href: `#${U_ROUTES.reviewOf('u3')}`,
        },
      ],
    },
  ),
  {
    id: 'ai-photo',
    name: 'IMG_2051.jpg',
    kind: 'file',
    typeLabel: 'JPEG image',
    parent: 'kv-sent-10',
    owner: AI_CLIENT_ME,
    modified: at(14, '09:38'),
    size: '2.7',
    sizeUnit: 'MB',
    thumbnail: photoUri(7),
    state: 'scanning',
    preview: 'image',
  },
  pdf('ai-izvodi', 'izvodi-160-171.pdf', 'kv-sent-09', AI_CLIENT_ME, sep(8, '12:40'), '1.2', 'MB'),
  pdf(
    'ai-bm-1012',
    'beton-mix-2026-1012.pdf',
    'kv-sent-09',
    AI_CLIENT_ME,
    sep(8, '12:41'),
    '214',
    'KB',
  ),
  pdf('ai-vat-09', 'PPPDV_septembar_2026.pdf', 'kv-by-firm', AI_ME, at(10, '13:20'), '182', 'KB', {
    badges: [{ label: 'Submitted', tone: 'success' }],
    retention: 'Keep until 2036',
  }),
  pdf(
    'ai-payroll-09',
    'Obracun_zarada_septembar_2026.pdf',
    'kv-by-firm',
    AI_ME,
    at(9, '11:00'),
    '264',
    'KB',
  ),
  pdf('ai-vat-08', 'PPPDV_avgust_2026.pdf', 'kv-vat', AI_ME, sep(12, '10:10'), '176', 'KB', {
    badges: [{ label: 'Submitted', tone: 'success' }],
    retention: 'Keep until 2036',
  }),
  pdf('ai-vat-09-firm', 'PPPDV_septembar_2026.pdf', 'kv-vat', AI_ME, at(10, '13:20'), '182', 'KB', {
    badges: [{ label: 'Submitted', tone: 'success' }],
    retention: 'Keep until 2036',
  }),
  pdf('ai-ppp-09', 'PPP-PD_septembar_2026.pdf', 'kv-payroll', AI_ME, at(9, '11:00'), '98', 'KB'),
  pdf(
    'ai-annual',
    'Finansijski_izvestaj_2025.pdf',
    'kv-annual',
    AI_ME,
    '2026-03-30T15:00:00+02:00',
    '1.4',
    'MB',
    { badges: [{ label: 'Signed', tone: 'success' }], retention: 'Keep permanently' },
  ),
  // Other clients and the firm.
  pdf('ai-medic-1', 'Izvod_112_OTP.pdf', 'cl-medic', AI_ME, at(12, '14:45'), '120', 'KB'),
  pdf(
    'ai-rakic-1',
    'Resenje_o_privremenoj_zabrani.pdf',
    'cl-rakic',
    AI_ME,
    at(2, '10:00'),
    '88',
    'KB',
  ),
  pdf('ai-vm-1', 'PPPDV_septembar_2026.pdf', 'cl-vojvodjanka', MARKO, at(13, '10:05'), '170', 'KB'),
  {
    id: 'ai-template',
    name: 'Ugovor_o_knjigovodstvenim_uslugama.docx',
    kind: 'file',
    typeLabel: 'Word document',
    parent: 'firm',
    owner: AI_ME,
    modified: sep(30, '12:00'),
    size: '64',
    sizeUnit: 'KB',
    preview: 'document',
  },
]

/** The firm's storage of its plan. */
export const AI_STORAGE = {
  used: '212.6',
  limit: '500',
  unit: 'GB',
  note: 'Included in the Pro plan: 500 GB.',
}
