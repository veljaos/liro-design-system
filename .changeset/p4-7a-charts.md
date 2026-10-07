---
'@veljaos/ui': patch
---

P4.7a: the charts move to a subpath of their own, `@veljaos/ui/charts`, rebuilt on the shadcn/ui Chart primitive. **Breaking (alpha):** `BarChart`, `LineChart`, `AreaChart`, `DonutChart`, `seriesColour`, `plotValue` and the chart types are no longer exported from `@veljaos/ui`; import them from `@veljaos/ui/charts`. `DonutSlice` is now `PieSlice`. New: `PieChart`, `RadarChart`, `RadialChart`, `ChartSeriesToggle`, `shortTick`, `percentTick`, `isEmptyChart`; every chart takes `controls`, `legend`, axis and grid switches, `tooltip` (indicator, label, total, defaultCategory), `loading`, `error` and `layout`; area `curve` and `stack`; bar `stack`, `labels`, `activeCategory`, `signTones`, `colorBy`; line `curve`, `dots`, `labels`. New messages `chart.noData`, `chart.error`, `chart.retry`, `chart.loading`, `chart.thousands`, `chart.millions`, `chart.billions`, `chart.percent`.
