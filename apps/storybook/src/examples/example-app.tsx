import { useCallback, useState, type ReactNode } from 'react'
import { ExampleProvider, PhoneFrame } from '../../../../packages/ui/src/components/story-frames'
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
import { GROUP_E_ROUTES } from './screens-E'

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
  ...GROUP_E_ROUTES,
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
          {/* A new screen starts with fresh state, as a page of the application does. */}
          <Screen key={path} path={path} phone={phone} />
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
