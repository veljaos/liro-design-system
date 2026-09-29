import { formatDecimal } from './format'
import type { LiroMessages } from './messages'

/**
 * English defaults for every Design System string. The type makes a missing key a compile error;
 * LiroProvider's `messages` replaces any of them.
 */
export const messagesEn: LiroMessages = {
  'table.next': 'Next',
  'table.previous': 'Previous',
  'table.count': (count, exact) => {
    const number = formatDecimal(String(count), 'comma-dot')
    if (!exact) return `More than ${number} rows`
    return count === 1 ? '1 row' : `${number} rows`
  },
  'table.noRows': 'Nothing here yet',
  'table.noMatch': 'No rows match',
  'field.required': 'Required',
  'field.readOnly': 'Read-only',
  'field.invalidDate': 'Enter a date',
  'field.invalidNumber': 'Enter a number',
  'field.invalidRange': 'The end is before the start',
  'field.openCalendar': 'Choose a date',
  'field.rangeStart': 'Start',
  'field.rangeEnd': 'End',
  'field.loading': 'Loading…',
  'field.noResults': 'Nothing found',
  'field.remove': (label) => `Remove ${label}`,
  'breadcrumbs.label': 'Breadcrumbs',
  'calendar.previousMonth': 'Previous month',
  'calendar.nextMonth': 'Next month',
  'calendar.navigation': 'Months',
  'dialog.close': 'Close',
  'due.settled': 'Settled',
  'due.overdue': (days) => (days === 1 ? '1 day overdue' : `${String(days)} days overdue`),
  'due.today': 'Due today',
  'due.inDays': (days) => (days === 1 ? 'Due in 1 day' : `Due in ${String(days)} days`),
  'alert.close': 'Close',
  'empty.emptyTitle': 'Nothing here yet',
  'empty.emptyDescription': 'When something is added, it appears here.',
  'empty.noResultsTitle': 'Nothing matches',
  'empty.noResultsDescription': 'Try other words, or clear some filters.',
  'empty.errorTitle': 'This could not be loaded',
  'empty.errorDescription': 'Something went wrong on our side. Try again in a moment.',
  'empty.caseId': 'Case number:',
  'dialog.cancel': 'Cancel',
  'confirm.deleteTitle': 'Delete this item?',
  'confirm.deleteMessage': 'This cannot be undone.',
  'confirm.deleteLabel': 'Delete',
  'confirm.typeToConfirm': (text) => `Type ${text} to confirm`,
  'notice.close': 'Close',
  'notice.region': 'Notifications',
  'action.unavailable': (reason) => `Unavailable: ${reason}`,
  'connection.offline': 'Offline',
}
