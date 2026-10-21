export { Accordion } from './components/accordion'
export type { AccordionProps, AccordionSection } from './components/accordion'
export { ActionGroup, UnavailableAction } from './components/actions'
export type { ActionGroupProps, ActionItem, UnavailableActionProps } from './components/actions'
export { asksFirst, BulkActionBar } from './components/bulk-action-bar'
export type { BulkAction, BulkActionBarProps } from './components/bulk-action-bar'
export { Alert, alertRole, Banner } from './components/alert'
export type { AlertProps, AlertTone, BannerProps } from './components/alert'
export { BrandLockup, lockupName } from './components/brand-lockup'
export type { BrandLockupProps, BrandLockupSize } from './components/brand-lockup'
export { Button, CompactIconButton, IconButton } from './components/button'
export type { ButtonProps, CompactIconButtonProps, IconButtonProps } from './components/button'
export { Card, KeyValueList, keyValueLines, SectionCard } from './components/cards'
export type {
  CardProps,
  KeyValueGroup,
  KeyValueItem,
  KeyValueLayout,
  KeyValueListProps,
  SectionCardProps,
} from './components/cards'
export { CheckboxField, SwitchField } from './components/checkbox-field'
export { FilterBar } from './components/filter-bar'
export type { FilterBarProps } from './components/filter-bar'
export {
  clearFilters,
  emptyFilterValue,
  filterValueText,
  isFilterSet,
  rangeText,
  sortButtonText,
} from './components/filter-logic'
export type {
  FilterDefinition,
  FilterValue,
  NumberRange,
  SortColumn,
} from './components/filter-logic'
export type { CheckboxFieldProps, SwitchFieldProps } from './components/checkbox-field'
export { ComboboxField } from './components/combobox-field'
export type { ComboboxFieldProps, ComboboxOption } from './components/combobox-field'
export { CommandPalette } from './components/command-palette'
export type { CommandItem, CommandPaletteProps } from './components/command-palette'
export { DateField, DateRangeField } from './components/date-field'
export type { DateFieldProps, DateRange, DateRangeFieldProps } from './components/date-field'
export {
  ConfirmDialog,
  confirmFamily,
  confirmTone,
  DeleteConfirmDialog,
  IrreversibleConfirmDialog,
  ReasonConfirmDialog,
} from './components/confirm-dialog'
export type {
  ConfirmAnswer,
  ConfirmDialogProps,
  ConfirmReason,
  DeleteConfirmDialogProps,
  IrreversibleConfirmDialogProps,
  ReasonConfirmDialogProps,
} from './components/confirm-dialog'
export { DataTable } from './components/data-table'
export { EditableGrid } from './components/editable-grid'
export type { EditableGridColumn, EditableGridProps, GridTotal } from './components/editable-grid'
export { gridKeyAction, orderMessages } from './components/editable-grid-logic'
export type {
  GridAction,
  GridKey,
  GridMessage,
  GridPosition,
} from './components/editable-grid-logic'
export {
  FormActions,
  FormFullWidth,
  FormGrid,
  FormSection,
  FormTabs,
  FormWizard,
  useUnsavedChangesGuard,
} from './components/form-layout'
export type {
  FormActionsProps,
  FormGridProps,
  FormSectionProps,
  FormTab,
  FormTabsProps,
  FormWizardProps,
  UnsavedChangesGuard,
  WizardStep,
} from './components/form-layout'
export {
  bottomBarShown,
  firstErrorTab,
  focusFirstInvalid,
  wizardStepTarget,
} from './components/form-logic'
export type { StickyActions } from './components/form-logic'
export type {
  DataTableColumn,
  DataTableHandle,
  DataTableMobile,
  DataTableProps,
} from './components/data-table'
export {
  ariaSort,
  clampWidth,
  COUNT_THRESHOLD,
  DESCRIPTION_MIN_WIDTH,
  formatCount,
  hasActiveFilters,
  isActiveFilterValue,
  MAX_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  nextSort,
  RESIZE_STEP,
  RESIZE_STEP_LARGE,
  widthAfterDrag,
  widthAfterKey,
} from './components/data-table-logic'
export type { DataTableFilters, DataTableSort } from './components/data-table-logic'
export { Dialog, Drawer } from './components/dialog'
export type { DialogProps, DrawerProps } from './components/dialog'
export { DropdownMenu } from './components/dropdown-menu'
export type { DropdownMenuProps, MenuEntry } from './components/dropdown-menu'
export {
  DateRangeText,
  DateText,
  daysBetween,
  DueDate,
  dueState,
  MoneyText,
  NumberText,
} from './components/display-text'
export type {
  DateRangeTextProps,
  DateTextProps,
  DueDateProps,
  MoneyTextProps,
  NumberTextProps,
} from './components/display-text'
export { EmptyState, ErrorState } from './components/empty-state'
export type {
  EmptyAction,
  EmptyStateProps,
  EmptyVariant,
  ErrorStateProps,
} from './components/empty-state'
export { Field } from './components/field'
export type { FieldBaseProps, FieldControl, FieldProps } from './components/field'
export { MonthField } from './components/month-field'
export type { MonthFieldProps } from './components/month-field'
export { MultiSelectField } from './components/multi-select-field'
export type { MultiSelectFieldProps } from './components/multi-select-field'
export { Breadcrumbs, CursorPagination, ShortcutHint, Tabs } from './components/navigation'
export type {
  BreadcrumbsProps,
  Crumb,
  CursorPaginationProps,
  ShortcutHintProps,
  TabItem,
  TabsProps,
} from './components/navigation'
export { MoneyField, NumberField } from './components/number-field'
export type { MoneyFieldProps, NumberFieldProps } from './components/number-field'
export { PeriodField } from './components/period-field'
export type { PeriodFieldProps } from './components/period-field'
export { PERIOD_PRESETS } from './components/period-logic'
export type { PeriodPreset, QuarterBasis } from './components/period-logic'
export { Popover, Tooltip } from './components/popover'
export { Spinner } from './components/spinner'
export type { SpinnerProps, SpinnerSize } from './components/spinner'
export type { PopoverProps, TooltipProps } from './components/popover'
export { initialsOf, PersonAvatar, PersonName } from './components/person'
export type { PersonAvatarProps, PersonNameProps } from './components/person'
export { notice, Toaster } from './components/notice'
export type { NoticeAction, NoticeKind, NoticeOptions, ToasterProps } from './components/notice'
export { compactStep, ProgressBar, Skeleton, Stepper, stepState } from './components/progress'
export type {
  ProgressBarProps,
  SkeletonProps,
  StepperProps,
  StepperStep,
} from './components/progress'
export { RadioGroupField } from './components/radio-group-field'
export type { RadioGroupFieldProps, RadioOption } from './components/radio-group-field'
export { SelectField } from './components/select-field'
export type { SelectFieldProps, SelectOption } from './components/select-field'
export { TextAreaField, TextField } from './components/text-field'
export type { TextAreaFieldProps, TextFieldProps } from './components/text-field'
export { FAMILY_NAMES, INTENT_NAMES, INTENTS } from './components/intents'
export { SETTLING_DELAY, SettlingValue } from './components/settling-value'
export type { SettlingValueProps } from './components/settling-value'
export { SplitAction } from './components/split-action'
export type { SplitActionProps } from './components/split-action'
export { StatusBadge, TONE_NAMES, toneFor } from './components/status-badge'
export type { StatusBadgeProps, Tone } from './components/status-badge'
export type { Emphasis, Family, IconComponent, Intent, IntentInfo } from './components/intents'
export {
  createFormat,
  dateFieldOrder,
  directionForLocale,
  formatDecimal,
  intlLocale,
  langAttribute,
  LiroProvider,
  localToday,
  messagesEn,
  NUMBER_SCHEMES,
  numberSchemeForLocale,
  parseDateText,
  parseDecimal,
  useLangAttribute,
  useLiro,
  weekStartsOnForLocale,
} from './provider'
export type {
  DatePart,
  LiroContextValue,
  LiroFormat,
  LiroMessages,
  LiroProviderProps,
  NumberScheme,
  Weekday,
} from './provider'
export {
  AppShell,
  COMPANY_SEARCH_THRESHOLD,
  companySections,
  matchingCompanies,
} from './templates/app-shell'
export type {
  AppShellProps,
  CompanySection,
  ModuleTab,
  ShellCompanies,
  ShellCompany,
  ShellNotifications,
  ShellUser,
} from './templates/app-shell'
export { NotificationsPanel } from './templates/notifications-panel'
export type { NotificationsPanelProps } from './templates/notifications-panel'
export { NotificationsPage } from './templates/notifications-page'
export type { NotificationFilter, NotificationsPageProps } from './templates/notifications-page'
export {
  filterNotifications,
  groupByDay,
  notificationDay,
  notificationFiltersActive,
} from './templates/notifications-logic'
export type {
  NotificationFilters,
  NotificationGroup,
  NotificationItem,
} from './templates/notifications-logic'
export { Launchpad } from './templates/launchpad'
export type { LaunchpadModule, LaunchpadProps } from './templates/launchpad'
export {
  dropModule,
  launchpadArrowTarget,
  launchpadDigitTarget,
  moveModule,
} from './templates/launchpad-logic'
export {
  ColumnChooser,
  ListPage,
  QuickPreview,
  splitViews,
  VIEW_SEARCH_THRESHOLD,
  VISIBLE_VIEWS,
} from './templates/list-page'
export type {
  ChooserColumn,
  ColumnChooserProps,
  ListPageProps,
  QuickPreviewProps,
  SavedView,
} from './templates/list-page'
export { WorklistPage, worklistPosition } from './templates/worklist-page'
export type { WorklistItem, WorklistPageProps } from './templates/worklist-page'
export { BackButton, PageHeader } from './templates/page-header'
export type { PageBack, PageHeaderProps } from './templates/page-header'
export { KeyFigures } from './components/key-figures'
export type { KeyFigure, KeyFiguresProps, KeyFigureTone } from './components/key-figures'
export { currentSection, SectionBar } from './components/section-bar'
export type { BarSection, SectionBarProps } from './components/section-bar'
export { DetailPage, RecordFormPage } from './templates/detail-page'
export type { DetailPageProps, DetailSection, RecordFormPageProps } from './templates/detail-page'
export { lifecycleState, LifecycleBar } from './components/lifecycle-bar'
export type { LifecycleBarProps, LifecycleStep, StepState } from './components/lifecycle-bar'
export { DocumentTotals } from './components/document-totals'
export type { DocumentTotalsProps, TotalsRow } from './components/document-totals'
export { SidePanels } from './components/side-panels'
export type { SidePanel, SidePanelsProps } from './components/side-panels'
export { ActivityList, RelatedDocuments } from './components/panel-lists'
export type {
  ActivityEntry,
  ActivityListProps,
  RelatedDocument,
  RelatedDocumentsProps,
} from './components/panel-lists'
export { ChangeableValue } from './components/changeable-value'
export type { ChangeableValueProps } from './components/changeable-value'
export { DocumentPage } from './templates/document-page'
export type { Counterparty, DocumentPageProps, DocumentSection } from './templates/document-page'
export { sparklinePoints, StatCard } from './components/stat-card'
export type { StatCardProps, StatChange } from './components/stat-card'
export { DashboardPage } from './templates/dashboard-page'
export type { DashboardPageProps } from './templates/dashboard-page'
export { ReportPage } from './templates/report-page'
export type { ReportPageProps, ReportParameterSummary } from './templates/report-page'
export { SettingsPage } from './templates/settings-page'
export type {
  SettingRow,
  SettingsGroup,
  SettingsPageProps,
  SettingsSection,
} from './templates/settings-page'
export { StatusPage, STATUS_KINDS, statusLook } from './templates/status-page'
export type {
  StatusAction,
  StatusKind,
  StatusPageProps,
  SuspendedSubject,
} from './templates/status-page'
export { AuthShell } from './templates/auth-shell'
export type { AuthShellProps } from './templates/auth-shell'
// ── P5 group F ──
export { CandidateList, chooseCandidate } from './components/candidate-list'
export type { Candidate, CandidateListProps } from './components/candidate-list'
export { BalanceBar } from './components/balance-bar'
export type { BalanceBarProps, BalanceState } from './components/balance-bar'
export { PeriodicRunPage } from './templates/periodic-run-page'
export type {
  PeriodicRunPageProps,
  RunCheck,
  RunLock,
  RunPreview,
  RunProgress,
  RunRerun,
  RunStep,
} from './templates/periodic-run-page'
export { countChecks, RUN_RESULT_ORDER } from './templates/periodic-run-logic'
export type { RunCheckResult } from './templates/periodic-run-logic'
// ── P5 group A ──
export { AgentMark } from './components/agent-mark'
export type { AgentMarkProps } from './components/agent-mark'
export { PresenceAvatars } from './components/presence-avatars'
export type { PresenceAvatarsProps, PresencePerson } from './components/presence-avatars'
export { HistoryList } from './components/history-list'
export type {
  ActorKind,
  HistoryActor,
  HistoryChange,
  HistoryEntry,
  HistoryListProps,
} from './components/history-list'
export {
  MentionText,
  MessageBubble,
  MessageComposer,
  MessageList,
  MessageThread,
} from './components/messages'
export type {
  ComposedMessage,
  MentionTextProps,
  MessageAuthor,
  MessageBubbleProps,
  MessageComposerProps,
  MessageListProps,
  MessageThreadProps,
  ThreadMessage,
} from './components/messages'
export { MentionCombobox } from './components/mention-combobox'
export type { MentionCandidate, MentionComboboxProps } from './components/mention-combobox'
export { mentionsInText, splitMentions } from './components/message-logic'
export type { Mention, MentionPart } from './components/message-logic'
export { Questionnaire } from './components/questionnaire'
export type { QuestionnaireProps } from './components/questionnaire'
export { answersOnPath, nextQuestionId, questionPath } from './components/questionnaire-logic'
export type {
  QuestionAnswer,
  QuestionAnswers,
  QuestionDefinition,
  QuestionnaireStep,
  QuestionOption,
  QuestionType,
} from './components/questionnaire-logic'
export { AgentQuestion } from './components/agent-question'
export type { AgentQuestionProps } from './components/agent-question'
// ── P5 group C ──
export { EmailFirstForm, ProviderSignInButtons } from './components/sign-in'
export type {
  EmailFirstFormProps,
  ProviderSignInButtonsProps,
  SignInProvider,
} from './components/sign-in'
export { PasswordField } from './components/password-field'
export type { PasswordFieldProps } from './components/password-field'
export { CodeInput } from './components/code-input'
export type { CodeInputProps } from './components/code-input'
export {
  codeBoxes,
  codeCharacters,
  codeComplete,
  codeKeyTarget,
  codeValue,
  eraseCode,
  fillCode,
} from './components/code-input-logic'
export type { CodeKind } from './components/code-input-logic'
export { RecoveryCodes } from './components/recovery-codes'
export type { RecoveryCodesProps } from './components/recovery-codes'
export { SessionList } from './components/session-list'
export type { SessionItem, SessionListProps } from './components/session-list'
export { KanbanBoard } from './components/kanban-board'
export type {
  KanbanBoardProps,
  KanbanCard,
  KanbanColumn,
  KanbanMove,
} from './components/kanban-board'
export {
  dragLayout,
  dropTarget,
  kanbanKeyTarget,
  moveCard,
  placeOf,
} from './components/kanban-logic'
export type { ColumnGeometry, KanbanColumnIds, KanbanPlace } from './components/kanban-logic'
export { PermissionMatrix } from './components/permission-matrix'
export type {
  PermissionAction,
  PermissionArea,
  PermissionChange,
  PermissionMatrixProps,
} from './components/permission-matrix'
export { SetupChecklist } from './components/setup-checklist'
export type { SetupAction, SetupChecklistProps, SetupStep } from './components/setup-checklist'
export { SignerList } from './components/signer-list'
export type { Signer, SignerListProps } from './components/signer-list'
export { SigningPage } from './templates/signing-page'
export type { SigningPageProps } from './templates/signing-page'
export {
  instantText,
  isAllowed,
  matrixKeyTarget,
  maySign,
  recoveryCodesText,
  resumeStep,
  setPermission,
  setupProgress,
  signerTurn,
  signingSummary,
} from './components/admin-logic'
export type {
  MatrixCell,
  PermissionValue,
  SetupStepState,
  SignerState,
} from './components/admin-logic'
// ── P5 group E ──
export { LookupDialog } from './components/lookup-dialog'
export type { LookupDialogProps } from './components/lookup-dialog'
export {
  assignColumn,
  changedFields,
  hasErrors,
  importBlocked,
  isProblemRow,
  isTypingKey,
  issuesOf,
  LOOKUP_PAGE_STEP,
  lookupDialogKeyTarget,
  missingRequired,
  toggleChanging,
  unusedColumns,
} from './components/catalog-logic'
export type {
  ImportCounts,
  ImportField,
  ImportIssue,
  ImportMapping,
  ImportPreviewRow,
  ImportSourceColumn,
} from './components/catalog-logic'
export { IMPORT_STEPS, ImportWizard } from './components/import-wizard'
export type {
  ImportFile,
  ImportProgress,
  ImportStep,
  ImportWizardProps,
} from './components/import-wizard'
export { BulkEditDrawer } from './components/bulk-edit-drawer'
export type { BulkEditDrawerProps, BulkEditField } from './components/bulk-edit-drawer'
export { DuplicateWarning } from './components/duplicate-warning'
export type { DuplicateWarningProps } from './components/duplicate-warning'
export { RegisterPage } from './templates/register-page'
export type { RegisterEntry, RegisterLock, RegisterPageProps } from './templates/register-page'
export { StatutoryFormPage } from './templates/statutory-form-page'
export type {
  SourceDocument,
  StatutoryFormPageProps,
  StatutoryOverride,
  StatutorySection,
} from './templates/statutory-form-page'
export {
  fieldElementId,
  fieldRules,
  registerMenu,
  ruleCounts,
  rulesTone,
} from './templates/register-logic'
export type { RuleResult, StatutoryRule } from './templates/register-logic'
// ── P5 group B ──
export {
  CONNECTION_STATUSES,
  ConnectionState,
  EnvironmentMarker,
  ImpersonationBar,
  minutesLeft,
  OfflineIndicator,
  untilNextMinute,
} from './components/shell-markers'
export type {
  ConnectionStateProps,
  ConnectionStatus,
  EnvironmentMarkerProps,
  EnvironmentTone,
  ImpersonationBarProps,
  OfflineIndicatorProps,
} from './components/shell-markers'
export { StatusTimeline } from './components/status-timeline'
export type {
  StatusNextStep,
  StatusTimelineProps,
  StatusTimelineStep,
} from './components/status-timeline'
export { clampedDone, JobProgress, jobOutcome } from './components/job-progress'
export type {
  JobFailure,
  JobOutcome,
  JobOutcomeLine,
  JobProgressProps,
  JobState,
} from './components/job-progress'
export { acceptsFile, checkFiles, FileDropzone } from './components/file-dropzone'
export type {
  FileDropzoneProps,
  FileFacts,
  FileRejection,
  FileRules,
  RejectionReason,
} from './components/file-dropzone'
export { AttachmentList, attachmentOffers } from './components/attachment-list'
export type {
  Attachment,
  AttachmentListProps,
  AttachmentOffers,
  AttachmentState,
} from './components/attachment-list'
export {
  DocumentFrame,
  FRAME_PROTOCOL,
  FRAME_TIMEOUT,
  FRAME_VERSION,
  frameReducer,
  hostMessage,
  INITIAL_FRAME_STATE,
  originAllowed,
  readViewerMessage,
  targetOrigin,
  ZOOM_STEPS,
  zoomStep,
} from './components/document-frame'
export type {
  DocumentFrameProps,
  FrameState,
  HostMessage,
  ViewerMessage,
} from './components/document-frame'
// ── P5 group D2 ──
export {
  CancellationBanner,
  ChangeText,
  correctionColumns,
  DocumentCurrency,
  DocumentNotes,
  DocumentReferences,
  DocumentSpecification,
} from './components/document-blocks'
export type {
  CancellationBannerProps,
  ChangeTextProps,
  CorrectionColumnSpec,
  DocumentCurrencyProps,
  DocumentNotesProps,
  DocumentReference,
  DocumentReferenceGroup,
  DocumentReferencesProps,
  DocumentSpecificationProps,
} from './components/document-blocks'
export { DocumentSource } from './components/document-source'
export type { DocumentSourceProps, DocumentSourceItem } from './components/document-source'
export { chosenNoteTexts, hasNotes } from './components/document-logic'
export type { DocumentNotesValue, NoteTemplate } from './components/document-logic'
export type {
  TaxRecap,
  TaxRecapRow,
  TotalsExchange,
  TotalsFootnote,
} from './components/document-totals'
export type { DocumentBlock } from './templates/document-page'
export type { IrreversibleReason } from './components/confirm-dialog'
export { subtotalStart } from './components/data-table-logic'
// ── P5 group D1 ──
export type { GridDetail } from './components/editable-grid-logic'
export type { GridLookupCreate } from './components/editable-grid'
export {
  ADDABLE_LINE_TYPES,
  editableCellCount,
  LINE_TYPES,
  spansRow,
  taxCategoryText,
} from './components/line-types'
export type { AddableLineType, LineType, TaxCategory, UnitOfMeasure } from './components/line-types'
export { LookupField } from './components/lookup-field'
export type { LookupFieldProps } from './components/lookup-field'
export {
  choosableCount,
  lookupKeyTarget,
  lookupKindLabel,
  lookupRowHeight,
  lookupRows,
  LOOKUP_ROW_HEIGHTS,
} from './components/lookup-logic'
export type {
  LookupCreateKind,
  LookupKind,
  LookupOption,
  LookupRow,
  LookupRowsInput,
} from './components/lookup-logic'
export { LookupCreateDrawer } from './components/lookup-create-drawer'
export type {
  LookupCreateDrawerProps,
  LookupDraft,
  LookupDraftErrors,
} from './components/lookup-create-drawer'
// ── P5.24 shifts ──
export { ShiftPlanner } from './components/shift-planner'
export type {
  ShiftCoverage,
  ShiftGroup,
  ShiftGrouping,
  ShiftPlannerProps,
  ShiftPlannerRow,
  ShiftPublishCounts,
} from './components/shift-planner'
export type { ShiftTemplate, ShiftTemplateTone } from './components/shift-parts'
export {
  assignChanges,
  conflictList,
  crossesMidnight,
  moveChange,
  removeChanges,
  rotationAssignments,
  shiftPeriod as movePlannerPeriod,
  shiftSpan,
  shiftsByWeek,
  templateForKey,
  templateKey,
  todayPeriod,
} from './components/shift-logic'
export type {
  RotationPattern,
  ShiftAssignment,
  ShiftCellRef,
  ShiftChange,
  ShiftConflict,
  ShiftConflicts,
  ShiftWeek,
} from './components/shift-logic'
export { MyShifts } from './components/my-shifts'
export type { MyShift, MyShiftsProps } from './components/my-shifts'
export { ShiftSwapDialog } from './components/shift-swap-dialog'
export type {
  ShiftSwapDialogProps,
  ShiftSwapRequest,
  SwapColleague,
  SwapShift,
} from './components/shift-swap-dialog'
export { WorkingTimeBalance } from './components/working-time-balance'
export type {
  WorkingTimeBalanceProps,
  WorkingTimePlan,
  WorkingTimeRow,
  WorkingTimeWarning,
  WorkingTimeWeek,
} from './components/working-time-balance'
// ── P5.9 Tree, P5.14 Sensitive fields, P5.16 Portal shell ──
export { TreeView } from './components/tree-view'
export type { TreeViewProps } from './components/tree-view'
export { TreeTable } from './components/tree-table'
export type { TreeTableColumn, TreeTableProps } from './components/tree-table'
export type { TreeBaseProps, TreeSelectionMode } from './components/use-tree'
export {
  findTreeNode,
  isExpandable,
  needsChildren,
  toggleTreeSelection,
  treeAncestors,
  treeCheckStates,
  treeKeyAction,
  typeAheadTarget,
  TYPE_AHEAD_DELAY,
  visibleTreeRows,
} from './components/tree-logic'
export type { TreeKeyAction, TreeNode, TreeRow } from './components/tree-logic'
export { MaskedValue } from './components/masked-value'
export type { MaskedValueProps, MaskedValueReason, RevealRequest } from './components/masked-value'
export { PortalShell } from './templates/portal-shell'
export type { PortalParticipant, PortalSection, PortalShellProps } from './templates/portal-shell'
// ── P5.13 / P5.24 AttendanceGrid and ClockRecordList ──
export { AttendanceGrid, ATTENDANCE_VIRTUALIZE_FROM } from './components/attendance-grid'
export type {
  AttendanceCode,
  AttendanceColumn,
  AttendanceCorrection,
  AttendanceCorrectionRequest,
  AttendanceGridProps,
  AttendanceHandOff,
  AttendanceLock,
  AttendanceMark,
  AttendanceRow,
  AttendanceTotal,
  AttendanceTotals,
} from './components/attendance-grid'
export {
  attendanceKeyAction,
  copyPreviousWeek,
  fillRange,
  markColumn,
  markRow,
} from './components/attendance-logic'
export type {
  AttendanceChange,
  AttendanceColumnKind,
  AttendanceEntry,
  AttendanceKey,
  AttendanceKeyAction,
  AttendanceKeyState,
  AttendanceValue,
  AttendanceCell,
  AttendancePosition,
  AttendanceRange,
} from './components/attendance-logic'
export { ClockRecordList } from './components/clock-record-list'
export type {
  ClockCorrection,
  ClockCorrectionRequest,
  ClockRecord,
  ClockRecordListProps,
  ClockSource,
} from './components/clock-record-list'
export { clockTimeOf, onLaterDay, parseClockTime } from './components/clock-record-logic'
// ── P5.8 Calendar and scheduling ──
export { CalendarView } from './components/calendar-view'
export type { CalendarEvent, CalendarSlot, CalendarViewProps } from './components/calendar-view'
export { ResourceSchedule } from './components/resource-schedule'
export type {
  ResourceScheduleProps,
  ScheduleBooking,
  ScheduleMove,
  ScheduleResource,
} from './components/resource-schedule'
export { SlotPicker } from './components/slot-picker'
export type { SlotPickerProps, SlotResource } from './components/slot-picker'
export { Timetable } from './components/timetable'
export type { TimetableLesson, TimetablePeriod, TimetableProps } from './components/timetable'
export {
  addDays,
  addMonths,
  calendarKeyTarget,
  CALENDAR_VIEWS,
  cellEvents,
  currentPeriod,
  dropPlace,
  fitOnAxis,
  groupSlots,
  layoutDay,
  monthWeeks,
  periodDays,
  readMoment,
  scheduleKeyTarget,
  shiftPeriod as moveCalendarPeriod,
  slotKey,
  spanOf,
  startOfWeek,
  unavailableReason,
  weekDays,
} from './components/schedule-logic'
export type {
  CalendarViewName,
  FreeSlot,
  GridCell,
  Placement,
  ScheduleAxis,
  SchedulePlace,
  Span,
  UnavailableTime,
} from './components/schedule-logic'
export { deviceTimeZone, localDateTimeIn } from './provider/format'
// ── P5.10 / P5.11 touch, POS and warehouse ──
export type { Density } from './provider/liro-provider'
export { NumericKeypad } from './components/numeric-keypad'
export type { NumericKeypadProps } from './components/numeric-keypad'
export {
  decimalSeparator,
  entryFromValue,
  KEYPAD_DIGITS,
  KEYPAD_MAX_DIGITS,
  keypadInput,
  keypadKeyFor,
  keypadText,
  keypadValue,
} from './components/keypad-logic'
export type { KeypadDigit, KeypadKey, KeypadOptions } from './components/keypad-logic'
export { ProductGrid, ProductTile } from './components/product-tile'
export type {
  PosProduct,
  ProductCategory,
  ProductGridProps,
  ProductStock,
  ProductTileProps,
} from './components/product-tile'
export { CartPanel } from './components/cart-panel'
export type { CartAmount, CartLine, CartPanelProps } from './components/cart-panel'
export { PaymentDialog } from './components/payment-dialog'
export type {
  CardState,
  PaymentDialogProps,
  PaymentMethod,
  PaymentPart,
} from './components/payment-dialog'
export { ReceiptPreview } from './components/receipt-preview'
export type {
  ReceiptAmount,
  ReceiptFact,
  ReceiptItem,
  ReceiptPreviewProps,
} from './components/receipt-preview'
export { PosShell } from './templates/pos-shell'
export type { PosShellProps } from './templates/pos-shell'
export { ScanField } from './components/scan-field'
export type { ScanFeedback, ScanFieldProps } from './components/scan-field'
export {
  EMPTY_SCAN_BUFFER,
  SCAN_MAX_INTERVAL,
  SCAN_MIN_LENGTH,
  scanDecision,
  scanKey,
} from './components/scan-logic'
export type { ScanBuffer, ScanOptions } from './components/scan-logic'
export { QuantityStepper } from './components/quantity-stepper'
export type { QuantityStepperProps } from './components/quantity-stepper'
export {
  canStep,
  compareDecimal,
  isDecimal,
  quantityRange,
  stepDecimal,
  stepQuantity,
} from './components/quantity-logic'
export type { StepOptions } from './components/quantity-logic'
export { PickList } from './templates/pick-list'
export type { PickLine, PickListProps } from './templates/pick-list'
export { StockCount } from './templates/stock-count'
export type { CountItem, StockCountProps } from './templates/stock-count'
export { PICK_STEPS, pickProgress, pickStepState } from './components/warehouse-logic'
export type { PickLineState, PickStep } from './components/warehouse-logic'
// ── P5.15 Print templates, P5.12 Learning ──
export { PrintPage } from './templates/print-page'
export type { PrintFrameProps, PrintPageProps, PrintStatus } from './templates/print-page'
export {
  PrintDetails,
  PrintIssuedLine,
  PrintSection,
  PrintSignatures,
  PrintTable,
  PrintTitle,
} from './templates/print-parts'
export type {
  PrintColumn,
  PrintDetail,
  PrintDetailsProps,
  PrintIssued,
  PrintSectionProps,
  PrintSignature,
  PrintSignaturesProps,
  PrintTableProps,
} from './templates/print-parts'
export {
  PrintCertificate,
  PrintDocument,
  PrintFinding,
  PrintGradeReport,
} from './templates/print-templates'
export type {
  PrintCertificateProps,
  PrintDocumentProps,
  PrintFindingProps,
  PrintFindingSection,
  PrintGradeReportProps,
  PrintParty,
} from './templates/print-templates'
export {
  cssString,
  fitZoom,
  pageName,
  pageNumberContent,
  pageRules,
  PRINT_MARGINS,
  PX_PER_MM,
  resolvedMargins,
  sheetSize,
} from './templates/print-logic'
export type { PageRulesOptions, PrintMargins, PrintOrientation } from './templates/print-logic'
export { CoursePage } from './templates/course-page'
export type { CourseCompletion, CourseLessonLink, CoursePageProps } from './templates/course-page'
export { courseProgress, findLesson, moduleProgress } from './templates/course-logic'
export type { CourseLesson, CourseModule, LessonCount, LessonState } from './templates/course-logic'
export { QuizResult } from './components/quiz-result'
export type { QuizResultProps, QuizReviewItem } from './components/quiz-result'
// ── P5.25 RoomRack ──
export { RoomRack } from './components/room-rack'
export type {
  RackFloor,
  RackNote,
  RackRoom,
  RackState,
  RoomRackProps,
} from './components/room-rack'
export {
  EMPTY_RACK_FILTER,
  rackCounts,
  rackFilterActive,
  rackKeyTarget,
  rackMatches,
  rackSearchText,
} from './components/room-rack-logic'
export type { RackFilter, RackPlace, RackSearchable } from './components/room-rack-logic'
export { fitOnDays } from './components/schedule-logic'
// ── P5.25 FloorPlan, SeatingChart ──
export { FloorPlan } from './components/floor-plan'
export type {
  FloorArea,
  FloorListGroupKey,
  FloorPaletteEntry,
  FloorPlanProps,
  FloorState,
  FloorTone,
  FloorWarning,
} from './components/floor-plan'
export {
  addedPosition,
  applyFloorChanges,
  boxesOverlap,
  dragPosition,
  duplicateDraft,
  FIXTURE_KINDS,
  footprint,
  isFixture,
  keepInside,
  listGroups,
  MIN_ITEM_SIZE,
  MIN_TARGET,
  minimumPlanWidth,
  nearestItem,
  nextRotation,
  NUDGE,
  NUDGE_LARGE,
  nudge,
  overlappingItems,
  readingOrder,
  resizeFootprint,
  rotateChange,
  snap,
  PLAN_ZOOM_STEPS,
  planZoomStep,
} from './components/floor-plan-logic'
export type {
  FloorBox,
  FloorChange,
  FloorGeometry,
  FloorItem,
  FloorItemDraft,
  FloorItemKind,
  FloorListGroup,
  FloorRotation,
} from './components/floor-plan-logic'
export { SeatingChart } from './components/seating-chart'
export type { SeatingChartProps } from './components/seating-chart'
export {
  freeSeats,
  guestAt,
  guestGroups,
  guestMatches,
  parseSeatId,
  sameSeat,
  seatCentres,
  seatId,
  seatingCounts,
} from './components/seating-logic'
export type {
  GuestGroup,
  SeatingConflict,
  SeatingGuest,
  SeatingTable,
  SeatRef,
} from './components/seating-logic'

// ── P5.27 legal search ──
export { LegalSearchPage } from './templates/legal-search-page'
export type { LegalSearchPageProps } from './templates/legal-search-page'
export { gazetteNumbers, snippetFromRanges, snippetText } from './templates/legal-search-logic'
export type {
  LegalSearchResult,
  LegalSearchSort,
  LegalSnippet,
  LegalSnippetPart,
} from './templates/legal-search-logic'
export { GazetteIssues } from './components/gazette-issues'
export type { GazetteIssue, GazetteIssuesProps } from './components/gazette-issues'
export { treeFilterIds, treeFilterLabels } from './components/filter-logic'
// ── P5.27 legal text ──
export { LegalText } from './components/legal-text'
export type { LegalTextHandle, LegalTextProps } from './components/legal-text'
export { LegalContents } from './components/legal-contents'
export type { LegalContentsProps } from './components/legal-contents'
export { LegalCompare } from './components/legal-compare'
export type { LegalCompareProps, LegalCompareVersion } from './components/legal-compare'
export {
  articleBlocks,
  articleText,
  compareArticles,
  compareBlocks,
  comparisonCounts,
  findLegalArticle,
  firstReference,
  flattenLegalNodes,
  foldForSearch,
  inlineText,
  latinTag,
  legalAncestors,
  legalArticles,
  legalContentsTree,
  legalHeadingIds,
  legalSearchIndex,
  legalTextParts,
  LEGAL_ENTRY_ESTIMATE,
  LEGAL_SEARCH_MIN_LENGTH,
  mapArticleText,
  mapFootnotesText,
  mapLegalText,
  mergeById,
  paragraphText,
  searchLegalIndex,
  searchLegalText,
  serbianScript,
  stepHit,
  transliterateCyrillicToLatin,
  transliterates,
  wordDiff,
} from './components/legal-logic'
export type {
  ArticleBlock,
  ArticleChangeKind,
  ArticleComparison,
  BlockComparison,
  DiffSegment,
  LegalEntry,
  LegalSearchHit,
  LegalSearchIndex,
  LegalTextPart,
} from './components/legal-logic'
// ── P5.27 legal page ──
export { LegalActPage } from './templates/legal-act-page'
export type { LegalActPageProps } from './templates/legal-act-page'
export {
  LEGAL_PANEL_KEYS,
  LegalArticleSummary,
  useLegalPanels,
  useVersionRange,
} from './components/legal-panels'
export type {
  LegalArticleSummaryProps,
  LegalPanelKey,
  LegalPanelsOptions,
} from './components/legal-panels'
export {
  amendmentsFor,
  articleCounts,
  groupRelatedByType,
  itemsForArticle,
  notesFor,
  otherVersions,
  practiceArticles,
  shownVersion,
  versionAsOf,
  versionsNewestFirst,
} from './components/legal-panels-logic'
export type { ArticleCounts } from './components/legal-panels-logic'
export { PrintLegalAct } from './templates/print-legal-act'
export type { PrintLegalActProps } from './templates/print-legal-act'
// ── P5.25a FloorPlan: background, polygon areas, level ──
export type { FloorBackground } from './components/floor-plan'
export {
  areaBox,
  areaContains,
  areaLabelPoint,
  isPolygonArea,
  levelText,
  levelWidth,
  percentPoint,
  pointInPolygon,
  polygonBounds,
  polygonCentroid,
  svgPoints,
} from './components/floor-plan-logic'
export type {
  FloorLevel,
  FloorPoint,
  FloorPolygonArea,
  FloorRectArea,
} from './components/floor-plan-logic'

// ── P5.27 legal model ──
export type {
  GazetteReference,
  LegalAct,
  LegalAmendment,
  LegalArticle,
  LegalArticleChange,
  LegalFootnote,
  LegalHeading,
  LegalInline,
  LegalNode,
  LegalNote,
  LegalParagraph,
  LegalPoint,
  LegalStatus,
  LegalTarget,
  LegalVersion,
  PracticeItem,
  RelatedAct,
} from './components/legal-model'
// ── P5.28 docs: the statutory form grid, simple printouts and electronic signature fields ──
export {
  statutoryRows,
  statutoryColumnLabel,
  findStatutoryPlace,
  statutoryGridLines,
  statutoryHeaderRows,
  isStatutoryGroup,
  statutoryRowRules,
  statutoryCellId,
  statutoryCellLabel,
} from './templates/statutory-logic'
export type {
  StatutoryGridLine,
  StatutoryHeaderCell,
  StatutoryCell,
  StatutoryCellKind,
  StatutoryColumn,
  StatutoryGroup,
  StatutoryItem,
  StatutoryPlace,
  StatutoryRow,
} from './templates/statutory-logic'
export {
  PrintAmountDueLine,
  PrintPaymentDetails,
  PrintSignatureField,
} from './templates/print-parts'
export type {
  PrintAmountDue,
  PrintPayment,
  PrintSignatureFieldProps,
} from './templates/print-parts'
export {
  lengthToMm,
  printedPageCount,
  PT_PER_MM,
  signatureFieldPlacement,
} from './templates/print-logic'
export type { PrintBodyArea, SheetBox, SignatureFieldPlacement } from './templates/print-logic'

// ── P5.28 dates ──
export { numericFormat } from './provider'
// ── P5.28 screens ──
export {
  ChangeConfirmDialog,
  changeConfirmLabel,
  initialNotify,
  toggleNotify,
} from './components/change-confirm-dialog'
export type {
  ChangeConfirmAnswer,
  ChangeConfirmDialogProps,
  ChangeLine,
  NotifyOption,
} from './components/change-confirm-dialog'

// ── P5.28 phone ──
export { isSearchable, SEARCHABLE_FROM } from './components/select-field'

// ── P5.28 pos ──
export { ReceiptKindPicker } from './components/receipt-kind-picker'
export type { ReceiptKindPickerProps } from './components/receipt-kind-picker'
export { BuyerField, BUYER_TYPES_SEARCHABLE_FROM } from './components/buyer-field'
export type { BuyerFieldProps, BuyerIdType, BuyerValue } from './components/buyer-field'
export { ReceiptFinder } from './components/receipt-finder'
export type { FoundReceipt, ReceiptFinderProps, ReceiptQuery } from './components/receipt-finder'
export { LineQuantityPicker } from './components/line-quantity-picker'
export type { ChoosableLine, LineQuantityPickerProps } from './components/line-quantity-picker'
export { AdvanceList } from './components/advance-list'
export type { AdvanceItem, AdvanceListProps } from './components/advance-list'
export { ReceiptResult } from './components/receipt-result'
export type { ReceiptDelivery, ReceiptResultProps } from './components/receipt-result'
export {
  allLinesChosen,
  chooseAllLines,
  chosenLineIds,
  exceedsAvailable,
  hasOwnOptions,
  isChosen,
  kindMarker,
  paymentOptions,
  toggleLine,
} from './components/sale-logic'
export type {
  ChosenQuantities,
  PaymentKind,
  PaymentOption,
  ReceiptKindOption,
} from './components/sale-logic'
export type { CartLineState } from './components/cart-panel'
export type { ReceiptRecap, ReceiptRecapColumn } from './components/receipt-preview'

// ── P5.28 floor ──
export {
  AREA_SEGMENTS_UP_TO,
  areaSwitchKind,
  inArea,
  labelFit,
  labelRoom,
  planFrame,
  switchableAreas,
} from './components/floor-plan-logic'
export type { LabelFit, LabelSize } from './components/floor-plan-logic'
export { seatingChanges } from './components/seating-logic'
export type { SeatingChange } from './components/seating-logic'

// ── P5.29 admin ──
export { HealthList, healthIcon } from './components/health-list'
export type {
  HealthAction,
  HealthItem,
  HealthListProps,
  HealthMetric,
  HealthState,
} from './components/health-list'
export { HEALTH_KINDS, healthFacts } from './components/health-logic'
export type { HealthFact, HealthKind, HealthTimes } from './components/health-logic'

// ── P5.29 agent: SlaTimer and the helpdesk's keys (P5.30) ──
export { durationText, SlaTimer, slaText } from './components/sla-timer'
export type { SlaTimerProps } from './components/sla-timer'
export {
  durationParts,
  millisecondsBetween,
  SLA_TONES,
  slaReading,
  slaUrgency,
} from './components/sla-logic'
export type { DurationParts, SlaOptions, SlaReading, SlaState } from './components/sla-logic'
export { rowFocusTarget } from './components/data-table-logic'
// ── P5.29 portal ──
export { SatisfactionRating } from './components/satisfaction-rating'
export type { SatisfactionRatingProps } from './components/satisfaction-rating'
export { HelpfulFeedback } from './components/helpful-feedback'
export type { HelpfulFeedbackProps } from './components/helpful-feedback'
export { LinkSuggestions } from './components/link-suggestions'
export type { LinkSuggestion, LinkSuggestionsProps } from './components/link-suggestions'
export { PageContents } from './components/page-contents'
export type { PageContentsProps } from './components/page-contents'
export { HighlightedText, SearchResultList } from './components/search-result-list'
export type { SearchResult, SearchResultListProps } from './components/search-result-list'
export { CategoryGrid } from './components/category-grid'
export type { CategoryCard, CategoryGridProps } from './components/category-grid'
export {
  asksWhy,
  currentEntry,
  highlightMatches,
  highlightText,
  ratingAnswer,
  ratingOption,
  scaleValueText,
} from './components/help-logic'
export type {
  ContentsEntry,
  HelpfulAnswer,
  Highlight,
  HighlightPart,
  SatisfactionAnswer,
  SatisfactionOption,
} from './components/help-logic'
// ── P5.34 ai: the assistant (P5.34), e-mail preview (P5.38), reading (P5.39) ──
export { AssistantAnswer } from './components/assistant-answer'
export type { AssistantAnswerProps } from './components/assistant-answer'
export { AssistantComposer } from './components/assistant-composer'
export type { AssistantComposerProps } from './components/assistant-composer'
export { AskedQuestion, AssistantPanel, QuestionList } from './components/assistant-panel'
export type { AssistantPanelProps, AssistantTurn } from './components/assistant-panel'
export { ProposedAction } from './components/proposed-action'
export type { ProposedActionProps } from './components/proposed-action'
export {
  actionOffers,
  actionSettled,
  ANSWER_STATES,
  answerBusy,
  answerSources,
  canReport,
  followUpsShown,
  questionKey,
  questionReady,
  shownBlocks,
} from './components/assistant-logic'
export type {
  AnswerBlock,
  AnswerChartBlock,
  AnswerColumn,
  AnswerHeadingBlock,
  AnswerListBlock,
  AnswerRow,
  AnswerSource,
  AnswerSourcesBlock,
  AnswerState,
  AnswerTableBlock,
  AnswerTextBlock,
  ProposedActionState,
} from './components/assistant-logic'
export { AskPage } from './templates/ask-page'
export type { AskPageProps } from './templates/ask-page'
export { EmailPreview, emailPreviewWidth } from './components/email-preview'
export type {
  EmailPreviewProps,
  EmailPreviewScheme,
  EmailPreviewWidth,
} from './components/email-preview'
export { ArticleList } from './components/article-list'
export type { ArticleListProps, ArticleSummary } from './components/article-list'
export { NewsletterSignup } from './components/newsletter-signup'
export type { NewsletterSignupProps } from './components/newsletter-signup'
export { opensOutside, ShareLinks } from './components/share-links'
export type { ShareLinksProps, ShareTarget } from './components/share-links'
export { articlePlaces, bylineText, emailProblem, looksLikeEmail } from './components/blog-logic'
export { ArticlePage } from './templates/article-page'
export type { ArticleAuthor, ArticlePageProps, ArticleTag } from './templates/article-page'

// ── P5.40 QR code, IPS QR and payment orders ──
export { QrCode, qrModules, qrPath } from './components/qr-code'
export type { QrCodeProps, QrErrorCorrection } from './components/qr-code'
export {
  ipsAccountText,
  ipsAccountValid,
  ipsAmount,
  ipsProblemsOf,
  ipsQrText,
  ipsReferenceValid,
  normalizeIpsAccount,
} from './components/ips-qr'
export type {
  IpsPayment,
  IpsProblem,
  IpsProblemCode,
  IpsQrKind,
  IpsQrResult,
} from './components/ips-qr'
export { PaymentOrderForm } from './templates/payment-order'
export type {
  PaymentOrderAccount,
  PaymentOrderField,
  PaymentOrderFormProps,
  PaymentOrderParty,
} from './templates/payment-order'
// ── P5.36 acct ──
export { PlanComparison } from './components/plan-comparison'
export type { PlanComparisonProps } from './components/plan-comparison'
export { choosablePlan, comparisonRows, featureCell } from './components/plan-logic'
export type {
  ComparedFeature,
  ComparedPlan,
  FeatureCell,
  FeatureOffer,
  PlanComparisonRow,
} from './components/plan-logic'
export { UsageMeter } from './components/usage-meter'
export type { UsageMeterProps } from './components/usage-meter'
export { meterShare, usageAmount, usageWords } from './components/usage-logic'
// ── P5.31 docs ──
export { PageViewer } from './components/page-viewer'
export type { PageViewerProps } from './components/page-viewer'
export { clampPage, labelSide, regionBox, regionPage } from './components/page-viewer-logic'
export type { PageRegion, RegionBox, ViewerPage } from './components/page-viewer-logic'
export { RecognizedField } from './components/recognized-field'
export type { RecognizedFieldProps } from './components/recognized-field'
// ── P5.33 docs ──
export { ValueComparison, valueComparisonCounts } from './components/value-comparison'
export type { ComparisonRow, ValueComparisonProps } from './components/value-comparison'
// ── P5.42 org ──
export { HierarchyChart } from './components/hierarchy-chart'
export type { HierarchyChartProps } from './components/hierarchy-chart'
export {
  descendantCount,
  hierarchyKeyAction,
  hierarchyPath,
  indexHierarchy,
  initiallyExpanded,
  matchHierarchy,
  revealNode,
  stacksChildren,
  visibleHierarchy,
} from './components/hierarchy-logic'
export type {
  HierarchyIndex,
  HierarchyItem,
  HierarchyKeyAction,
  HierarchyNode,
} from './components/hierarchy-logic'
// ── P5.43 files ──
export { FileBrowser } from './templates/file-browser'
export type {
  FileBrowserProps,
  FileColumn,
  FilePlace,
  FileUploadRules,
} from './templates/file-browser'
export {
  blockedFolders,
  canDropInto,
  expiresTooSoon,
  fileIconKind,
  folderPath,
  momentText,
  pickerTree,
  resolveConflicts,
  selectRange,
  sizeText,
  toggleSelection,
  uploadCounts,
  withPaths,
} from './components/file-browser-logic'
export type {
  ConflictChoice,
  ConflictResolution,
  FileEntry,
  FileIconKind,
  FileLink,
  UploadCounts,
  UploadedFile,
} from './components/file-browser-logic'
export { FileIcon } from './components/file-entry-parts'
export { FileGrid } from './components/file-grid'
export type { FileGridProps } from './components/file-grid'
export { FolderPicker, FolderPickerDialog, folderPathText } from './components/folder-picker'
export type { FolderPickerDialogProps, FolderPickerProps } from './components/folder-picker'
export { NameConflictDialog } from './components/name-conflict-dialog'
export type {
  ConflictFile,
  NameConflict,
  NameConflictDialogProps,
} from './components/name-conflict-dialog'
export { FileNameDialog } from './components/file-name-dialog'
export type { FileNameDialogProps } from './components/file-name-dialog'
export { ShareDialog } from './components/share-dialog'
export type {
  ShareAccess,
  ShareCandidate,
  ShareDialogProps,
  ShareKind,
  ShareLevel,
  ShareLinkState,
} from './components/share-dialog'
export { VersionList } from './components/version-list'
export type { FileVersion, VersionListProps } from './components/version-list'
export { FilePreview } from './components/file-preview'
export type { FilePreviewProps } from './components/file-preview'
export { FileDetails } from './components/file-details'
export type { FileDetailsProps } from './components/file-details'

// ── P5.49 trade ──
export type { ComparisonValues } from './components/value-comparison'

// ── P5.66 records ──
export {
  definedConditionFields,
  definedConditionHolds,
  DEFINED_FIELD_TYPES,
  DefinedForm,
  definedFormState,
  definedFormProblems,
  definedEmptyValue,
  definedFieldIds,
  definedFieldRequired,
  definedValueFilled,
  definedMissingKind,
} from './components/defined-form'
export type {
  DefinedCondition,
  DefinedCustomControl,
  DefinedField,
  DefinedFieldState,
  DefinedFieldType,
  DefinedFormCheck,
  DefinedFormHandle,
  DefinedFormProps,
  DefinedFormState,
  DefinedOption,
  DefinedSection,
  DefinedSectionState,
  DefinedValue,
  DefinedValues,
} from './components/defined-form'
// ── P5.78 auto ──
export { RuleBuilder, ruleValueText } from './components/rule-builder'
export type { RuleBuilderProps } from './components/rule-builder'
export {
  addRuleAction,
  addRuleCondition,
  addRuleGroup,
  emptyRuleDraft,
  findRuleCondition,
  moveRuleItem,
  nextRuleId,
  operatorsFor,
  removeRuleItem,
  ruleConditionCount,
  rulePlace,
  ruleProblemKey,
  setConditionField,
  setConditionOperator,
  setConditionValue,
  setRuleActionParam,
  setRuleActionType,
  setRuleJoin,
} from './components/rule-builder-logic'
export type {
  RuleAction,
  RuleActionParam,
  RuleActionType,
  RuleChoice,
  RuleCondition,
  RuleConditionGroup,
  RuleConditionItem,
  RuleDraft,
  RuleField,
  RuleJoin,
  RuleOperator,
  RulePlace,
  RuleTrigger,
  RuleValueKind,
} from './components/rule-builder-logic'

// ── P5.79 auto ──
export { chosenCounts } from './components/value-comparison'
// ── P5.81 reports ──
export { DashboardGrid } from './components/dashboard-grid'
export type { DashboardCard, DashboardGridProps } from './components/dashboard-grid'
export {
  addCard,
  allowedSizes,
  cardSpan,
  dashboardKeyTarget,
  gridPlacement,
  layoutOf,
  moveCardBy,
  moveCardTo,
  removeCard,
  resizeCard,
} from './components/dashboard-grid-logic'
export type {
  DashboardCardSize,
  DashboardLayoutChange,
  DashboardLayoutItem,
  GridPlace,
} from './components/dashboard-grid-logic'
