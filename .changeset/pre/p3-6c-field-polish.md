---
'@veljaos/tokens': patch
'@veljaos/ui': patch
---

P3.6c: free text in TextField, TextAreaField, ComboboxField and MultiSelectField, and the chosen option of SelectField, takes its direction from its content (`dir="auto"`) and stays at the page's start side; TextField's new `direction: 'ltr'` writes a code (a tax number, an IBAN) left to right, as e-mail, telephone and URL fields always are. NumberField and MoneyField take a `startText` ("From"). DateRangeField takes `endPlaceholder`, and an empty range shows no lone dash. FilterBar: a number range has one label over its two fields, "From" / "To" inside them, named "Total from" / "Total to" (the messages `filter.rangeFrom` and `filter.rangeTo` are back; 0.1.0-alpha.3 wrote "Total, from"); an empty date range reads "From – To".
