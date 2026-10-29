---
'@veljaos/ui': minor
---

P5.94, the owner's fifth review. Breaking changes (alpha) and how to migrate:

- PaymentDialog: with `onAddPart` the default ways are Cash and Card (no "Split" way); every way can take a part. `onCardStart` receives the amount of the part (`(amount: string | null) => void`; a handler without the argument still works). Mark a card's or an instant payment's part `state: 'approved'`: it has no remove button and cancelling the payment says it is reversed, then calls the new `onCancel` (the application reverses it). `PaymentOption.maxAmount` and `maxReason` limit a part of a way (a voucher's value). "Complete payment" waits with "Still to pay" while the remaining amount is more than zero after a part.
- VersionList: Restore runs at once, without a question (it is not destructive). The messages `versions.restoreTitle`, `versions.restoreMessage` and `versions.restore` are removed; drop them from your messages.
- New messages: `payment.partPaid`, `payment.partApproved`, `payment.payByCard`, `payment.payByCode`, `payment.overRemaining`, `payment.overLimit`, `payment.stillToPay`, `payment.declinedHint`, `payment.reverseWarning`, `payment.keepPaying`, `payment.cancelPayment`, `assistant.answering`.
- AssistantComposer: `onStop` turns the ask button into Stop while `busy`.
- NewsletterSignup: subscribed shows only the thanks; the band no longer keeps its size.
- SettlingValue: the reserved width is measured in pixels (the `SettlingMemory` widths are pixels); `reserveChars` still reserves characters.
- IconButton and CompactIconButton show no tooltip while `disabled`.
- Launchpad: the home page has no "Customize"; show the editing mode in the user's preferences.
- New exports: `CURRENT_TONE`, `CURRENT_ROW` (the one "current" look), `partOverLimit`, `stillToPay`, `closesOnSpace`. `mentionQueryAt` takes the chosen mentions as an optional third argument.
- Buttons, tabs, menu items and field labels never break a word inside (a CSS rule in the package's styles).
