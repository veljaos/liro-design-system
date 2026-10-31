---
'@veljaos/ui': patch
---

P5.91: a table's sticky first column never loses a row's line.

**Breaking (from P5.90): PosShell's phone props are renamed.** A phone till now shows the products first and the order as a compact bar that opens a sheet, so the props that opened the products sheet became props that open the order sheet:

- `productsOpen` → `orderOpen`
- `defaultProductsOpen` → `defaultOrderOpen`
- `onProductsOpenChange` → `onOrderOpenChange`
- new `orderSummary`: the bar's words, for example "Order · 3 items · 1.011,00 RSD" (the application's count and total).

Migration: rename the three props. The meaning is inverted (open now means the order is shown over the products), so an application that opened the products sheet by default drops `defaultProductsOpen` instead of renaming it.
