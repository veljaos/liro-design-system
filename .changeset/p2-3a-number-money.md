---
'@veljaos/ui': patch
---

P2.3a: `NumberField` and `MoneyField`. No input mask: the text is read by the provider's `format.parseNumber` on leaving the field or on Enter; the value is a decimal string or null, never a JavaScript number and never 0 for unreadable text. `decimals` adds zeros and never rounds. Unreadable text stays in the field with the new message `field.invalidNumber`, and `onValidityChange` tells the application. MoneyField shows the currency on the side where `format.money` writes it for the locale.
