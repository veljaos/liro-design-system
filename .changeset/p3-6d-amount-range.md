---
'@veljaos/tokens': patch
'@veljaos/ui': patch
---

P3.6d: FilterBar's amount range shows its currency once, in the label ("Total (EUR)", new message `filter.rangeLabel`), and only "From" / "To" and the number in its fields; `filter.rangeFrom` / `filter.rangeTo` take the currency ("Total from (EUR)"). The range's fields are at least 140px and grow with a long amount; the pair wraps instead of cutting it.
