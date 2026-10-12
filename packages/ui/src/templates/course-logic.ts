/*
 * The logic of CoursePage (P5.12), apart from the markup so it can be unit-tested (AGENTS.md C7):
 * counting the lessons done (a module's and the course's) and finding the lesson being shown.
 * The states themselves are the application's: the page decides nothing about what is done,
 * what is locked or why.
 */

/** A lesson's state: done, still to do, or locked (it cannot be opened yet, with a reason). */
export type LessonState = 'done' | 'todo' | 'locked'

/** One lesson of a course, from the application. */
export interface CourseLesson {
  key: string
  title: string
  /** The lesson's page, followed through the provider's linkComponent. */
  href: string
  state: LessonState
  /** A short line under the title: its kind and length ("Video · 6 min", "Quiz · 10 questions"). */
  detail?: string
  /** Why a locked lesson cannot be opened yet ("Finish module 1 first"). */
  lockedReason?: string
}

/** A module of a course: a titled group of lessons. */
export interface CourseModule {
  key: string
  title: string
  lessons: readonly CourseLesson[]
}

/** Lessons done and lessons in all. */
export interface LessonCount {
  done: number
  total: number
}

/** A module's lessons done, of all its lessons (locked ones count in the total). */
export function moduleProgress(module: CourseModule): LessonCount {
  return {
    done: module.lessons.filter((lesson) => lesson.state === 'done').length,
    total: module.lessons.length,
  }
}

/** The course's lessons done, of all its lessons. */
export function courseProgress(modules: readonly CourseModule[]): LessonCount {
  return modules.reduce(
    (sum, module) => {
      const count = moduleProgress(module)
      return { done: sum.done + count.done, total: sum.total + count.total }
    },
    { done: 0, total: 0 },
  )
}

/** The lesson with this key, or undefined. */
export function findLesson(
  modules: readonly CourseModule[],
  key: string | undefined,
): CourseLesson | undefined {
  if (key === undefined) return undefined
  for (const module of modules) {
    const lesson = module.lessons.find((each) => each.key === key)
    if (lesson !== undefined) return lesson
  }
  return undefined
}
