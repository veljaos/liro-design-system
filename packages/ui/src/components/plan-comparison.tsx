import { Check, Minus } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { RadioGroup, RadioGroupItem } from '../primitives/radio-group'
import { useLiro } from '../provider/liro-provider'
import { Field } from './field'
import {
  choosablePlan,
  comparisonRows,
  featureCell,
  type ComparedFeature,
  type ComparedPlan,
} from './plan-logic'
import { StatusBadge } from './status-badge'
import { usePhone } from './use-phone'

/*
 * PlanComparison (BUILD-PLAN P5.36): plans side by side — what each costs and offers — and one
 * of them chosen. Generic: the plans (a subscription's tiers, a service's packages, a membership's
 * levels), their prices, the features and what each plan offers of them are the application's;
 * the component shows them and reports the choice. It never prices, recommends or compares by
 * itself.
 * - **One choice: a radio group** named by the field's label (Field `group`). Each plan's radio is
 *   named by the plan's name and described by its price, note, description, the current mark and
 *   the reason it cannot be chosen. Tab enters the group, the arrows (following the page's
 *   direction) move and choose.
 * - **Desktop: a table**, plans as columns and features as rows (`<th scope="col">` per plan,
 *   `<th scope="row">` per feature, a heading row per feature group). The chosen plan's column
 *   is the neutral selection (D17): surface.selected down the column and a 3px border.selected
 *   bar over its header; only the radio's dot is blue. A wide table scrolls sideways inside its
 *   own region, the features' column first.
 * - **Phones: one card per plan**, the radio, name and price in the card's header and the
 *   features as a list under it ("Users included — 30"); the chosen card is the neutral
 *   selection (surface.selected, a border.selected border).
 * - **The current plan** (`current`) carries "Current plan" in words (a neutral badge): never
 *   marked by colour alone, and distinct from the choice (it may be chosen or not).
 * - **What a plan offers** of a feature: `true` — a check and "Included" for assistive
 *   technology; `false` / nothing — a dash and "Not included"; or the application's words or
 *   figure ("30 users").
 * - **A plan that cannot be chosen** (`unavailableReason`) has a disabled radio and the reason in
 *   words under it (D3); `readOnly` shows the comparison and the choice that cannot be changed
 *   here: the radios in the read-only look, focusable, nothing changes (P5.93 item 1).
 */

export interface PlanComparisonProps {
  /** Names the choice (the radio group), from the application ("Choose a plan"). */
  label: ReactNode
  /** A line under the label. */
  description?: ReactNode
  /** The plans, in the application's order (columns from the start). */
  plans: readonly ComparedPlan[]
  /** The features, in the application's order; `group` heads consecutive features. */
  features: readonly ComparedFeature[]
  /** The id of the plan in use now: marked "Current plan". */
  current?: string
  /** The words of the current plan's mark. Default `messages['plan.current']`. */
  currentLabel?: string
  /** The chosen plan's id (controlled). */
  value?: string | null
  /** The plan chosen at first (uncontrolled). */
  defaultValue?: string
  onChange?: (planId: string) => void
  /** The choice is shown but cannot be changed here (the read-only look, P5.93). */
  readOnly?: boolean
  /** An error under the label (the application's words: "Choose a plan."). */
  error?: ReactNode
  /** 'desktop' or 'phone' forces one; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

/** A feature's offer for one plan: a check, a dash or the application's words. */
function Offer({ feature, planId }: { feature: ComparedFeature; planId: string }) {
  const { messages } = useLiro()
  const cell = featureCell(feature, planId)
  if (cell.kind === 'included') {
    return (
      <span className="inline-flex items-center">
        <Check aria-hidden="true" className={'size-4 text-primary'} />
        <span className="sr-only">{messages['plan.included']}</span>
      </span>
    )
  }
  if (cell.kind === 'excluded') {
    return (
      <span className="inline-flex items-center">
        <Minus aria-hidden="true" className="size-4 text-tertiary" />
        <span className="sr-only">{messages['plan.notIncluded']}</span>
      </span>
    )
  }
  return <span className={cn('text-sm break-words text-primary', TEXT_ISOLATE)}>{cell.value}</span>
}

/** The plan's facts under its name: price, note, description, the current mark, the reason. */
function PlanFacts({
  plan,
  id,
  current,
  currentLabel,
  centred,
}: {
  plan: ComparedPlan
  id: string
  current: boolean
  currentLabel: string
  centred: boolean
}) {
  const unavailable = plan.unavailableReason !== undefined && plan.unavailableReason !== null
  const align = centred ? TEXT_ISOLATE : TEXT_DIRECTION
  return (
    <span
      id={id}
      className={cn(
        'flex min-w-0 flex-col gap-1 font-regular',
        centred ? 'items-center text-center' : 'items-start',
      )}
    >
      {plan.price !== undefined && plan.price !== null && (
        <span className={cn('text-h3 font-semibold text-primary tabular-nums', align)}>
          {plan.price}
        </span>
      )}
      {plan.priceNote !== undefined && plan.priceNote !== null && (
        <span className={cn('text-xs text-secondary', align)}>{plan.priceNote}</span>
      )}
      {plan.description !== undefined && plan.description !== null && (
        <span className={cn('text-xs break-words text-secondary', align)}>{plan.description}</span>
      )}
      {current && <StatusBadge label={currentLabel} tone="neutral" withBorder />}
      {unavailable && (
        <span className={cn('text-xs break-words text-secondary', align)}>
          {plan.unavailableReason}
        </span>
      )}
    </span>
  )
}

/** Plans side by side, one chosen: a table on a desktop, cards on a phone. */
export function PlanComparison(props: PlanComparisonProps) {
  const { messages } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const idBase = useId()
  const [innerValue, setInnerValue] = useState<string | null>(props.defaultValue ?? null)
  const value = props.value === undefined ? innerValue : props.value
  const rows = comparisonRows(props.features)
  const currentLabel = props.currentLabel ?? messages['plan.current']
  const readOnly = props.readOnly === true

  const choose = (next: string) => {
    if (readOnly || !choosablePlan(props.plans, next)) return
    setInnerValue(next)
    props.onChange?.(next)
  }
  const radioId = (index: number) => `${idBase}-plan-${String(index)}`
  const factsId = (index: number) => `${idBase}-facts-${String(index)}`

  return (
    <Field
      label={props.label}
      group
      {...(props.description === undefined ? {} : { description: props.description })}
      {...(props.error === undefined ? {} : { error: props.error })}
      readOnly={readOnly}
      {...(props.className === undefined ? {} : { className: props.className })}
    >
      {(control) => (
        <RadioGroup
          data-slot="plan-comparison"
          value={value ?? ''}
          onValueChange={choose}
          aria-labelledby={control.labelId}
          aria-describedby={control.describedBy}
          aria-invalid={control.invalid || undefined}
          aria-readonly={control.readOnly || undefined}
          className={cn('min-w-0 font-sans', phone ? 'flex flex-col gap-3' : 'block')}
        >
          {phone ? (
            props.plans.map((plan, index) => {
              const chosen = plan.id === value
              const off = !choosablePlan(props.plans, plan.id)
              return (
                <div
                  key={plan.id}
                  data-slot="plan-card"
                  data-chosen={chosen || undefined}
                  className={cn(
                    'box-border flex min-w-0 flex-col rounded-lg border border-solid',
                    chosen
                      ? 'border-selected bg-surface-selected'
                      : 'border-default bg-surface-raised',
                  )}
                >
                  <label
                    htmlFor={radioId(index)}
                    className={cn(
                      'flex min-w-0 items-start gap-3 p-4',
                      off
                        ? 'cursor-not-allowed'
                        : control.readOnly
                          ? 'cursor-default'
                          : 'cursor-pointer',
                    )}
                  >
                    <RadioGroupItem
                      id={radioId(index)}
                      value={plan.id}
                      disabled={off}
                      readOnly={control.readOnly}
                      aria-describedby={factsId(index)}
                      className="mt-0.5"
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span
                        className={cn(
                          'text-md font-semibold',
                          off ? 'text-disabled' : 'text-primary',
                          TEXT_DIRECTION,
                        )}
                      >
                        {plan.name}
                      </span>
                      <PlanFacts
                        plan={plan}
                        id={factsId(index)}
                        current={plan.id === props.current}
                        currentLabel={currentLabel}
                        centred={false}
                      />
                    </span>
                  </label>
                  <ul className="m-0 flex list-none flex-col border-0 border-t border-solid border-default px-4 py-2">
                    {rows.map((row) =>
                      row.kind === 'group' ? (
                        <li
                          key={row.key}
                          className={cn(
                            'pt-3 pb-1 text-xs font-semibold text-secondary',
                            TEXT_DIRECTION,
                          )}
                        >
                          {row.label}
                        </li>
                      ) : (
                        <li
                          key={row.feature.id}
                          className="flex min-w-0 items-baseline justify-between gap-3 py-1.5"
                        >
                          <span className={cn('min-w-0 text-sm text-secondary', TEXT_DIRECTION)}>
                            {row.feature.label}
                          </span>
                          <span className="shrink-0 text-end">
                            <Offer feature={row.feature} planId={plan.id} />
                          </span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )
            })
          ) : (
            <div className="min-w-0 overflow-x-auto">
              <table className="w-full min-w-[36rem] border-collapse text-sm">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="box-border w-[32%] border-0 border-b border-solid border-default p-3 align-bottom"
                    >
                      <span className="sr-only">{messages['plan.feature']}</span>
                    </th>
                    {props.plans.map((plan, index) => {
                      const chosen = plan.id === value
                      const off = !choosablePlan(props.plans, plan.id)
                      return (
                        <th
                          key={plan.id}
                          scope="col"
                          data-chosen={chosen || undefined}
                          className={cn(
                            'box-border border-0 border-t-3 border-b border-solid p-3 align-top',
                            chosen
                              ? 'border-t-selected border-b-default bg-surface-selected'
                              : 'border-t-transparent border-b-default',
                          )}
                        >
                          <span className="flex flex-col items-center gap-2">
                            <label
                              htmlFor={radioId(index)}
                              className={cn(
                                'flex min-h-6 items-center gap-2',
                                off
                                  ? 'cursor-not-allowed'
                                  : control.readOnly
                                    ? 'cursor-default'
                                    : 'cursor-pointer',
                              )}
                            >
                              <RadioGroupItem
                                id={radioId(index)}
                                value={plan.id}
                                disabled={off}
                                readOnly={control.readOnly}
                                aria-describedby={factsId(index)}
                              />
                              <span
                                className={cn(
                                  'text-md font-semibold',
                                  off ? 'text-disabled' : 'text-primary',
                                  TEXT_ISOLATE,
                                )}
                              >
                                {plan.name}
                              </span>
                            </label>
                            <PlanFacts
                              plan={plan}
                              id={factsId(index)}
                              current={plan.id === props.current}
                              currentLabel={currentLabel}
                              centred
                            />
                          </span>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) =>
                    row.kind === 'group' ? (
                      <tr key={row.key}>
                        <th
                          scope="colgroup"
                          colSpan={props.plans.length + 1}
                          className="border-0 border-b border-solid border-default bg-surface-sunken px-3 pt-3 pb-1.5 text-start text-xs font-semibold text-secondary"
                        >
                          <span className={TEXT_DIRECTION}>{row.label}</span>
                        </th>
                      </tr>
                    ) : (
                      <tr key={row.feature.id}>
                        <th
                          scope="row"
                          className="border-0 border-b border-solid border-default px-3 py-2.5 text-start align-top font-regular"
                        >
                          <span className={cn('block text-sm text-primary', TEXT_DIRECTION)}>
                            {row.feature.label}
                          </span>
                          {row.feature.description !== undefined &&
                            row.feature.description !== null && (
                              <span className={cn('block text-xs text-secondary', TEXT_DIRECTION)}>
                                {row.feature.description}
                              </span>
                            )}
                        </th>
                        {props.plans.map((plan) => (
                          <td
                            key={plan.id}
                            className={cn(
                              'border-0 border-b border-solid border-default px-3 py-2.5 text-center align-top',
                              plan.id === value && 'bg-surface-selected',
                            )}
                          >
                            <Offer feature={row.feature} planId={plan.id} />
                          </td>
                        ))}
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </RadioGroup>
      )}
    </Field>
  )
}
