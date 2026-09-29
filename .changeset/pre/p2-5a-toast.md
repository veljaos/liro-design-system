---
'@veljaos/ui': patch
---

P2.5a: toasts — place `<Toaster />` once inside LiroProvider and call `notice.success | info | warning | error | loading(message, { title })`; `notice.update(id, kind, message)` turns a loading toast into its result; `notice.dismiss(id)`. New runtime dependency sonner 2.0.8 (MIT) and messages `notice.close`, `notice.region`.
