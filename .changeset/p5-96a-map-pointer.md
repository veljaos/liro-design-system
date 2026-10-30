---
'@veljaos/ui': patch
---

P5.96a: a map's marks follow real input only (RegionChart, AreaMap, LocationCheck). After a drill-down by mouse or touch no area is outlined, named or showing its tooltip until the pointer really moves — an area that appears under a still pointer is not hovered, whatever the browser repeats; the hovered area is drawn by a class, never CSS `:hover`. Leaving the map clears every mark. The focus ring and the keys' area show only when the focus came from the keyboard (a Tab or a key), never after a press of the pointer or a touch; the keys work as before. AreaMap names an area from its list only on the keys' focus.
