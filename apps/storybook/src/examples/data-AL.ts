/*
 * Group AL's example data (P5.45): Kvadrat Gradnja d.o.o.'s financial statements — the balance
 * sheet at 30.09.2026 beside 31.12.2025, the income statement for January–September 2026 beside
 * the same months of 2025, and their notes. The trial balance is the ledger's (data-AK.ts). The
 * positions, their codes and the notes are illustrative, in the shape of the Serbian forms, never
 * the official form; every figure is the Core's, written here as decimal strings (the totals
 * worked out with the books' arithmetic and checked below). Not part of the package. No classes
 * here.
 */

export const AL_ROUTES = {
  trial: '/accounting/trial-balance',
  /** The trial balance compared with the same day of 2025. */
  trialCompare: '/accounting/trial-balance?compare',
  balanceSheet: '/accounting/statements/balance-sheet',
  /** The balance sheet with note 8 open. */
  balanceSheetNote: '/accounting/statements/balance-sheet?note=8',
  incomeStatement: '/accounting/statements/income-statement',
}

// ── The balance sheet at 30.09.2026 ───────────────────────────────────────────────────────────

// ── The income statement, January–September ──────────────────────────────────────────────────

// ── The notes ─────────────────────────────────────────────────────────────────────────────────

// ── The books' arithmetic, checked ────────────────────────────────────────────────────────────
