/*
 * The logic of FileDropzone and AttachmentList (P5.5): which chosen files are accepted, and what
 * a file in the list offers. Sizes are byte counts (whole numbers from the browser), compared
 * only; the text the user reads ("up to 10 MB", "2,4 MB") is the application's (D4: the component
 * does not compute units).
 */

/** What the browser tells about a chosen file (a File has these). */
export interface FileFacts {
  name: string
  /** The MIME type the browser guessed; may be empty. */
  type: string
  /** Bytes. */
  size: number
}

/** Why a file was not taken. */
export type RejectionReason = 'type' | 'size' | 'count'

export interface FileRejection<F extends FileFacts = File> {
  file: F
  reason: RejectionReason
}

export interface FileRules {
  /**
   * Accepted types, as the `accept` attribute takes them: extensions (".pdf"), MIME types
   * ("application/pdf") or MIME families ("image/*"). Empty or left out: any type.
   */
  accept?: readonly string[]
  /** The largest accepted size, in bytes. */
  maxSize?: number
  /** How many files may be added in all, counting `existing`. */
  maxFiles?: number
  /** How many files are already there (in the list beside the dropzone). */
  existing?: number
}

/** The extension of a name, lower case with its dot (".pdf"), or '' without one. */
function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot <= 0 ? '' : name.slice(dot).toLowerCase()
}

/**
 * Whether a file matches the accepted types, as browsers read `accept`: an extension matches the
 * name's end (any case), "type/*" the MIME family, anything else the exact MIME type. The check is
 * repeated here because a dropped file never passes through the input's `accept`, and a person
 * can switch the file dialog to "All files".
 */
export function acceptsFile(file: Pick<FileFacts, 'name' | 'type'>, accept?: readonly string[]) {
  if (accept === undefined || accept.length === 0) return true
  const extension = extensionOf(file.name)
  const type = file.type.toLowerCase()
  return accept.some((entry) => {
    const rule = entry.trim().toLowerCase()
    if (rule.startsWith('.')) return extension === rule
    if (rule.endsWith('/*')) return type !== '' && type.startsWith(rule.slice(0, -1))
    return type !== '' && type === rule
  })
}

/**
 * Splits chosen files into accepted and rejected ones, in the order chosen. A file is checked
 * for its type first, then its size; files beyond `maxFiles` (counting `existing` and the files
 * accepted before it) are rejected for the count.
 */
export function checkFiles<F extends FileFacts>(
  files: readonly F[],
  rules: FileRules,
): { accepted: F[]; rejected: FileRejection<F>[] } {
  const accepted: F[] = []
  const rejected: FileRejection<F>[] = []
  const room =
    rules.maxFiles === undefined ? Infinity : Math.max(rules.maxFiles - (rules.existing ?? 0), 0)
  for (const file of files) {
    if (!acceptsFile(file, rules.accept)) {
      rejected.push({ file, reason: 'type' })
    } else if (rules.maxSize !== undefined && file.size > rules.maxSize) {
      rejected.push({ file, reason: 'size' })
    } else if (accepted.length >= room) {
      rejected.push({ file, reason: 'count' })
    } else {
      accepted.push(file)
    }
  }
  return { accepted, rejected }
}

/** The states of an attachment (AttachmentList). */
export type AttachmentState = 'uploading' | 'scanning' | 'available' | 'quarantined' | 'failed'

/** What a file in the list offers, from its state and the application's rules. */
export interface AttachmentOffers {
  /** The name is a download button: only a file that is available (checked and clean). */
  download: boolean
  /** A remove button: whenever the application allows it, in any state. */
  remove: boolean
  /** A retry button: a failed upload, when the application can retry. */
  retry: boolean
  /** A progress bar: while uploading. */
  progress: boolean
}

export function attachmentOffers(
  state: AttachmentState,
  options: { canDownload: boolean; canRemove: boolean; canRetry: boolean },
): AttachmentOffers {
  return {
    download: state === 'available' && options.canDownload,
    remove: options.canRemove,
    retry: state === 'failed' && options.canRetry,
    progress: state === 'uploading',
  }
}
