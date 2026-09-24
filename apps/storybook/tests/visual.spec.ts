// Changing this file is a protected change (BUILD-PLAN rule 10).
import { expect, test } from '@playwright/test'
import { MODES, modeName, openEntry, readEntries } from './support'

// Visual: every story matches its baseline in light/dark × ltr/rtl. Baselines are generated
// only in the pinned Playwright image (BUILD-PLAN P0.4). Docs pages are prose and are not compared.
for (const entry of readEntries().filter((candidate) => candidate.type === 'story')) {
  for (const mode of MODES) {
    test(`${entry.title} / ${entry.name} [${modeName(mode)}]`, async ({ page }) => {
      await openEntry(page, entry, mode)
      await expect(page).toHaveScreenshot(`${entry.id}--${modeName(mode)}.png`, {
        fullPage: true,
      })
    })
  }
}
