import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  MoreHorizontal,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Settings,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

/**
 * The colour of an action by its purpose (BUILD-PLAN Appendix A.6). Blue means confirm, red
 * means destructive, everywhere.
 */
export type Family =
  'primary' | 'verify' | 'document' | 'positive' | 'destructive' | 'caution' | 'neutral'

export const FAMILY_NAMES: readonly Family[] = [
  'primary',
  'verify',
  'document',
  'positive',
  'destructive',
  'caution',
  'neutral',
]

/**
 * The weight of a button within its family: primary = filled, secondary = light (neutral:
 * default, with a border), menu = subtle (text only; it usually lives in a "more" menu).
 */
export type Emphasis = 'primary' | 'secondary' | 'menu'

/** An icon component, such as one from lucide-react. It is drawn at the button's icon size. */
export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

export interface IntentInfo {
  family: Family
  emphasis: Emphasis
  /** Whether the action asks for confirmation (ConfirmDialog, P2.4). */
  confirms: boolean
  icon: IconComponent
  /** A direction arrow, drawn mirrored in right-to-left. */
  mirrorsInRtl: boolean
}

function info(
  family: Family,
  emphasis: Emphasis,
  icon: IconComponent,
  options: { confirms?: boolean; mirrorsInRtl?: boolean } = {},
): IntentInfo {
  return {
    family,
    emphasis,
    icon,
    confirms: options.confirms ?? false,
    mirrorsInRtl: options.mirrorsInRtl ?? false,
  }
}

/** The interface intents of Appendix A.6: each with family, default emphasis, confirmation and icon. */
export const INTENTS = {
  create: info('primary', 'primary', Plus),
  save: info('primary', 'primary', Save),
  confirm: info('primary', 'primary', Check),
  next: info('primary', 'primary', ArrowRight, { mirrorsInRtl: true }),
  pdf: info('document', 'primary', FileText),
  print: info('document', 'primary', Printer),
  preview: info('document', 'secondary', Eye),
  download: info('document', 'secondary', Download),
  export: info('positive', 'secondary', FileSpreadsheet),
  delete: info('destructive', 'menu', Trash2, { confirms: true }),
  edit: info('neutral', 'secondary', Pencil),
  view: info('neutral', 'menu', Eye),
  filter: info('neutral', 'secondary', Filter),
  refresh: info('neutral', 'menu', RefreshCw),
  back: info('neutral', 'menu', ArrowLeft, { mirrorsInRtl: true }),
  cancel: info('neutral', 'secondary', X),
  duplicate: info('neutral', 'secondary', Copy),
  import: info('neutral', 'secondary', Upload),
  settings: info('neutral', 'menu', Settings),
  more: info('neutral', 'menu', MoreHorizontal),
} as const satisfies Record<string, IntentInfo>

export type Intent = keyof typeof INTENTS

export const INTENT_NAMES = Object.keys(INTENTS) as Intent[]
