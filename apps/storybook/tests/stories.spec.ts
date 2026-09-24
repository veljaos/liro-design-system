// Changing this file is a protected change (BUILD-PLAN rule 10).
import { expect, test } from '@playwright/test'
import { MODES, modeName, openEntry, readEntries } from './support'

// Story tests: every story and docs page renders, its play function passes, no report fails
// (the accessibility addon reports with test: "error"), and nothing is logged as an error.
for (const entry of readEntries()) {
  for (const mode of MODES) {
    test(`${entry.title} / ${entry.name} [${modeName(mode)}]`, async ({ page }) => {
      const outcome = await openEntry(page, entry, mode)
      expect(outcome.errors).toEqual([])
      expect(outcome.status).toBe('success')
    })
  }
}
