import type {
  LegalAct,
  LegalAmendment,
  LegalArticle,
  LegalNode,
  LegalNote,
  LegalVersion,
  PracticeItem,
  RelatedAct,
} from './legal-model'

/*
 * The pure logic of a legal act's page and its side panels: finding an
 * article, narrowing the panels to one article, counting what concerns it, grouping related acts
 * by type, and the version a page shows. Nothing legal is decided here: which act refers to which,
 * which amendment changed which article, which decision concerns which article — all of it is the
 * application's data; these functions only select and count it.
 */

/** Every article of the act, in the text's order (headings walked depth first). */
export function articlesOf(nodes: readonly LegalNode[]): LegalArticle[] {
  const found: LegalArticle[] = []
  const walk = (list: readonly LegalNode[]) => {
    for (const node of list) {
      if (node.kind === 'article') found.push(node)
      else walk(node.children)
    }
  }
  walk(nodes)
  return found
}

/** The article with this id, or undefined. */
export function findArticle(
  nodes: readonly LegalNode[],
  articleId: string,
): LegalArticle | undefined {
  return articlesOf(nodes).find((article) => article.id === articleId)
}

/** Whether an item concerns the article: its `articleIds` name it. */
function concerns(item: { articleIds?: readonly string[] | undefined }, articleId: string) {
  return item.articleIds?.includes(articleId) === true
}

/**
 * The items for the panel: all of them for the whole act (`articleId` undefined), else only the
 * ones whose `articleIds` name the article (an item about the whole act names none, so it goes).
 */
export function itemsForArticle<T extends { articleIds?: readonly string[] | undefined }>(
  items: readonly T[],
  articleId: string | undefined,
): T[] {
  return articleId === undefined ? [...items] : items.filter((item) => concerns(item, articleId))
}

/** A user's notes for the panel: all, or the ones on the article. */
export function notesFor(notes: readonly LegalNote[], articleId: string | undefined): LegalNote[] {
  return articleId === undefined ? [...notes] : notes.filter((note) => note.articleId === articleId)
}

/** The amending acts that changed the article (in the act's order, oldest first). */
export function amendmentsFor(
  amendments: readonly LegalAmendment[],
  articleId: string | undefined,
): LegalAmendment[] {
  return articleId === undefined
    ? [...amendments]
    : amendments.filter((amendment) => amendment.articleIds.includes(articleId))
}

/** What the narrowed panel says about one article: changes, court decisions, opinions. */
export interface ArticleCounts {
  changes: number
  decisions: number
  opinions: number
}

/**
 * The counts of the narrowed panel's summary ("Article 57: changed twice, 3 court decisions, 1
 * opinion"). Changes are the amending acts whose `articleIds` name the article — the same list
 * the History of changes panel shows, so the two always agree.
 */
export function articleCounts(
  act: Pick<LegalAct, 'amendments'>,
  practice: readonly PracticeItem[],
  articleId: string,
): ArticleCounts {
  const items = itemsForArticle(practice, articleId)
  return {
    changes: amendmentsFor(act.amendments, articleId).length,
    decisions: items.filter((item) => item.kind === 'decision').length,
    opinions: items.filter((item) => item.kind === 'opinion').length,
  }
}

/** Related acts grouped by their `type`, groups in the order of first appearance. */
export function groupRelatedByType(
  items: readonly RelatedAct[],
): { type: string; items: RelatedAct[] }[] {
  const groups = new Map<string, RelatedAct[]>()
  for (const item of items) {
    const list = groups.get(item.type) ?? []
    list.push(item)
    groups.set(item.type, list)
  }
  return [...groups.entries()].map(([type, list]) => ({ type, items: list }))
}

/**
 * The articles the practice filter offers: those some decision or opinion concerns, in the act's
 * order (an id the text does not hold is left out: it could not be named).
 */
export function practiceArticles(
  nodes: readonly LegalNode[],
  practice: readonly PracticeItem[],
): LegalArticle[] {
  const named = new Set(practice.flatMap((item) => item.articleIds))
  return articlesOf(nodes).filter((article) => named.has(article.id))
}

/** The version the page shows (`act.versionId`), or the first one when the id is unknown. */
export function shownVersion(
  act: Pick<LegalAct, 'versionId' | 'versions'>,
): LegalVersion | undefined {
  return act.versions.find((version) => version.id === act.versionId) ?? act.versions[0]
}

/**
 * The day the header's "Version as of …" names: the application's `asOf` when it gives one;
 * otherwise `today` for the current version (no `to`) and the version's first day for an older
 * one (its text as it stood from that day).
 */
export function versionAsOf(
  version: LegalVersion | undefined,
  today: string,
  asOf?: string,
): string {
  if (asOf !== undefined) return asOf
  if (version?.to === undefined) return today
  return version.from
}

/** The versions, newest first (by their first day): the order of the picker and of "Compare with…". */
export function versionsNewestFirst(versions: readonly LegalVersion[]): LegalVersion[] {
  return [...versions].sort((a, b) => (a.from < b.from ? 1 : a.from > b.from ? -1 : 0))
}

/** The versions other than the one shown: what "Compare with…" offers, newest first. */
export function otherVersions(versions: readonly LegalVersion[], shownId: string): LegalVersion[] {
  return versionsNewestFirst(versions.filter((version) => version.id !== shownId))
}
