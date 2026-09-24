// Changing this file is a protected change (BUILD-PLAN rule 10).
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { WCAG_TAGS } from '../.storybook/a11y'
import { MODES, modeName, openEntry, readEntries } from './support'

// Accessibility: axe with the WCAG 2.2 AA tags finds no violation, in every mode. No rule is
// disabled and nothing is excluded.
for (const entry of readEntries()) {
  for (const mode of MODES) {
    test(`${entry.title} / ${entry.name} [${modeName(mode)}]`, async ({ page }) => {
      await openEntry(page, entry, mode)
      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
      const violations = results.violations.map((violation) => ({
        rule: violation.id,
        impact: violation.impact,
        help: violation.help,
        targets: violation.nodes.map((node) => node.target.join(' ')),
      }))
      expect(violations).toEqual([])
    })
  }
}
