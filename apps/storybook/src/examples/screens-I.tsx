import type { ExampleRoute } from './example-app'
import { Till, type TillStart } from './screens-I-till'
import { I_ROUTES } from './data-I'

/*
 * Group I's example screen (P5.17): the till of Pekara Zlatni klas — a device of its own, not a
 * page of the back office, so it stands without AppShell and is not reached from the home page.
 * The screen (screens-I-till.tsx) plays the application around the components: it checks every
 * scan, keeps the sale and computes every figure in data-I.ts; the components only show them and
 * report what the cashier does. It runs in the touch density (a LiroProvider with
 * `density="touch"` inside the examples' provider, as an application wraps its till).
 */

export { I_ROUTES }

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

const till = (start: TillStart) => (phone: boolean) => <Till phone={phone} start={start} />

export const GROUP_I_ROUTES: ExampleRoute[] = [
  { path: I_ROUTES.pos, render: till({}) },
  { path: I_ROUTES.posCash, render: till({ step: 'cash' }) },
  { path: I_ROUTES.posCardWaiting, render: till({ step: 'card-waiting' }) },
  { path: I_ROUTES.posCardApproved, render: till({ step: 'card-approved' }) },
  { path: I_ROUTES.posReceipt, render: till({ step: 'receipt' }) },
  { path: I_ROUTES.posOffline, render: till({ offline: true }) },
  { path: I_ROUTES.posProducts, render: till({ productsOpen: true }) },
]
