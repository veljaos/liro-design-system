/*
 * The shape of a legal act as the application gives it (BUILD-PLAN P5.27; docs/decisions.md
 * "Legal information"): the library presents it and computes nothing legal. Every text, date,
 * status and reference is the application's; dates are YYYY-MM-DD and go through `format`.
 *
 * Words such as "Article", "Part", "Deleted", "Amended by" are part of the data (`label`s), not
 * the library's: acts are numbered and named differently in every legal system and language.
 */

/** A status of an act or a version, from the application's map (In force, Partly in force …). */
export interface LegalStatus {
  id: string
  label: string
  /** Its tone, as StatusBadge's; never blue (D17). */
  tone: 'success' | 'warning' | 'danger' | 'neutral' | 'premium'
}

/** Where a reference leads: an article of this act (no `actId`) or of another act. */
export interface LegalTarget {
  actId?: string
  articleId?: string
  /** The address of the target, through the provider's `linkComponent`. */
  href: string
}

/** A run of an article's text: plain text, a reference, a footnote mark, or emphasis. */
export type LegalInline =
  | string
  | { kind: 'ref'; text: string; target: LegalTarget }
  | { kind: 'footnote'; id: string; mark: string }
  | { kind: 'emphasis'; text: string }

/** An item or a sub-item ("1)", "a)"), with its own items. */
export interface LegalPoint {
  id: string
  label: string
  content: readonly LegalInline[]
  points?: readonly LegalPoint[]
}

/** A paragraph of an article ("(1)"; an article of one paragraph has no label). */
export interface LegalParagraph {
  id: string
  label?: string
  content: readonly LegalInline[]
  points?: readonly LegalPoint[]
}

/** A change an amending act made to an article. */
export interface LegalArticleChange {
  /** The amending act's id (in `LegalAct.amendments`). */
  amendmentId: string
  /** The words shown: "Amended by No. 47/2018". */
  label: string
  /** The day the change applies from. */
  appliesFrom: string
}

export interface LegalArticle {
  kind: 'article'
  id: string
  /** "Article 57". */
  label: string
  title?: string
  paragraphs: readonly LegalParagraph[]
  /** The changes made to it, oldest first. */
  changes?: readonly LegalArticleChange[]
  /** A deleted article: the words shown ("Deleted (No. 33/2021)"); shown collapsed. */
  deleted?: string
  /** An article not yet in force: the day it applies from. */
  inForceFrom?: string
  /** The article's own address (copy link). */
  href: string
}

/** A part, chapter or section heading and what stands under it. */
export interface LegalHeading {
  kind: 'heading'
  id: string
  /** 1 part, 2 chapter, 3 section, 4 subsection. */
  level: 1 | 2 | 3 | 4
  /** "Part One", "Chapter III". */
  label: string
  title?: string
  children: readonly LegalNode[]
}

export type LegalNode = LegalHeading | LegalArticle

export interface LegalFootnote {
  id: string
  mark: string
  content: readonly LegalInline[]
}

/** A gazette reference: "No. 47/2018", the issue's address, and the day it was published. */
export interface GazetteReference {
  id: string
  label: string
  published?: string
  href?: string
}

/** An amending act and what it changed. */
export interface LegalAmendment {
  id: string
  /** "Law amending the Law on …", or the gazette number. */
  label: string
  gazette: GazetteReference
  /** The day it applies from. */
  appliesFrom: string
  /** The articles it changed (ids in the act), with the words shown ("Articles 12, 57 and 90"). */
  articleIds: readonly string[]
  articlesText?: string
  href?: string
}

/** A consolidated version: the act's text in force between two days. */
export interface LegalVersion {
  id: string
  /** First day of the version. */
  from: string
  /** Last day, or none for the current version. */
  to?: string
  /** The amending act that produced it (none for the original text). */
  amendmentId?: string
  status?: LegalStatus
}

/** The act, as the application gives it for one version. */
export interface LegalAct {
  id: string
  /** "Law", "Rulebook", "Decision". */
  type: string
  title: string
  issuer: string
  /** Every gazette reference, the original first. */
  gazette: readonly GazetteReference[]
  status: LegalStatus
  /** The version shown. */
  versionId: string
  versions: readonly LegalVersion[]
  amendments: readonly LegalAmendment[]
  /** The text of the version shown. */
  nodes: readonly LegalNode[]
  footnotes?: readonly LegalFootnote[]
  /** The language tag of the text (`sr-Cyrl`, `sr-Latn`, `en`), for `lang` (D15). */
  lang?: string
}

/** An act related to this one (hierarchy, references, practice). */
export interface RelatedAct {
  id: string
  type: string
  title: string
  status?: LegalStatus
  href: string
  /** What ties it ("Based on Article 63 of …", "Article 12 refers to"). */
  note?: string
  /** The articles of this act it concerns. */
  articleIds?: readonly string[]
}

/** A court decision or an official opinion. */
export interface PracticeItem {
  id: string
  kind: 'decision' | 'opinion'
  /** The court or the issuer. */
  issuer: string
  /** "Rev 123/2020". */
  number: string
  date: string
  summary: string
  href: string
  /** The articles of this act it concerns. */
  articleIds: readonly string[]
}

/** A note or a bookmark of the user's on an article (or on the whole act, without one). */
export interface LegalNote {
  id: string
  articleId?: string
  kind: 'note' | 'bookmark'
  text?: string
  created: string
}
