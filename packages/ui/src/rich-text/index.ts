// @veljaos/ui/rich-text: RichTextField and RichText, on Tiptap's MIT packages. A subpath of
// its own, so an application without rich text does not load Tiptap and ProseMirror.
export { insertable, RichTextField } from './rich-text-field'
export type { RichTextFieldHandle, RichTextFieldProps } from './rich-text-field'
export { RichText } from './rich-text'
export type { RichTextMergeField, RichTextProps } from './rich-text'
export {
  EMPTY_RICH_TEXT,
  isRichTextEmpty,
  linkFromInput,
  MERGE_FIELD_KEY,
  normalizeRichText,
  richTextFromHtml,
  richTextLength,
  richTextMentions,
  richTextMergeFields,
  richTextToHtml,
  richTextValue,
  safeHref,
  sanitizeRichHtml,
  suggestionAt,
  toolbarKeyTarget,
} from './rich-text-logic'
export type {
  RichTextMark,
  RichTextMention,
  RichTextNode,
  RichTextSuggestion,
  RichTextValue,
} from './rich-text-logic'
// ── ReplyComposer ──
export { groupSavedReplies, isSendKey, linkNodes, ReplyComposer } from './reply-composer'
export type {
  ComposedReply,
  ComposerLink,
  ComposerMode,
  ReplyComposerProps,
  SavedReply,
} from './reply-composer'

// ── Heading ids ──
export { headingSlug, richTextHeadings } from './rich-text-headings'
export type { RichTextHeading } from './rich-text-headings'

// ── Merge values ──
export {
  mergeFieldText,
  missingMergeFields,
  resolveMergeFields,
  resolveMergeText,
} from './merge-values'
export type {
  MergeContext,
  MergeResult,
  MergeValue,
  MergeValueKind,
  MergeValues,
} from './merge-values'
