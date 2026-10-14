import type { ReactNode } from 'react'

/*
 * The logic of PlanComparison (BUILD-PLAN P5.36), kept apart from the markup so it can be
 * unit-tested (AGENTS.md C7): what a feature's cell says for a plan, where the feature groups
 * start, and which plans can be chosen. Nothing here prices, ranks or recommends: the plans,
 * their prices and what each includes are the application's.
 */

/** One plan of the comparison, a column on a desktop and a card on a phone. */
export interface ComparedPlan {
  id: string
  /** The plan's name, from the application ("Business"): names its radio button. */
  name: string
  /** Its price as the application writes it (a MoneyText, "14.900,00 RSD"). */
  price?: ReactNode
  /** A line under the price ("per month, without VAT"). */
  priceNote?: ReactNode
  /** One or two lines on who the plan is for. */
  description?: ReactNode
  /**
   * Why this plan cannot be chosen now, in words ("Start has 5 users; you have 24."): the radio
   * is disabled and the reason is shown under the plan (D3).
   */
  unavailableReason?: ReactNode
}

/**
 * What a plan offers of one feature: `true` included (a check and "Included" for assistive
 * technology), `false`, `null` or nothing not included (a dash and "Not included"), or the
 * application's own words or figure ("30 users", "10 GB").
 */
export type FeatureOffer = ReactNode

/** One row of the comparison: a feature and what each plan offers of it. */
export interface ComparedFeature {
  id: string
  /** The feature's name, from the application ("Users included"). */
  label: string
  /** A line under the name. */
  description?: ReactNode
  /**
   * The group the feature belongs to ("Modules", "Limits", "Support"): a heading row where the
   * group changes. Features of one group stand together, in the application's order.
   */
  group?: string
  /** What each plan offers, by plan id. */
  values: Readonly<Record<string, FeatureOffer>>
}

/** A feature's cell for one plan. */
export type FeatureCell =
  { kind: 'included' } | { kind: 'excluded' } | { kind: 'text'; value: ReactNode }

/** What the cell of `feature` says for the plan `planId`. */
export function featureCell(feature: ComparedFeature, planId: string): FeatureCell {
  const value = feature.values[planId]
  if (value === true) return { kind: 'included' }
  if (value === false || value === null || value === undefined || value === '') {
    return { kind: 'excluded' }
  }
  return { kind: 'text', value }
}

/** A row of the comparison: a group's heading or a feature. */
export type ComparisonRow =
  { kind: 'group'; key: string; label: string } | { kind: 'feature'; feature: ComparedFeature }

/**
 * The rows in order: a heading before the first feature of each group (where `group` changes
 * from the previous feature's), then the feature. Features without a group get no heading.
 */
export function comparisonRows(features: readonly ComparedFeature[]): ComparisonRow[] {
  const rows: ComparisonRow[] = []
  let previous: string | undefined
  features.forEach((feature, index) => {
    if (feature.group !== undefined && feature.group !== previous) {
      rows.push({ kind: 'group', key: `group-${String(index)}`, label: feature.group })
    }
    previous = feature.group
    rows.push({ kind: 'feature', feature })
  })
  return rows
}

/** Whether the plan with this id exists and can be chosen (it has no unavailable reason). */
export function choosablePlan(plans: readonly ComparedPlan[], id: string | null | undefined) {
  if (id === null || id === undefined) return false
  const plan = plans.find((each) => each.id === id)
  return (
    plan !== undefined && (plan.unavailableReason === undefined || plan.unavailableReason === null)
  )
}
