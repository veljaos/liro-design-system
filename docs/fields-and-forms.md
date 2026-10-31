# Fields and forms

## Fields

- Order: label, control, hint (`description`), error. Never a hint between label and control, so
  fields in a row align.
- **Read only** is the one non-editable state: the grey background and border, the value readable,
  focusable, selectable and announced as read only (`readonly` / `aria-readonly`). No hint, no
  placeholder, an empty value is "—", no reason under it. Fields have no `disabled` prop.
- An **action** that cannot be used is unavailable with its reason in words: aria-disabled,
  focusable, a tooltip (`UnavailableAction`; a form around one action takes `unavailableReason`).
  Otherwise it is hidden.
- Errors stand under their field (danger border, icon, `aria-describedby`); Save focuses the first.
- Free text takes its direction from its content (`dir="auto"`); codes, IBANs, e-mails, URLs and
  passwords are written left to right (`direction="ltr"`).
- A SelectField with more than 10 options is searched by typing (`SEARCHABLE_FROM` = 11); any other
  choice among more than ten is a searchable combobox; a server search is ComboboxField.
- Lists scroll natively and keep the active option in view; no scroll buttons.

## Numbers, money, dates and times

- Money and numbers are decimal strings. Never a JavaScript `number`, never add, round or
  truncate; totals arrive computed. Unreadable input parses to `null`, never `0`, and stays in the
  field with its error.
- No input masks: text is read by `format` on blur or Enter (NumberField, MoneyField, DateField,
  TimeField). `decimals` adds zeros, never rounds.
- Dates are `YYYY-MM-DD`, typed or picked; a day and month alone read in today's year; a range's
  end before its start is an error. The calendar opens on the provider's `today`.
- Times are typed the quick way ("630" → 06:30, "6:30 pm" → 18:30); `parseTimeText` is the one
  parser.
- Everything shown goes through the provider's `format`: dates, numbers, amounts, percentages.

## Forms

- FormSection cards with a 1–3 column FormGrid (columns follow the grid's own width).
- FormActions: actions at the top and a sticky bottom bar while they are out of view, "Unsaved
  changes" when dirty; `useUnsavedChangesGuard` on leaving.
- FormTabs is the form card; a tab with errors shows a warning icon and "— has errors".
- Values the system filled in are ChangeableValues: shown, changed through a small pencil.
- A form from the application's definitions is DefinedForm (conditions as data, a hidden field is
  empty and not submitted).
- React Hook Form bindings live in `@veljaos/ui/form`; unreadable numbers and dates block submit.
