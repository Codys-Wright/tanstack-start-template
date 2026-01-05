/**
 * Mock Course Data for Songmaking
 *
 * Uses Effect Schema types from @course package.
 * In production, this data will come from the database via RPC.
 */

import {
  Course,
  CourseId,
  CoursePricing,
  Section,
  SectionId,
  InstructorId,
  Lesson,
  LessonId,
  LessonPart,
  LessonPartId,
  VideoContent,
  LessonProgress,
} from '@course';
import * as DateTime from 'effect/DateTime';

// =============================================================================
// Helper to create video content
// =============================================================================

function makeVideoContent(videoId: string, durationSeconds: number): VideoContent {
  return VideoContent.make({
    provider: 'youtube',
    videoId,
    durationSeconds,
    thumbnailUrl: null,
  });
}

// =============================================================================
// Mock IDs
// =============================================================================

const COURSE_ID = CourseId.make('00000000-0000-0000-0000-000000000001');
const INSTRUCTOR_ID = InstructorId.make('00000000-0000-0000-0000-000000000002');

const SECTION_IDS = {
  gettingStarted: SectionId.make('10000000-0000-0000-0000-000000000001'),
  melodyHarmony: SectionId.make('10000000-0000-0000-0000-000000000002'),
  writingLyrics: SectionId.make('10000000-0000-0000-0000-000000000003'),
  songStructure: SectionId.make('10000000-0000-0000-0000-000000000004'),
  productionBasics: SectionId.make('10000000-0000-0000-0000-000000000005'),
} as const;

const LESSON_IDS = {
  welcome: LessonId.make('20000000-0000-0000-0000-000000000001'),
  creativeSpace: LessonId.make('20000000-0000-0000-0000-000000000002'),
  mindset: LessonId.make('20000000-0000-0000-0000-000000000003'),
  scales: LessonId.make('20000000-0000-0000-0000-000000000004'),
  chordProgressions: LessonId.make('20000000-0000-0000-0000-000000000005'),
} as const;

const PART_IDS = {
  welcome_video: LessonPartId.make('30000000-0000-0000-0000-000000000000'),
  creativeSpace_intro: LessonPartId.make('30000000-0000-0000-0000-000000000001'),
  creativeSpace_essentials: LessonPartId.make('30000000-0000-0000-0000-000000000002'),
  creativeSpace_quiz: LessonPartId.make('30000000-0000-0000-0000-000000000003'),
  creativeSpace_advanced: LessonPartId.make('30000000-0000-0000-0000-000000000004'),
  mindset_video: LessonPartId.make('30000000-0000-0000-0000-000000000010'),
  scales_video: LessonPartId.make('30000000-0000-0000-0000-000000000020'),
  chordProgressions_text: LessonPartId.make('30000000-0000-0000-0000-000000000030'),
} as const;

// =============================================================================
// Mock Timestamps
// =============================================================================

const now = DateTime.unsafeNow();

// =============================================================================
// Mock Course
// =============================================================================

export const SONGMAKING_COURSE = Course.make({
  id: COURSE_ID,
  instructorId: INSTRUCTOR_ID,
  title: 'Songmaking',
  slug: 'songmaking',
  subtitle: 'Learn to write and produce your own songs from scratch',
  description: `This comprehensive course takes you from complete beginner to confident songwriter.`,
  thumbnailUrl: '/images/songmaking-cover.jpg',
  categoryId: null,
  tags: ['music', 'songwriting', 'production'],
  level: 'all-levels',
  language: 'en',
  pricing: CoursePricing.make({
    model: 'freemium',
    price: 99,
    currency: 'USD',
    freeLessonCount: 3,
  }),
  totalDurationMinutes: 245,
  lessonCount: 18,
  sectionCount: 5,
  enrollmentCount: 0,
  averageRating: null,
  reviewCount: 0,
  status: 'published',
  publishedAt: now,
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
});

// =============================================================================
// Mock Sections
// =============================================================================

export const SONGMAKING_SECTIONS: ReadonlyArray<Section> = [
  Section.make({
    id: SECTION_IDS.gettingStarted,
    courseId: COURSE_ID,
    title: 'Getting Started',
    description: 'Set up your creative space and understand the songwriting mindset',
    sortOrder: 0,
    lessonCount: 3,
    totalDurationMinutes: 35,
    createdAt: now,
    updatedAt: now,
  }),
  Section.make({
    id: SECTION_IDS.melodyHarmony,
    courseId: COURSE_ID,
    title: 'Melody & Harmony Basics',
    description: 'Learn the building blocks of music that make songs memorable',
    sortOrder: 1,
    lessonCount: 4,
    totalDurationMinutes: 55,
    createdAt: now,
    updatedAt: now,
  }),
  Section.make({
    id: SECTION_IDS.writingLyrics,
    courseId: COURSE_ID,
    title: 'Writing Lyrics',
    description: 'Craft meaningful lyrics that connect with your audience',
    sortOrder: 2,
    lessonCount: 4,
    totalDurationMinutes: 50,
    createdAt: now,
    updatedAt: now,
  }),
  Section.make({
    id: SECTION_IDS.songStructure,
    courseId: COURSE_ID,
    title: 'Song Structure',
    description: 'Arrange your ideas into compelling song formats',
    sortOrder: 3,
    lessonCount: 3,
    totalDurationMinutes: 40,
    createdAt: now,
    updatedAt: now,
  }),
  Section.make({
    id: SECTION_IDS.productionBasics,
    courseId: COURSE_ID,
    title: 'Production Basics',
    description: 'Record and produce your songs with professional techniques',
    sortOrder: 4,
    lessonCount: 4,
    totalDurationMinutes: 65,
    createdAt: now,
    updatedAt: now,
  }),
];

// =============================================================================
// Mock Lessons
// =============================================================================

export const SONGMAKING_LESSONS: ReadonlyArray<Lesson> = [
  // Section 1: Getting Started
  Lesson.make({
    id: LESSON_IDS.welcome,
    sectionId: SECTION_IDS.gettingStarted,
    courseId: COURSE_ID,
    title: 'Welcome to Songmaking',
    description: 'An introduction to the course and what you will learn',
    type: 'video',
    mdxContent: null,
    videoContent: null, // Content is in parts
    quizId: null,
    quizPassingScore: null,
    quizIsRequired: false,
    downloadFiles: null,
    sortOrder: 0,
    durationMinutes: 8,
    isFree: true,
    isPreview: true,
    createdAt: now,
    updatedAt: now,
  }),
  Lesson.make({
    id: LESSON_IDS.creativeSpace,
    sectionId: SECTION_IDS.gettingStarted,
    courseId: COURSE_ID,
    title: 'Setting Up Your Creative Space',
    description: 'Create an environment that inspires creativity',
    type: 'text',
    mdxContent: null, // Content is in parts
    videoContent: null,
    quizId: null,
    quizPassingScore: null,
    quizIsRequired: false,
    downloadFiles: null,
    sortOrder: 1,
    durationMinutes: 15,
    isFree: true,
    isPreview: false,
    createdAt: now,
    updatedAt: now,
  }),
  Lesson.make({
    id: LESSON_IDS.mindset,
    sectionId: SECTION_IDS.gettingStarted,
    courseId: COURSE_ID,
    title: 'The Songwriting Mindset',
    description: 'Develop habits and attitudes that support creativity',
    type: 'video',
    mdxContent: null,
    videoContent: null,
    quizId: null,
    quizPassingScore: null,
    quizIsRequired: false,
    downloadFiles: null,
    sortOrder: 2,
    durationMinutes: 15,
    isFree: false,
    isPreview: false,
    createdAt: now,
    updatedAt: now,
  }),
  // Section 2: Melody & Harmony
  Lesson.make({
    id: LESSON_IDS.scales,
    sectionId: SECTION_IDS.melodyHarmony,
    courseId: COURSE_ID,
    title: 'Understanding Scales',
    description: 'The foundation of melody - major and minor scales',
    type: 'video',
    mdxContent: null,
    videoContent: null,
    quizId: null,
    quizPassingScore: null,
    quizIsRequired: false,
    downloadFiles: null,
    sortOrder: 0,
    durationMinutes: 14,
    isFree: false,
    isPreview: false,
    createdAt: now,
    updatedAt: now,
  }),
  Lesson.make({
    id: LESSON_IDS.chordProgressions,
    sectionId: SECTION_IDS.melodyHarmony,
    courseId: COURSE_ID,
    title: 'Building Chord Progressions',
    description: 'Learn the most common chord progressions in popular music',
    type: 'text',
    mdxContent: null,
    videoContent: null,
    quizId: null,
    quizPassingScore: null,
    quizIsRequired: false,
    downloadFiles: null,
    sortOrder: 1,
    durationMinutes: 18,
    isFree: false,
    isPreview: false,
    createdAt: now,
    updatedAt: now,
  }),
];

// =============================================================================
// Mock Lesson Parts
// =============================================================================

export const SONGMAKING_LESSON_PARTS: ReadonlyArray<LessonPart> = [
  // Lesson: Welcome (single video part)
  LessonPart.make({
    id: PART_IDS.welcome_video,
    lessonId: LESSON_IDS.welcome,
    title: 'Welcome Video',
    type: 'video',
    sortOrder: 0,
    durationMinutes: 8,
    mdxContent: null,
    videoContent: makeVideoContent('dQw4w9WgXcQ', 480),
    quizId: null,
    quizPassingScore: null,
    quizIsRequired: false,
    downloadFiles: null,
    createdAt: now,
    updatedAt: now,
  }),

  // Lesson: Setting Up Your Creative Space - has multiple parts
  LessonPart.make({
    id: PART_IDS.creativeSpace_intro,
    lessonId: LESSON_IDS.creativeSpace,
    title: 'Introduction',
    type: 'text',
    sortOrder: 0,
    durationMinutes: 3,
    mdxContent: `# Setting Up Your Creative Space

Your environment plays a huge role in your creative output. Let's set up a space that inspires you.

In this lesson, you'll learn:
- The essential equipment you need
- How to set up your digital workspace
- Creating the right mindset for creativity

Let's dive in!`,
    videoContent: null,
    quizId: null,
    quizPassingScore: null,
    quizIsRequired: false,
    downloadFiles: null,
    createdAt: now,
    updatedAt: now,
  }),
  LessonPart.make({
    id: PART_IDS.creativeSpace_essentials,
    lessonId: LESSON_IDS.creativeSpace,
    title: 'The Essentials',
    type: 'text',
    sortOrder: 1,
    durationMinutes: 5,
    mdxContent: `## The Essentials

1. **A comfortable seat** - You'll be here for hours, make it count
2. **Good lighting** - Natural light is best, but warm artificial light works too
3. **Minimal distractions** - Turn off notifications, close unnecessary tabs
4. **Your instrument of choice** - Guitar, keyboard, or even just your voice

## Digital Setup

You'll need some basic software:

- A **DAW** (Digital Audio Workstation) - We recommend starting with GarageBand (free) or Reaper (affordable)
- A simple **audio interface** if you want to record real instruments
- **Headphones** - Closed-back for recording, open-back for mixing

## Creating the Right Mindset

Before we dive into techniques, remember:

> "There are no wrong notes, only unresolved tensions." - Jazz wisdom

Give yourself permission to experiment. Your first songs don't need to be masterpieces.`,
    videoContent: null,
    quizId: null,
    quizPassingScore: null,
    quizIsRequired: false,
    downloadFiles: null,
    createdAt: now,
    updatedAt: now,
  }),
  LessonPart.make({
    id: PART_IDS.creativeSpace_quiz,
    lessonId: LESSON_IDS.creativeSpace,
    title: 'Knowledge Check',
    type: 'quiz',
    sortOrder: 2,
    durationMinutes: 2,
    mdxContent: null,
    videoContent: null,
    quizId: '40000000-0000-0000-0000-000000000001',
    quizPassingScore: 70,
    quizIsRequired: false,
    downloadFiles: null,
    createdAt: now,
    updatedAt: now,
  }),
  LessonPart.make({
    id: PART_IDS.creativeSpace_advanced,
    lessonId: LESSON_IDS.creativeSpace,
    title: 'Advanced Setup Tips',
    type: 'text',
    sortOrder: 3,
    durationMinutes: 5,
    mdxContent: `## Acoustic Treatment Basics

The room you work in affects how you hear music. Here are some tips:

### Common Problems

1. **Flutter echo** - Sound bouncing between parallel walls
2. **Standing waves** - Bass frequencies building up in corners
3. **Early reflections** - Sound bouncing off nearby surfaces

### Budget-Friendly Solutions

- **Bookshelves** - Filled bookshelves act as excellent diffusers
- **Thick curtains** - Help absorb high frequencies
- **Rugs and carpets** - Reduce floor reflections
- **DIY panels** - Rockwool in wooden frames covered with fabric

## Summary

Your creative space should:

- [ ] Be physically comfortable for long sessions
- [ ] Have decent acoustics (or at least treated problems)
- [ ] Minimize distractions
- [ ] Inspire you visually
- [ ] Be ready for immediate creativity

Now go set up your space, and we'll see you in the next lesson!`,
    videoContent: null,
    quizId: null,
    quizPassingScore: null,
    quizIsRequired: false,
    downloadFiles: null,
    createdAt: now,
    updatedAt: now,
  }),

  // Lesson: Mindset (single video part)
  LessonPart.make({
    id: PART_IDS.mindset_video,
    lessonId: LESSON_IDS.mindset,
    title: 'The Songwriting Mindset',
    type: 'video',
    sortOrder: 0,
    durationMinutes: 15,
    mdxContent: null,
    videoContent: makeVideoContent('dQw4w9WgXcQ', 900),
    quizId: null,
    quizPassingScore: null,
    quizIsRequired: false,
    downloadFiles: null,
    createdAt: now,
    updatedAt: now,
  }),

  // Lesson: Scales (single video part)
  LessonPart.make({
    id: PART_IDS.scales_video,
    lessonId: LESSON_IDS.scales,
    title: 'Understanding Scales',
    type: 'video',
    sortOrder: 0,
    durationMinutes: 14,
    mdxContent: null,
    videoContent: makeVideoContent('dQw4w9WgXcQ', 840),
    quizId: null,
    quizPassingScore: null,
    quizIsRequired: false,
    downloadFiles: null,
    createdAt: now,
    updatedAt: now,
  }),

  // Lesson: Chord Progressions (single text part)
  LessonPart.make({
    id: PART_IDS.chordProgressions_text,
    lessonId: LESSON_IDS.chordProgressions,
    title: 'Building Chord Progressions',
    type: 'text',
    sortOrder: 0,
    durationMinutes: 18,
    mdxContent: `# Building Chord Progressions

Chord progressions are the harmonic backbone of your song. Let's learn the most powerful ones.

## The Four-Chord Wonder

The I-V-vi-IV progression appears in hundreds of hit songs:

- **I** - Home base, feels resolved
- **V** - Creates tension, wants to resolve
- **vi** - The relative minor, adds emotion  
- **IV** - The subdominant, creates movement

In the key of C, this is: **C - G - Am - F**

## Try These Progressions

| Name | Chords (in C) | Mood |
|------|---------------|------|
| Pop Classic | C - G - Am - F | Uplifting |
| Sad but Beautiful | Am - F - C - G | Melancholic |
| 50s Progression | C - Am - F - G | Nostalgic |

## Exercise

Pick one progression and loop it for 5 minutes. Hum melodies over it.
Don't judge, just explore.`,
    videoContent: null,
    quizId: null,
    quizPassingScore: null,
    quizIsRequired: false,
    downloadFiles: null,
    createdAt: now,
    updatedAt: now,
  }),
];

// =============================================================================
// Helper Functions
// =============================================================================

export function getSectionLessons(sectionId: SectionId): ReadonlyArray<Lesson> {
  return SONGMAKING_LESSONS.filter((l) => l.sectionId === sectionId).toSorted(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}

export function getLessonById(lessonId: LessonId): Lesson | undefined {
  return SONGMAKING_LESSONS.find((l) => l.id === lessonId);
}

export function getSectionById(sectionId: SectionId): Section | undefined {
  return SONGMAKING_SECTIONS.find((s) => s.id === sectionId);
}

export function getLessonParts(lessonId: LessonId): ReadonlyArray<LessonPart> {
  return SONGMAKING_LESSON_PARTS.filter((p) => p.lessonId === lessonId).toSorted(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}

export function getLessonPartById(partId: LessonPartId): LessonPart | undefined {
  return SONGMAKING_LESSON_PARTS.find((p) => p.id === partId);
}

export function getNextLesson(currentLessonId: LessonId): Lesson | undefined {
  const currentLesson = getLessonById(currentLessonId);
  if (!currentLesson) return undefined;

  const sectionLessons = getSectionLessons(currentLesson.sectionId);
  const currentIndex = sectionLessons.findIndex((l) => l.id === currentLessonId);
  if (currentIndex < sectionLessons.length - 1) {
    return sectionLessons[currentIndex + 1];
  }

  const currentSection = getSectionById(currentLesson.sectionId);
  if (!currentSection) return undefined;

  const nextSection = SONGMAKING_SECTIONS.find((s) => s.sortOrder === currentSection.sortOrder + 1);
  if (!nextSection) return undefined;

  const nextSectionLessons = getSectionLessons(nextSection.id);
  return nextSectionLessons[0];
}

export function getPreviousLesson(currentLessonId: LessonId): Lesson | undefined {
  const currentLesson = getLessonById(currentLessonId);
  if (!currentLesson) return undefined;

  const sectionLessons = getSectionLessons(currentLesson.sectionId);
  const currentIndex = sectionLessons.findIndex((l) => l.id === currentLessonId);
  if (currentIndex > 0) {
    return sectionLessons[currentIndex - 1];
  }

  const currentSection = getSectionById(currentLesson.sectionId);
  if (!currentSection) return undefined;

  const prevSection = SONGMAKING_SECTIONS.find((s) => s.sortOrder === currentSection.sortOrder - 1);
  if (!prevSection) return undefined;

  const prevSectionLessons = getSectionLessons(prevSection.id);
  return prevSectionLessons[prevSectionLessons.length - 1];
}

// =============================================================================
// Mock Progress Data
// =============================================================================

export const MOCK_PROGRESS: Map<LessonId, LessonProgress> = new Map();

// =============================================================================
// Re-export types for convenience
// =============================================================================

export type {
  Course,
  CourseId,
  Section,
  SectionId,
  Lesson,
  LessonId,
  LessonPart,
  LessonPartId,
  LessonProgress,
  VideoContent,
};
