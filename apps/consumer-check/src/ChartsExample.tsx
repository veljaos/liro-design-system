import { LiroProvider } from '@veljaos/ui'
import { BarChart } from '@veljaos/ui/charts'

/**
 * One chart through the `@veljaos/ui/charts` subpath (P4.7a), typed against the packed
 * declarations; Recharts comes with it as a dependency of `@veljaos/ui`.
 */
export function ChartsExample() {
  return (
    <LiroProvider locale="en">
      <BarChart
        title="Revenue"
        description="Thousands of RSD"
        categories={[
          { key: '08', label: 'Aug' },
          { key: '09', label: 'Sep' },
        ]}
        series={[{ key: 'revenue', label: 'Revenue' }]}
        values={{ revenue: { '08': '4421.8', '09': '5684.2' } }}
      />
    </LiroProvider>
  )
}
