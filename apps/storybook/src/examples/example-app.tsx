import { useCallback, useState, type ReactNode } from 'react'
import { ExampleProvider, PhoneFrame } from '../../../../packages/ui/src/components/story-frames'
import './dataset-checks'
import { ExampleStateProvider } from './example-state'
import { FEATURED, INVOICES } from './examples-story-data'
import {
  Navigate,
  NotFound,
  NOTIFICATIONS,
  Notifications,
  RouterLink,
  ROUTES,
} from './example-shell'
import {
  Approvals,
  Dashboard,
  Employee,
  Home,
  Invoice,
  InvoiceList,
  NotificationsScreen,
  SignIn,
} from './screens-core'
import { GROUP_F_ROUTES } from './screens-F'
import { BANK_STATEMENT_ROUTES } from './screens-bank'
import { GROUP_A_ROUTES } from './screens-A'
import { GROUP_C_ROUTES } from './screens-C'
import { GROUP_E_ROUTES } from './screens-E'
import { GROUP_D2_ROUTES } from './screens-D2'
import { GROUP_D1_ROUTES } from './screens-D1'
import { GROUP_J_ROUTES } from './screens-J'
import { GROUP_G_ROUTES } from './screens-G'
import { GROUP_H_ROUTES } from './screens-H'
import { GROUP_I_ROUTES } from './screens-I'
import { GROUP_L_ROUTES } from './screens-L'
import { GROUP_K_ROUTES } from './screens-K'
import { GROUP_M_ROUTES } from './screens-M'
import { GROUP_P_ROUTES } from './screens-P'
import { GROUP_O_ROUTES } from './screens-O'
import { GROUP_N_ROUTES } from './screens-N'

// ── Routes ────────────────────────────────────────────────────────────────────────────────

/** One screen of the examples: its path ("/sales/invoices") and how it renders. */
export interface ExampleRoute {
  path: string
  render: (phone: boolean) => ReactNode
}

/**
 * The screens added after P4.8, by the module that adds them (Phase 5). Each group registers its
 * screens with one import above and one line here.
 */
const EXAMPLE_ROUTES: readonly ExampleRoute[] = [
  // ── P5 routes ──
  ...GROUP_F_ROUTES,
  ...BANK_STATEMENT_ROUTES,
  ...GROUP_A_ROUTES,
  ...GROUP_C_ROUTES,
  ...GROUP_E_ROUTES,
  ...GROUP_D2_ROUTES,
  ...GROUP_D1_ROUTES,
  ...GROUP_J_ROUTES,
  ...GROUP_G_ROUTES,
  ...GROUP_H_ROUTES,
  ...GROUP_I_ROUTES,
  ...GROUP_L_ROUTES,
  ...GROUP_K_ROUTES,
  ...GROUP_M_ROUTES,
  ...GROUP_P_ROUTES,
  ...GROUP_O_ROUTES,
  ...GROUP_N_ROUTES,
]

// ── The app ───────────────────────────────────────────────────────────────────────────────────

export function Screen({ path, phone }: { path: string; phone: boolean }) {
  if (path === ROUTES.signIn) return <SignIn phone={phone} />
  if (path === ROUTES.home) return <Home phone={phone} />
  if (path === ROUTES.invoices) return <InvoiceList phone={phone} />
  if (path === ROUTES.dashboard) return <Dashboard phone={phone} />
  if (path === ROUTES.approvals) return <Approvals phone={phone} />
  if (path === ROUTES.employee) return <Employee phone={phone} />
  if (path === ROUTES.notifications) return <NotificationsScreen phone={phone} />
  const route = EXAMPLE_ROUTES.find((each) => each.path === path)
  if (route !== undefined) return route.render(phone)
  if (path === ROUTES.invoice(FEATURED)) {
    const invoice = INVOICES.find((each) => each.number === FEATURED)
    if (invoice !== undefined) return <Invoice phone={phone} invoice={invoice} />
  }
  return <NotFound />
}

/** The examples as one application: a route, the provider with the router's link, a screen. */
export function ExampleApp({ start, phone = false }: { start: string; phone?: boolean }) {
  const [path, setPath] = useState(start)
  const navigate = useCallback((next: string) => {
    setPath(next)
    window.scrollTo(0, 0)
    // On a phone the page scrolls inside the phone frame (P5.28): a new screen starts at its top.
    document.querySelectorAll('[data-liro-phone-page]').forEach((page) => {
      page.scrollTo(0, 0)
    })
  }, [])
  // The notifications' read state lives above the screens, as the Core keeps it.
  const [items, setItems] = useState(NOTIFICATIONS)
  const setRead = useCallback((id: string, read: boolean) => {
    setItems((list) =>
      list.map((item) => (id === 'all' || item.id === id ? { ...item, read } : item)),
    )
  }, [])
  return (
    <Navigate.Provider value={navigate}>
      <Notifications.Provider value={{ items, setRead }}>
        <ExampleProvider linkComponent={RouterLink}>
          {/* What must outlive a screen (an open tab, the till's journal) is kept above it. */}
          <ExampleStateProvider>
            {/* A new screen starts with fresh state, as a page of the application does. */}
            <Screen key={path} path={path} phone={phone} />
          </ExampleStateProvider>
        </ExampleProvider>
      </Notifications.Provider>
    </Navigate.Provider>
  )
}

export function OnPhone({ start }: { start: string }) {
  return (
    <PhoneFrame>
      <ExampleApp start={start} phone />
    </PhoneFrame>
  )
}
