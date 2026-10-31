# Point of sale

- PosShell is the full-screen till: the strip (register, cashier, queue), products at the start, the
  cart at the end; on phones the products first and the order as a compact bar that opens a sheet.
- The till keeps selling offline and says "3 sales waiting to be sent".
- Every tap answers at once: a brief neutral highlight and a short vibration where available
  (`tapFeedback`); a line that grows is highlighted and scrolled into view.
- No routine toasts at the till or on a restaurant's floor: lines show their state, a reversible
  action its Undo in place.
- Tiles are at least 112px; the stock state in two lines (icon and state, the detail under it);
  "Most sold" first; `search` across every category.
- CartPanel and PaymentDialog compute nothing: change and remaining amounts are the application's.
  A sale is paid in parts by any ways in any order; only cash gives change; limits come from data;
  "Complete payment" waits while something remains; cancelling after an approval says it is
  reversed.
- PaymentDialog never scrolls: Cash and Card are the two big choices, every other way behind
  "Other…".
- The keypad (NumericKeypad) has 56px keys, left to right in every direction, and stops digits at
  `maxDecimals`, never rounding.
- A scanner's burst or a typed code arrives on Enter (ScanField), the field emptied and kept focused.
- The issued receipt is ReceiptResult (state, number, Print, Send, Copy); its printed form is
  liro-folio's.
