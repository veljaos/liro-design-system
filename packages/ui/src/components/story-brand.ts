/*
 * The Liro brand files for stories (fictitious use of the real files). Not part of the package:
 * nothing in src/index.ts imports this file. Storybook serves `@veljaos/tokens/brand/` under
 * `brand/` (apps/storybook/.storybook/main.ts); an application imports the files from
 * `@veljaos/tokens/brand/` and passes them through props (AGENTS.md D18).
 */

/** The props a BrandLockup takes for the Liro brand. */
export const LIRO_BRAND = {
  brandName: 'Liro',
  productName: 'Business Apps',
  icon: 'brand/icon.svg',
  wordmark: 'brand/wordmark-light.svg',
  wordmarkOnDark: 'brand/wordmark-mono-white.svg',
} as const
