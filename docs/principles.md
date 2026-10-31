# Principles

## The two principles

They apply to every screen, before every other rule.

1. **Simplicity first.** Show the minimum by default; tuck advanced options away (a menu, "More", a
   section that opens).
2. **Ease sells.** A first-day user manages without training, under pressure: the fewest steps, big
   clear targets, visible feedback on every action, Undo instead of a confirmation for anything
   reversible, nothing that blocks the user.

## The library's limits

- No backend: no API calls, cookies, URLs, tenants or permissions. Everything arrives through props
  and `LiroProvider`.
- No text of its own: components show the text they are given; their few own strings come from
  provider `messages` (English defaults in `packages/ui/src/provider/messages.en.ts`).
- No business domain inside components ("invoice", "VAT"); fictitious examples in stories are fine.
- No decisions: figures, totals, states, checks, permissions and rules are the application's. A
  component never adds, rounds, sorts, filters or judges.
- Consumers import `@veljaos/ui` and its subpaths only, never Radix or `src/primitives/`.
- No logo in a component: shells and status pages take name, wordmark and icon through props.

## Class rules

One look and one behaviour per kind of thing, everywhere:

- The same interaction looks the same on every item of a component, whatever its size or place.
- Words never break inside; a label that cannot fit wraps between words or shortens with "…" and
  shows the whole text in the library's Tooltip ([languages](languages.md)).
- Read only is the one non-editable state of a field ([fields and forms](fields-and-forms.md)).
- An action that cannot be used stays visible with its reason in words ([fields and forms](fields-and-forms.md)).
- Focus rings always show and are never covered ([accessibility](accessibility.md)).
- Toasts never block; a routine action answers in place ([feedback and states](feedback-and-states.md)).
- No box with its own vertical scroll inside a phone page ([phones](phones.md)).
- Every state is visible and says something ([feedback and states](feedback-and-states.md)).
- Hints are the library's Tooltip, never the browser's `title`.
- Printed documents are liro-folio's PDFs ([documents](documents.md)).
