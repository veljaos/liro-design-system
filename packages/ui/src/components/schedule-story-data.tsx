import type { ReactNode } from 'react'
import type { Weekday } from '../provider/format'
import { LiroProvider, useLiro } from '../provider/liro-provider'
import type { CalendarEvent } from './calendar-view'
import type { FreeSlot, UnavailableTime } from './schedule-logic'

/*
 * Fictitious data for the scheduling stories (P5.8): a health clinic in Novi Sad and the timetable
 * of "OŠ Jovan Popović". Not part of the package: nothing in src/index.ts imports this file. No
 * classes here: Storybook compiles classes only from *.stories.tsx files.
 */

/** The tenant's date in the scheduling stories: Wednesday 14 October 2026. */
export const SCHEDULE_TODAY = '2026-10-14'

/**
 * A provider in the story's theme and direction with a fixed today, so pictures never change with
 * the date; locale, week start and time zone may be given.
 */
export function ScheduleFrame({
  locale,
  direction,
  weekStartsOn,
  timeZone,
  today = SCHEDULE_TODAY,
  children,
}: {
  locale?: string
  direction?: 'ltr' | 'rtl'
  weekStartsOn?: Weekday
  timeZone?: string
  today?: string
  children: ReactNode
}) {
  const liro = useLiro()
  const dir = direction ?? (locale === undefined ? liro.direction : undefined)
  // A Serbian tenant's week starts on Monday, whatever the story's format locale.
  return (
    <LiroProvider
      locale={locale ?? liro.locale}
      {...(dir === undefined ? {} : { direction: dir })}
      colorScheme={liro.colorScheme}
      today={today}
      weekStartsOn={weekStartsOn ?? 1}
      timeZone={timeZone ?? 'Europe/Belgrade'}
    >
      {children}
    </LiroProvider>
  )
}

/** Dr Milica Jovanović's week at the clinic (12–18 October 2026), with overlaps and all-day items. */
export const CLINIC_EVENTS: readonly CalendarEvent[] = [
  { id: 'e1', title: 'Check-up: Marko Ilić', start: '2026-10-12T08:00', end: '2026-10-12T08:30' },
  {
    id: 'e2',
    title: 'Blood pressure control: Ana Petrović',
    start: '2026-10-12T08:30',
    end: '2026-10-12T09:00',
  },
  {
    id: 'e3',
    title: 'Team meeting',
    start: '2026-10-12T10:00',
    end: '2026-10-12T11:00',
    tone: 'info',
    description: 'Room 2, ground floor',
  },
  {
    id: 'e4',
    title: 'Vaccination: Luka Popović',
    start: '2026-10-13T09:00',
    end: '2026-10-13T09:45',
    tone: 'success',
  },
  {
    id: 'e5',
    title: 'Phone consultation: Ivana Marković',
    start: '2026-10-13T09:30',
    end: '2026-10-13T10:00',
  },
  { id: 'e6', title: 'Check-up: Petar Đurić', start: '2026-10-14T08:00', end: '2026-10-14T08:30' },
  {
    id: 'e7',
    title: 'Minor surgery: Stefan Đorđević',
    start: '2026-10-14T09:00',
    end: '2026-10-14T10:30',
    tone: 'warning',
    description: 'Procedure room, bring the consent form',
  },
  {
    id: 'e8',
    title: 'Consultation: Dragana Nikolić',
    start: '2026-10-14T09:30',
    end: '2026-10-14T10:00',
  },
  {
    id: 'e9',
    title: 'Lab results: Milan Savić',
    start: '2026-10-14T10:00',
    end: '2026-10-14T10:30',
  },
  {
    id: 'e10',
    title: 'Home visit: Vera Tomić, Liman 3',
    start: '2026-10-14T13:00',
    end: '2026-10-14T14:30',
    description: 'Bulevar cara Lazara 56, Novi Sad',
  },
  {
    id: 'e11',
    title: 'Medical education seminar',
    start: '2026-10-15',
    tone: 'premium',
    description: 'Hotel Park, Novi Sad',
  },
  {
    id: 'e12',
    title: 'Check-up: Jovana Simić',
    start: '2026-10-15T11:00',
    end: '2026-10-15T11:30',
  },
  { id: 'e13', title: 'On call', start: '2026-10-16', tone: 'info' },
  {
    id: 'e14',
    title: 'Cancelled: Teodora Lazić',
    start: '2026-10-16T12:00',
    end: '2026-10-16T12:30',
    tone: 'danger',
    description: 'The patient cancelled by phone',
  },
  {
    id: 'e15',
    title: 'Ultrasound: Nikola Babić',
    start: '2026-10-16T14:00',
    end: '2026-10-16T14:40',
  },
  {
    id: 'e16',
    title: 'Early shift handover',
    start: '2026-10-16T06:30',
    end: '2026-10-16T06:50',
  },
  {
    id: 'e17',
    title: 'Annual leave',
    start: '2026-10-26',
    end: '2026-10-30',
    tone: 'neutral',
  },
  {
    id: 'e18',
    title: 'Check-up: Uroš Pavlović',
    start: '2026-10-05T09:00',
    end: '2026-10-05T09:30',
  },
  {
    id: 'e19',
    title: 'Diabetes control: Zorica Mitić',
    start: '2026-10-07T10:00',
    end: '2026-10-07T10:30',
  },
  {
    id: 'e20',
    title: 'Team meeting',
    start: '2026-10-19T10:00',
    end: '2026-10-19T11:00',
    tone: 'info',
  },
  { id: 'e21', title: 'Check-up: Saša Kostić', start: '2026-10-21T08:30', end: '2026-10-21T09:00' },
]

/** Long titles and descriptions. */
export const LONG_EVENTS: readonly CalendarEvent[] = [
  {
    id: 'l1',
    title:
      'Specialist consultation with the cardiologist about the results of the 24-hour Holter monitoring: Aleksandar Vukašinović',
    start: '2026-10-14T09:00',
    end: '2026-10-14T10:00',
    description:
      'Bring the previous findings from the Institute of Cardiovascular Diseases of Vojvodina in Sremska Kamenica and the list of current therapy.',
  },
  {
    id: 'l2',
    title: 'Interdisciplinary meeting of the palliative care team of the Novi Sad health centre',
    start: '2026-10-14',
    tone: 'info',
  },
  {
    id: 'l3',
    title:
      'Check-up after the treatment of a complicated fracture of the left forearm: Kristina Radivojević-Stanković',
    start: '2026-10-14T09:30',
    end: '2026-10-14T10:00',
  },
]

/** The clinic's doctors and rooms: the rows of the ResourceSchedule. */
export const CLINIC_RESOURCES = [
  { id: 'jovanovic', name: 'Dr Milica Jovanović', description: 'General practice' },
  { id: 'kovacevic', name: 'Dr Nenad Kovačević', description: 'Cardiology' },
  { id: 'stojanovic', name: 'Dr Jelena Stojanović', description: 'Paediatrics' },
  { id: 'ultrasound', name: 'Ultrasound room', description: 'Ground floor, room 4' },
] as const

/** The bookings of Wednesday 14 October 2026. */
export const CLINIC_BOOKINGS = [
  {
    id: 'b1',
    resourceId: 'jovanovic',
    title: 'Marko Ilić',
    description: 'Check-up',
    start: '2026-10-14T08:00',
    end: '2026-10-14T08:30',
  },
  {
    id: 'b2',
    resourceId: 'jovanovic',
    title: 'Ana Petrović',
    description: 'Blood pressure',
    start: '2026-10-14T09:00',
    end: '2026-10-14T10:00',
  },
  {
    id: 'b3',
    resourceId: 'kovacevic',
    title: 'Stefan Đorđević',
    description: 'ECG',
    start: '2026-10-14T08:30',
    end: '2026-10-14T09:30',
    tone: 'warning' as const,
  },
  {
    id: 'b4',
    resourceId: 'kovacevic',
    title: 'Dragana Nikolić',
    description: 'Consultation',
    start: '2026-10-14T13:00',
    end: '2026-10-14T13:30',
  },
  {
    id: 'b5',
    resourceId: 'stojanovic',
    title: 'Luka Popović',
    description: 'Vaccination',
    start: '2026-10-14T10:00',
    end: '2026-10-14T10:30',
    tone: 'success' as const,
  },
  {
    id: 'b6',
    resourceId: 'ultrasound',
    title: 'Nikola Babić',
    description: 'Abdominal ultrasound',
    start: '2026-10-14T11:00',
    end: '2026-10-14T12:00',
  },
]

/** Times no one can be booked: the lunch break for everyone, a doctor's surgery hours, a service. */
export const CLINIC_UNAVAILABLE: readonly UnavailableTime[] = [
  { start: '2026-10-14T12:00', end: '2026-10-14T12:30', reason: 'Lunch break' },
  {
    resourceId: 'stojanovic',
    start: '2026-10-14T14:00',
    end: '2026-10-14T16:00',
    reason: 'School visits',
  },
  {
    resourceId: 'ultrasound',
    start: '2026-10-14T08:00',
    end: '2026-10-14T09:30',
    reason: 'Device service',
  },
]

/** Free appointment slots offered for booking, by doctor (14–16 October 2026). */
export const FREE_SLOTS: readonly FreeSlot[] = [
  { start: '2026-10-14T10:30', end: '2026-10-14T11:00', resourceId: 'jovanovic' },
  { start: '2026-10-14T11:00', end: '2026-10-14T11:30', resourceId: 'jovanovic' },
  { start: '2026-10-14T14:00', end: '2026-10-14T14:30', resourceId: 'kovacevic' },
  { start: '2026-10-14T14:30', end: '2026-10-14T15:00', resourceId: 'kovacevic' },
  { start: '2026-10-15T08:00', end: '2026-10-15T08:30', resourceId: 'jovanovic' },
  { start: '2026-10-15T08:30', end: '2026-10-15T09:00', resourceId: 'jovanovic' },
  { start: '2026-10-15T09:00', end: '2026-10-15T09:30', resourceId: 'jovanovic' },
  { start: '2026-10-15T12:30', end: '2026-10-15T13:00', resourceId: 'kovacevic' },
  { start: '2026-10-15T15:00', end: '2026-10-15T15:30', resourceId: 'kovacevic' },
  { start: '2026-10-16T09:00', end: '2026-10-16T09:30', resourceId: 'jovanovic' },
  { start: '2026-10-16T10:00', end: '2026-10-16T10:30', resourceId: 'kovacevic' },
  { start: '2026-10-16T13:30', end: '2026-10-16T14:00', resourceId: 'jovanovic' },
]

/** The periods of the school day at OŠ Jovan Popović, Novi Sad. */
export const SCHOOL_PERIODS = [
  { id: 'p1', label: '1.', start: '08:00', end: '08:45' },
  { id: 'p2', label: '2.', start: '08:50', end: '09:35' },
  { id: 'p3', label: '3.', start: '09:55', end: '10:40' },
  { id: 'p4', label: '4.', start: '10:45', end: '11:30' },
  { id: 'p5', label: '5.', start: '11:35', end: '12:20' },
  { id: 'p6', label: '6.', start: '12:25', end: '13:10' },
] as const

interface Lesson {
  id: string
  day: 1 | 2 | 3 | 4 | 5
  periodId: string
  subject: string
  teacher: string
  room: string
  tone?: 'info' | 'warning' | 'danger' | 'success' | 'premium' | 'neutral'
  note?: string
}

/** Class 7/2's week. */
export const CLASS_LESSONS: readonly Lesson[] = [
  { id: 'm1', day: 1, periodId: 'p1', subject: 'Serbian', teacher: 'Gordana Rakić', room: '12' },
  { id: 'm2', day: 1, periodId: 'p2', subject: 'Mathematics', teacher: 'Zoran Mićić', room: '14' },
  { id: 'm3', day: 1, periodId: 'p3', subject: 'English', teacher: 'Jasmina Kostić', room: '8' },
  { id: 'm4', day: 1, periodId: 'p4', subject: 'History', teacher: 'Dejan Lukić', room: '12' },
  {
    id: 'm5',
    day: 1,
    periodId: 'p5',
    subject: 'Physical education',
    teacher: 'Bojan Vasić',
    room: 'Gym',
  },
  { id: 't1', day: 2, periodId: 'p1', subject: 'Mathematics', teacher: 'Zoran Mićić', room: '14' },
  { id: 't2', day: 2, periodId: 'p2', subject: 'Physics', teacher: 'Slavica Ilić', room: 'Lab 2' },
  { id: 't3', day: 2, periodId: 'p3', subject: 'Biology', teacher: 'Marija Đukić', room: 'Lab 1' },
  { id: 't4', day: 2, periodId: 'p4', subject: 'Serbian', teacher: 'Gordana Rakić', room: '12' },
  { id: 't5', day: 2, periodId: 'p5', subject: 'Music', teacher: 'Nada Ristić', room: '3' },
  {
    id: 't6',
    day: 2,
    periodId: 'p6',
    subject: 'Chemistry club',
    teacher: 'Petar Bogdanović',
    room: 'Lab 2',
    tone: 'premium',
  },
  { id: 'w1', day: 3, periodId: 'p1', subject: 'Geography', teacher: 'Ljiljana Perić', room: '10' },
  {
    id: 'w2',
    day: 3,
    periodId: 'p2',
    subject: 'Mathematics',
    teacher: 'Zoran Mićić',
    room: '14',
    tone: 'warning',
    note: 'Test',
  },
  { id: 'w3', day: 3, periodId: 'p3', subject: 'Serbian', teacher: 'Gordana Rakić', room: '12' },
  { id: 'w4', day: 3, periodId: 'p4', subject: 'German', teacher: 'Sanja Milošević', room: '8' },
  {
    id: 'w5',
    day: 3,
    periodId: 'p5',
    subject: 'Technology',
    teacher: 'Vladimir Jakšić',
    room: 'Workshop',
  },
  { id: 'h1', day: 4, periodId: 'p1', subject: 'English', teacher: 'Jasmina Kostić', room: '8' },
  { id: 'h2', day: 4, periodId: 'p2', subject: 'Physics', teacher: 'Slavica Ilić', room: 'Lab 2' },
  { id: 'h3', day: 4, periodId: 'p3', subject: 'Mathematics', teacher: 'Zoran Mićić', room: '14' },
  {
    id: 'h4',
    day: 4,
    periodId: 'p4',
    subject: 'Art',
    teacher: 'Milena Vuković',
    room: 'Studio',
    tone: 'info',
    note: 'Substitute: Ivan Grujić',
  },
  {
    id: 'h5',
    day: 4,
    periodId: 'p5',
    subject: 'Physical education',
    teacher: 'Bojan Vasić',
    room: 'Gym',
  },
  { id: 'f1', day: 5, periodId: 'p1', subject: 'Biology', teacher: 'Marija Đukić', room: 'Lab 1' },
  { id: 'f2', day: 5, periodId: 'p2', subject: 'Serbian', teacher: 'Gordana Rakić', room: '12' },
  { id: 'f3', day: 5, periodId: 'p3', subject: 'History', teacher: 'Dejan Lukić', room: '12' },
  {
    id: 'f4',
    day: 5,
    periodId: 'p4',
    subject: 'Class meeting',
    teacher: 'Gordana Rakić',
    room: '12',
  },
]
