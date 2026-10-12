---
'@veljaos/ui': minor
---

Legal information (P5.27), no new dependency:

- The shared model of a legal act (`LegalAct`, `LegalNode`, `LegalArticle`, `LegalVersion`, `LegalAmendment`, `RelatedAct`, `PracticeItem`, `LegalNote` and the rest), exported as types.
- `LegalText` (an act's text: headings, articles with copy link, selection and actions, change marks, deleted articles collapsed, references with a preview, search in the act, Latin / Cyrillic switch, windowing for long acts, `revealNode`), `LegalContents` (the table of contents in a start-side drawer), `LegalCompare` (two versions inline, word diff), and the helpers of `legal-logic.ts` (word diff, Serbian Cyrillic to Latin, search on the data, comparison, contents tree).
- `LegalActPage` (a legal act in DocumentPage's layout: gazette, version picker, actions, side panels, a phone sheet), the act's side panels (`useLegalPanels`, `LegalArticleSummary`) and their helpers, and `PrintLegalAct` (an act on A4).
- `LegalSearchPage` (full-text search across acts on ListPage: filters, the count and sort, results with a marked snippet and the article they matched in; `snippetFromRanges`), `GazetteIssues` (what is new in a gazette, issue by issue).
- FilterBar: a `tree` filter kind (TreeView in the drawer; `treeFilterLabels`, `treeFilterIds`).
- New messages `legal.*`, `legalPage.*`, `legalPanel.*`, `legalPrint.footnotes`, `legalSearch.*`, `gazette.*` (English defaults).
