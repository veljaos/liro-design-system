---
'@veljaos/ui': patch
---

P5.31a: AreaMap, LocationCheck and RegionChart measure their labels again when web fonts finish loading, so whether a name fits inside its area no longer depends on how fast the fonts arrived; the map reports itself ready only once the fonts are settled.
