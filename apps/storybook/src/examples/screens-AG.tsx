import { useState } from 'react'
import { Alert, KeyValueList, MoneyText, PageHeader, SectionCard } from '@veljaos/ui'
import { RegionChart, type RegionChartArea } from '../../../../packages/ui/src/map'
import type { ExampleRoute } from './example-app'
import { Shell } from './example-shell'
import { Frame, Tenant } from './screens-G'
import {
  AG_ROUTES,
  COUNTRY_BREAKS,
  GROUP_COUNTRIES,
  REGION_BREAKS,
  SALES_OFFICES,
  SERBIA_REGIONS,
  SUBSIDIARIES,
} from './data-AG'

/*
 * Group AG's example screens (P5.41, maps in charts): Kvadrat Gradnja group's reports on
 * 14.10.2026 — revenue by country in January–September 2026 (EUR; the subsidiaries' seats as
 * points; Albania's new branch has no figure yet, so it is hatched and says "No data"), and sales
 * by **illustrative** region of Serbia (RSD; the sales offices as bubbles sized by their own
 * sales). Choosing an area on the map shows its figures under the chart. Every figure, break and
 * word is the application's; RegionChart only compares the decimal strings and draws.
 */

export { AG_ROUTES }

/** The chosen area's figures, under the chart. */
function Chosen({
  area,
  currency,
  label,
}: {
  area: RegionChartArea | undefined
  currency: string
  label: string
}) {
  if (area === undefined) return null
  return (
    <SectionCard title={area.name} headingLevel={2}>
      <KeyValueList
        columns={1}
        items={[
          {
            key: 'value',
            label,
            numeric: true,
            value:
              area.value === null ? (
                'No data'
              ) : (
                <MoneyText value={area.value} currency={currency} />
              ),
          },
          { key: 'detail', label: 'Note', value: area.detail },
        ]}
      />
    </SectionCard>
  )
}

function GroupRevenue({ phone }: { phone: boolean }) {
  const [selected, setSelected] = useState<string>('rs')
  return (
    <Tenant today="2026-10-14">
      <Shell
        phone={phone}
        crumbs={[{ label: 'Reports', href: '#/reports' }, { label: 'Group revenue by country' }]}
      >
        <Frame phone={phone} wide>
          <PageHeader
            title="Group revenue by country"
            subtitle="Kvadrat Gradnja group · January to September 2026"
          />
          <RegionChart
            title="Revenue by country"
            description="EUR, without VAT, consolidated"
            valueLabel="Revenue"
            areas={GROUP_COUNTRIES}
            breaks={COUNTRY_BREAKS}
            currency="EUR"
            decimals={0}
            places={SUBSIDIARIES}
            placeLabel="Subsidiaries’ seats"
            selected={selected}
            onSelect={setSelected}
            height={phone ? 320 : 460}
            layout={phone ? 'phone' : 'desktop'}
          />
          <Chosen
            area={GROUP_COUNTRIES.find((each) => each.id === selected)}
            currency="EUR"
            label="Revenue"
          />
        </Frame>
      </Shell>
    </Tenant>
  )
}

function RegionSales({ phone }: { phone: boolean }) {
  const [selected, setSelected] = useState<string>('capital')
  return (
    <Tenant today="2026-10-14">
      <Shell
        phone={phone}
        crumbs={[{ label: 'Reports', href: '#/reports' }, { label: 'Sales by region' }]}
      >
        <Frame phone={phone} wide>
          <PageHeader
            title="Sales by region"
            subtitle="Kvadrat Gradnja d.o.o. · Serbia · January to September 2026"
          />
          <Alert tone="neutral" title="Illustrative regions">
            Five hand-drawn regions for this example; they are not Serbia’s administrative
            boundaries.
          </Alert>
          <RegionChart
            title="Sales by illustrative region"
            description="RSD, without VAT · bubbles: the sales offices’ own sales"
            valueLabel="Sales"
            areas={SERBIA_REGIONS}
            breaks={REGION_BREAKS}
            currency="RSD"
            decimals={0}
            places={SALES_OFFICES}
            placeLabel="Sales offices (bubble: their sales)"
            selected={selected}
            onSelect={setSelected}
            layout={phone ? 'phone' : 'desktop'}
          />
          <Chosen
            area={SERBIA_REGIONS.find((each) => each.id === selected)}
            currency="RSD"
            label="Sales"
          />
        </Frame>
      </Shell>
    </Tenant>
  )
}

export const GROUP_AG_ROUTES: ExampleRoute[] = [
  { path: AG_ROUTES.countries, render: (phone) => <GroupRevenue phone={phone} /> },
  { path: AG_ROUTES.regions, render: (phone) => <RegionSales phone={phone} /> },
]
