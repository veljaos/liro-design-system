import { LogOut, ShieldAlert, UserRound } from 'lucide-react'
import { useCallback, useContext, type ReactNode, type SetStateAction } from 'react'
import {
  Alert,
  AppShell,
  StatusBadge,
  Toaster,
  useLiro,
  type CommandItem,
  type ModuleTab,
  type LiroFormat,
  type ShellCompanies,
} from '@veljaos/ui'
import { BRAND, Navigate, ROUTES } from './example-shell'
import { useExampleState } from './example-state'
import { Tenant } from './screens-G'
import { PINNED, RECENT, SWITCHER_COMPANIES, V_ROUTES } from './data-V'
import {
  AML_CLIENTS,
  AML_KYC_TONES,
  AML_OFFICER,
  AML_PEP_TONES,
  AML_RISK_TONES,
  AML_ROUTES,
  AML_TODAY,
  amlAt,
  amlClient,
  type AmlClient,
  type AmlRisk,
  type KycState,
  type PepStatus,
} from './data-aml'
// ── P5.85–P5.88 cases ──
import { BZ_ROUTES, MONITORING_ALERTS, type MonitoringAlert } from './data-BZ'
import { AML_CASES, CA_ROUTES, type AmlCase } from './data-CA'
import { AML_REPORTS, CB_ROUTES, type AmlReport } from './data-CB'
import { CC_ROUTES } from './data-CC'

/*
 * The AML compliance module's shared pieces (P5.82–P5.88), for every AML screen:
 * - `AmlShell`: Knjigovodstvo Jelić's shell for the module — the module tabs of `AML_TABS`, the
 *   company switcher (the firm's own company; a client opens its AML file), Snežana Jelić's user
 *   menu, the toaster, the tenant's digits and today (14.10.2026). Pass `tab` for the current tab,
 *   `crumbs` after "AML compliance", and `bottomBar` for a phone's decisions.
 * - `AML_TABS`: the module's tabs in order. A later step adds its tab here (Alerts, Cases,
 *   Reports, Overview: P5.85–P5.88) with the route it registers in its own screens file.
 * - `riskBadge`, `kycBadge`, `pepBadge`: the application's states in words and tone, never
 *   colour alone.
 * - `useAmlClients`, `useAmlClient`: the clients as the application keeps them in this session,
 *   above the screens (a review, an override, a screening decision change a client and every
 *   screen shows the change).
 * - `AmlLink`: a link to another AML page (a route of `AML_ROUTES`).
 * - `ConfidentialNote`: the reminder that the client must not be told (a screening match, a
 *   suspicion, a report), in the application's words; a warning Alert with its title, never
 *   colour alone.
 * The screens play the application with data-aml.ts; nothing here scores, matches or decides.
 */

export type AmlTab = 'clients' | 'screening' | 'alerts' | 'cases' | 'reports' | 'overview'

/** The module's tabs, in order; each later AML step adds its own here. */
export const AML_TABS: readonly { key: AmlTab; label: string; path: string }[] = [
  { key: 'clients', label: 'Clients', path: AML_ROUTES.clients },
  { key: 'screening', label: 'Screening', path: AML_ROUTES.screening },
  // ── P5.85–P5.88 cases ──
  { key: 'alerts', label: 'Alerts', path: BZ_ROUTES.alerts },
  { key: 'cases', label: 'Cases', path: CA_ROUTES.cases },
  { key: 'reports', label: 'Reports', path: CB_ROUTES.reports },
  { key: 'overview', label: 'Overview', path: CC_ROUTES.overview },
]

/** The module's name, the first crumb of every AML page. */
export const AML_MODULE = 'AML compliance'

export function riskBadge(level: AmlRisk, label = `${level} risk`) {
  return <StatusBadge label={label} tone={AML_RISK_TONES[level]} />
}

export function kycBadge(state: KycState) {
  return <StatusBadge label={state} tone={AML_KYC_TONES[state]} />
}

export function pepBadge(status: PepStatus) {
  return <StatusBadge label={status} tone={AML_PEP_TONES[status]} />
}

/** "The client must not be informed", in the application's words (a warning, with its title). */
export function ConfidentialNote({ children }: { children: ReactNode }) {
  return (
    <Alert tone="warning" icon={ShieldAlert} title="Confidential">
      {children}
    </Alert>
  )
}

/** The clients as the application keeps them in this session, and a change to one of them. */
export function useAmlClients(): {
  clients: readonly AmlClient[]
  update: (id: string, change: (client: AmlClient) => AmlClient) => void
} {
  const [clients, setClients] = useExampleState<readonly AmlClient[]>(
    'aml.clients',
    () => AML_CLIENTS,
  )
  const update = useCallback(
    (id: string, change: (client: AmlClient) => AmlClient) => {
      setClients((list) => list.map((client) => (client.id === id ? change(client) : client)))
    },
    [setClients],
  )
  return { clients, update }
}

/** One client as the application keeps it in this session, and a change to it. */
export function useAmlClient(
  id: string,
): [AmlClient, (change: (client: AmlClient) => AmlClient) => void] {
  const { clients, update } = useAmlClients()
  const client = clients.find((each) => each.id === id) ?? amlClient(id)
  const change = useCallback(
    (next: (client: AmlClient) => AmlClient) => {
      update(id, next)
    },
    [update, id],
  )
  return [client, change]
}

/** A link to another AML page through the provider's linkComponent, underlined in the link colour. */
export function AmlLink({ href, children }: { href: string; children: ReactNode }) {
  const { linkComponent: Link } = useLiro()
  return (
    <Link href={`#${href}`} className="text-link underline">
      {children}
    </Link>
  )
}

/** Where the switcher takes a company: its AML file when it is an AML client, else its month. */
function companyPath(id: string): string {
  return AML_CLIENTS.some((client) => client.id === id) ? AML_ROUTES.client(id) : V_ROUTES.close(id)
}

/** Knjigovodstvo Jelić's shell for the AML module, Snežana Jelić signed in. */
export function AmlShell({
  phone,
  tab,
  crumbs,
  bottomBar,
  children,
}: {
  phone: boolean
  tab?: AmlTab
  /** The crumbs after the module's name. */
  crumbs: readonly { label: string; href?: string }[]
  /** A phone's decisions, within thumb reach. */
  bottomBar?: ReactNode
  children: ReactNode
}) {
  const navigate = useContext(Navigate)
  const moduleTabs: ModuleTab[] = AML_TABS.map((each) => ({
    key: each.key,
    label: each.label,
    href: `#${each.path}`,
    current: each.key === tab,
  }))
  const commands: CommandItem[] = AML_TABS.map((each) => ({
    id: `aml-${each.key}`,
    label: each.label,
    group: 'navigation' as const,
    onSelect: () => {
      navigate(each.path)
    },
  }))
  const companies: ShellCompanies = {
    items: SWITCHER_COMPANIES,
    current: 'jelic',
    pinned: PINNED,
    recent: RECENT,
    onSelect: (id) => {
      navigate(companyPath(id))
    },
  }
  return (
    <Tenant today={AML_TODAY}>
      <AppShell
        layout={phone ? 'phone' : 'desktop'}
        brand={BRAND}
        breadcrumbs={[{ label: AML_MODULE, href: `#${AML_ROUTES.clients}` }, ...crumbs]}
        commands={{ items: commands }}
        companies={companies}
        user={{
          name: AML_OFFICER.name,
          email: AML_OFFICER.email,
          entries: [
            { label: 'Profile', icon: UserRound, onSelect: () => undefined },
            { type: 'separator' },
            {
              label: 'Sign out',
              icon: LogOut,
              onSelect: () => {
                navigate(ROUTES.signIn)
              },
            },
          ],
        }}
        moduleTabs={moduleTabs}
        {...(bottomBar === undefined ? {} : { bottomBar })}
      >
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </AppShell>
    </Tenant>
  )
}

// ── P5.85–P5.88 cases ─────────────────────────────────────────────────────────────────────────

/** The alerts as the application keeps them in this session (closing, escalating change them). */
export function useAmlAlerts(): [
  readonly MonitoringAlert[],
  (next: SetStateAction<readonly MonitoringAlert[]>) => void,
] {
  return useExampleState<readonly MonitoringAlert[]>('aml.alerts', () => MONITORING_ALERTS)
}

/** The cases as the application keeps them in this session (an escalation adds one, a decision changes one). */
export function useAmlCases(): [
  readonly AmlCase[],
  (next: SetStateAction<readonly AmlCase[]>) => void,
] {
  return useExampleState<readonly AmlCase[]>('aml.cases', () => AML_CASES)
}

/** The reports as the application keeps them in this session. */
export function useAmlReports(): [
  readonly AmlReport[],
  (next: SetStateAction<readonly AmlReport[]>) => void,
] {
  return useExampleState<readonly AmlReport[]>('aml.reports', () => AML_REPORTS)
}

/** The signed-in user's instant for everything decided in this session (14.10.2026 09:40). */
export const AML_NOW_AT = amlAt(AML_TODAY, '09:40')

/**
 * An instant written in the tenant's offset ("2026-10-14T08:30:00+02:00"), as its day and clock
 * as written (`format.date` and `format.time`): the examples' instants are the tenant's, so the
 * picture does not depend on the device's zone.
 */
export function amlDateTime(format: Pick<LiroFormat, 'date' | 'time'>, at: string): string {
  return `${format.date(at.slice(0, 10))} ${format.time(at)}`
}
