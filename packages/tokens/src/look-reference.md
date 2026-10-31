# The Liro look: reference values

The token tests compare `tokens.ts` with these tables, so a value typed wrongly on either side fails.

### A.1 Colour ramps (0 = lightest, 9 = darkest)

| Ramp | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|---|
| blue (brand; 6 is the brand colour) | #E8F5FA | #BDE3F5 | #93D1F0 | #68BEEF | #3EACEB | #1499E6 | #0078D4 | #0069BC | #0059A4 | #004A8C |
| teal (secondary accent) | #E4F7F7 | #B8E8E9 | #8CD9DA | #5FC9CB | #33BABC | #17A8AB | #038387 | #027276 | #026165 | #015052 |
| gray (neutral, 90% of surfaces and text) | #FAF9F8 | #F3F2F1 | #EDEBE9 | #E1DFDD | #D2D0CE | #A19F9D | #797775 | #605E5C | #3B3A39 | #323130 |
| green (success) | #DFF6DD | #C3EBC0 | #A3DD9F | #7FCD7A | #5ABC55 | #3AA835 | #1C8815 | #107C10 | #0B6A0B | #054B05 |
| orange (warning) | #FFF4CE | #FFE7A0 | #FFD670 | #FFC043 | #FCA61F | #F08C00 | #E56F01 | #D83B01 | #B83101 | #8F2601 |
| red (error, destructive) | #FDE7E9 | #F9C8CD | #F3A3AB | #EB7A85 | #E05360 | #CF3A48 | #BD2F3B | #A4262C | #8A1F24 | #6B171C |
| violet (premium, documents) | #F3F0FF | #E5DBFF | #D0BFFF | #B197FC | #9775FA | #845EF7 | #7950F2 | #7048E8 | #6741D9 | #5F3DC4 |

Common: white #FFFFFF, black #000000, dark page `ink` #1B1B1B, `inkRaised` #242424, `inkSunken` #141414, `inkOverlay` #2C2C2C.

### A.2 Meanings (semantic tokens)

| Meaning | Light | Dark |
|---|---|---|
| surface.page | gray1 | ink |
| surface.raised | white | inkRaised |
| surface.sunken | gray2 | inkSunken |
| surface.overlay | white | inkOverlay |
| surface.header | white | inkRaised |
| surface.hover | gray0 | rgba(255,255,255,0.05) |
| surface.selected | gray2 | #363636 |
| surface.disabled | gray2 | rgba(255,255,255,0.06) |
| surface.backdrop | rgba(0,0,0,0.45) | rgba(0,0,0,0.65) |
| surface.scrim | rgba(0,0,0,0.55) | rgba(0,0,0,0.55) |
| surface.inverse | gray9 | gray2 |
| text.primary | gray9 | gray1 |
| text.secondary | gray7 | #B3B0AD |
| text.tertiary | #6A6866 | gray5 |
| text.disabled | gray5 | gray6 |
| text.onAccent | white | white |
| text.brand / text.link | blue7 | blue4 |
| text.onInverse | white | black |
| text.logo | blue6 | blue4 |
| border.default | gray3 | #3B3B3B |
| border.strong | gray4 | #4D4D4D |
| border.subtle | gray2 | #2E2E2E |
| border.brand | blue6 | blue5 |
| border.focus | blue6 | blue4 |
| border.control | gray6 | gray6 |
| border.selected | gray7 | gray4 |
| brand.solid / solidHover / solidActive | blue6 / blue7 / blue8 | blue6 / blue7 / blue8 |
| brand.subtle / subtleHover | blue0 / blue1 | rgba(0,120,212,0.16) / rgba(0,120,212,0.26) |
| brand.onSolid | white | white |
| brand.accent | teal6 | teal4 |
| chart.main | blue6 | blue4 |
| chart.comparison | gray6 | gray5 |
| chart.other | gray8 | gray3 |
| chart.category1 | blue6 | blue5 |
| chart.category2 | #970E75 | #B75B97 |
| chart.category3 | #7E6EF2 | #8475F9 |
| chart.category4 | #179A8E | #059488 |
| chart.category5 | #334DB0 | #5778DF |

Status tones — `fg` / `bg` / `border` / `solid`:

| Tone | Light | Dark |
|---|---|---|
| success | green7 / green0 / green2 / green7 | green3 / rgba(16,124,16,0.20) / rgba(16,124,16,0.45) / green6 |
| warning | orange8 / orange0 / orange2 / orange6 | orange3 / rgba(216,59,1,0.20) / rgba(216,59,1,0.45) / orange6 |
| danger | red7 / red0 / red2 / red7 | red3 / rgba(164,38,44,0.22) / rgba(164,38,44,0.50) / red6 |
| info | blue7 / blue0 / blue2 / blue6 | blue3 / rgba(0,120,212,0.18) / rgba(0,120,212,0.45) / blue6 |
| neutral | gray9 / gray1 / gray3 / gray7 | gray1 / rgba(255,255,255,0.07) / #3B3B3B / gray5 |
| premium | violet7 / violet0 / violet2 / violet6 | violet3 / rgba(121,80,242,0.20) / rgba(121,80,242,0.45) / violet5 |

`surface.inverse` and `text.onInverse` are the tooltip's colours; `border.control` is the boundary of inputs, checkboxes, radios and the off state of switches (at least 3:1 on every surface). `surface.selected` is neutral and `border.selected` marks a selection (a selected row's start-edge bar, a selected card's border). The `chart.*` meanings: one brand blue for a chart's main series, greys for the comparison and the rest, and an opt-in categorical palette of five hues (blue, magenta, purple, teal, indigo, validated for colour-vision deficiency). The light `warning.solid` is orange6, for icons only. `text.logo` (blue6 / blue4) is the app lockup's colour.

On a selected row or card (`surface.selected`, marked `data-liro-surface="selected"`), five dark-theme text colours that measure below 4.5:1 over the selection take the next lighter shade, the one their hover already uses: status.danger.fg red3 → red2, status.premium.fg violet3 → violet2, and the family texts primary blue4 → blue3, document violet3 → violet2, destructive red3 → red2. The light theme needs none.

`brand.solid` is a background and `text.brand` is text; they move in opposite directions between themes and must never share a token.

### A.3 Spacing, radius, shadows

- Spacing: none 0 · xxs 4px · xs 8px · sm 12px · md 16px · lg 24px · xl 32px · xxl 48px · xxxl 64px.
- Radius: none 0 · xs 2px · sm 4px · md 8px · lg 12px · xl 16px · full 9999px.
- Shadows, light: xs `0 1px 2px rgba(0,0,0,0.06)` · sm `0 1px 4px rgba(0,0,0,0.08)` · md `0 2px 8px rgba(0,0,0,0.08)` · lg `0 4px 16px rgba(0,0,0,0.10)` · xl `0 8px 32px rgba(0,0,0,0.14)`.
- Shadows, dark: same offsets with opacity 0.35 · 0.40 · 0.45 · 0.50 · 0.60.

### A.4 Motion and layout

- Durations: instant 75ms · fast 100ms · base 150ms · slow 250ms. Easing: standard `cubic-bezier(0.33,0,0.67,1)` · decelerate `cubic-bezier(0.1,0.9,0.2,1)` · accelerate `cubic-bezier(0.9,0.1,1,0.2)`. Respect `prefers-reduced-motion`.
- Breakpoints: xs 36em · sm 48em · md 62em · lg 75em · xl 88em.
- Sizes: header height 56px · content max width 1440px · control height 36px · small control 30px.
- Layers (z-index): base 0 · raised 10 · sticky 100 · header 200 · drawer 300 · modal 400 · popover 500 · toast 600 · tooltip 700.

### A.5 Typography

- Interface face: Noto Sans. Brand face (wordmark, status pages): Space Grotesk with Inter fallback. Monospace: JetBrains Mono, Cascadia Code, system monospace.
- Sizes: xs 12px · sm 13px · md 14px (body) · lg 16px · xl 20px.
- Weights: regular 400 · medium 500 · semibold 600 · bold 700.
- Line heights: tight 1.25 · base 1.45 · relaxed 1.6. Letter spacing: heading −0.015em · body −0.01em · caps 0.5px.
- Headings (all semibold): h1 24px/1.3 · h2 20px/1.35 · h3 16px/1.4 · h4 14px/1.45 · h5 13px/1.45 · h6 12px/1.45.

### A.6 Families and interface intents

| Family | Colour | Filled shade | Meaning |
|---|---|---|---|
| primary | blue | 6 | create, save, confirm, go on |
| verify | teal | 6 | check, submit to an outside party, sign, send |
| document | violet | 6 | PDF, print, preview, download |
| positive | green | 6 | approve, complete, activate |
| destructive | red | 6 | delete, reject |
| caution | orange | **7** | hard-to-reverse: unlock, revert, void |
| neutral | gray | **7** | view, edit, filter, back, cancel, settings |

Gray and orange use shade 7 for filled buttons because shade 6 fails AA with white text.

Interface intents (`intent` prop) — family · default emphasis · confirms · lucide icon:

| Intent | Family | Emphasis | Confirms | Icon |
|---|---|---|---|---|
| create | primary | primary | — | Plus |
| save | primary | primary | — | Save |
| confirm | primary | primary | — | Check |
| next | primary | primary | — | ArrowRight |
| pdf | document | primary | — | FileText |
| print | document | primary | — | Printer |
| preview | document | secondary | — | Eye |
| download | document | secondary | — | Download |
| export | positive | secondary | — | FileSpreadsheet |
| delete | destructive | menu | yes | Trash2 |
| edit | neutral | secondary | — | Pencil |
| view | neutral | menu | — | Eye |
| filter | neutral | secondary | — | Filter |
| refresh | neutral | menu | — | RefreshCw |
| back | neutral | menu | — | ArrowLeft (mirrors in rtl) |
| cancel | neutral | secondary | — | X |
| duplicate | neutral | secondary | — | Copy |
| import | neutral | secondary | — | Upload |
| settings | neutral | menu | — | Settings |
| more | neutral | menu | — | MoreHorizontal |

Every other action uses `family` + `icon` + `label`. Domain actions map to families as follows, for `liro-core`'s actions: submit → primary (Check); verify → verify (ShieldCheck); sign → verify (Signature, confirms); send → verify (Send, confirms); sync → verify (Share2); approve → positive (CheckCheck, confirms); post → positive (BookCheck, confirms); complete → positive (CircleCheck); activate → positive (Power, confirms); reject → destructive (CircleX, confirms); reverse a document → destructive (FileMinus2, confirms); unlock → caution (Unlock, confirms); revert → caution (RotateCcw, confirms); void → caution (Ban, confirms); escalate → caution (ArrowUpCircle); archive → neutral (Archive).

Document buttons (PDF, print) carry full weight on purpose: bookkeepers look for them first; a light violet button gets lost next to a filled blue one.

### A.7 Example status-to-tone map (Storybook data only)

draft neutral · pending warning · in review info · approved success · posted success · signed info · sent info · paid success · partially paid warning · overdue danger · rejected danger · cancelled danger · archived neutral · active success · inactive neutral · locked warning · error danger.

---
