---
'@veljaos/ui': patch
---

P2.3b: `DateField` and `DateRangeField`. A date is typed (read by `format.parseDate` on leaving the field or on Enter) or picked in the calendar, which opens only from its button or with Alt+ArrowDown, on the provider's `today`; the value is YYYY-MM-DD. A range whose end is before its start is an error, never swapped. New messages: `field.invalidDate`, `field.invalidRange`, `field.openCalendar`, `field.rangeStart`, `field.rangeEnd`, `calendar.previousMonth`, `calendar.nextMonth`, `calendar.navigation`. **Breaking:** the provider type `DateField` (`'day' | 'month' | 'year'`) is renamed `DatePart`, because the component takes the name.
