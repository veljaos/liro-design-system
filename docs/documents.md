# Documents and liro-folio

## Printed documents → liro-folio

- No React replica of a printed document. Invoices, notes, quotes, delivery notes, decisions,
  contracts, letters, minutes, payslips, IOS statements, ledger reports, prescribed forms, the
  fiscal receipt and labels are PDFs that liro-folio renders (its own repository, on
  `@veljaos/tokens` only).
- The Design System owns the screens around them and shows the PDF or its page images
  (`FilePreview`, `DocumentFrame`, `PageViewer`; `ReceiptResult` at the till).
- A screen printed as you see it (a report, a chart, a list, a screen's `@media print` rules) is
  not a document and stays.
- **E-signature coordinates:** liro-folio returns each signature area as its page (from 1) and its
  rectangle `x y width height` in PDF points, origin at the page's bottom-left.

## DocumentFrame protocol

A viewer on another origin, in a sandboxed iframe; the library draws the toolbar, skeleton and
error around it.

- Sandbox `allow-scripts` (opaque origin), `referrerpolicy="no-referrer"`. `allowSameOrigin` only
  for a viewer that needs its own cookies, never one served from the application's origin.
- Messages, both ways: `{ protocol: 'liro-document-frame', version: 1, type, ...payload }`. Anything
  else is ignored. Pages count from 1; zoom is a percentage, 10–1000.
- Viewer → host: `loading`; `ready` (`page`, `pageCount`, `zoom`); `page` (`page`, `pageCount`);
  `zoom` (`zoom`); `error` (`message?`, at most 300 characters shown).
- Host → viewer: `goToPage` (`page`); `setZoom` (`zoom`; the toolbar steps 50–300). The viewer owns
  the state: the toolbar shows only what the viewer reported.
- Without `ready` within `timeout` (20 s) the host shows "did not answer"; "Try again" loads a new
  frame.
- The host accepts a message only when `event.source` is its frame, `event.origin` equals
  `allowedOrigin` exactly, and the data match. It posts to `allowedOrigin`; for an opaque origin
  (`"null"`) the source check ties the messages and the host posts with `"*"`.
- The viewer accepts commands only from `window.parent` and checks the host's origin when it knows
  it. Its document has a `lang`, a `<title>` and real text.
- A change an existing viewer would misread raises `version`.
