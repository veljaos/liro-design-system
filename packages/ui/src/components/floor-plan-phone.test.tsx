import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { FloorPlan } from './floor-plan'
import {
  RESTAURANT_AREAS,
  RESTAURANT_ITEMS,
  RESTAURANT_PALETTE,
  RESTAURANT_SIZE,
  RESTAURANT_STATES,
} from './floor-plan-story-data'

/*
 * P5.90 item 20 (P5.28 item 27): a floor plan is never edited on a phone. The picture of it was
 * removed (no story edits a plan at phone width); this proves the refusal instead.
 */

function plan(layout: 'phone' | 'desktop') {
  return renderToStaticMarkup(
    <LiroProvider locale="en">
      <FloorPlan
        label="Restoran Kej"
        items={RESTAURANT_ITEMS}
        width={RESTAURANT_SIZE.width}
        height={RESTAURANT_SIZE.height}
        areas={RESTAURANT_AREAS}
        states={RESTAURANT_STATES}
        editing
        palette={RESTAURANT_PALETTE}
        onChange={() => undefined}
        layout={layout}
      />
    </LiroProvider>,
  )
}

describe('FloorPlan on a phone', () => {
  it('offers no edit mode, and says where to edit', () => {
    const phone = plan('phone')
    expect(phone).toContain('Edit the plan on a computer or tablet.')
    expect(phone).not.toContain('Round table')
  })

  it('edits on a larger screen', () => {
    const desktop = plan('desktop')
    expect(desktop).not.toContain('Edit the plan on a computer or tablet.')
    expect(desktop).toContain('Round table')
  })
})
