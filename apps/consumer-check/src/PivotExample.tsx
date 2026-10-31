import { LiroProvider } from '@veljaos/ui'
import { Pivot, placeField, type PivotField, type PivotLayout } from '@veljaos/ui/pivot'
import { useState } from 'react'

const FIELDS: PivotField[] = [
  { id: 'region', label: 'Region', kind: 'dimension' },
  { id: 'amount', label: 'Amount', kind: 'measure', aggregations: [{ id: 'sum', label: 'Sum' }] },
]

/**
 * The pivot through the `@veljaos/ui/pivot` subpath, typed against the packed
 * declarations; built on TanStack Table, a dependency of `@veljaos/ui`. The figures are given.
 */
export function PivotExample() {
  const [layout, setLayout] = useState<PivotLayout>({
    rows: ['region'],
    columns: [],
    values: [{ field: 'amount', aggregation: 'sum' }],
    filters: [],
  })
  return (
    <LiroProvider locale="en">
      <Pivot
        label="Sales by region"
        fields={FIELDS}
        value={layout}
        onChange={setLayout}
        result={{
          columns: [{ key: 'amount', label: 'Amount', kind: 'money', currency: 'EUR' }],
          rows: [{ key: 'north', label: 'North', cells: { amount: '1200.50' } }],
          total: { key: 'total', label: 'Total', cells: { amount: '1200.50' } },
        }}
        onDrillDown={() => {
          setLayout((current) => placeField(current, FIELDS[0] as PivotField, 'rows'))
        }}
      />
    </LiroProvider>
  )
}
