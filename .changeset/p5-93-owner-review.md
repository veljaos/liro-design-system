---
'@veljaos/ui': minor
---

P5.93, the owner's fourth review. Breaking changes (alpha) and how to migrate:

P5.93 (helper a): fields have one non-editable state — read only.

**Breaking (alpha):**

- `FieldBaseProps` loses `disabled` and `disabledReason`, so every field does: TextField, TextAreaField, SelectField, ComboboxField, MultiSelectField, CheckboxField, SwitchField, RadioGroupField, DateField, DateRangeField, PeriodField, MonthField, TimeField, NumberField, MoneyField, PasswordField, LookupField, QuantityStepper, ScanField, MentionCombobox, RichTextField, Field (and `FieldControl.disabled`), the `@veljaos/ui/form` bindings. Migration: use `readOnly`. It now looks like the old disabled field (grey, with a border) and stays readable, focusable and selectable; it shows no hint and no placeholder, and an empty value shows "—". A reason under the field is no longer shown: say it once where the page needs it (an Alert above the form, a section's line).
- `CodeInput`, `BuyerField`, `PlanComparison`, `NumericKeypad`: `disabled` (and `disabledReason`) → `readOnly`. NumericKeypad read only shows the display without keys. ScanField now takes `readOnly`.
- `DefinedField.disabledReason` is removed: use `readOnly: true` in the definition.
- `RuleBuilder` `disabledReason` is removed: use `readOnly`.
- `AssistantComposer`, `MessageComposer`, `ReplyComposer`, `EmailFirstForm`, `NewsletterSignup`, `SatisfactionRating`: `disabled` + `disabledReason` → `unavailableReason` (the field read only, the action unavailable, the reason in words under it).
- `FileDropzone`: `disabled` + `disabledReason` → `unavailableReason` ("Choose files" stays focusable, aria-disabled).
- The message `rule.fieldFirst` is removed (RuleBuilder shows the test once the field is chosen).

**Added:** QuantityStepper `maxReason` / `minReason` (and the messages `quantity.atMax`, `quantity.atMin`): at a limit − / + stays focusable and says why in a tooltip and a line under the field. HierarchyChart `emptyAction`; LinkSuggestions `emptyText` (`suggestions.empty`); DefinedForm `loading` and an empty state (`definedForm.empty`). Skeletons stay visible on sunken surfaces. MaskedValue's refusals are a neutral line under the value.

P5.93: Diagram (`@veljaos/ui/diagram`) never shows React Flow's credit link. The `hideAttribution` prop is removed — delete it where you pass it; the link is now always hidden (React Flow's credit stays in THIRD-PARTY-NOTICES.md).

P5.93: CodeBlock (`@veljaos/ui`) and syntax highlighting (`@veljaos/ui/code`, `<CodeHighlighting>`, Shiki). Trace and the assistant's work patterns (Reasoning, ChainOfThought, Plan, Queue, Task, Subagent, Sources). AssistantAnswer: a `code` block kind and `work`. HealthList: `lastError.detail` / `detailLanguage`. Diagram: a run step's `log` / `logLanguage`.

Migration: AssistantAnswer's `sources` block is now one line "Used N records" that opens into the links (it was an always-open numbered list), and `AnswerSourcesBlock.title` is a `string` (it was a ReactNode) — pass plain text. The message `assistant.sources` is no longer used by AssistantAnswer.

### P5.93 (helper c) — migration notes

- **Toasts:** every `notice` toast now has a close button, also success and info. Nothing to change
  in calls. For a routine action in a till or on a floor plan, drop the toast and answer in place:
  a line's `state`, `CartPanel` `undo={{ message, onUndo, after }}` or `<InlineUndo message onUndo />`.
- **CatalogPicker:** with one choice there is no footer and no Cancel button any more (the header's
  X closes it); tests that pressed "Cancel" press the X ("Close"). The link back from a level is a
  link-styled button whose name is still "Back to …"; pass `topLabel` ("All services") to name the
  top level (default `messages['catalog.top']`, "All").
- **IconButton, CompactIconButton, dialogs' close buttons and other icon buttons** no longer carry
  a `title` attribute; their label shows in the library's Tooltip. Tests that read `title` read the
  accessible name instead.
- **EmailPreview:** `from` and `to` also take `{ name, address }` (`EmailAddress`); a string still
  works.
- **SidePanels:** the gap under a panel's header is 16px (was 12px when open).
- No public prop was removed.

P5.93 (helper d) — breaking changes and how to migrate:

- **ReceiptFinder:** one search field instead of number, date and total. `onSearch` now receives the typed text (`onSearch(text: string)`, trimmed, after 300ms of quiet or at once on Enter) instead of a `ReceiptQuery`; read the text yourself (a date with `format.parseDate`, an amount with `format.parseNumber`, otherwise the receipt's number). `defaultQuery` is replaced by `defaultSearch?: string`; the `ReceiptQuery` type is removed. New: `searchDelay`.
- **NameConflictDialog:** the answers are buttons and one press answers (`onResolve` is called on the press); the radio group and Continue are gone, and so is `defaultChoice` (Keep both is always the default, focused). `defaultApplyToAll` now ticks "Do this for the other N conflicts". New: `ConflictFile.thumbnail`, `layout`.
- **ShareDialog:** same props (new `layout`); the link is created by choosing "Anyone with the link" under General access and turned off by choosing "Restricted" (one confirmation) — there is no "Create link" or "Revoke link" button any more; the access level and Remove access are in one menu per person.
- **PaymentDialog:** same props; the ways other than the first cash and card way are now in an "Other…" menu (tests that pressed e.g. "Cheque" directly open "Other…" first).
- **ValueComparison:** numeric columns are no longer end-aligned. While choosing, identical rows are hidden behind "Show identical fields" (`defaultShowIdentical` to show them) and a merged-record preview appears with `onChoose` (`preview={false}` to hide it). New: `onChooseAll`, `preview`, `previewTitle`, `comparisonRowsShown`, `mergedFields`, `MergedField`.
- **ProductStock:** new optional `label`; a warning or danger stock now shows a state line ("Low stock" / "Out of stock" by default) over its `text` — write `text` as the detail ("3 left"), not "Low stock: 3".
- **Messages:** removed `conflict.choice`, `conflict.replaceHint`, `conflict.skipHint`, `conflict.continue`, `conflict.applyToAll` (now `conflict.applyToOthers(count, countText)`, the others' count), `sharing.levelOf` (now `sharing.levelMenu(level, name)`), `sharing.remove` (now `sharing.removeAccess`), `sharing.link`, `sharing.linkNone`, `sharing.createLink`, `receiptFinder.searchBy`, `receiptFinder.orSearchBy`, `receiptFinder.number`, `receiptFinder.date`, `receiptFinder.total`, `receiptFinder.search`. Added: `stateLine.unavailable`, `stateLine.locked`, `pos.lowStock`, `pos.outOfStock`, `payment.other`, `payment.doneDetails`, `receiptFinder.searchLabel`, `receiptFinder.orSearch`, `receiptFinder.searchHint`, `comparison.kept`, `comparison.keepAll`, `comparison.source`, `comparison.showIdentical`, `comparison.preview`, `comparison.notChosen`, `conflict.replaceUnavailable`, `conflict.applyToOthers`, `sharing.levelMenu`, `sharing.removeAccess`, `sharing.general`, `sharing.restricted`, `sharing.restrictedHint`, `sharing.anyone`, `sharing.anyoneHint`, `sharing.copied`. Changed English texts: `conflict.title` ("Keep both files?"), `conflict.message`, `conflict.keepBothHint`, `sharing.add`, `sharing.addButton` ("Invite"), `sharing.who`, `sharing.linkAddress`, `sharing.revokeLink`, `sharing.revokeTitle`, `sharing.revokeMessage`. An application with its own messages adds the new keys and drops the removed ones.

`@veljaos/ui/map`: the base map prop is now `baseLayer` (P5.93 item 37). `AreaMap`, `LocationCheck` and `RegionChart` take `baseLayer` instead of `tiles`, and the type `MapTiles` is now `MapBaseLayer`, with a new optional `maxZoom` (the deepest zoom the provider serves, default 18).

Migration: rename the prop and the type — `<AreaMap tiles={{ url, attribution, urlDark }} />` becomes `<AreaMap baseLayer={{ url, attribution, urlDark, maxZoom: 19 }} />`; `import type { MapTiles }` becomes `import type { MapBaseLayer }`. The base map stays off by default; its provider, key and usage terms are the application's.

ReplyComposer's mode switch is now a segmented control: tests that looked for the buttons "Reply" / "Internal note" with `aria-pressed` find radios (`getByRole('radio', { name: 'Reply' })`, checked).

RuleBuilder (P5.93 item 46) — breaking: a rule has branches.

`RuleDraft` was `{ trigger, join, conditions, actions }`; it is now
`{ trigger, branches: RuleBranch[], otherwise: RuleAction[] | null }`, where
`RuleBranch` is `{ id, join, conditions, actions }` — the first branch is "If", the others
"Else if" (tried in order), and `otherwise` is "Else" (null when the rule has none).

Migrate a stored rule:

```ts
const draft: RuleDraft = {
  trigger: old.trigger,
  branches: [{ id: 'b1', join: old.join, conditions: old.conditions, actions: old.actions }],
  otherwise: null,
}
```

and back, while a rule has one branch and no Else: `const { join, conditions, actions } = draft.branches[0]`.

- `addRuleCondition(draft, containerId?)`, `addRuleGroup(draft, branchId?)`, `addRuleAction(draft, branchId?)`
  and `setRuleJoin(draft, join, containerId?)` take a branch's (or a group's) id; without it they act on the
  first branch, as before. `addRuleAction(draft, RULE_OTHERWISE)` adds to Else.
- New: `RuleBranch`, `RULE_OTHERWISE`, `addRuleBranch`, `addRuleOtherwise`, `moveRuleItemTo`.
- `rulePlace` reports `branchId`, and `list: 'branches'` for an Else-if block.
- `removeRuleItem` also removes an Else-if branch or Else (`RULE_OTHERWISE`); the first branch stays.
- Removed: `moveFocusTarget` (internal; the move buttons became one menu per item).
- Messages: removed `rule.field`, `rule.operator`, `rule.value`, `rule.action`; added `rule.elseIf`,
  `rule.else`, `rule.branchName`, `rule.fieldOf`, `rule.operatorOf`, `rule.valueOf`, `rule.actionOf`,
  `rule.chooseTrigger`, `rule.chooseField`, `rule.chooseTest`, `rule.chooseAction`, `rule.addElseIf`,
  `rule.addElse`, `rule.itemMenu`, `rule.moved`. An application with its own messages adds them.

Pivot (P5.93 item 45): `views` (the application's suggested views, `PivotView`); the chooser is closed
by default (`defaultFieldsOpen` now defaults to false on every screen) and opens as a sheet; the
start column beside the grid is gone; `PIVOT_AREAS` is now ordered rows, columns, values, filters;
"Expand all" and "Collapse all" are one button. New exports: `PivotView`, `PivotZone`,
`PivotSummaryParts`, `sameLayout`, `pivotViewOf`, `pivotSummaryParts`, `acceptsField`, `dropField`.
New messages: `pivot.views`, `pivot.summary`, `pivot.summaryValue`, `pivot.summaryFilter`,
`pivot.summaryFilters`, `pivot.summaryMany`, `pivot.moved`, `pivot.removedField`.

Charts (P5.93 item 42): every chart (and RegionChart) takes `toggle` — a ChartSeriesToggle shown as
the interactive header (key figures at the header's end, under the title on phones). Pass a
ChartSeriesToggle there instead of in `controls`.

# Changeset notes from helper h (P5.93 items 43 and 44)

Not breaking. New: seven charts in `@veljaos/ui/charts` (CandlestickChart, FunnelChart, ScatterChart, Heatmap, SankeyChart, MatrixChart, Treemap) with their helpers; `loadSerbiaBoundaries` and the TopoJSON reader in `@veljaos/ui/map`; RegionChart `attribution`. `regionStep` & co. now come from the charts' step helpers (same names and behaviour; a break beyond the fourth no longer makes a sixth step). New message keys: `chart.itemKeys`, `chart.open`, `chart.high`, `chart.low`, `chart.close`, `chart.rising`, `chart.falling`, `chart.cellName`, `chart.flow`, `chart.from`, `chart.to`, `chart.none`, `chart.more` — an application with its own complete `messages` adds them. `@veljaos/ui/map` now ships boundary data under the ODbL 1.0 (notice in THIRD-PARTY-NOTICES.md).
