import type { ReactNode } from 'react'
import type {
  LegalAct,
  LegalArticle,
  LegalInline,
  LegalNode,
  LegalPoint,
} from '../components/legal-model'
import { shownVersion, versionAsOf } from '../components/legal-panels-logic'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLangAttribute } from '../provider/lang'
import { useLiro } from '../provider/liro-provider'
import { PrintPage, type PrintFrameProps } from './print-page'
import { PrintSection, PrintTitle } from './print-parts'

/*
 * PrintLegalAct (BUILD-PLAN P5.27 a, "Print / PDF"): one version of a legal act on A4 paper, on
 * PrintPage (P5.15): the paper is light, the page header repeats on every page (the act's title
 * and its gazette references), the page number "Page 2 of 5" in the bottom margin.
 * - **First page:** the title (h1), "Law · Illustrative National Assembly", the gazette line,
 *   "Version as of …", and the application's `note` (an "Illustrative" line) in a bordered box.
 * - **The text, drawn from the model's nodes here** (no windowing on paper — every article is
 *   printed; the screen's text component is not used, so the printout has no buttons or links):
 *   parts, chapters and sections as headings, centred, as acts are set on paper; each article's
 *   label (and title) centred and semibold, its paragraphs with their labels ("(1)"), items and
 *   sub-items indented under them; references as plain text, emphasis in italics, footnote marks
 *   raised; a changed article's change labels ("Amended by No. 47/2018") small under its label; a
 *   deleted article its words ("Deleted (No. 33/2021)") only; an article not yet in force "Applies
 *   from …". The footnotes at the end under "Footnotes".
 * - Headings are kept with what follows them, paragraphs break with at least three lines on each
 *   side (PrintPage's rules). `lang` from `act.lang` on the text (D15).
 */

export interface PrintLegalActProps extends PrintFrameProps {
  /** The act, its text the version shown (`act.versionId`). */
  act: LegalAct
  /** The gazette's name before its numbers ("Illustrative Gazette"), from the application. */
  gazetteName?: string
  /** The day of "Version as of …"; default as on the page (today, or an older version's first day). */
  asOf?: string
  /** A line at the top of the first page, from the application ("Illustrative act: …"). */
  note?: string
}

function Inline({ content }: { content: readonly LegalInline[] }) {
  return (
    <>
      {content.map((part, index) => {
        if (typeof part === 'string') return part
        if (part.kind === 'footnote') {
          return (
            <sup key={index} className="text-xs">
              {part.mark}
            </sup>
          )
        }
        if (part.kind === 'emphasis') return <em key={index}>{part.text}</em>
        return part.text
      })}
    </>
  )
}

function Points({ points }: { points: readonly LegalPoint[] }) {
  return (
    <ol className="m-0 flex list-none flex-col gap-1 p-0 ps-6">
      {points.map((point) => (
        <li key={point.id} className={cn('text-sm text-primary', TEXT_DIRECTION)}>
          <span className="me-1.5">{point.label}</span>
          <Inline content={point.content} />
          {point.points !== undefined && point.points.length > 0 && (
            <div className="pt-1">
              <Points points={point.points} />
            </div>
          )}
        </li>
      ))}
    </ol>
  )
}

function Article({ article, level }: { article: LegalArticle; level: number }) {
  const { messages, format } = useLiro()
  const Heading = `h${String(Math.min(level, 6))}` as 'h4'
  return (
    <section data-slot="print-legal-article" className="flex flex-col gap-2 pt-2">
      <Heading className={cn('m-0 text-center text-sm font-semibold text-primary', TEXT_ISOLATE)}>
        {article.label}
        {article.title !== undefined && (
          <>
            <br />
            {article.title}
          </>
        )}
      </Heading>
      {article.changes !== undefined && article.changes.length > 0 && (
        <p className={cn('m-0 text-center text-xs text-secondary', TEXT_ISOLATE)}>
          {article.changes.map((change) => change.label).join('; ')}
        </p>
      )}
      {article.inForceFrom !== undefined && (
        <p className={cn('m-0 text-center text-xs text-secondary', TEXT_ISOLATE)}>
          {messages['legalPanel.appliesFrom'](format.date(article.inForceFrom))}
        </p>
      )}
      {article.deleted === undefined ? (
        article.paragraphs.map((paragraph) => (
          <div key={paragraph.id} className="flex flex-col gap-1">
            <p className={cn('m-0 text-sm text-primary', TEXT_DIRECTION)}>
              {paragraph.label !== undefined && <span className="me-1.5">{paragraph.label}</span>}
              <Inline content={paragraph.content} />
            </p>
            {paragraph.points !== undefined && paragraph.points.length > 0 && (
              <Points points={paragraph.points} />
            )}
          </div>
        ))
      ) : (
        <p className={cn('m-0 text-sm text-secondary italic', TEXT_DIRECTION)}>{article.deleted}</p>
      )}
    </section>
  )
}

function Nodes({ nodes, level }: { nodes: readonly LegalNode[]; level: number }): ReactNode {
  return nodes.map((node) => {
    if (node.kind === 'article') return <Article key={node.id} article={node} level={level} />
    const Heading = `h${String(Math.min(level, 6))}` as 'h2'
    return (
      <section key={node.id} data-slot="print-legal-heading" className="flex flex-col gap-2 pt-4">
        <Heading
          className={cn(
            'm-0 text-center text-primary',
            node.level === 1 ? 'text-md font-bold' : 'text-sm font-semibold',
            TEXT_ISOLATE,
          )}
        >
          {node.label}
          {node.title !== undefined && (
            <>
              <br />
              {node.title}
            </>
          )}
        </Heading>
        <Nodes nodes={node.children} level={level + 1} />
      </section>
    )
  })
}

/** One version of a legal act on A4: the title page lines, the whole text, the footnotes. */
export function PrintLegalAct(props: PrintLegalActProps) {
  const { messages, format, today } = useLiro()
  const lang = useLangAttribute(props.act.lang)
  const { act } = props
  const gazette = [
    ...(props.gazetteName === undefined ? [] : [props.gazetteName]),
    act.gazette.map((reference) => reference.label).join(', '),
  ].join(' ')
  const asOf = messages['legalPage.versionAsOf'](
    format.date(versionAsOf(shownVersion(act), today, props.asOf)),
  )
  const header = props.header ?? (
    <span className="flex flex-wrap justify-between gap-x-4">
      <span {...lang} className={TEXT_ISOLATE}>
        {act.title}
      </span>
      <span className={TEXT_ISOLATE}>{gazette}</span>
    </span>
  )
  return (
    <PrintPage
      title={act.title}
      header={header}
      {...(props.footer === undefined ? {} : { footer: props.footer })}
      {...(props.orientation === undefined ? {} : { orientation: props.orientation })}
      {...(props.margins === undefined ? {} : { margins: props.margins })}
      {...(props.pageNumbers === undefined ? {} : { pageNumbers: props.pageNumbers })}
      {...(props.status === undefined ? {} : { status: props.status })}
      {...(props.fit === undefined ? {} : { fit: props.fit })}
    >
      <div data-slot="print-legal-act" className="flex flex-col gap-4">
        <div {...lang}>
          <PrintTitle title={act.title} subtitle={`${act.type} · ${act.issuer}`} />
        </div>
        <div className="flex flex-col gap-0.5">
          {act.gazette.length > 0 && (
            <p className={cn('m-0 text-sm text-primary', TEXT_DIRECTION)}>{gazette}</p>
          )}
          <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>{asOf}</p>
        </div>
        {props.note !== undefined && (
          <p
            className={cn(
              'm-0 rounded-md border border-solid border-strong px-3 py-2 text-sm text-primary break-inside-avoid',
              TEXT_DIRECTION,
            )}
          >
            {props.note}
          </p>
        )}
        <div {...lang} data-slot="print-legal-text" className="flex flex-col gap-2">
          <Nodes nodes={act.nodes} level={2} />
        </div>
        {act.footnotes !== undefined && act.footnotes.length > 0 && (
          <PrintSection title={messages['legalPrint.footnotes']}>
            <ol {...lang} className="m-0 flex list-none flex-col gap-1 p-0">
              {act.footnotes.map((footnote) => (
                <li key={footnote.id} className={cn('text-xs text-primary', TEXT_DIRECTION)}>
                  <sup className="me-1">{footnote.mark}</sup>
                  <Inline content={footnote.content} />
                </li>
              ))}
            </ol>
          </PrintSection>
        )}
      </div>
    </PrintPage>
  )
}
