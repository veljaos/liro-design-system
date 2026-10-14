import { FileText, FolderOpen, Inbox, LogOut, UserRound } from 'lucide-react'
import { useContext, type ReactNode } from 'react'
import { PortalShell, type ModuleTab, type PortalSection } from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate, ROUTES, Shell } from './example-shell'
import { useExampleState } from './example-state'
import {
  AI_CANDIDATES,
  AI_CLIENT_ME,
  AI_ITEMS,
  AI_LEVELS,
  AI_ME,
  AI_NOW,
  AI_ROUTES,
  AI_STORAGE,
  AI_TODAY,
  firmRules,
  portalRules,
} from './data-AI'
import type { DriveItem } from './data-AH'
import { FIRM, PORTAL_PERSON, REQUESTS, SWITCHER_COMPANIES, V_ROUTES } from './data-V'
import { DriveScreen, type DriveConfig, type DriveShell, type DriveStart } from './screens-AH'

/*
 * Group AI's example screens (P5.43, files and folders): Knjigovodstvo Jelić's client folders
 * (Snežana Jelić, the firm's tabs Clients, Deadlines and Files) and Kvadrat Gradnja d.o.o.'s
 * client portal (Milica Petrović: Requests, Documents and Files). Both are group AH's
 * `DriveScreen` over the same files, kept above the screens by one key, so what Milica uploads
 * in the portal stands in Snežana's "Sent to the accountant" at once. Links lead to the firm's
 * month-end checklist (group V) and to Kvadrat Gradnja's document inbox (group U).
 */

export { AI_ROUTES }

/** The files both sides read (the application keeps them once). */
const STATE_KEY = 'AI.items'

// ── The firm's side ───────────────────────────────────────────────────────────────────────────

const FIRM_TABS: { key: string; label: string; path: string }[] = [
  { key: 'clients', label: 'Clients', path: V_ROUTES.clients },
  { key: 'deadlines', label: 'Deadlines', path: V_ROUTES.deadlines },
  { key: 'files', label: 'Files', path: AI_ROUTES.root },
]

const FIRM_SHELL: DriveShell = ({ phone, children }) => {
  const tabs: ModuleTab[] = FIRM_TABS.map((tab) => ({
    key: tab.key,
    label: tab.label,
    href: `#${tab.path}`,
    current: tab.key === 'files',
  }))
  return (
    <Shell
      phone={phone}
      company="jelic"
      tabs={tabs}
      account={{
        name: AI_ME,
        email: 'snezana.jelic@example.com',
        companies: SWITCHER_COMPANIES,
        links: FIRM_TABS.map((tab) => ({ label: tab.label, path: tab.path })),
      }}
    >
      {children}
    </Shell>
  )
}

export const FIRM_CONFIG: DriveConfig = {
  stateKey: STATE_KEY,
  initial: () => AI_ITEMS,
  label: 'Files',
  route: (id) => (id === null ? AI_ROUTES.root : AI_ROUTES.folder(id)),
  placeRoute: AI_ROUTES.place,
  rules: firmRules,
  me: AI_ME,
  now: AI_NOW,
  today: AI_TODAY,
  storage: AI_STORAGE,
  levels: AI_LEVELS,
  candidates: AI_CANDIDATES,
  Shell: FIRM_SHELL,
}

// ── The client's portal ───────────────────────────────────────────────────────────────────────

function PortalFrame({ phone, children }: { phone: boolean; children: ReactNode }) {
  const navigate = useContext(Navigate)
  const [items] = useExampleState<DriveItem[]>(STATE_KEY, () => AI_ITEMS)
  const open = REQUESTS.filter(
    (request) => request.clientId === 'kvadrat' && request.status === 'Open',
  ).length
  const fresh = items.filter(
    (item) =>
      item.parent === 'kv-by-firm' &&
      item.deleted === undefined &&
      (item.modified ?? '') >= '2026-10-10',
  ).length
  const sections: PortalSection[] = [
    {
      key: 'requests',
      label: 'Requests',
      href: `#${V_ROUTES.portal}`,
      icon: Inbox,
      ...(open > 0 ? { note: `${String(open)} open` } : {}),
    },
    { key: 'documents', label: 'Documents', href: `#${V_ROUTES.documents}`, icon: FileText },
    {
      key: 'files',
      label: 'Files',
      href: `#${AI_ROUTES.portalRoot}`,
      icon: FolderOpen,
      current: true,
      ...(fresh > 0 ? { note: `${String(fresh)} new from ${FIRM.name}` } : {}),
    },
  ]
  return (
    <PortalShell
      layout={phone ? 'phone' : 'desktop'}
      brand={{ brandName: 'Liro', productName: 'Client portal', href: `#${V_ROUTES.portal}` }}
      participant={{ name: PORTAL_PERSON.name, detail: PORTAL_PERSON.company }}
      menu={[
        { label: 'My details', icon: UserRound, onSelect: () => undefined },
        { type: 'separator' },
        {
          label: 'Sign out',
          icon: LogOut,
          onSelect: () => {
            navigate(ROUTES.signIn)
          },
        },
      ]}
      sections={sections}
      footer={`${FIRM.name} · ${FIRM.city} · Illustrative data`}
    >
      {children}
    </PortalShell>
  )
}

const PORTAL_SHELL: DriveShell = ({ phone, children }) => (
  <PortalFrame phone={phone}>{children}</PortalFrame>
)

export const PORTAL_CONFIG: DriveConfig = {
  stateKey: STATE_KEY,
  initial: () => AI_ITEMS,
  label: `Shared with ${FIRM.name}`,
  route: (id) => (id === null ? AI_ROUTES.portalRoot : AI_ROUTES.portalFolder(id)),
  roots: ['kv-sent', 'kv-by-firm'],
  rules: portalRules,
  me: AI_CLIENT_ME,
  now: AI_NOW,
  today: AI_TODAY,
  levels: AI_LEVELS,
  candidates: [],
  Shell: PORTAL_SHELL,
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

const FIRM_FOLDERS = AI_ITEMS.filter((item) => item.kind === 'folder')
const PORTAL_FOLDERS = FIRM_FOLDERS.filter(
  (item) =>
    item.id === 'kv-sent' ||
    item.id === 'kv-by-firm' ||
    item.parent === 'kv-sent' ||
    item.parent === 'kv-by-firm',
)

function firm(path: string, start: DriveStart): ExampleRoute {
  return {
    path,
    render: (phone) => <DriveScreen phone={phone} config={FIRM_CONFIG} start={start} />,
  }
}

function portal(path: string, start: DriveStart): ExampleRoute {
  return {
    path,
    render: (phone) => <DriveScreen phone={phone} config={PORTAL_CONFIG} start={start} />,
  }
}

export const GROUP_AI_ROUTES: ExampleRoute[] = [
  firm(AI_ROUTES.root, { folder: null }),
  ...FIRM_FOLDERS.map((item) => firm(AI_ROUTES.folder(item.id), { folder: item.id })),
  ...(['recent', 'favourites', 'shared', 'trash'] as const).map((key) =>
    firm(AI_ROUTES.place(key), { folder: null, place: key }),
  ),
  firm(AI_ROUTES.clientUploadDetails, { folder: 'kv-sent-10', details: 'ai-betonmix' }),
  firm(AI_ROUTES.clientShare, { folder: 'cl-kvadrat', ask: 'share' }),
  portal(AI_ROUTES.portalRoot, { folder: null }),
  ...PORTAL_FOLDERS.map((item) => portal(AI_ROUTES.portalFolder(item.id), { folder: item.id })),
  portal(AI_ROUTES.portalUpload, { folder: 'kv-sent-10', ask: 'upload' }),
  portal(AI_ROUTES.portalUploading, { folder: 'kv-sent-10', uploading: true }),
  portal(AI_ROUTES.portalOffline, { folder: 'kv-sent-10', offline: true }),
]
