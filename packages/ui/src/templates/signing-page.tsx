import type { ReactNode } from 'react'
import { SectionCard } from '../components/cards'
import { usePhone } from '../components/use-phone'
import { useLiro } from '../provider/liro-provider'
import { DetailPage, type DetailSection } from './detail-page'
import type { PageBack } from './page-header'

/*
 * SigningPage (BUILD-PLAN P5.21, signing): a document awaiting signatures. Built on DetailPage
 * (one page frame, one header, one side column rule), not a layout of its own.
 * - Desktop: the header (back, the document's number, its status, a subtitle, the actions), then
 *   the document's preview as the first section, edge to edge (`preview`: the application's
 *   viewer — DocumentFrame, P5.5), the attachments section, any further sections; the signers
 *   (`signers`: a SignerList) in the side column, 300px from 75em, under the content below that.
 * - Phones: the signers come first — the person came to sign or to see who has —, then the
 *   document and the attachments. The application puts the user's Sign into the AppShell's
 *   bottom bar if it wants it within thumb reach (P4.9 rule 16).
 * - Section titles from `messages['signing.signers' | 'signing.document' | 'signing.attachments']`
 *   unless the application names them.
 */

export interface SigningPageProps {
  /** The document's number: the page's h1 ("RU-2026-017"). */
  title: string
  back?: PageBack
  /** After the title: a StatusBadge ("Awaiting signatures"). */
  status?: ReactNode
  /** A line under the title ("Employment contract · Stefan Nikolić"). */
  subtitle?: ReactNode
  /** The page's actions at the end of the header (Download PDF, Send reminder), main one last. */
  actions?: ReactNode
  /** The document's preview: the application's viewer (DocumentFrame). */
  preview: ReactNode
  /** The signers: a SignerList. */
  signers: ReactNode
  /** The attachments: an AttachmentList (P5.5); the section is left out without them. */
  attachments?: ReactNode
  /** Further sections (the document's details), after the attachments. */
  sections?: readonly DetailSection[]
  /** Section titles. Default: from messages. */
  signersTitle?: string
  previewTitle?: string
  attachmentsTitle?: string
  /** 'desktop' or 'phone' forces one; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

/** A document awaiting signatures: the preview, the attachments and the signers. */
export function SigningPage(props: SigningPageProps) {
  const { messages } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const signersTitle = props.signersTitle ?? messages['signing.signers']
  const signers: DetailSection = { id: 'signers', label: signersTitle, content: props.signers }
  const previewSection: DetailSection = {
    id: 'document',
    label: props.previewTitle ?? messages['signing.document'],
    flush: true,
    content: props.preview,
  }
  const attachments: DetailSection[] =
    props.attachments === undefined
      ? []
      : [
          {
            id: 'attachments',
            label: props.attachmentsTitle ?? messages['signing.attachments'],
            content: props.attachments,
          },
        ]
  const sections = [
    ...(phone ? [signers] : []),
    previewSection,
    ...attachments,
    ...(props.sections ?? []),
  ]
  return (
    <DetailPage
      title={props.title}
      sections={sections}
      layout={phone ? 'phone' : 'desktop'}
      {...(props.back === undefined ? {} : { back: props.back })}
      {...(props.status === undefined ? {} : { status: props.status })}
      {...(props.subtitle === undefined ? {} : { subtitle: props.subtitle })}
      {...(props.actions === undefined ? {} : { actions: props.actions })}
      {...(props.className === undefined ? {} : { className: props.className })}
      {...(phone
        ? {}
        : {
            side: (
              <SectionCard title={signersTitle} headingLevel={2}>
                {props.signers}
              </SectionCard>
            ),
          })}
    />
  )
}
