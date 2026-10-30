---
'@veljaos/ui': patch
---

P5.96b: one look per interaction on every item. Maps (RegionChart, AreaMap): no name is written on an area; the area under the pointer and the area the keys reached show the same outline, drawn over their neighbours, and a tooltip with the name (AreaMap gains its tooltip); the chosen area is drawn over its neighbours too. Focus rings: `FOCUS_RING` and every ring beside `outline-none` now say `outline-solid` — with Tailwind 4 they drew nothing; rings and frames no longer covered by a neighbour (ToggleGroup's segmented options, CalendarView's events, ResourceSchedule's bookings, ShiftPlanner's cells: the ring inside; FloorPlan's and SeatingChart's focused and chosen items over their neighbours); the Launchpad's locked tile shows the ring.
