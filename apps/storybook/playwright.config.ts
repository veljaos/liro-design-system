// Changing this file is a protected change (BUILD-PLAN rule 10).
import { defineConfig, devices } from '@playwright/test'

const PORT = 6006

/**
 * Story tests, accessibility and visual checks against the built Storybook (storybook-static).
 * CI runs them inside the official Playwright image, pinned by digest; visual baselines are
 * generated only there (BUILD-PLAN P0.4).
 */
export default defineConfig({
  testDir: './tests',
  // No platform suffix: baselines exist for the Linux image only.
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFileName}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  expect: {
    toHaveScreenshot: { animations: 'disabled', caret: 'hide', maxDiffPixels: 0 },
  },
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://127.0.0.1:${String(PORT)}`,
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    trace: 'retain-on-failure',
  },
  webServer: {
    // The job starts its own server on the built Storybook; a running one is never reused.
    command: `pnpm exec vite preview --outDir storybook-static --host 127.0.0.1 --port ${String(PORT)} --strictPort`,
    url: `http://127.0.0.1:${String(PORT)}/index.json`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
