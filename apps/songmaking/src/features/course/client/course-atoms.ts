/**
 * Course State Atoms
 *
 * Effect Atom-based state management for course data,
 * lesson progress, and UI state.
 */

import { Atom, useAtomValue, useAtomSet } from '@effect-atom/atom-react';
import * as Data from 'effect/Data';
import * as Option from 'effect/Option';
import {
  type Section,
  type Lesson,
  type LessonId,
  type SectionId,
  type LessonPart,
  SONGMAKING_COURSE,
  SONGMAKING_SECTIONS,
  SONGMAKING_LESSONS,
  SONGMAKING_LESSON_PARTS,
  getSectionLessons,
  getLessonById,
  getSectionById,
  getLessonParts,
  getNextLesson,
  getPreviousLesson,
  MOCK_PROGRESS,
} from '../../../data/course.js';
import { LessonId as LessonIdBrand, SectionId as SectionIdBrand } from '@course';

// =============================================================================
// Local Progress Type (simplified for UI state)
// =============================================================================

interface LocalLessonProgress {
  lessonId: LessonId;
  status: 'not_started' | 'in_progress' | 'completed';
  progressPercent: number;
  completedAt?: string;
}

// Re-export lesson parts atom and helper
export { SONGMAKING_LESSON_PARTS, getLessonParts };
export type { LessonPart };

// =============================================================================
// Course Data Atoms (Derived from static data for now)
// =============================================================================

/**
 * Course atom - returns the main course data
 */
export const courseAtom = Atom.make(SONGMAKING_COURSE).pipe(Atom.keepAlive);

/**
 * Sections atom - returns all sections
 */
export const sectionsAtom = Atom.make(SONGMAKING_SECTIONS).pipe(Atom.keepAlive);

/**
 * Lessons atom - returns all lessons
 */
export const lessonsAtom = Atom.make(SONGMAKING_LESSONS).pipe(Atom.keepAlive);

// =============================================================================
// Progress Atoms
// =============================================================================

type ProgressMap = Map<string, LessonProgress>;

/**
 * Progress update action type
 */
type ProgressUpdate = Data.TaggedEnum<{
  MarkComplete: { lessonId: string };
  MarkInProgress: { lessonId: string; progressPercent: number };
  Reset: { lessonId: string };
}>;

/**
 * Internal store for progress
 */
const progressStoreAtom = Atom.make<ProgressMap>(new Map(MOCK_PROGRESS)).pipe(Atom.keepAlive);

/**
 * Progress atom - writable atom for lesson progress
 * This will later be connected to the server
 */
export const progressAtom: Atom.Writable<ProgressMap, ProgressUpdate> = Atom.writable(
  (get) => get(progressStoreAtom),
  (ctx, update: ProgressUpdate) => {
    const current = ctx.get(progressStoreAtom);
    const newMap = new Map(current);

    switch (update._tag) {
      case 'MarkComplete':
        newMap.set(update.lessonId, {
          lessonId: update.lessonId,
          status: 'completed',
          progressPercent: 100,
          completedAt: new Date().toISOString(),
        });
        break;
      case 'MarkInProgress':
        newMap.set(update.lessonId, {
          lessonId: update.lessonId,
          status: 'in_progress',
          progressPercent: update.progressPercent,
        });
        break;
      case 'Reset':
        newMap.delete(update.lessonId);
        break;
    }

    ctx.set(progressStoreAtom, newMap);
  },
);

/**
 * Get progress for a specific lesson
 */
export const lessonProgressAtom = (lessonId: string) =>
  Atom.make((get) => {
    const progress = get(progressAtom);
    return Option.fromNullable(progress.get(lessonId));
  });

/**
 * Overall course progress (percentage)
 */
export const courseProgressAtom = Atom.make((get) => {
  const progress = get(progressAtom);
  const lessons = get(lessonsAtom);

  const completedCount = Array.from(progress.values()).filter(
    (p) => p.status === 'completed',
  ).length;

  return {
    completed: completedCount,
    total: lessons.length,
    percent: lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0,
  };
});

// =============================================================================
// Section Progress Atoms
// =============================================================================

/**
 * Get progress for a specific section
 */
export const sectionProgressAtom = (sectionId: string) =>
  Atom.make((get) => {
    const progress = get(progressAtom);
    const lessons = getSectionLessons(sectionId);

    const completedCount = lessons.filter((l) => progress.get(l.id)?.status === 'completed').length;

    return {
      completed: completedCount,
      total: lessons.length,
      percent: lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0,
    };
  });

// =============================================================================
// UI State Atoms
// =============================================================================

/**
 * Current lesson ID atom
 */
export const currentLessonIdAtom = Atom.make<string | null>(null).pipe(Atom.keepAlive);

/**
 * Expanded sections update action type
 */
type ExpandedSectionsUpdate = Data.TaggedEnum<{
  Toggle: { sectionId: string };
  Expand: { sectionId: string };
  Collapse: { sectionId: string };
  ExpandAll: {};
  CollapseAll: {};
}>;

/**
 * Internal store for expanded sections
 */
const expandedSectionsStoreAtom = Atom.make<Set<string>>(
  new Set([SONGMAKING_SECTIONS[0]?.id ?? '']),
).pipe(Atom.keepAlive);

/**
 * Expanded sections atom (for sidebar)
 */
export const expandedSectionsAtom: Atom.Writable<
  Set<string>,
  ExpandedSectionsUpdate
> = Atom.writable(
  (get) => get(expandedSectionsStoreAtom),
  (ctx, update: ExpandedSectionsUpdate) => {
    const current = ctx.get(expandedSectionsStoreAtom);
    const newSet = new Set(current);

    switch (update._tag) {
      case 'Toggle':
        if (newSet.has(update.sectionId)) {
          newSet.delete(update.sectionId);
        } else {
          newSet.add(update.sectionId);
        }
        break;
      case 'Expand':
        newSet.add(update.sectionId);
        break;
      case 'Collapse':
        newSet.delete(update.sectionId);
        break;
      case 'ExpandAll':
        SONGMAKING_SECTIONS.forEach((s) => newSet.add(s.id));
        break;
      case 'CollapseAll':
        newSet.clear();
        break;
    }

    ctx.set(expandedSectionsStoreAtom, newSet);
  },
);

/**
 * Mobile sidebar open state
 */
export const sidebarOpenAtom = Atom.make(false).pipe(Atom.keepAlive);

// =============================================================================
// Derived Navigation Atoms
// =============================================================================

/**
 * Current lesson data (derived from currentLessonId)
 */
export const currentLessonAtom = Atom.make((get) => {
  const lessonId = get(currentLessonIdAtom);
  if (!lessonId) return Option.none<Lesson>();
  return Option.fromNullable(getLessonById(lessonId));
});

/**
 * Current section data (derived from current lesson)
 */
export const currentSectionAtom = Atom.make((get) => {
  const lesson = get(currentLessonAtom);
  if (Option.isNone(lesson)) return Option.none<Section>();
  return Option.fromNullable(getSectionById(lesson.value.sectionId));
});

/**
 * Next lesson (derived from current lesson)
 */
export const nextLessonAtom = Atom.make((get) => {
  const lessonId = get(currentLessonIdAtom);
  if (!lessonId) return Option.none<Lesson>();
  return Option.fromNullable(getNextLesson(lessonId));
});

/**
 * Previous lesson (derived from current lesson)
 */
export const previousLessonAtom = Atom.make((get) => {
  const lessonId = get(currentLessonIdAtom);
  if (!lessonId) return Option.none<Lesson>();
  return Option.fromNullable(getPreviousLesson(lessonId));
});

/**
 * First incomplete lesson (for "Continue" button)
 */
export const firstIncompleteLessonAtom = Atom.make((get) => {
  const progress = get(progressAtom);
  const lessons = get(lessonsAtom);

  const firstIncomplete = lessons.find((l) => {
    const p = progress.get(l.id);
    return !p || p.status !== 'completed';
  });

  return Option.fromNullable(firstIncomplete);
});

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook to get course progress
 */
export const useCourseProgress = () => useAtomValue(courseProgressAtom);

/**
 * Hook to get current lesson
 */
export const useCurrentLesson = () => useAtomValue(currentLessonAtom);

/**
 * Hook to get sections
 */
export const useSections = () => useAtomValue(sectionsAtom);

/**
 * Hook to check if a section is expanded
 */
export const useExpandedSections = () => useAtomValue(expandedSectionsAtom);

/**
 * Hook to toggle section expansion
 */
export const useToggleSection = () => {
  const set = useAtomSet(expandedSectionsAtom);
  return (sectionId: string) => set({ _tag: 'Toggle', sectionId });
};

/**
 * Hook to mark lesson as complete
 */
export const useMarkLessonComplete = () => {
  const set = useAtomSet(progressAtom);
  return (lessonId: string) => set({ _tag: 'MarkComplete', lessonId });
};

/**
 * Hook to get sidebar open state
 */
export const useSidebarOpen = () => useAtomValue(sidebarOpenAtom);

/**
 * Hook to toggle sidebar
 */
export const useToggleSidebar = () => {
  const set = useAtomSet(sidebarOpenAtom);
  return () => set((prev) => !prev);
};

/**
 * Hook to set sidebar open state
 */
export const useSetSidebarOpen = () => {
  const set = useAtomSet(sidebarOpenAtom);
  return (open: boolean) => set(open);
};
