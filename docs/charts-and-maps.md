# Charts and maps

## Charts (`@veljaos/ui/charts`)

- Main series blue, comparison and the rest grey, status tones only for states; the categorical
  palette (five validated hues) only on request. No gradients.
- Every chart is a card: title, description, a series `toggle` at the header's end (under the title
  on phones; the chosen one neutral), `controls` for a period, legend, "Show as table".
- Values are decimal strings, turned into numbers only to draw; null leaves a gap.
- States: loading skeleton, empty, error with Retry.
- The plot is one tab stop; the arrows reach each mark with its tooltip, announced once.
- Labels on colour stand on a raised tag. Motion 300ms, none when reduced or automated.
- A sparkline only when the application passes `trend`.

## Maps (`@veljaos/ui/map`)

- Leaflet with SVG; never mirrored. A base layer is optional, off by default, and the
  application's (its URL, attribution always shown, key and terms).
- No name is written on an area. The area under the pointer or reached by the keys has one look
  for every area of every level: its outline drawn over its neighbours, a solid line, and a tooltip
  with the name.
- Marks come from real input only: no hover under a pointer that has not moved; leaving the map
  clears every mark; the ring and the keys' area show only after a key.
- AreaMap areas are the charts' main blue (darker on hover and when chosen); other colours only
  from the data's `tone`. RegionChart: at most five steps from the application's `breaks`
  (compared as decimal strings), "No data" hatched, never 0.
- LocationCheck never calls `navigator.geolocation`; the application locates and judges.
- Maps follow the law of the Republic of Serbia: Kosovo and Metohija is part of Serbia, drawn
  within Serbia's area with no shape, border or name of its own. The package's boundaries
  (`loadSerbiaBoundaries`) follow it; a real application passes its own geometry.
