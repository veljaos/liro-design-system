// @veljaos/ui/rich-text (P5.22): RichTextField and RichText, on Tiptap's MIT packages. A subpath of
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
// ── P5.29 agent: ReplyComposer (P5.30) ──
export { groupSavedReplies, isSendKey, linkNodes, ReplyComposer } from './reply-composer'
export type {
  ComposedReply,
  ComposerLink,
  ComposerMode,
  ReplyComposerProps,
  SavedReply,
} from './reply-composer'

// ── P5.29 portal ──
export { headingSlug, richTextHeadings } from './rich-text-headings'
export type { RichTextHeading } from './rich-text-headings'

// ── P5.34 ai: merge fields filled for a preview (P5.38) ──
export { fillMergeFields, fillMergeText, mergeTextKeys } from './merge-fill'
