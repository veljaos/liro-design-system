import type { ExampleRoute } from './example-app'
import { Till, type TillStart } from './screens-I-till'
import { I_ROUTES } from './data-I'

/*
 * Group I's example screens (P5.17): the till of a bakery and a warehouse handheld — devices of
 * their own, not pages of the back office, so they stand without AppShell and are not reached
 * from the home page. Each screen plays the application around the components: it checks every
 * scan, keeps the sale or the pick list, and computes every figure in data-I.ts; the components
 * only show them and report what the cashier or the worker does. Both run in the touch density
 * (a LiroProvider with `density="touch"` inside the examples' provider, as an application wraps
 * its till).
 */

export { I_ROUTES }

// ── Touch ─────────────────────────────────────────────────────────────────────────────────────

// ── The till: Pekara Zlatni klas ──────────────────────────────────────────────────────────────
// The till with its fiscal flows lives in screens-I-till.tsx (P5.28 item 21).

// ── The handheld: picking PL-2026-0418 ───────────────────────────────────────────────────────

// ── The handheld: counting A-02-03 ───────────────────────────────────────────────────────────

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
  // P5.28 item 21: the fiscal flows.
]
