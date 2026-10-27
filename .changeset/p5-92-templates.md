---
'@veljaos/ui': minor
---

P5.92: the page templates consolidated to the core (about eighteen). **Breaking (alpha):** these
templates and their exports are removed; compose the page from the core templates and the
components as `docs/recipes.md` ("Pages composed from the core templates") describes:

- `LegalActPage` → `DocumentPage` with `LegalText`, `LegalContents`, `useLegalPanels`.
- `LegalSearchPage` (`LegalSearchResult`, `LegalSnippet`, `snippetText`, `gazetteNumbers`) →
  `ListPage` with `FilterBar` and `SearchResultList`; `snippetFromRanges` is still exported.
- `CoursePage` (`CourseModule`, `CourseLesson`, `moduleProgress`, `courseProgress`, …),
  `ArticlePage`, `AskPage` → a reading page on `DetailPage`.
- `PickList`, `StockCount` (`pickProgress`, `pickStepState`, `PICK_STEPS`, `CountItem`) →
  `WorklistPage` / `ListPage` inside `<LiroProvider density="touch">`.
- `PaymentOrderForm` → `RecordFormPage`; its paper form is a JSON layout.
- `SigningPage` → `DetailPage` (or `DocumentPage`) with `SignerList`.
- `FileBrowser` (`FilePlace`, `FileColumn`, `FileUploadRules`) → `ListPage` with `FileGrid`,
  `FileDetails` and the file dialogs.
- `PrintCertificate`, `PrintGradeReport`, `PrintFinding`, `PrintLegalAct` → JSON definitions
  rendered from the print parts (still exported). `PrintDocument` stays.

Their message keys (`article.*`, `course.*`, `legalPage.*`, `legalSearch.*`, `pick.*`, `count.*`,
`signing.*` and others) are removed from `LiroMessages`.
