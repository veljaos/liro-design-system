---
'@veljaos/ui': minor
'@veljaos/tokens': patch
'@veljaos/eslint-config': patch
---

P5.29 and P5.30, the Admin, Superadmin and Helpdesk views.

- `HealthList`: monitored things — connections, services, queues, databases, backups, regions — with their state (the application's words and tone, with an icon by `kind`), figures, last success and last error with its message, and the application's actions (Retry); one card per thing on phones. Helpers `healthIcon`, `healthFacts`, `HEALTH_KINDS`.
- ImpersonationBar: an optional `note` after the reason, from the application (an audited view of a tenant: "Every page you open is recorded in the audit log").
- SlaTimer: a deadline in words against the application's now — due in, overdue by (danger), paused, met, missed — with its pure helpers (`slaText`, `durationText`, `slaReading`, `durationParts`, `millisecondsBetween`, `slaUrgency`, `SLA_TONES`).
- ReplyComposer in `@veljaos/ui/rich-text`: reply or internal note, saved replies, files, a link from the application's search, Ctrl/Cmd+Enter (helpers `groupSavedReplies`, `linkNodes`, `isSendKey`).
- RichTextField: a `ref` handle (`RichTextFieldHandle`: insert at the caret, focus, clear; `insertable`) and `surface`.
- MessageBubble and ThreadMessage: `internal`, an internal note marked "Internal" on the note surface.
- DataTable: ArrowDown / ArrowUp, Home and End move between pressable rows and cards (`rowFocusTarget`).
- Add SatisfactionRating, HelpfulFeedback, LinkSuggestions, PageContents, SearchResultList and CategoryGrid for customer portals and help centres (P5.30 d, e); helpers `ratingAnswer`, `ratingOption`, `scaleValueText`, `asksWhy`, `currentEntry`, `highlightText`, `highlightMatches`, `HighlightedText`.
- RichText: `headingIds` gives headings stable ids for a page's contents; `richTextHeadings` and `headingSlug` in `@veljaos/ui/rich-text`.
- `numericFormat` made without a time zone now follows the provider's `timeZone`: `createFormat` rebuilds its `dateTime` and `time` for the provider's zone (they showed the device's zone before, e.g. 06:30 for 08:30+02:00 on a machine in UTC).
- Messages: new `health.lastSuccess`, `health.lastError`, `health.errorMessage`, `health.never`, `health.empty`, `health.actionNamed`, `sla.dueIn`, `sla.overdueBy`, `sla.overdue`, `sla.paused`, `sla.met`, `sla.missedBy`, `sla.duration`, `sla.dueAt`, `sla.labelled`, `message.internal`, `composer.modes`, `composer.reply`, `composer.note`, `composer.noteHint`, `composer.send`, `composer.addNote`, `composer.sendHint`, `composer.savedReplies`, `composer.findSavedReply`, `composer.attach`, `composer.insertLink`, `rating.comment`, `rating.send`, `rating.required`, `rating.thanks`, `rating.given`, `helpful.question`, `helpful.yes`, `helpful.no`, `helpful.thanks`, `helpful.why`, `helpful.send`, `helpful.commentThanks`, `suggestions.count`, `suggestions.searching`, `pageContents.title`, `searchResults.count`, `searchResults.retry`.
