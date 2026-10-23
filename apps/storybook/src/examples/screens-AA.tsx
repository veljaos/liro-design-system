import { useState } from 'react'
import { KeyFigures, MoneyText, PageHeader, Toaster, notice, useLiro } from '@veljaos/ui'
import { Gantt, type GanttChange, type GanttScale } from '../../../../packages/ui/src/gantt'
import type { ExampleRoute } from './example-app'
import { Shell } from './example-shell'
import { Frame, Tenant } from './screens-G'
import {
  AA_NOW,
  AA_ROUTES,
  AA_TODAY,
  applyPlanChange,
  LIMAN_DEPENDENCIES,
  LIMAN_TASKS,
  PROJECT,
} from './data-AA'

/*
 * Group AA's example screen (P5.37, the project timeline): Kvadrat Gradnja d.o.o.'s
 * "Residential building Liman 4" on 14.10.2026 at 09:40, in the company's shell (Projects). Above
 * the plan its figures (the application's totals); the plan itself is Gantt from
 * `@veljaos/ui/gantt`: nine phases with their tasks, milestones and dependencies, each phase's
 * budget and what was spent beside the timeline, today's marker, Floors 3–4 at risk. The screen
 * plays the application: it applies every reported change, lets each phase span its tasks again
 * (data-AA.ts) and confirms it with a notice. Phones show the plan as a list by phase and the
 * timeline read-only.
 */

export { AA_ROUTES }

function ProjectTimeline({
  phone,
  scale,
  move = false,
}: {
  phone: boolean
  scale?: GanttScale
  move?: boolean
}) {
  const { format } = useLiro()
  const [model, setModel] = useState({ tasks: LIMAN_TASKS, dependencies: LIMAN_DEPENDENCIES })
  const label = (id: string) => model.tasks.find((each) => each.id === id)?.label ?? id
  const report = (change: GanttChange) => {
    const before = model
    setModel(applyPlanChange(model, change))
    // A move is reversible: a toast that closes by itself, with Undo, never a confirmation (P5.90).
    if (change.type === 'dates') {
      notice.success(
        `${label(change.id)} now runs ${format.date(change.start)} – ${format.date(change.end)}`,
        {
          action: {
            label: 'Undo',
            onClick: () => {
              setModel(before)
            },
          },
        },
      )
    }
  }
  return (
    <Tenant today={AA_TODAY}>
      <Shell
        phone={phone}
        crumbs={[{ label: 'Projects', href: '#/projects' }, { label: PROJECT.name }]}
      >
        <Frame phone={phone} wide>
          <PageHeader
            title={PROJECT.name}
            subtitle={`${PROJECT.place} · site manager ${PROJECT.manager}`}
          />
          <KeyFigures
            layout={phone ? 'phone' : 'desktop'}
            items={[
              {
                key: 'planned',
                label: 'Budget',
                value: <MoneyText value={PROJECT.planned} currency="RSD" />,
              },
              {
                key: 'spent',
                label: 'Spent to date',
                value: <MoneyText value={PROJECT.spent} currency="RSD" />,
              },
              { key: 'done', label: 'Done', value: format.percent(PROJECT.done) },
              { key: 'handover', label: 'Handover', value: format.date(PROJECT.handover) },
            ]}
          />
          <Gantt
            label={PROJECT.name}
            tasks={model.tasks}
            dependencies={model.dependencies}
            mode="edit"
            now={AA_NOW}
            onChange={report}
            screen={phone ? 'phone' : 'desktop'}
            {...(scale === undefined ? {} : { defaultScale: scale })}
            {...(move ? { defaultDialog: { type: 'move' as const, id: 'floors-3-4' } } : {})}
          />
        </Frame>
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

export const GROUP_AA_ROUTES: ExampleRoute[] = [
  { path: AA_ROUTES.timeline, render: (phone) => <ProjectTimeline phone={phone} /> },
  { path: AA_ROUTES.move, render: (phone) => <ProjectTimeline phone={phone} move /> },
  { path: AA_ROUTES.days, render: (phone) => <ProjectTimeline phone={phone} scale="days" /> },
]
