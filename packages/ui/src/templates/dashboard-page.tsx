import type { ReactNode } from 'react'
import { StatCard, type StatCardProps } from '../components/stat-card'
import { usePhone } from '../components/use-phone'
import { cn } from '../primitives/cn'
import { PageHeader } from './page-header'

/*
 * DashboardPage (P4.6, the owner's decision, docs/decisions.md "Dashboard"): numbers first, then
 * charts — restrained, no decorative colour.
 * - The title (visible) and the page's actions (a period, an export) at the end.
 * - The StatCards in a row: one column on phones, two from xs (36em), four from md (62em), 16px
 *   apart; skeleton cards while loading.
 * - The charts (BarChart, LineChart, AreaChart, DonutChart) under them in two columns from md,
 *   16px apart; a chart may span both (`wide` on its wrapper, from the application's layout).
 */

export interface DashboardPageProps {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
  /** The numbers at the top. */
  stats?: readonly (StatCardProps & { key: string })[]
  /** Skeleton cards instead of the numbers. */
  loading?: boolean
  /** The charts (and other panels), laid out two to a row from 62em. */
  children?: ReactNode
  layout?: 'desktop' | 'phone'
  className?: string
}

/** A dashboard: numbers, then charts. */
export function DashboardPage(props: DashboardPageProps) {
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const stats = props.stats ?? []
  return (
    <div
      data-slot="dashboard-page"
      className={cn(
        'mx-auto box-border flex w-full max-w-content flex-col',
        phone ? 'gap-4 p-4' : 'gap-6 p-6',
        props.className,
      )}
    >
      <PageHeader
        title={props.title}
        {...(props.subtitle === undefined ? {} : { subtitle: props.subtitle })}
        {...(props.actions === undefined ? {} : { actions: props.actions })}
      />
      {stats.length > 0 && (
        <div
          className={cn(
            'grid gap-4',
            phone ? 'grid-cols-1' : 'grid-cols-1 xs:grid-cols-2 md:grid-cols-4',
          )}
        >
          {stats.map(({ key, ...stat }) => (
            <StatCard key={key} {...stat} {...(props.loading === true ? { loading: true } : {})} />
          ))}
        </div>
      )}
      {props.children !== undefined && (
        <div className={cn('grid gap-4', phone ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2')}>
          {props.children}
        </div>
      )}
    </div>
  )
}
