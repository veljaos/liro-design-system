/*
 * DefinedForm's stories: definitions as an application would keep them (JSON), fictitious. An
 * equipment request: who asks, what (a category; "Other" asks what), how it arrives (delivery
 * asks for the address), and a confirmation. Not part of the package.
 */
import type { DefinedSection } from './defined-form-logic'

export const REQUEST: DefinedSection[] = [
  {
    id: 'requester',
    title: 'Requester',
    description: 'Who asks, and for which team.',
    fields: [
      { id: 'name', type: 'text', label: 'Name', required: true },
      { id: 'email', type: 'email', label: 'E-mail', required: true },
      {
        id: 'team',
        type: 'select',
        label: 'Team',
        required: true,
        options: [
          { value: 'design', label: 'Design' },
          { value: 'field', label: 'Field work' },
          { value: 'office', label: 'Office' },
        ],
      },
      { id: 'neededBy', type: 'date', label: 'Needed by', required: true },
    ],
  },
  {
    id: 'item',
    title: 'What is needed',
    fields: [
      {
        id: 'category',
        type: 'radio',
        label: 'Category',
        required: true,
        options: [
          { value: 'laptop', label: 'Laptop', description: 'With the standard software.' },
          { value: 'phone', label: 'Phone' },
          { value: 'other', label: 'Other' },
        ],
      },
      {
        id: 'other',
        type: 'text',
        label: 'What exactly',
        required: true,
        visibleWhen: { field: 'category', equals: 'other' },
      },
      { id: 'quantity', type: 'number', label: 'Quantity', required: true },
      {
        id: 'budget',
        type: 'money',
        label: 'Budget',
        currency: 'EUR',
        description: 'Leave empty when the price list applies.',
      },
      {
        id: 'accessories',
        type: 'multiselect',
        label: 'Accessories',
        options: [
          { value: 'bag', label: 'Bag' },
          { value: 'dock', label: 'Docking station' },
          { value: 'headset', label: 'Headset' },
        ],
      },
      {
        id: 'reason',
        type: 'textarea',
        label: 'Why it is needed',
        fullWidth: true,
        requiredWhen: { field: 'budget', filled: true },
        description: 'Required when a budget is given.',
      },
    ],
  },
  {
    id: 'delivery',
    title: 'Delivery',
    fields: [
      {
        id: 'delivery',
        type: 'radio',
        label: 'How it arrives',
        required: true,
        options: [
          { value: 'pickup', label: 'Picked up at the office' },
          { value: 'courier', label: 'By courier' },
        ],
      },
      {
        id: 'address',
        type: 'textarea',
        label: 'Delivery address',
        rows: 2,
        fullWidth: true,
        required: true,
        visibleWhen: { field: 'delivery', equals: 'courier' },
      },
      { id: 'urgent', type: 'switch', label: 'Urgent' },
    ],
  },
  {
    id: 'confirm',
    title: 'Confirmation',
    columns: 1,
    fields: [
      {
        id: 'agree',
        type: 'checkbox',
        label: 'I will return the equipment when I leave the team.',
        required: true,
      },
    ],
  },
]

/** The request filled in: a laptop by courier. */
export const FILLED = {
  name: 'Mia Novak',
  email: 'mia.novak@example.com',
  team: 'design',
  neededBy: '2026-11-02',
  category: 'laptop',
  quantity: '1',
  budget: null,
  accessories: ['dock', 'headset'],
  reason: '',
  delivery: 'courier',
  address: 'Harbour Street 12, 2nd floor',
  urgent: false,
  agree: true,
} as const

/** A long section and long texts from the application. */
export const LONG: DefinedSection[] = [
  {
    id: 'long',
    title:
      'Information about the person responsible for the equipment during the whole period of its use',
    description:
      'The person named here receives the reminders about servicing, insurance and the return of the equipment, and is asked first when anything is missing.',
    fields: [
      {
        id: 'responsible',
        type: 'text',
        label: 'Full name of the person responsible for the equipment, as written in the contract',
        description:
          'Write the name exactly as in the employment contract; a nickname or a shortened name delays the request.',
        required: true,
      },
      {
        id: 'place',
        type: 'radio',
        label: 'Where the equipment will be kept outside working hours',
        required: true,
        options: [
          {
            value: 'office',
            label: 'In the locked cupboard of the office where the person works every day',
          },
          {
            value: 'home',
            label: 'At home, with the written approval of the head of the team attached',
            description:
              'The approval is attached to the request before it is sent; without it, the request returns.',
          },
        ],
      },
    ],
  },
]

/** A collapsible section of rarely used fields, and a field the application filled in. */
export const WITH_EXTRAS: DefinedSection[] = [
  {
    id: 'main',
    title: 'Request',
    fields: [
      {
        id: 'number',
        type: 'text',
        label: 'Number',
        readOnly: true,
        direction: 'ltr',
      },
      { id: 'name', type: 'text', label: 'Name', required: true },
      {
        id: 'costCentre',
        type: 'select',
        label: 'Cost centre',
        readOnly: true,
        options: [{ value: 'cc-10', label: 'CC-10 Design' }],
      },
    ],
  },
  {
    id: 'more',
    title: 'More details',
    collapsible: true,
    fields: [
      { id: 'project', type: 'text', label: 'Project code', direction: 'ltr' },
      { id: 'note', type: 'textarea', label: 'Note', fullWidth: true },
    ],
  },
]

/** A field the application draws itself (its lines), between defined ones. */
export const WITH_CUSTOM: DefinedSection[] = [
  {
    id: 'order',
    title: 'Order',
    fields: [
      { id: 'supplier', type: 'text', label: 'Supplier', required: true },
      { id: 'lines', type: 'custom', label: 'Lines', required: true },
    ],
  },
]

/** Definitions written in Serbian (Latin), on an English page. */
export const SERBIAN: DefinedSection[] = [
  {
    id: 'zahtev',
    title: 'Zahtev za opremu',
    description: 'Ko traži opremu i do kada.',
    fields: [
      { id: 'ime', type: 'text', label: 'Ime i prezime', required: true },
      {
        id: 'vrsta',
        type: 'radio',
        label: 'Vrsta opreme',
        required: true,
        options: [
          { value: 'laptop', label: 'Laptop' },
          { value: 'telefon', label: 'Telefon' },
        ],
      },
      { id: 'rok', type: 'date', label: 'Potrebno do' },
    ],
  },
]

/** Arabic definitions. */
export const ARABIC_REQUEST: DefinedSection[] = [
  {
    id: 'requester',
    title: 'مقدّم الطلب',
    description: 'من يطلب المعدات ولأي فريق.',
    fields: [
      { id: 'name', type: 'text', label: 'الاسم', required: true },
      {
        id: 'category',
        type: 'radio',
        label: 'الفئة',
        required: true,
        options: [
          { value: 'laptop', label: 'حاسوب محمول' },
          { value: 'other', label: 'أخرى' },
        ],
      },
      {
        id: 'other',
        type: 'text',
        label: 'ما المطلوب بالتحديد',
        required: true,
        visibleWhen: { field: 'category', equals: 'other' },
      },
      { id: 'quantity', type: 'number', label: 'الكمية', required: true },
    ],
  },
]

/** Japanese definitions. */
export const JAPANESE_REQUEST: DefinedSection[] = [
  {
    id: 'requester',
    title: '申請者',
    description: '申請する人とチーム。',
    fields: [
      { id: 'name', type: 'text', label: '氏名', required: true },
      {
        id: 'category',
        type: 'radio',
        label: '種類',
        required: true,
        options: [
          { value: 'laptop', label: 'ノートパソコン' },
          { value: 'other', label: 'その他' },
        ],
      },
      {
        id: 'other',
        type: 'text',
        label: '具体的な品目',
        required: true,
        visibleWhen: { field: 'category', equals: 'other' },
      },
      { id: 'quantity', type: 'number', label: '数量', required: true },
    ],
  },
]
