// @veljaos/ui/rich-text (P5.22): RichTextField and RichText, on Tiptap's MIT packages. A subpath of
// its own, so an application without rich text does not load Tiptap and ProseMirror.
export { RichTextField } from './rich-text-field'
export type { RichTextFieldProps } from './rich-text-field'
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
