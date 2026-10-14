import { ScanSearch } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  DateText,
  Drawer,
  HierarchyChart,
  KeyFigures,
  KeyValueList,
  PageHeader,
  Tabs,
  useLiro,
  type ModuleTab,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { HR_TABS, Shell } from './example-shell'
import { Frame, Tenant } from './screens-G'
import {
  AG_ROUTES,
  AG_TODAY,
  COMPANIES,
  emailOf,
  GROUP_NODES,
  HEADCOUNT,
  ORG_NODES,
  OTHER_OWNERS,
  PEOPLE,
  personOf,
  SECONDARY,
  UNIT_NODES,
} from './data-AG'

/*
 * Group AG's example screens (P5.42): Kvadrat Gradnja d.o.o.'s organisation in HR on 14 October
 * 2026 — the people by their reporting lines and the same company by its units (HierarchyChart,
 * a tab each), a person's card (a Drawer: position, unit, manager, e-mail, since when, and the
 * secondary relations, which the chart never draws) — and Kvadrat group: the holding, its
 * companies and the ownership shares on the lines, a company's card with its other owners. The
 * screens play the application with data-AG.ts; the chart only shows and reports.
 */

export { AG_ROUTES }

/** HR's module tabs with Organisation after Employees (the lead may fold it into HR_TABS). */
function organisationTabs(): ModuleTab[] {
  const [first, ...rest] = HR_TABS.map((tab) => ({ ...tab, current: false }))
  return [
    ...(first === undefined ? [] : [first]),
    { key: 'organisation', label: 'Organisation', href: `#${AG_ROUTES.chart}`, current: true },
    ...rest,
  ]
}

interface OrganisationStart {
  view: 'people' | 'units'
  card?: string
  query?: string
  unit?: string
}

/** The units of the people's chart that the route may show alone. */
const UNIT_OF_ROUTE: Record<string, string> = { liman: 'liman' }

export function Organisation({ phone, start }: { phone: boolean; start: OrganisationStart }) {
  const { format } = useLiro()
  const [view, setView] = useState(start.view)
  const [card, setCard] = useState<string | null>(start.card ?? null)
  const [unitCard, setUnitCard] = useState<string | null>(null)
  const [unit, setUnit] = useState<string | null>(
    start.unit === undefined ? null : (UNIT_OF_ROUTE[start.unit] ?? null),
  )
  const person = card === null ? undefined : personOf(card)
  const parentId = person?.parent ?? null
  const manager = parentId === null ? undefined : personOf(parentId)
  const reports =
    person === undefined ? 0 : PEOPLE.filter((each) => each.parent === person.id).length
  const relations = card === null ? [] : (SECONDARY[card] ?? [])
  const unitNode = unitCard === null ? undefined : UNIT_NODES.find((node) => node.id === unitCard)
  const vacancies = PEOPLE.filter((each) => each.vacant === true).length

  return (
    <Tenant today={AG_TODAY}>
      <Shell
        phone={phone}
        crumbs={[{ label: 'Human resources', href: '#/hr/employees' }, { label: 'Organisation' }]}
        tabs={organisationTabs()}
      >
        <Frame phone={phone} wide>
          <PageHeader title="Organisation" titleHidden />
          <KeyFigures
            layout={phone ? 'phone' : 'desktop'}
            items={[
              { key: 'people', label: 'People', value: format.number(String(HEADCOUNT)) },
              { key: 'units', label: 'Units', value: format.number(String(UNIT_NODES.length - 1)) },
              {
                key: 'vacant',
                label: 'Open positions',
                value: format.number(String(vacancies)),
                tone: 'warning',
              },
            ]}
          />
          <Tabs
            label="Organisation views"
            value={view}
            onValueChange={(value) => {
              setView(value === 'units' ? 'units' : 'people')
            }}
            items={[
              {
                value: 'people',
                label: 'People',
                content: (
                  <HierarchyChart
                    label="Organisation of Kvadrat Gradnja d.o.o."
                    nodes={ORG_NODES}
                    layout={phone ? 'phone' : 'desktop'}
                    defaultExpandedDepth={3}
                    {...(start.query === undefined ? {} : { defaultQuery: start.query })}
                    {...(start.card === undefined ? {} : { defaultChosen: start.card })}
                    unit={unit}
                    onUnitChange={setUnit}
                    onOpen={setCard}
                    searchLabel="Find a person or position"
                    vacantLabel="Vacant"
                    maxHeight="40rem"
                  />
                ),
              },
              {
                value: 'units',
                label: 'Units',
                content: (
                  <HierarchyChart
                    label="Units of Kvadrat Gradnja d.o.o."
                    nodes={UNIT_NODES}
                    layout={phone ? 'phone' : 'desktop'}
                    searchLabel="Find a unit"
                    onOpen={setUnitCard}
                    maxHeight="40rem"
                  />
                ),
              },
            ]}
          />
        </Frame>
        {/* Dialogs belong at page level, outside the Tabs (D16). */}
        <Drawer
          side="end"
          open={person !== undefined}
          onOpenChange={(open) => {
            if (!open) setCard(null)
          }}
          title={person?.name ?? ''}
          description={person?.vacant === true ? 'Open position' : (person?.position ?? '')}
          actions={
            <>
              {person !== undefined && reports > 0 && (
                <Button
                  family="neutral"
                  icon={ScanSearch}
                  label="Show only this unit"
                  onClick={() => {
                    setUnit(person.id)
                    setCard(null)
                  }}
                />
              )}
              <Button
                intent="cancel"
                label="Close"
                onClick={() => {
                  setCard(null)
                }}
              />
            </>
          }
        >
          {person !== undefined && (
            <div className="flex flex-col gap-6">
              <KeyValueList
                columns={1}
                items={[
                  {
                    label: 'Position',
                    value: person.vacant === true ? person.name : person.position,
                  },
                  { label: 'Unit', value: person.unit },
                  { label: 'Reports to', value: manager?.name ?? '—' },
                  ...(person.vacant === true
                    ? [{ label: 'State', value: person.position }]
                    : [
                        {
                          label: 'E-mail',
                          value: <span dir="ltr">{emailOf(person)}</span>,
                        },
                      ]),
                  ...(person.since === undefined
                    ? []
                    : [
                        {
                          label: 'With the company since',
                          value: <DateText value={person.since} />,
                          numeric: true,
                        },
                      ]),
                  ...(reports > 0
                    ? [
                        {
                          label: 'Direct reports',
                          value: format.number(String(reports)),
                          numeric: true,
                        },
                      ]
                    : []),
                ]}
              />
              {relations.length > 0 && (
                <section aria-label="Secondary relations" className="flex flex-col gap-2">
                  <h3 className="bidi-content m-0 text-h4 text-primary">Secondary relations</h3>
                  <ul className="m-0 flex list-none flex-col gap-3 p-0">
                    {relations.map((relation) => (
                      <li key={relation.with} className="flex flex-col gap-0.5">
                        <span className="bidi-content text-sm text-primary">
                          <span className="text-secondary">{relation.label}: </span>
                          <span className="font-medium">{relation.with}</span>
                        </span>
                        <span className="bidi-content text-xs text-secondary">{relation.note}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </Drawer>
        <Drawer
          side="end"
          open={unitNode !== undefined}
          onOpenChange={(open) => {
            if (!open) setUnitCard(null)
          }}
          title={unitNode?.title ?? ''}
          description={unitNode?.subtitle ?? ''}
          actions={
            <Button
              intent="cancel"
              label="Close"
              onClick={() => {
                setUnitCard(null)
              }}
            />
          }
        >
          {unitNode !== undefined && (
            <KeyValueList
              columns={1}
              items={[
                { label: 'Head', value: (unitNode.subtitle ?? '').replace(/^Head: /, '') },
                { label: 'People', value: unitNode.count ?? '—' },
                { label: 'Open positions', value: unitNode.badge?.label ?? 'None' },
              ]}
            />
          )}
        </Drawer>
      </Shell>
    </Tenant>
  )
}

export function CompanyGroup({ phone, start }: { phone: boolean; start: { card?: string } }) {
  const [card, setCard] = useState<string | null>(start.card ?? null)
  const company = COMPANIES.find((each) => each.id === card)
  const parent = COMPANIES.find((each) => each.id === company?.parent)
  return (
    <Tenant today={AG_TODAY}>
      <Shell
        phone={phone}
        crumbs={[{ label: 'Company', href: '#/company' }, { label: 'Kvadrat group' }]}
      >
        <Frame phone={phone} wide>
          <PageHeader
            title="Kvadrat group"
            subtitle="Kvadrat Holding d.o.o. and the companies it owns, with the shares on the lines"
          />
          <HierarchyChart
            label="Kvadrat group"
            nodes={GROUP_NODES}
            layout={phone ? 'phone' : 'desktop'}
            searchLabel="Find a company"
            {...(start.card === undefined ? {} : { defaultChosen: start.card })}
            onOpen={setCard}
            maxHeight="40rem"
          />
        </Frame>
        <Drawer
          side="end"
          open={company !== undefined}
          onOpenChange={(open) => {
            if (!open) setCard(null)
          }}
          title={company?.name ?? ''}
          description={company?.activity ?? ''}
          actions={
            <Button
              intent="cancel"
              label="Close"
              onClick={() => {
                setCard(null)
              }}
            />
          }
        >
          {company !== undefined && (
            <KeyValueList
              columns={1}
              items={[
                { label: 'PIB', value: <span dir="ltr">{company.taxId}</span>, numeric: true },
                ...(parent === undefined || company.share === undefined
                  ? []
                  : [{ label: 'Owned by', value: `${parent.name}, ${company.share}` }]),
                ...(OTHER_OWNERS[company.id] === undefined
                  ? []
                  : [{ label: 'Other owners', value: OTHER_OWNERS[company.id] }]),
                ...(company.associate === true
                  ? [{ label: 'Kind', value: 'Associate: not consolidated' }]
                  : []),
                { label: 'Director', value: company.director },
                { label: 'Employees', value: company.employees },
              ]}
            />
          )}
        </Drawer>
      </Shell>
    </Tenant>
  )
}

export const GROUP_AG_ROUTES: ExampleRoute[] = [
  {
    path: AG_ROUTES.chart,
    render: (phone) => <Organisation phone={phone} start={{ view: 'people' }} />,
  },
  {
    path: AG_ROUTES.units,
    render: (phone) => <Organisation phone={phone} start={{ view: 'units' }} />,
  },
  {
    path: AG_ROUTES.card,
    render: (phone) => <Organisation phone={phone} start={{ view: 'people', card: 'fin' }} />,
  },
  {
    path: AG_ROUTES.search,
    render: (phone) => <Organisation phone={phone} start={{ view: 'people', query: 'Marković' }} />,
  },
  {
    path: AG_ROUTES.unit,
    render: (phone) => <Organisation phone={phone} start={{ view: 'people', unit: 'liman' }} />,
  },
  { path: AG_ROUTES.group, render: (phone) => <CompanyGroup phone={phone} start={{}} /> },
  {
    path: AG_ROUTES.groupCard,
    render: (phone) => <CompanyGroup phone={phone} start={{ card: 'beton' }} />,
  },
]
