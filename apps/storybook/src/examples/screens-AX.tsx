import { useContext, useState, type ReactNode } from 'react'
import {
  ActionGroup,
  Button,
  DataTable,
  DateText,
  DESCRIPTION_MIN_WIDTH,
  DetailPage,
  ListPage,
  MIN_COLUMN_WIDTH,
  MoneyText,
  notice,
  NumberText,
  StatusBadge,
  type DataTableColumn,
  type ShellCompany,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate, type ExampleAccount } from './example-shell'
import { BAKERY } from './data-I'
import { SHOP_ACCOUNT } from './data-I-fiscal'
import {
  AX_ROUTES,
  CN02_CUSTOMER_PRICES,
  CN02_PRICES,
  DISCOUNT_RULES,
  PRICE_LIST_VIEWS,
  PRICE_LISTS,
  PROMOTION_VIEWS,
  PROMOTIONS,
  RULES_NOTE,
  SHOPS,
  type CustomerPrice,
  type DiscountRule,
  type GroupCustomer,
  type ListPrice,
  type PriceList,
  type PricingState,
  type Promotion,
} from './data-AX'
import { moduleTabs, TradeShell } from './screens-AU'

/*
 * Group AX's example screens (P5.54): price lists, discounts and promotions at Pekara Zlatni klas
 * on 14 October 2026, seen by Snežana Kovačević.
 * - The price lists (ListPage): the shop's retail list and the wholesale lists for shops and for
 *   cafés and restaurants — who each applies to, with or without VAT, valid from / until, items,
 *   and the state in the application's words (Active, Scheduled, Ended).
 * - One price list, CN-02 Wholesale, shops (DetailPage): its prices (item, code, unit, price,
 *   previous price, VAT, valid from), the customers' own prices on it, and the customers of the
 *   group it applies to.
 * - Promotions (ListPage): what, the rule in words, where it applies, from / to and the state.
 * - Discount rules (DataTable): applies to, condition, discount, in the application's order, on
 *   or off; how they combine in the application's words.
 * Every price, rate, date and state is data (data-AX.ts): nothing is computed or compared here.
 */

export { AX_ROUTES }

const BAKERY_COMPANY: ShellCompany = {
  id: 'zlatni-klas',
  name: BAKERY.name,
  description: BAKERY.address,
}

const ACCOUNT: ExampleAccount = {
  name: SHOP_ACCOUNT.name,
  email: SHOP_ACCOUNT.email,
  companies: [BAKERY_COMPANY],
  links: [
    { label: 'Price lists', path: AX_ROUTES.lists },
    { label: 'Promotions', path: AX_ROUTES.promotions },
  ],
}

const PRICING = [
  { key: 'lists', label: 'Price lists', path: AX_ROUTES.lists },
  { key: 'promotions', label: 'Promotions', path: AX_ROUTES.promotions },
  { key: 'rules', label: 'Discount rules', path: AX_ROUTES.rules },
]

const STATE_TONES = { Active: 'success', Scheduled: 'info', Ended: 'neutral' } as const

function stateBadge(state: PricingState) {
  return <StatusBadge label={state} tone={STATE_TONES[state]} />
}

const money = (value: string | null) => <MoneyText value={value} currency="RSD" />
const date = (value: string | null) => <DateText value={value} />

/** The pricing module's screen for Snežana at the bakery. */
function PricingShell({
  phone,
  tab,
  crumbs,
  children,
}: {
  phone: boolean
  tab: string
  crumbs: { label: string; href?: string }[]
  children: ReactNode
}) {
  return (
    <TradeShell
      phone={phone}
      tabs={moduleTabs(PRICING, tab)}
      crumbs={crumbs}
      account={ACCOUNT}
      company={BAKERY_COMPANY.id}
    >
      {children}
    </TradeShell>
  )
}

/** The rows of a view: the states it holds, from the application's list of views. */
function inView(
  views: readonly { id: string; states: readonly PricingState[] }[],
  row: { state: PricingState },
  id: string,
) {
  return views.find((each) => each.id === id)?.states.includes(row.state) === true
}

// ── The price lists ───────────────────────────────────────────────────────────────────────────

const LIST_COLUMNS: DataTableColumn<PriceList>[] = [
  {
    id: 'name',
    header: 'Price list',
    minWidth: 220,
    cell: (row) => (
      <span className="flex flex-col">
        <span className="bidi-content font-medium">{row.name}</span>
        <span dir="ltr" className="text-start text-xs text-secondary">
          {row.code}
        </span>
      </span>
    ),
  },
  {
    id: 'applies',
    header: 'Applies to',
    minWidth: 200,
    cell: (row) => <span className="bidi-content">{row.appliesTo}</span>,
  },
  { id: 'vat', header: 'Prices', cell: (row) => row.vat },
  { id: 'from', header: 'Valid from', numeric: true, cell: (row) => date(row.from) },
  { id: 'to', header: 'Valid until', numeric: true, cell: (row) => date(row.to) },
  {
    id: 'items',
    header: 'Items',
    align: 'end',
    numeric: true,
    minWidth: MIN_COLUMN_WIDTH,
    cell: (row) => <NumberText value={row.items} />,
  },
  { id: 'state', header: 'State', cell: (row) => stateBadge(row.state) },
]

export function PriceListsScreen({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const [view, setView] = useState('current')
  const rows = PRICE_LISTS.filter((row) => inView(PRICE_LIST_VIEWS, row, view))
  return (
    <PricingShell
      phone={phone}
      tab="lists"
      crumbs={[{ label: 'Pricing' }, { label: 'Price lists' }]}
    >
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Price lists"
        actions={<Button intent="create" label="New price list" />}
        views={PRICE_LIST_VIEWS.map((each) => ({
          id: each.id,
          label: each.label,
          count: PRICE_LISTS.filter((row) => inView(PRICE_LIST_VIEWS, row, each.id)).length,
        }))}
        view={view}
        onViewChange={setView}
      >
        <DataTable
          label="Price lists"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={LIST_COLUMNS}
          rows={rows}
          getRowId={(row) => row.code}
          getRowLabel={(row) => `${row.code} ${row.name}`}
          count={rows.length}
          onRowClick={(row) => {
            if (`/pricing/price-lists/${row.code}` === AX_ROUTES.list) navigate(AX_ROUTES.list)
            else notice.info(`${row.code} is not part of the examples.`)
          }}
          mobile={{
            title: (row) => row.name,
            subtitle: (row) => <span className="bidi-content">{row.appliesTo}</span>,
            badge: (row) => stateBadge(row.state),
            details: ['from', 'to', 'items'],
          }}
        />
      </ListPage>
    </PricingShell>
  )
}

// ── CN-02 ─────────────────────────────────────────────────────────────────────────────────────

const PRICE_COLUMNS: DataTableColumn<ListPrice>[] = [
  {
    id: 'item',
    header: 'Item',
    minWidth: DESCRIPTION_MIN_WIDTH,
    cell: (row) => (
      <span className="flex flex-col">
        <span className="bidi-content">{row.name}</span>
        <span dir="ltr" className="text-start text-xs text-secondary tabular-nums">
          {row.code}
        </span>
      </span>
    ),
  },
  { id: 'unit', header: 'Unit', minWidth: MIN_COLUMN_WIDTH, cell: (row) => row.unit },
  { id: 'price', header: 'Price', align: 'end', numeric: true, cell: (row) => money(row.price) },
  {
    id: 'previous',
    header: 'Previous price',
    align: 'end',
    numeric: true,
    cell: (row) => money(row.previous),
  },
  {
    id: 'vat',
    header: 'VAT',
    minWidth: MIN_COLUMN_WIDTH,
    cell: (row) => <span className="bidi-isolate whitespace-nowrap">{row.vat}</span>,
  },
  { id: 'from', header: 'Valid from', numeric: true, cell: (row) => date(row.from) },
]

const CUSTOMER_PRICE_COLUMNS: DataTableColumn<CustomerPrice>[] = [
  { id: 'customer', header: 'Customer', minWidth: 180, cell: (row) => row.customer },
  {
    id: 'item',
    header: 'Item',
    minWidth: 180,
    cell: (row) => <span className="bidi-content">{row.item}</span>,
  },
  { id: 'price', header: 'Price', align: 'end', numeric: true, cell: (row) => money(row.price) },
  { id: 'from', header: 'Valid from', numeric: true, cell: (row) => date(row.from) },
  { id: 'to', header: 'Valid until', numeric: true, cell: (row) => date(row.to) },
]

const CUSTOMER_COLUMNS: DataTableColumn<GroupCustomer>[] = [
  { id: 'name', header: 'Customer', minWidth: 200, cell: (row) => row.name },
  {
    id: 'taxId',
    header: 'PIB',
    numeric: true,
    cell: (row) => <span dir="ltr">{row.taxId}</span>,
  },
  { id: 'since', header: 'In the group since', numeric: true, cell: (row) => date(row.since) },
]

export function PriceListScreen({ phone }: { phone: boolean }) {
  const list = PRICE_LISTS.find((each) => `/pricing/price-lists/${each.code}` === AX_ROUTES.list)
  if (list === undefined) return null
  return (
    <PricingShell
      phone={phone}
      tab="lists"
      crumbs={[{ label: 'Price lists', href: `#${AX_ROUTES.lists}` }, { label: list.code }]}
    >
      <DetailPage
        layout={phone ? 'phone' : 'desktop'}
        title={`${list.code} ${list.name}`}
        back={{ href: `#${AX_ROUTES.lists}`, label: 'Price lists' }}
        status={stateBadge(list.state)}
        subtitle={`${list.appliesTo} · ${list.vat}`}
        keyFigures={[
          { label: 'Valid from', value: date(list.from) },
          { label: 'Valid until', value: date(list.to) },
          { label: 'Items', value: <NumberText value={list.items} /> },
          { label: 'Customers', value: <NumberText value={String(SHOPS.length)} /> },
        ]}
        actions={
          <ActionGroup
            actions={[
              {
                key: 'export',
                intent: 'export',
                label: 'Export',
                onClick: () => {
                  notice.success(`${list.code}.xlsx is downloaded.`)
                },
              },
              { key: 'edit', intent: 'edit', label: 'Edit prices' },
            ]}
          />
        }
        sections={[
          {
            id: 'prices',
            label: 'Prices',
            description: 'Without VAT, in RSD. A changed price shows the one before it.',
            flush: true,
            content: (
              <DataTable
                label="Prices"
                layout={phone ? 'cards' : 'table'}
                inCard
                columns={PRICE_COLUMNS}
                rows={CN02_PRICES}
                getRowId={(row) => row.id}
                getRowLabel={(row) => row.name}
                mobile={{ details: ['unit', 'price', 'previous', 'vat', 'from'] }}
              />
            ),
          },
          {
            id: 'customer-prices',
            label: 'Customers’ own prices',
            description: 'Where a customer’s price differs from this list’s.',
            flush: true,
            content: (
              <DataTable
                label="Customers’ own prices"
                layout={phone ? 'cards' : 'table'}
                inCard
                columns={CUSTOMER_PRICE_COLUMNS}
                rows={CN02_CUSTOMER_PRICES}
                getRowId={(row) => row.id}
                getRowLabel={(row) => `${row.customer}, ${row.item}`}
                mobile={{
                  title: (row) => row.customer,
                  subtitle: (row) => <span className="bidi-content">{row.item}</span>,
                  details: ['price', 'from', 'to'],
                }}
              />
            ),
          },
          {
            id: 'customers',
            label: 'Customers',
            description: 'The customer group Shops: every customer in it buys at this list.',
            flush: true,
            content: (
              <DataTable
                label="Customers"
                layout={phone ? 'cards' : 'table'}
                inCard
                columns={CUSTOMER_COLUMNS}
                rows={SHOPS}
                getRowId={(row) => row.id}
                getRowLabel={(row) => row.name}
                mobile={{ details: ['taxId', 'since'] }}
              />
            ),
          },
        ]}
      />
    </PricingShell>
  )
}

// ── Promotions ────────────────────────────────────────────────────────────────────────────────

const PROMOTION_COLUMNS: DataTableColumn<Promotion>[] = [
  {
    id: 'name',
    header: 'Promotion',
    minWidth: 200,
    cell: (row) => (
      <span className="flex flex-col">
        <span className="bidi-content font-medium">{row.name}</span>
        <span className="bidi-content text-xs text-secondary">{row.items}</span>
      </span>
    ),
  },
  {
    id: 'rule',
    header: 'Rule',
    minWidth: 200,
    cell: (row) => <span className="bidi-content">{row.rule}</span>,
  },
  {
    id: 'where',
    header: 'Applies to',
    minWidth: 180,
    cell: (row) => <span className="bidi-content">{row.where}</span>,
  },
  { id: 'from', header: 'From', numeric: true, cell: (row) => date(row.from) },
  { id: 'to', header: 'To', numeric: true, cell: (row) => date(row.to) },
  { id: 'state', header: 'State', cell: (row) => stateBadge(row.state) },
]

export function PromotionsScreen({ phone }: { phone: boolean }) {
  const [view, setView] = useState('all')
  const rows = PROMOTIONS.filter((row) => inView(PROMOTION_VIEWS, row, view))
  return (
    <PricingShell
      phone={phone}
      tab="promotions"
      crumbs={[{ label: 'Pricing' }, { label: 'Promotions' }]}
    >
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Promotions"
        actions={<Button intent="create" label="New promotion" />}
        views={PROMOTION_VIEWS.map((each) => ({
          id: each.id,
          label: each.label,
          count: PROMOTIONS.filter((row) => inView(PROMOTION_VIEWS, row, each.id)).length,
        }))}
        view={view}
        onViewChange={setView}
      >
        <DataTable
          label="Promotions"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={PROMOTION_COLUMNS}
          rows={rows}
          getRowId={(row) => row.id}
          getRowLabel={(row) => row.name}
          count={rows.length}
          mobile={{
            title: (row) => row.name,
            subtitle: (row) => <span className="bidi-content">{row.rule}</span>,
            badge: (row) => stateBadge(row.state),
            details: ['where', 'from', 'to'],
          }}
        />
      </ListPage>
    </PricingShell>
  )
}

// ── Discount rules ────────────────────────────────────────────────────────────────────────────

const RULE_COLUMNS: DataTableColumn<DiscountRule>[] = [
  {
    id: 'order',
    header: 'Order',
    align: 'end',
    numeric: true,
    minWidth: MIN_COLUMN_WIDTH,
    cell: (row) => <NumberText value={row.order} />,
  },
  { id: 'name', header: 'Rule', minWidth: 160, cell: (row) => row.name },
  {
    id: 'applies',
    header: 'Applies to',
    minWidth: 180,
    cell: (row) => <span className="bidi-content">{row.appliesTo}</span>,
  },
  {
    id: 'condition',
    header: 'When',
    minWidth: 200,
    cell: (row) => <span className="bidi-content">{row.condition}</span>,
  },
  {
    id: 'discount',
    header: 'Discount',
    minWidth: 180,
    cell: (row) => <span className="bidi-content">{row.discount}</span>,
  },
  {
    id: 'state',
    header: 'State',
    cell: (row) => (
      <StatusBadge label={row.on ? 'On' : 'Off'} tone={row.on ? 'success' : 'neutral'} />
    ),
  },
]

export function DiscountRulesScreen({ phone }: { phone: boolean }) {
  const [rules, setRules] = useState(DISCOUNT_RULES)
  return (
    <PricingShell
      phone={phone}
      tab="rules"
      crumbs={[{ label: 'Pricing' }, { label: 'Discount rules' }]}
    >
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Discount rules"
        actions={<Button intent="create" label="New rule" />}
      >
        <DataTable
          label="Discount rules"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={RULE_COLUMNS}
          rows={rules}
          getRowId={(row) => row.id}
          getRowLabel={(row) => row.name}
          rowLimitMessage={RULES_NOTE}
          rowActions={(row) => [
            {
              label: row.on ? 'Turn off' : 'Turn on',
              onSelect: () => {
                setRules((list) =>
                  list.map((each) => (each.id === row.id ? { ...each, on: !each.on } : each)),
                )
                notice.success(`${row.name} is ${row.on ? 'off' : 'on'}.`)
              },
            },
          ]}
          mobile={{
            title: (row) => row.name,
            subtitle: (row) => <span className="bidi-content">{row.appliesTo}</span>,
            badge: (row) => (
              <StatusBadge label={row.on ? 'On' : 'Off'} tone={row.on ? 'success' : 'neutral'} />
            ),
            details: ['condition', 'discount', 'order'],
          }}
        />
      </ListPage>
    </PricingShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_AX_ROUTES: ExampleRoute[] = [
  { path: AX_ROUTES.lists, render: (phone) => <PriceListsScreen phone={phone} /> },
  { path: AX_ROUTES.list, render: (phone) => <PriceListScreen phone={phone} /> },
  { path: AX_ROUTES.promotions, render: (phone) => <PromotionsScreen phone={phone} /> },
  { path: AX_ROUTES.rules, render: (phone) => <DiscountRulesScreen phone={phone} /> },
]
