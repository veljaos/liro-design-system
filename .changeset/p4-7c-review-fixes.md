---
'@veljaos/tokens': patch
'@veljaos/ui': patch
---

P4.7c: light `status.warning.solid` is orange 6; the categorical chart palette is blue, magenta, purple, teal, indigo (no status hues). `Tabs` stand at the start by default (`align="center"` for centred content). `LiroFormat` gains `percent` (the locale's pattern: "62,4%" in Serbian); `messages['chart.percent']` is removed (breaking, alpha). Charts: lines and areas straight up to 31 points with dots up to 12 (`defaultCurve`), equal ticks on dense axes (`equalTicks`), areas take `dots`; `RadialChart` takes `percent`, and labelled rings show their values in one colour.
