/*
 * Story data of HierarchyChart (P5.42): fictitious. A small company's people by their reporting
 * lines, the same company's units with their heads and headcounts, a group of companies with
 * ownership shares on the lines, and the people in Arabic and Japanese. Every word is the
 * application's; the counts are its words, never computed by the chart. Not part of the package:
 * nothing in src/index.ts imports this file. No classes here.
 */
import type { HierarchyNode } from './hierarchy-logic'

/** Northwind Ltd.'s people: a director, four heads, their teams, one vacant position. */
export const PEOPLE: HierarchyNode[] = [
  {
    id: 'ceo',
    parentId: null,
    title: 'Ana Horvat',
    subtitle: 'Managing director',
    detail: 'Management',
    avatar: 'Ana Horvat',
  },
  {
    id: 'fin',
    parentId: 'ceo',
    title: 'Boris Lang',
    subtitle: 'Head of finance',
    detail: 'Finance',
    avatar: 'Boris Lang',
    count: '3 people',
  },
  {
    id: 'fin1',
    parentId: 'fin',
    title: 'Clara Weiss',
    subtitle: 'Accountant',
    avatar: 'Clara Weiss',
  },
  {
    id: 'fin2',
    parentId: 'fin',
    title: 'David Roth',
    subtitle: 'Payroll clerk',
    avatar: 'David Roth',
    badge: { label: 'On leave', tone: 'warning' },
  },
  { id: 'fin3', parentId: 'fin', title: 'Payroll assistant', subtitle: 'Finance', vacant: true },
  {
    id: 'ops',
    parentId: 'ceo',
    title: 'Eva Novak',
    subtitle: 'Head of operations',
    detail: 'Operations',
    avatar: 'Eva Novak',
    count: '7 people',
  },
  {
    id: 'site1',
    parentId: 'ops',
    title: 'Frank Berg',
    subtitle: 'Site manager',
    detail: 'Harbour Road',
    avatar: 'Frank Berg',
  },
  { id: 's1a', parentId: 'site1', title: 'Gina Moll', subtitle: 'Foreman', avatar: 'Gina Moll' },
  { id: 's1b', parentId: 'site1', title: 'Hugo Falk', subtitle: 'Mason', avatar: 'Hugo Falk' },
  { id: 's1c', parentId: 'site1', title: 'Iris Kühn', subtitle: 'Carpenter', avatar: 'Iris Kühn' },
  {
    id: 'site2',
    parentId: 'ops',
    title: 'Jonas Wolf',
    subtitle: 'Site manager',
    detail: 'Market Square',
    avatar: 'Jonas Wolf',
  },
  {
    id: 's2a',
    parentId: 'site2',
    title: 'Karla Stein',
    subtitle: 'Foreman',
    avatar: 'Karla Stein',
  },
  {
    id: 'sales',
    parentId: 'ceo',
    title: 'Lena Brandt',
    subtitle: 'Head of sales',
    detail: 'Sales',
    avatar: 'Lena Brandt',
    count: '2 people',
  },
  { id: 'sal1', parentId: 'sales', title: 'Max Huber', subtitle: 'Estimator', avatar: 'Max Huber' },
]

/** The same company by its units: the head and the headcount in the application's words. */
export const UNITS: HierarchyNode[] = [
  {
    id: 'u-all',
    parentId: null,
    title: 'Northwind Ltd.',
    subtitle: 'Head: Ana Horvat',
    count: '14 people',
  },
  {
    id: 'u-fin',
    parentId: 'u-all',
    title: 'Finance',
    subtitle: 'Head: Boris Lang',
    count: '4 people',
  },
  {
    id: 'u-ops',
    parentId: 'u-all',
    title: 'Operations',
    subtitle: 'Head: Eva Novak',
    count: '7 people',
  },
  {
    id: 'u-harbour',
    parentId: 'u-ops',
    title: 'Harbour Road site',
    subtitle: 'Head: Frank Berg',
    count: '4 people',
  },
  {
    id: 'u-market',
    parentId: 'u-ops',
    title: 'Market Square site',
    subtitle: 'Head: Jonas Wolf',
    count: '2 people',
  },
  {
    id: 'u-sales',
    parentId: 'u-all',
    title: 'Sales',
    subtitle: 'Head: Lena Brandt',
    count: '2 people',
  },
]

/** A group of companies: ownership shares on the lines, an associate marked. */
export const COMPANIES: HierarchyNode[] = [
  {
    id: 'c-hold',
    parentId: null,
    title: 'Northwind Holding Ltd.',
    subtitle: 'Parent company',
    count: '4 companies',
  },
  {
    id: 'c-build',
    parentId: 'c-hold',
    title: 'Northwind Ltd.',
    subtitle: 'Construction',
    lineLabel: '100%',
    count: '14 people',
  },
  {
    id: 'c-concrete',
    parentId: 'c-hold',
    title: 'Northwind Concrete Ltd.',
    subtitle: 'Ready-mix concrete',
    lineLabel: '60%',
  },
  {
    id: 'c-homes',
    parentId: 'c-build',
    title: 'Harbour Homes Ltd.',
    subtitle: 'Project company',
    lineLabel: '51%',
  },
  {
    id: 'c-assoc',
    parentId: 'c-hold',
    title: 'Facades North Ltd.',
    subtitle: 'Facades',
    lineLabel: '25%',
    badge: { label: 'Associate', tone: 'neutral' },
  },
]

/** Long names and words, for wrapping. */
export const LONG_PEOPLE: HierarchyNode[] = PEOPLE.slice(0, 6).map((node) =>
  node.id === 'fin'
    ? {
        ...node,
        title: 'Bartholomew Alexander Langenfeld-Kowalczyk',
        subtitle: 'Head of finance, administration, controlling and the payroll of every site',
        detail: 'Finance and administration, second floor of the Harbour Road office',
      }
    : node,
)

export const ARABIC_PEOPLE: HierarchyNode[] = [
  { id: 'a1', parentId: null, title: 'ليلى حداد', subtitle: 'المديرة العامة', avatar: 'ليلى حداد' },
  {
    id: 'a2',
    parentId: 'a1',
    title: 'سامر خوري',
    subtitle: 'رئيس المالية',
    avatar: 'سامر خوري',
    count: '٣ أشخاص',
  },
  { id: 'a3', parentId: 'a2', title: 'نور سليم', subtitle: 'محاسبة', avatar: 'نور سليم' },
  { id: 'a4', parentId: 'a1', title: 'كريم نصار', subtitle: 'رئيس العمليات', avatar: 'كريم نصار' },
  { id: 'a5', parentId: 'a1', title: 'مساعد مشتريات', subtitle: 'المشتريات', vacant: true },
]

export const JAPANESE_PEOPLE: HierarchyNode[] = [
  { id: 'j1', parentId: null, title: '佐藤 花子', subtitle: '代表取締役', avatar: '佐藤 花子' },
  {
    id: 'j2',
    parentId: 'j1',
    title: '鈴木 一郎',
    subtitle: '経理部長',
    avatar: '鈴木 一郎',
    count: '3名',
  },
  { id: 'j3', parentId: 'j2', title: '高橋 美咲', subtitle: '経理担当', avatar: '高橋 美咲' },
  { id: 'j4', parentId: 'j1', title: '田中 健', subtitle: '工事部長', avatar: '田中 健' },
  { id: 'j5', parentId: 'j1', title: '購買担当', subtitle: '購買部', vacant: true },
]
