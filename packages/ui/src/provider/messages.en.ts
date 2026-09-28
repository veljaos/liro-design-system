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
  'field.invalidNumber': 'Enter a number',
  'field.loading': 'Loading…',
  'field.noResults': 'Nothing found',
  'field.remove': (label) => `Remove ${label}`,
  'dialog.close': 'Close',
  'dialog.cancel': 'Cancel',
  'confirm.deleteTitle': 'Delete this item?',
  'confirm.deleteMessage': 'This cannot be undone.',
  'confirm.deleteLabel': 'Delete',
  'confirm.typeToConfirm': (text) => `Type ${text} to confirm`,
  'action.more': 'More actions',
  'action.moreOptions': (label) => `More options: ${label}`,
  'action.unavailable': (reason) => `Unavailable: ${reason}`,
  'connection.offline': 'Offline',
}
