import { useState } from 'react'
import { Alert, NumberText, PageHeader, RadioGroupField, SectionCard, useLiro } from '@veljaos/ui'
import { AreaMap, areaAt } from '../../../../packages/ui/src/map'
import type { ExampleRoute } from './example-app'
import { Shell } from './example-shell'
import { Frame, Tenant } from './screens-G'
import { AE_ROUTES, PROPERTIES, ZONE_LEGEND, ZONES } from './data-AE'

/*
 * Group AE's example screen (P5.41, areas on a map): Kvadrat Gradnja d.o.o.'s property-tax view on
 * 14.10.2026 — the **illustrative** zones of Novi Sad (hand-drawn, never the city's real
 * boundaries) on AreaMap, and the company's three properties: choose one and the map shows it with
 * the zone it falls in (the application decides with `areaAt`). The zones' words, the legend
 * and every figure are the application's. No tiles are passed, so nothing is fetched; a real
 * application passes its tile source (`tiles`, with its attribution).
 */

export { AE_ROUTES }

function PropertyZones({ phone, property = 'liman' }: { phone: boolean; property?: string }) {
  const { format } = useLiro()
  const [chosen, setChosen] = useState(property)
  const current = PROPERTIES.find((each) => each.id === chosen) ?? PROPERTIES[0]
  const zoneOf = (each: { lat: number; lng: number }) => areaAt(each, ZONES)
  const [selected, setSelected] = useState<string | null>(
    current === undefined ? null : (zoneOf(current)?.id ?? null),
  )
  return (
    <Tenant today="2026-10-14">
      <Shell
        phone={phone}
        crumbs={[{ label: 'Finance', href: '#/finance' }, { label: 'Property tax zones' }]}
      >
        <Frame phone={phone} wide>
          <PageHeader
            title="Property tax zones"
            subtitle="Which zone each of our properties falls in · Novi Sad"
          />
          <Alert tone="neutral" title="Illustrative zones">
            Hand-drawn for this example; they are not the city’s boundaries.
          </Alert>
          <SectionCard title="Our properties" headingLevel={2}>
            <RadioGroupField
              label="Show on the map"
              value={chosen}
              onChange={(next) => {
                setChosen(next)
                const property = PROPERTIES.find((each) => each.id === next)
                setSelected(property === undefined ? null : (zoneOf(property)?.id ?? null))
              }}
              options={PROPERTIES.map((each) => ({
                value: each.id,
                label: each.name,
                description: `${each.address} · ${format.number(each.area)} m² · ${zoneOf(each)?.name ?? 'No zone'}`,
              }))}
            />
          </SectionCard>
          <AreaMap
            label="Illustrative zones of Novi Sad"
            areas={ZONES}
            legend={ZONE_LEGEND}
            selected={selected}
            onSelect={setSelected}
            layout={phone ? 'phone' : 'desktop'}
            {...(current === undefined
              ? {}
              : {
                  point: {
                    lat: current.lat,
                    lng: current.lng,
                    label: `${current.name}, ${current.address}`,
                  },
                })}
          />
          <p className="bidi-content m-0 text-xs text-secondary">
            <NumberText value={String(ZONES.length)} /> illustrative zones · the rates are set by
            the city’s decision
          </p>
        </Frame>
      </Shell>
    </Tenant>
  )
}

export const GROUP_AE_ROUTES: ExampleRoute[] = [
  { path: AE_ROUTES.zones, render: (phone) => <PropertyZones phone={phone} /> },
  {
    path: AE_ROUTES.warehouse,
    render: (phone) => <PropertyZones phone={phone} property="warehouse" />,
  },
]
