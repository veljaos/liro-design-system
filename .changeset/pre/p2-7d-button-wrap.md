---
'@veljaos/ui': patch
---

P2.7d: a long button label wraps instead of overflowing: lines centred, normally at most two, the button growing in height from its 36px (30px small) minimum; never cut with "…". Text buttons can now shrink to their container. `BulkActionBar` moves the actions before the main one into a "More" menu when they do not fit, as `ActionGroup` does, so wrapping is the last resort.
