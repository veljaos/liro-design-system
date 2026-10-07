/**
 * The Design System's own strings: every text a component shows on its own, and nothing else
 * (BUILD-PLAN section 5). All other text comes in through props. A value is a string, or a
 * function where the text depends on a value, so that the application can supply its own
 * plural and gender rules. English defaults: `messages.en.ts`.
 */
export interface LiroMessages {
  /** Paging: go to the next rows. */
  'table.next': string
  /** Paging: go to the previous rows. */
  'table.previous': string
  /**
   * The number of rows: exact ("1,234 rows"), or a lower bound when the count stopped at a
   * threshold ("More than 10,000 rows").
   */
  'table.count': (count: number, exact: boolean) => string
  /** A table that has no rows yet. */
  'table.noRows': string
  'table.updating': string
  /** A table whose filters match no row. */
  'table.noMatch': string
  /** The action of the "no rows match" state that clears the table's filters. */
  'table.clearFilters': string
  /** The checkbox in the header that selects every row shown. */
  'table.selectAll': string
  /** The checkbox of one row; `label` names the row (from the application). */
  'table.selectRow': (label: string) => string
  /** The button that opens a row's actions menu; `label` names the row. */
  'table.rowActions': (label: string) => string
  /** The handle that resizes a column; `label` is the column's name. */
  'table.resizeColumn': (label: string) => string
  /** The resize popover's button that narrows the column; `label` is the column's name. */
  'table.narrower': (label: string) => string
  /** The resize popover's button that widens the column; `label` is the column's name. */
  'table.wider': (label: string) => string
  /** Marks a required field. */
  'field.required': string
  /** Announces a read-only field. */
  'field.readOnly': string
  /** A number or amount field whose text cannot be read as a number (shown under the field). */
  'field.invalidNumber': string
  /** A date field whose text cannot be read as a date (shown under the field). */
  'field.invalidDate': string
  /** A date range whose end is before its start (shown under the field). */
  'field.invalidRange': string
  /** The button that opens a date field's calendar. */
  'field.openCalendar': string
  /** Names the first date of a range for assistive technology. */
  'field.rangeStart': string
  /** Names the last date of a range for assistive technology. */
  'field.rangeEnd': string
  /** A searching field is waiting for its results. */
  'field.loading': string
  /** A searching field found nothing for the text typed. */
  'field.noResults': string
  /** The button that removes one chosen value (its label) from a multiple choice. */
  'field.remove': (label: string) => string
  'field.selectedCount': (count: number) => string
  /** The button that empties a field (a clearable SelectField). */
  'field.clear': string
  /** FilterBar: the search field's placeholder and accessible name. */
  'filter.search': string
  /** FilterBar: the button that empties the search field. */
  'filter.clearSearch': string
  /** FilterBar: the button that opens the filters drawer, and the drawer's title. */
  'filter.filters': string
  /** FilterBar: the button that clears every filter of the bar. */
  'filter.clearAll': string
  /** FilterBar: an active filter on its pill, its label and its value: "Status: Sent". */
  'filter.pill': (label: string, value: string) => string
  /** FilterBar: the button that removes one active filter (its label). */
  'filter.remove': (label: string) => string
  /** FilterBar: the two choices of a yes / no filter. */
  'filter.yes': string
  'filter.no': string
  /**
   * FilterBar: the short texts inside the two ends of a number range, at their start, and the
   * empty date range's placeholders ("From – To").
   */
  'filter.from': string
  'filter.to': string
  /**
   * FilterBar: the names of the two ends of a number range, with the filter's label and, for an
   * amount, its currency ("Total from (EUR)").
   */
  'filter.rangeFrom': (label: string, currency?: string) => string
  'filter.rangeTo': (label: string, currency?: string) => string
  /** FilterBar: an amount range's visible label, with its currency once ("Total (EUR)"). */
  'filter.rangeLabel': (label: string, currency: string) => string
  /** FilterBar on phones: the sort button's text while nothing is sorted, and the start of its name. */
  'filter.sort': string
  /** FilterBar on phones: the two directions in the sort menu. */
  'filter.ascending': string
  'filter.descending': string
  /** Names the breadcrumb trail for assistive technology. */
  'breadcrumbs.label': string
  /** Names the command palette and its search field. */
  'command.title': string
  /** The placeholder of the command palette's search field. */
  'command.placeholder': string
  /** The heading of the palette's actions. */
  'command.actions': string
  /** The heading of the palette's places to go. */
  'command.navigation': string
  /** The palette found nothing. */
  'command.noResults': string
  /** The calendar's button that shows the previous month. */
  'calendar.previousMonth': string
  /** The calendar's button that shows the next month. */
  'calendar.nextMonth': string
  /** The month grid's button that shows the previous year. */
  'calendar.previousYear': string
  /** The month grid's button that shows the next year. */
  'calendar.nextYear': string
  /** Names the group of the calendar's month buttons. */
  'calendar.navigation': string
  /** A quarter and its year's name, e.g. "Q1 2025/26". quarter is 1 … 4. */
  'period.quarter': (quarter: number, year: string) => string
  /** Period presets. */
  'period.today': string
  'period.thisWeek': string
  'period.thisMonth': string
  'period.lastMonth': string
  'period.thisQuarter': string
  'period.lastQuarter': string
  'period.yearToDate': string
  'period.lastYear': string
  /** Removes the chosen period: all periods. */
  'period.clear': string
  /** A period field with no period chosen: all periods. */
  'period.all': string
  /** The caption over the calendar of a period field. */
  'period.customRange': string
  /** The button that dismisses a confirmation without acting. */
  'dialog.cancel': string
  /** The default question of a delete confirmation. */
  'confirm.deleteTitle': string
  /** The default text of a delete confirmation. */
  'confirm.deleteMessage': string
  /** The default label of a delete confirmation's button. */
  'confirm.deleteLabel': string
  /** The label of the field where the user types `text` to confirm an irreversible action. */
  'confirm.typeToConfirm': (text: string) => string
  /** The button that closes a dialog or a drawer. */
  'dialog.close': string
  /** A DueDate that is paid or otherwise closed. */
  'due.settled': string
  /** A DueDate that has passed, with the number of days. */
  'due.overdue': (days: number) => string
  /** A DueDate that is today. */
  'due.today': string
  /** A DueDate within the warning days, with the number of days left. */
  'due.inDays': (days: number) => string
  /** The button that opens the actions that do not fit. */
  'action.more': string
  /** Names the menu button of a split action (its main action's label). */
  'action.moreOptions': (label: string) => string
  /** How many rows are selected, in a BulkActionBar. */
  'bulk.selected': (count: number) => string
  /** Offers to select every row of the result. */
  'bulk.selectAll': (total: number) => string
  /** The button that clears the selection. */
  'bulk.clear': string
  /** The question before an action on the selection. */
  'bulk.confirmTitle': (count: number) => string
  /** The button that closes a dismissible alert or banner. */
  'alert.close': string
  /** EmptyState 'empty': nothing here yet. */
  'empty.emptyTitle': string
  'empty.emptyDescription': string
  /** EmptyState 'no-results': nothing matches the search or the filters. */
  'empty.noResultsTitle': string
  'empty.noResultsDescription': string
  /** EmptyState 'error' and ErrorState: loading failed. */
  'empty.errorTitle': string
  'empty.errorDescription': string
  /** Before the case number of an ErrorState. */
  'empty.caseId': string
  /** The button that closes a toast. */
  'notice.close': string
  /** Names the region where toasts appear, for assistive technology. */
  'notice.region': string
  /** Tells assistive technology that a step of a Stepper is completed. */
  'stepper.completed': string
  /** An action that cannot be used, with the reason it is given. */
  'action.unavailable': (reason: string) => string
  /** EditableGrid: each cell's accessible name, its column and line: "Quantity, line 3". */
  'grid.cell': (column: string, line: number) => string
  /** EditableGrid: a message about one cell under its row: "Quantity: Enter a number". */
  'grid.cellMessage': (column: string, text: string) => string
  /** EditableGrid: the button that adds a line at the end. */
  'grid.addLine': string
  /** EditableGrid: the remove button of a line (its number). */
  'grid.removeLine': (line: number) => string
  /** EditableGrid: the names of the two row shortcuts shown beside "Add line". */
  'grid.insertLine': string
  'grid.deleteLine': string
  /**
   * EditableGrid: the keys of the row shortcuts as the user sees them. The application gives "⌘"
   * on a Mac; the grid accepts Ctrl and Cmd on every system.
   */
  'grid.modifierKey': string
  'grid.enterKey': string
  'grid.deleteKey': string
  /** FormTabs: the name of a tab whose fields have errors (its label). */
  'form.hasErrors': (label: string) => string
  /** FormActions: the bottom bar's note while the form has unsaved changes. */
  'form.unsaved': string
  /** useUnsavedChangesGuard: the question before leaving a form with unsaved changes. */
  'form.leaveTitle': string
  'form.leaveMessage': string
  /** useUnsavedChangesGuard: leave (and lose the changes), or stay on the form. */
  'form.leave': string
  'form.stay': string
  /** FormWizard: the buttons that go to the previous and the next step, and finish. */
  'wizard.back': string
  'wizard.next': string
  'wizard.finish': string
  /** The connection is lost. */
  'connection.offline': string
  /** AppShell: the link that skips the header and goes to the page's content. */
  'shell.skipToContent': string
  /** AppShell: the search button that opens the command palette. */
  'shell.search': string
  /** AppShell: the notifications button; `unread` is how many are unread (0: none). */
  'shell.notifications': (unread: number) => string
  /** AppShell: the user menu's button. */
  'shell.userMenu': string
  /** AppShell: names the row of module tabs. */
  'shell.moduleTabs': string
  /** Company switcher: the button's name (`company` is the current one), and its list. */
  'shell.switchCompany': (company: string) => string
  'shell.companies': string
  /** Company switcher: the search field shown when there are many companies. */
  'shell.findCompany': string
  /** Company switcher: how many items wait in a company. */
  'shell.waiting': (count: number) => string
  /** Launchpad, editing mode: the buttons of a module card (`name` is the module's). */
  'launchpad.moveEarlier': (name: string) => string
  'launchpad.moveLater': (name: string) => string
  'launchpad.hide': (name: string) => string
  /** Launchpad, editing mode: the title over the hidden modules, and their "Show" button. */
  'launchpad.hidden': (count: number) => string
  'launchpad.showLabel': string
  /** ListPage: names the row of saved views. */
  'list.views': string
  /** ColumnChooser: its button, its title, and the move buttons of a column (`label`). */
  'columns.button': string
  'columns.title': string
  'columns.moveUp': (label: string) => string
  'columns.moveDown': (label: string) => string
  /** QuickPreview: opens the record's full page. */
  'preview.open': string
  /** WorklistPage, below 62em: back to the list, and on to the next item. */
  'worklist.back': string
  'worklist.next': string
  /** WorklistPage, from 62em: names the detail pane. */
  'worklist.detail': string
  /** PageHeader's back button: its name and tooltip (`list` is the list's name). */
  'page.backTo': (list: string) => string
  /** SectionBar: names the row of section links. */
  'page.sections': string
  /** LifecycleBar on phones: "Step 3 of 4: Sent to SEF". */
  'lifecycle.step': (step: number, total: number, label: string) => string
  /** DocumentPage: the button that hides or shows the side panels, and the panels' name. */
  'document.hidePanels': string
  'document.showPanels': string
  'document.panels': string
  /** Charts: the button that shows the values as a table, and back as a chart. */
  'chart.showTable': string
  'chart.showChart': string
  /** Charts (P4.7a): no values in the period; a failed load and its retry; loading. */
  'chart.noData': string
  'chart.error': string
  'chart.retry': string
  'chart.loading': string
  /**
   * Axis ticks written short (P4.7a): `value` is the tick already divided and formatted
   * ("1,5"); the words are the Core's ("1,5 hilj.", "1,5 mil.").
   */
  'chart.thousands': (value: string) => string
  'chart.millions': (value: string) => string
  'chart.billions': (value: string) => string
  /** ReportPage: run the report; edit its parameters again; names the parameters. */
  'report.run': string
  'report.edit': string
  'report.parameters': string
  /** SettingsPage: a setting saved (shown in its row). */
  'settings.saved': string
  /** Status pages (P4.7): the default title and description of each kind. */
  'status.unauthenticatedTitle': string
  'status.unauthenticatedDescription': string
  'status.planRequiredTitle': string
  'status.planRequiredDescription': string
  'status.forbiddenTitle': string
  'status.forbiddenDescription': string
  'status.notFoundTitle': string
  'status.notFoundDescription': string
  'status.errorTitle': string
  'status.errorDescription': string
  'status.maintenanceTitle': string
  'status.maintenanceDescription': string
  'status.suspendedTitle': string
  'status.suspendedDescription': string
  /** The accessible name of a hidden module's "Show" button. */
  'launchpad.show': (name: string) => string
}
