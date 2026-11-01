// Changing this file is a protected change (see AGENTS.md).
import { expect, test } from '@playwright/test'
import {
  brokenWords,
  MODES,
  modeName,
  openEntry,
  readEntries,
  sidewaysOverflow,
  textOutOfOrder,
} from './support'

// Story tests: every story and docs page renders, its play function passes, no report fails
// (the accessibility addon reports with test: "error"), and nothing is logged as an error.
// No open option list, menu or popover is wider inside than its box: a sideways
// scrollbar there covers the highlighted option. In a right-to-left mode, every text of a story
// keeps its own word order: "4 items" never reads "items 4". A word in a
// button, a tab, a menu item or a label never breaks inside, and a button's text stays in its box.
for (const entry of readEntries()) {
  for (const mode of MODES) {
    test(`${entry.title} / ${entry.name} [${modeName(mode)}]`, async ({ page }) => {
      const outcome = await openEntry(page, entry, mode)
      expect(outcome.errors).toEqual([])
      expect(outcome.status).toBe('success')
      expect(await sidewaysOverflow(page), 'lists and popovers must not overflow sideways').toEqual(
        [],
      )
      if (entry.type === 'story') {
        expect(await brokenWords(page), 'words in controls and labels never break').toEqual([])
      }
      if (entry.type === 'story' && mode.direction === 'rtl') {
        expect(await textOutOfOrder(page), 'texts must keep their own order').toEqual([])
      }
    })
  }
}
