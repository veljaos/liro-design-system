# Languages and directions

## The provider

- Everything that differs between applications, languages and customers goes through
  `LiroProvider`: locale, direction, messages, format, today, time zone, week start, colour scheme,
  density, link component — each with a default.
- Month and weekday names, long dates and the week's first day come only from `locale` (the week
  from its region, or `weekStartsOn`). `format` may replace how digits are written, never the words:
  an English interface for a Serbian company is `locale="en-RS"` with
  `format={numericFormat('sr-Latn-RS')}`.
- Times follow the locale: a 12-hour clock without a leading zero ("7:00 AM"), a 24-hour clock with
  two digits ("07:00").
- Instants are shown in the provider's `timeZone`; local values as written.
- Language tags name the script: `sr-Latn`, `sr-Cyrl`, never bare `sr`.

## Direction

- Logical properties only: `ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`/`text-start`; never
  `ml-`/`left-`/`text-left` (`liro/logical-properties`). Pointer and keyboard movement measure from
  the leading edge.
- Every text block takes its direction from its content (`unicode-bidi: plaintext`), the layout
  keeping the page's. Numbers are isolated (`bdi`), so "4 items" never reads "items 4".
- Text whose language differs from the page carries `lang` (`useLangAttribute`), and its own `dir`
  when its direction differs.
- Code, IBANs, plans, maps, the keypad and code inputs stay left to right in every direction.

## Words and lines

- A word never breaks inside. A button's, a tab's, a menu item's or a field label's text wraps
  between words only; where a word cannot fit, the place gives it room (whole buttons wrap) or
  shortens it with "…" and the whole text in the Tooltip (`FittedLabel`).
- Every text block wraps a long unbroken string (an IBAN, a URL) inside its box
  (`overflow-wrap: break-word` in `bidi-content` / `bidi-isolate`).
- A file name is one line shortened in the middle, the extension kept (`FileName`), the whole name
  in the Tooltip. A time range ("08:00 – 08:45") never breaks.

## Samples

- Every component with text has an Arabic and a Japanese story; Serbian Latin and Cyrillic run
  through the Storybook "Format locale" toolbar (`sr-Latn-RS`, `sr-Cyrl-RS`).
