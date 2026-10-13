import { RefreshCw } from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  Button,
  DropdownMenu,
  IconButton,
  LiroProvider,
  notice,
  PickList,
  StockCount,
  Toaster,
  useLiro,
  type PickLine,
  type PickStep,
  type ScanFeedback,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { TILL_ROUTES } from './data-I-fiscal'
import { Journal, Till, type TillStart } from './screens-I-till'
import { WebOrder } from './screens-I-web'
import { Navigate, ROUTES } from './example-shell'
import { useExampleState } from './example-state'
import {
  COUNT,
  COUNT_RECORDS,
  countItems,
  CURRENT_COUNT,
  CURRENT_PICK,
  I_ROUTES,
  PICK_LINES,
  PICKING,
  quantityUnits,
  SKIP_REASONS,
  type CountRecord,
} from './data-I'

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

/** The application's answer to a scan: a new id each time, so the same words are news again. */
function answer(previous: ScanFeedback | null, tone: ScanFeedback['tone'], text: string) {
  return { id: typeof previous?.id === 'number' ? previous.id + 1 : 1, tone, text }
}

// ── Touch ─────────────────────────────────────────────────────────────────────────────────────

/** The examples' provider again, with `density="touch"`: every target at least 44px. */
function Touch({ children }: { children: ReactNode }) {
  const liro = useLiro()
  return (
    <LiroProvider
      locale={liro.locale}
      direction={liro.direction}
      colorScheme={liro.colorScheme}
      messages={liro.messages}
      format={liro.format}
      today={liro.today}
      weekStartsOn={liro.weekStartsOn}
      timeZone={liro.timeZone}
      linkComponent={liro.linkComponent}
      density="touch"
    >
      {children}
    </LiroProvider>
  )
}

// ── The till: Pekara Zlatni klas ──────────────────────────────────────────────────────────────
// The till with its fiscal flows lives in screens-I-till.tsx (P5.28 item 21).

// ── The handheld: picking PL-2026-0418 ───────────────────────────────────────────────────────

/** A handheld's screen at its own width; on a wide screen, a tablet on a cart (640px). */
function Handheld({ phone, children }: { phone: boolean; children: ReactNode }) {
  return (
    <Touch>
      <div
        className={
          phone ? 'h-full' : 'mx-auto h-dvh max-w-160 border-0 border-x border-solid border-default'
        }
      >
        {children}
        <Toaster layout="phone" />
      </div>
    </Touch>
  )
}

/** The menu of the list: count the location the pick came up short at, sign out. */
function HandheldMenu() {
  const navigate = useContext(Navigate)
  return (
    <DropdownMenu
      align="end"
      trigger={<IconButton intent="more" label="Pick list menu" />}
      entries={[
        {
          label: `Count location ${COUNT.location}`,
          onSelect: () => {
            navigate(I_ROUTES.count)
          },
        },
        {
          label: 'Sign out',
          onSelect: () => {
            navigate(ROUTES.signIn)
          },
        },
      ]}
    />
  )
}

/** Where the current line stands when the screen opens (one route per state). */
export type PickingStep = 'location' | 'item' | 'quantity' | 'skip'

function Picking({
  phone,
  step: initialStep = 'location',
  offline = false,
}: {
  phone: boolean
  step?: PickingStep
  offline?: boolean
}) {
  const { format } = useLiro()
  // The pick list outlives the screen (P5.28: what was picked is still there after the count).
  const [lines, setLines] = useExampleState<readonly PickLine[]>('picking.lines', () => PICK_LINES)
  const [currentId, setCurrentId] = useExampleState<string | null>(
    'picking.current',
    () => CURRENT_PICK,
  )
  const [step, setStep] = useState<PickStep>(initialStep === 'skip' ? 'item' : initialStep)
  const current = lines.find((line) => line.id === currentId) ?? null
  const [feedback, setFeedback] = useState<ScanFeedback | null>(() => {
    const line = PICK_LINES.find((each) => each.id === CURRENT_PICK)
    if (line === undefined || initialStep === 'location') return null
    return initialStep === 'quantity'
      ? { id: 'restored', tone: 'success', text: line.item }
      : { id: 'restored', tone: 'success', text: `Location ${line.location}` }
  })

  const amount = (quantity: string, unit: string | undefined) =>
    `${format.number(quantity)}${unit === undefined ? '' : ` ${unit}`}`

  /** The next open line after the one just done, else the first open one. */
  const moveOn = (next: readonly PickLine[], doneId: string) => {
    const at = next.findIndex((line) => line.id === doneId)
    const after = [...next.slice(at + 1), ...next.slice(0, at)].find(
      (line) => line.state === 'open',
    )
    setCurrentId(after?.id ?? null)
    setStep('location')
  }

  return (
    <Handheld phone={phone}>
      <PickList
        title={`Pick list ${PICKING.list}`}
        subtitle={`${PICKING.customer} · ${PICKING.warehouse}`}
        lines={lines}
        currentId={currentId}
        step={step}
        feedback={feedback}
        onScan={(code, at) => {
          if (current === null) return
          if (at === 'location') {
            if (code === current.location) {
              setFeedback((previous) => answer(previous, 'success', `Location ${code}`))
              setStep('item')
            } else {
              setFeedback((previous) =>
                answer(previous, 'error', `Wrong location: ${code}. Go to ${current.location}.`),
              )
            }
            return
          }
          if (code === current.itemCode) {
            setFeedback((previous) => answer(previous, 'success', current.item))
            setStep('quantity')
            return
          }
          const other = PICK_LINES.find((line) => line.itemCode === code)
          setFeedback((previous) =>
            answer(
              previous,
              'error',
              other === undefined
                ? `Unknown code ${code}.`
                : `This is ${other.item}, not ${current.item}. Put it back on ${other.location}.`,
            ),
          )
        }}
        onConfirm={(lineId, quantity) => {
          const line = lines.find((each) => each.id === lineId)
          if (line === undefined || quantity === null) return
          const short = quantityUnits(quantity) < quantityUnits(line.quantity)
          const next = lines.map((each) =>
            each.id === lineId
              ? {
                  ...each,
                  picked: quantity,
                  state: short ? ('short' as const) : ('picked' as const),
                  ...(short
                    ? {
                        note: `Picked ${amount(quantity, line.unit)} of ${amount(line.quantity, line.unit)}.`,
                      }
                    : {}),
                }
              : each,
          )
          setLines(next)
          setFeedback((previous) =>
            answer(previous, 'success', `${line.item}: ${amount(quantity, line.unit)} picked`),
          )
          moveOn(next, lineId)
        }}
        onSkip={(lineId, answer) => {
          const reason = SKIP_REASONS.find((each) => each.value === answer.reason)?.label ?? ''
          const details = answer.text.trim()
          const next = lines.map((each) =>
            each.id === lineId
              ? {
                  ...each,
                  state: 'skipped' as const,
                  note: `Skipped: ${reason}${details === '' ? '' : ` — ${details}`}`,
                }
              : each,
          )
          setLines(next)
          setFeedback(null)
          moveOn(next, lineId)
        }}
        skipReasons={SKIP_REASONS}
        defaultSkipOpen={initialStep === 'skip'}
        onSelectLine={(lineId) => {
          const line = lines.find((each) => each.id === lineId)
          if (line?.state !== 'open') return
          setCurrentId(lineId)
          setStep('location')
          setFeedback(null)
        }}
        onFinish={() => {
          notice.success(`${PICKING.list} is picked and handed over for loading.`)
        }}
        offline={offline}
        queued={offline ? PICKING.queued : 0}
        offlineAction={
          <Button
            family="neutral"
            icon={RefreshCw}
            label="Try now"
            onClick={() => {
              notice.info('Still offline. Your changes stay on this device.')
            }}
          />
        }
        actions={<HandheldMenu />}
      />
    </Handheld>
  )
}

// ── The handheld: counting A-02-03 ───────────────────────────────────────────────────────────

function Counting({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const [location, setLocation] = useState<string | null>(COUNT.location)
  const [records, setRecords] = useExampleState<readonly CountRecord[]>(
    'count.records',
    () => COUNT_RECORDS,
  )
  const [currentId, setCurrentId] = useState<string | null>(CURRENT_COUNT)
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null)
  return (
    <Handheld phone={phone}>
      <StockCount
        title={COUNT.title}
        subtitle={COUNT.subtitle}
        location={location}
        {...(location === COUNT.location ? { locationName: COUNT.locationName } : {})}
        items={location === null ? [] : countItems(records)}
        currentId={location === null ? null : currentId}
        feedback={feedback}
        onScan={(code, target) => {
          if (target === 'location') {
            if (code === COUNT.location) {
              setLocation(code)
              setFeedback((previous) => answer(previous, 'success', `Location ${code}`))
            } else {
              setFeedback((previous) =>
                answer(previous, 'error', `${code} is not in this count. Scan ${COUNT.location}.`),
              )
            }
            return
          }
          const record = records.find((each) => each.itemCode === code)
          if (record === undefined) {
            setFeedback((previous) =>
              answer(
                previous,
                'error',
                `Unknown code ${code}. Put the item aside and tell the shift leader.`,
              ),
            )
            return
          }
          setCurrentId(record.id)
          setFeedback((previous) => answer(previous, 'success', record.item))
        }}
        onCountChange={(itemId, counted) => {
          setRecords((current) =>
            current.map((each) => (each.id === itemId ? { ...each, counted } : each)),
          )
        }}
        onSelectItem={setCurrentId}
        onChangeLocation={() => {
          setLocation(null)
          setFeedback(null)
        }}
        onFinish={() => {
          notice.success(`Location ${COUNT.location} counted.`)
          navigate(I_ROUTES.picking)
        }}
        actions={<IconButton intent="more" label="Count menu" />}
      />
    </Handheld>
  )
}

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
  { path: TILL_ROUTES.kind, render: till({ kindDialog: 'proforma' }) },
  { path: TILL_ROUTES.proforma, render: till({ type: 'proforma' }) },
  { path: TILL_ROUTES.training, render: till({ type: 'training' }) },
  { path: TILL_ROUTES.buyer, render: till({ buyerDialog: true }) },
  { path: TILL_ROUTES.mixed, render: till({ step: 'mixed' }) },
  { path: TILL_ROUTES.instant, render: till({ step: 'instant' }) },
  { path: TILL_ROUTES.deferred, render: till({ step: 'deferred' }) },
  { path: TILL_ROUTES.corporate, render: till({ step: 'corporate' }) },
  { path: TILL_ROUTES.issued, render: till({ step: 'issued' }) },
  { path: TILL_ROUTES.issuedOffline, render: till({ step: 'issued', offline: true }) },
  { path: TILL_ROUTES.refundFind, render: till({ refund: 'find' }) },
  { path: TILL_ROUTES.refundLines, render: till({ refund: 'lines' }) },
  { path: TILL_ROUTES.refundCart, render: till({ refund: 'cart' }) },
  { path: TILL_ROUTES.refundReceipt, render: till({ refund: 'receipt' }) },
  { path: TILL_ROUTES.advances, render: till({ advances: true }) },
  { path: TILL_ROUTES.advanceTake, render: till({ advance: 'take' }) },
  { path: TILL_ROUTES.advanceRefund, render: till({ advance: 'refund' }) },
  { path: TILL_ROUTES.noCompensation, render: till({ noCompensation: true }) },
  { path: TILL_ROUTES.queueFailed, render: till({ queue: 'failed' }) },
  { path: TILL_ROUTES.journal, render: (phone) => <Journal phone={phone} /> },
  { path: TILL_ROUTES.journalCopy, render: (phone) => <Journal phone={phone} show="copy" /> },
  { path: TILL_ROUTES.journalCancel, render: (phone) => <Journal phone={phone} show="cancel" /> },
  { path: TILL_ROUTES.journalQueue, render: (phone) => <Journal phone={phone} show="queue" /> },
  { path: TILL_ROUTES.dailyReport, render: (phone) => <Journal phone={phone} show="report" /> },
  { path: TILL_ROUTES.webOrder, render: (phone) => <WebOrder phone={phone} /> },
  { path: I_ROUTES.picking, render: (phone) => <Picking phone={phone} /> },
  { path: I_ROUTES.pickingItem, render: (phone) => <Picking phone={phone} step="item" /> },
  {
    path: I_ROUTES.pickingQuantity,
    render: (phone) => <Picking phone={phone} step="quantity" />,
  },
  { path: I_ROUTES.pickingSkip, render: (phone) => <Picking phone={phone} step="skip" /> },
  { path: I_ROUTES.pickingOffline, render: (phone) => <Picking phone={phone} offline /> },
  { path: I_ROUTES.count, render: (phone) => <Counting phone={phone} /> },
]
