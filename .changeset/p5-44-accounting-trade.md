---
'@veljaos/ui': patch
---

P5.44–P5.61, Group A (accounting and trade), assembled from the library's components:

- `StatutoryCell.content`: the application's own content in place of an amount, for a column that holds no figure (a financial statement's Note column with a link to the note).
- ValueComparison compares two or three sources (`ComparisonValues`), for the three-way match of an order, its receipt and the invoice.
- DocumentPage `counterparties`: the further parties of a document among three parties, beside the counterparty.
- Toaster: toasts are shown and removed without the fade in a browser driven by automation, so a test never reads a toast at half contrast.
