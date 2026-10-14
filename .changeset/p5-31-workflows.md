---
'@veljaos/ui': minor
---

P5.31 to P5.41, the workflows of the accounting product.

- `PageViewer` (P5.31): a document's pages as the application's images, with pages, zoom and one region highlighted in the page's units (helpers `regionBox`, `regionPage`, `clampPage`, `labelSide`); light in both themes, never mirrored; loading, error and `unavailable` (a locked PDF).
- `RecognizedField` (P5.31): the application's confidence under any field, an uncertain reading marked with an icon and words, "Changed by you" and "Show where it was read".
- Merge values in `@veljaos/ui/rich-text` (P5.31): typed and computed merge fields (RichTextMergeField `kind`, `currency`, `decimals`, `computed`, `offsetDays`) filled in by RichText, RichTextField and ReplyComposer (`mergeValues`, `now`); a field without a value stays a pill marked "No value". Helpers `resolveMergeFields`, `resolveMergeText`, `mergeFieldText`, `missingMergeFields`.
- The sticky first columns of DataTable (also after its selection column), AttendanceGrid, ShiftPlanner, ResourceSchedule and EditableGrid now stand on a layer of their own, as StatutoryFormPage's, so they are drawn the same way every time.
- `ValueComparison` (P5.33): two sources' values side by side, the differences the application marks, "2 of 4 differ" (`valueComparisonCounts`).
- The Liro Assistant (P5.34): `AssistantAnswer`, `ProposedAction`, `AssistantComposer`, `AssistantPanel` (with `QuestionList`, `AskedQuestion`), the template `AskPage`, their types and helpers (`AnswerBlock`, `AnswerState`, `ANSWER_STATES`, `answerBusy`, `shownBlocks`, `followUpsShown`, `canReport`, `answerSources`, `questionKey`, `questionReady`, `actionOffers`, `actionSettled`). An answer is the application's data; nothing calls a model. `AgentMark` gained `label` (default "Agent").
- `PlanComparison` (P5.36): plans side by side, one chosen (`featureCell`, `comparisonRows`, `choosablePlan`; row type `PlanComparisonRow`), and `UsageMeter`: used of an allowance in words and a bar (`meterShare`, `usageWords`, `usageAmount`).
- New subpath `@veljaos/ui/gantt` (P5.37): `Gantt` on SVAR React Gantt 2.7.3 (MIT edition; a dependency of `@veljaos/ui`, loaded only through the subpath) — phases, tasks, milestones, dependencies, progress, who does each, a phase's budget against spent, the one "now" marker from the application's `now`, months or days; edits by drag and by the rows' dialogs (Move…, Change dates…, Set progress…, Dependencies…) reported through `onChange`; right to left mirrored; phones a list by phase. Helpers `applyGanttChange`, `ganttRows`, `phaseGroups`, `movedDates`, `draggedDates`, `dragChange`, `chartRange`, `dependencyCandidates`, `dependsOn`, `predecessors`, `linkType`, `dependencyType`, `nowPosition`, `isProgress`, `durationDays`, `nextDependencyId`, `forbiddenGanttPackages`; its CSS is in `styles.css`.
- `EmailPreview` (P5.38): a message as its reader sees it, Desktop / Phone width and Light / Dark mail client (`emailPreviewWidth`).
- The blog's reading pieces (P5.39): `ArticleList`, `NewsletterSignup`, `ShareLinks` (`opensOutside`), the template `ArticlePage`, and `looksLikeEmail`, `emailProblem`, `bylineText`, `articlePlaces`.
- `QrCode` (P5.40, on `qr` 0.7.2): any text as a real QR code, dark on light in both themes. The IPS NBS QR helpers (`ipsQrText`, `ipsAmount`, `ipsAccountValid`, `normalizeIpsAccount`, `ipsAccountText`, `ipsReferenceValid`, `ipsProblemsOf`) name every problem by field and never round. The template `PaymentOrderForm` draws a bank's paper payment order as its real form (Serbian forms 1, 2 and 3). PaymentDialog draws no frame for an empty `qrCode`.
- New subpath `@veljaos/ui/map` (P5.41) on Leaflet 1.9.4 (BSD-2-Clause; a dependency of `@veljaos/ui`, loaded only through the subpath, drawn with SVG):
  - `AreaMap`: GeoJSON areas with their names, the list beside the map, an address with the area it falls in, a legend.
  - `LocationCheck`: a workplace's allowed area, the person's position with its accuracy, the application's verdict, "Use my location" through `onLocate`, the check-in unavailable with its reason.
  - `RegionChart`: a choropleth in the charts' card. Areas take the colour of their value's step (decimal strings compared exactly with the application's breaks; at most five steps of the main blue or neutral). Areas without a value are hatched with "No data". The legend writes its ranges through `format`. Places are points or bubbles. The keyboard and "Show as table" work as in the other charts.
  - The base map's tiles are optional and the application's.
  - Helpers `pointInArea`, `areaAt`, `labelPoint`, `labelFits`, `distanceMeters`, `withinRadius`, `circleBounds`, `geometryBounds`, `unionBounds`, `regionStep`, `regionStepRanges`, `rampShade`, `regionReadingOrder`, `regionKeyTarget`, `bubbleRadius`; its CSS is in `styles.css`.
- Messages: new
  - `richText.mergeFieldMissing`, `richText.missingValues` (merge values)
  - `recognized.*`, `viewer.highlighted`, `comparison.*` (P5.31, P5.33)
  - `assistant.*` (P5.34)
  - `plan.current`, `plan.feature`, `plan.included`, `plan.notIncluded`, `usage.amount`, `usage.ofLimit`, `usage.noLimit` (P5.36)
  - `gantt.*` (P5.37)
  - `emailPreview.*` (P5.38)
  - `article.*`, `share.*`, `newsletter.*` (P5.39)
  - `qr.tooLong`, `ips.problem` (P5.40)
  - `map.*` and `location.*` (P5.41)
