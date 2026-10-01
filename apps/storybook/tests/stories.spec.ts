// Changing this file is a protected change (BUILD-PLAN rule 10).
import { expect, test } from '@playwright/test'
import { MODES, modeName, openEntry, readEntries, sidewaysOverflow } from './support'

// Story tests: every story and docs page renders, its play function passes, no report fails
// (the accessibility addon reports with test: "error"), and nothing is logged as an error.
// No open option list, menu or popover is wider inside than its box (P3.2a): a sideways
// scrollbar there covers the highlighted option.
for (const entry of readEntries()) {
  for (const mode of MODES) {
    test(`${entry.title} / ${entry.name} [${modeName(mode)}]`, async ({ page }) => {
      const outcome = await openEntry(page, entry, mode)
      expect(outcome.errors).toEqual([])
      expect(outcome.status).toBe('success')
      expect(await sidewaysOverflow(page), 'lists and popovers must not overflow sideways').toEqual(
        [],
      )
    })
  }
}
