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
   * threshold ("More than 10,000 rows"). Every message that shows a number receives the number
   * (for plural rules) and its text already written by the provider's `format.number` (P4.9).
   */
  'table.count': (count: number, text: string, exact: boolean) => string
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
  'field.selectedCount': (count: number, text: string) => string
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
  /** FilterBar: the empty value of a choice filter, meaning no filter ("All"; P4.9). */
  'filter.all': string
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
  'period.quarter': (quarter: number, text: string, year: string) => string
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
  /** The reason field of ReasonConfirmDialog, when the application gives no label. */
  'confirm.reason': string
  /** ReasonConfirmDialog's free text beside a list of reasons. */
  'confirm.reasonDetails': string
  /** The button that closes a dialog or a drawer. */
  'dialog.close': string
  /** A DueDate that is paid or otherwise closed. */
  'due.settled': string
  /** A DueDate that has passed, with the number of days. */
  'due.overdue': (days: number, text: string) => string
  /** A DueDate that is today. */
  'due.today': string
  /** A DueDate within the warning days, with the number of days left. */
  'due.inDays': (days: number, text: string) => string
  /** The button that opens the actions that do not fit. */
  'action.more': string
  /** Names the menu button of a split action (its main action's label). */
  'action.moreOptions': (label: string) => string
  /** How many rows are selected, in a BulkActionBar. */
  'bulk.selected': (count: number, text: string) => string
  /** Offers to select every row of the result. */
  'bulk.selectAll': (total: number, text: string) => string
  /** The button that clears the selection. */
  'bulk.clear': string
  /** The question before an action on the selection. */
  'bulk.confirmTitle': (count: number, text: string) => string
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
  'grid.cell': (column: string, line: number, text: string) => string
  /** EditableGrid: a message about one cell under its row: "Quantity: Enter a number". */
  'grid.cellMessage': (column: string, text: string) => string
  /** EditableGrid: the button that adds a line at the end. */
  'grid.addLine': string
  /** EditableGrid: the remove button of a line (its number). */
  'grid.removeLine': (line: number, text: string) => string
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
  'shell.notifications': (unread: number, text: string) => string
  /** AppShell: the user menu's button. */
  'shell.userMenu': string
  /** AppShell: names the row of module tabs. */
  'shell.moduleTabs': string
  /** Company switcher: the button's name (`company` is the current one), and its list. */
  'shell.switchCompany': (company: string) => string
  'shell.companies': string
  /** Company switcher: the search field shown when there are many companies, and its hint. */
  'shell.findCompany': string
  'shell.findCompanyHint': string
  /** Company switcher: the sections of the list. */
  'shell.pinnedCompanies': string
  'shell.recentCompanies': string
  'shell.allCompanies': string
  /** Company switcher: no company matches the search (`query` as typed). */
  'shell.noCompany': (query: string) => string
  /** The command palette's entry that opens the company switcher. */
  'shell.switchCompanyCommand': string
  /** The title of the full-screen company sheet on phones. */
  'shell.switchCompanyTitle': string
  /** NotificationsPanel and NotificationsPage: the title, the unread count (`text` formatted). */
  'notifications.title': string
  'notifications.unreadCount': (count: number, text: string) => string
  /** Names an unread notification for assistive technology (beside its dot). */
  'notifications.unread': string
  'notifications.markAllRead': string
  /** Mark one notification read or unread (`title` is the notification's). */
  'notifications.markRead': (title: string) => string
  'notifications.markUnread': (title: string) => string
  /** The panel's link to the NotificationsPage. */
  'notifications.viewAll': string
  /** NotificationsPage: the header's link to the notification settings. */
  'notifications.settings': string
  /** NotificationsPage: the All / Unread toggle, its name, and the empty filters' placeholder. */
  'notifications.all': string
  'notifications.unreadFilter': string
  'notifications.show': string
  /** NotificationsPage: the day headings. */
  'notifications.today': string
  'notifications.yesterday': string
  /** Nothing at all, and nothing that matches the filters. */
  'notifications.emptyTitle': string
  'notifications.emptyDescription': string
  'notifications.noMatchTitle': string
  /** Launchpad, editing mode: the buttons of a module card (`name` is the module's). */
  'launchpad.moveEarlier': (name: string) => string
  'launchpad.moveLater': (name: string) => string
  'launchpad.hide': (name: string) => string
  /** Launchpad, editing mode: the title over the hidden modules, and their "Show" button. */
  'launchpad.hidden': (count: number, text: string) => string
  'launchpad.showLabel': string
  /** ListPage: names the row of saved views. */
  'list.views': string
  /**
   * ListPage: the saved views that do not fit as tabs, in a "More" menu (desktop); on phones the
   * one select's text ("View: All"; `view` is the current view's name) and its search field,
   * shown above 7 views (P4.9).
   */
  'list.moreViews': string
  'list.view': (view: string) => string
  'list.findView': string
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
  'lifecycle.step': (
    step: number,
    stepText: string,
    total: number,
    totalText: string,
    label: string,
  ) => string
  /** DocumentPage: the button that hides or shows the side panels, and the panels' name. */
  'document.hidePanels': string
  'document.showPanels': string
  'document.panels': string
  /** Side-panel lists (ActivityList): show every entry ("Show all 5"), then only the latest. */
  'panel.showAll': (count: number, countText: string) => string
  'panel.showFewer': string
  /** ChangeableValue: the button that turns a value the system filled in into its field. */
  'value.change': (label: string) => string
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
  /** A suspended page about the user's own account (the default subject). */
  'status.suspendedTitle': string
  'status.suspendedDescription': string
  /** A suspended page about a company the user works for (P4.9). */
  'status.suspendedCompanyTitle': string
  /** `company` is the company's name, from the application. */
  'status.suspendedCompanyDescription': (company: string) => string
  /** The accessible name of a hidden module's "Show" button. */
  'launchpad.show': (name: string) => string
  // ── P5 group B ──
  /** OfflineIndicator: announced politely once the connection returns. */
  'connection.online': string
  /** ConnectionState: a draft saved on this device only; `time` is `format.time`, or null. */
  'connection.local': (time: string | null) => string
  /** ConnectionState: the draft is being sent. */
  'connection.sending': string
  /** ConnectionState: the draft has been sent; `time` is `format.time`, or null. */
  'connection.sent': (time: string | null) => string
  /** ConnectionState: sending failed (the draft is still on this device). */
  'connection.failed': string
  /** ConnectionState: the button that sends a draft again. */
  'connection.retry': string
  /** EnvironmentMarker: read before the environment's name ("Environment: Sandbox"). */
  'environment.prefix': string
  /** ImpersonationBar: the bar's name as a region. */
  'impersonation.region': string
  /** ImpersonationBar: whose account is being used; `name` from the application. */
  'impersonation.viewingAs': (name: string) => string
  /** ImpersonationBar: why; `reason` from the application. */
  'impersonation.reason': (reason: string) => string
  /** ImpersonationBar: the time left; `text` is the minutes written by `format.number`. */
  'impersonation.minutesLeft': (minutes: number, text: string) => string
  /** ImpersonationBar: the session's time is over. */
  'impersonation.ended': string
  /** ImpersonationBar: the action that ends the session. */
  'impersonation.exit': string
  /** StatusTimeline: a step that failed, for assistive technology (its reason is shown). */
  'timeline.failed': string
  /** StatusTimeline: the name of the next-step block under the current state. */
  'timeline.next': string
  /** JobProgress: how far it has come ("312 of 1.284"), both counts through `format.number`. */
  'job.progress': (done: number, doneText: string, total: number, totalText: string) => string
  /** JobProgress: stops the job; and while it stops. */
  'job.cancel': string
  'job.cancelling': string
  /** JobProgress: the report's heading after the job finished or was cancelled. */
  'job.finished': string
  'job.cancelled': string
  /** JobProgress: the heading of the list of items that failed, with their reasons. */
  'job.failures': string
  /** FileDropzone: the button that opens the file dialog (one file or several). */
  'file.choose': (multiple: boolean) => string
  /** FileDropzone: beside the button, where dropping is possible. */
  'file.drop': (multiple: boolean) => string
  /** FileDropzone: the size limit before choosing; `limit` is the application's text ("10 MB"). */
  'file.maxSize': (limit: string) => string
  /** FileDropzone: a file of a type not accepted; `accepted` is the application's text. */
  'file.rejectedType': (name: string, accepted: string) => string
  /** FileDropzone: a file over the size limit; `limit` is the application's text ("10 MB"). */
  'file.rejectedSize': (name: string, limit: string) => string
  /** FileDropzone: a file beyond the number allowed; `text` is `max` through `format.number`. */
  'file.rejectedCount': (name: string, max: number, text: string) => string
  /**
   * AttachmentList: uploading, and what comes next; `percent` through `format.percent`, or null
   * while the progress is not known.
   */
  'attachment.uploading': (percent: string | null) => string
  /** AttachmentList: being checked for viruses, and what comes next. */
  'attachment.scanning': string
  /** AttachmentList: blocked after the check, and what to do. */
  'attachment.quarantined': string
  /** AttachmentList: the upload failed (the application's reason follows). */
  'attachment.failed': string
  /** AttachmentList: the accessible names of a file's buttons; `name` is the file's name. */
  'attachment.download': (name: string) => string
  'attachment.remove': (name: string) => string
  'attachment.retry': (name: string) => string
  /** AttachmentList: the visible label of the retry button. */
  'attachment.retryLabel': string
  /** AttachmentList: a list without files. */
  'attachment.none': string
  /** DocumentFrame: the toolbar's name and its buttons. */
  'frame.toolbar': string
  'frame.previousPage': string
  'frame.nextPage': string
  'frame.zoomIn': string
  'frame.zoomOut': string
  /** DocumentFrame: "Page 3 of 12", both numbers through `format.number`. */
  'frame.page': (page: number, pageText: string, count: number, countText: string) => string
  /** DocumentFrame: the zoom level for assistive technology; `text` through `format.percent`. */
  'frame.zoom': (text: string) => string
  /** DocumentFrame: while the viewer loads; when it failed, or did not answer in time. */
  'frame.loading': string
  'frame.error': string
  'frame.timeout': string
  /** DocumentFrame: loads the viewer again. */
  'frame.retry': string
}
