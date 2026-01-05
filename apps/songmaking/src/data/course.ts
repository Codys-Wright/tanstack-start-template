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
  Path,
  PathId,
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
  // Section 1: Getting Started
  welcome: LessonId.make('20000000-0000-0000-0000-000000000001'),
  creativeSpace: LessonId.make('20000000-0000-0000-0000-000000000002'),
  mindset: LessonId.make('20000000-0000-0000-0000-000000000003'),
  // Section 2: Melody & Harmony
  scales: LessonId.make('20000000-0000-0000-0000-000000000004'),
  chordProgressions: LessonId.make('20000000-0000-0000-0000-000000000005'),
  melodyWriting: LessonId.make('20000000-0000-0000-0000-000000000006'),
  hookCreation: LessonId.make('20000000-0000-0000-0000-000000000007'),
  // Section 3: Writing Lyrics
  lyricsBasics: LessonId.make('20000000-0000-0000-0000-000000000008'),
  storytelling: LessonId.make('20000000-0000-0000-0000-000000000009'),
  rhymeSchemes: LessonId.make('20000000-0000-0000-0000-000000000010'),
  emotionalConnection: LessonId.make('20000000-0000-0000-0000-000000000011'),
  // Section 4: Song Structure
  verseChorus: LessonId.make('20000000-0000-0000-0000-000000000012'),
  bridgesBreakdowns: LessonId.make('20000000-0000-0000-0000-000000000013'),
  dynamicArrangement: LessonId.make('20000000-0000-0000-0000-000000000014'),
  // Section 5: Production Basics
  demoRecording: LessonId.make('20000000-0000-0000-0000-000000000015'),
  workingWithProducers: LessonId.make('20000000-0000-0000-0000-000000000016'),
  releasingMusic: LessonId.make('20000000-0000-0000-0000-000000000017'),
  buildingFanbase: LessonId.make('20000000-0000-0000-0000-000000000018'),
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

const PATH_IDS = {
  songwriting: PathId.make('50000000-0000-0000-0000-000000000001'),
  artistry: PathId.make('50000000-0000-0000-0000-000000000002'),
  business: PathId.make('50000000-0000-0000-0000-000000000003'),
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
// Mock Paths
// =============================================================================

export const SONGMAKING_PATHS: ReadonlyArray<Path> = [
  Path.make({
    id: PATH_IDS.songwriting,
    courseId: COURSE_ID,
    name: 'Songwriting',
    slug: 'songwriting',
    description: 'Learn the craft of writing memorable melodies, harmonies, and lyrics',
    color: '#3B82F6', // blue
    icon: 'music',
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
  }),
  Path.make({
    id: PATH_IDS.artistry,
    courseId: COURSE_ID,
    name: 'Artistry',
    slug: 'artistry',
    description: 'Develop your creative mindset and unique artistic voice',
    color: '#8B5CF6', // purple
    icon: 'palette',
    sortOrder: 1,
    createdAt: now,
    updatedAt: now,
  }),
  Path.make({
    id: PATH_IDS.business,
    courseId: COURSE_ID,
    name: 'Music Business',
    slug: 'business',
    description: 'Understand how to monetize and market your music',
    color: '#10B981', // green
    icon: 'dollar-sign',
    sortOrder: 2,
    createdAt: now,
    updatedAt: now,
  }),
];

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
    totalDurationMinutes: 38,
    createdAt: now,
    updatedAt: now,
  }),
  Section.make({
    id: SECTION_IDS.melodyHarmony,
    courseId: COURSE_ID,
    title: 'Melody & Harmony',
    description: 'Learn the building blocks of music that make songs memorable',
    sortOrder: 1,
    lessonCount: 4,
    totalDurationMinutes: 67,
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
    totalDurationMinutes: 60,
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
    totalDurationMinutes: 45,
    createdAt: now,
    updatedAt: now,
  }),
  Section.make({
    id: SECTION_IDS.productionBasics,
    courseId: COURSE_ID,
    title: 'Production & Release',
    description: 'Record, produce, and release your songs to the world',
    sortOrder: 4,
    lessonCount: 4,
    totalDurationMinutes: 75,
    createdAt: now,
    updatedAt: now,
  }),
];

// =============================================================================
// Mock Lessons
// =============================================================================

export const SONGMAKING_LESSONS: ReadonlyArray<Lesson> = [
  // =============================================================================
  // Section 1: Getting Started
  // =============================================================================
  Lesson.make({
    id: LESSON_IDS.welcome,
    sectionId: SECTION_IDS.gettingStarted,
    courseId: COURSE_ID,
    pathId: null, // Intro lesson - no specific path
    title: 'Welcome to Songmaking',
    description: 'An introduction to the course and what you will learn',
    type: 'video',
    mdxContent: null,
    videoContent: null,
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
    pathId: PATH_IDS.artistry,
    title: 'Setting Up Your Creative Space',
    description: 'Create an environment that inspires creativity',
    type: 'text',
    mdxContent: null,
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
    pathId: PATH_IDS.artistry,
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

  // =============================================================================
  // Section 2: Melody & Harmony
  // =============================================================================
  Lesson.make({
    id: LESSON_IDS.scales,
    sectionId: SECTION_IDS.melodyHarmony,
    courseId: COURSE_ID,
    pathId: PATH_IDS.songwriting,
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
    pathId: PATH_IDS.songwriting,
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
  Lesson.make({
    id: LESSON_IDS.melodyWriting,
    sectionId: SECTION_IDS.melodyHarmony,
    courseId: COURSE_ID,
    pathId: PATH_IDS.songwriting,
    title: 'Writing Memorable Melodies',
    description: 'Techniques for crafting melodies that stick',
    type: 'video',
    mdxContent: null,
    videoContent: null,
    quizId: null,
    quizPassingScore: null,
    quizIsRequired: false,
    downloadFiles: null,
    sortOrder: 2,
    durationMinutes: 20,
    isFree: false,
    isPreview: false,
    createdAt: now,
    updatedAt: now,
  }),
  Lesson.make({
    id: LESSON_IDS.hookCreation,
    sectionId: SECTION_IDS.melodyHarmony,
    courseId: COURSE_ID,
    pathId: PATH_IDS.artistry,
    title: 'Creating Irresistible Hooks',
    description: 'The art of writing hooks that captivate listeners',
    type: 'text',
    mdxContent: null,
    videoContent: null,
    quizId: null,
    quizPassingScore: null,
    quizIsRequired: false,
    downloadFiles: null,
    sortOrder: 3,
    durationMinutes: 15,
    isFree: false,
    isPreview: false,
    createdAt: now,
    updatedAt: now,
  }),

  // =============================================================================
  // Section 3: Writing Lyrics
  // =============================================================================
  Lesson.make({
    id: LESSON_IDS.lyricsBasics,
    sectionId: SECTION_IDS.writingLyrics,
    courseId: COURSE_ID,
    pathId: PATH_IDS.songwriting,
    title: 'Lyrics Fundamentals',
    description: 'The building blocks of great lyrics',
    type: 'text',
    mdxContent: null,
    videoContent: null,
    quizId: null,
    quizPassingScore: null,
    quizIsRequired: false,
    downloadFiles: null,
    sortOrder: 0,
    durationMinutes: 12,
    isFree: false,
    isPreview: false,
    createdAt: now,
    updatedAt: now,
  }),
  Lesson.make({
    id: LESSON_IDS.storytelling,
    sectionId: SECTION_IDS.writingLyrics,
    courseId: COURSE_ID,
    pathId: PATH_IDS.artistry,
    title: 'Storytelling Through Song',
    description: 'How to tell compelling stories in your lyrics',
    type: 'video',
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
  Lesson.make({
    id: LESSON_IDS.rhymeSchemes,
    sectionId: SECTION_IDS.writingLyrics,
    courseId: COURSE_ID,
    pathId: PATH_IDS.songwriting,
    title: 'Rhyme Schemes & Patterns',
    description: 'Master different rhyming techniques',
    type: 'text',
    mdxContent: null,
    videoContent: null,
    quizId: null,
    quizPassingScore: null,
    quizIsRequired: false,
    downloadFiles: null,
    sortOrder: 2,
    durationMinutes: 14,
    isFree: false,
    isPreview: false,
    createdAt: now,
    updatedAt: now,
  }),
  Lesson.make({
    id: LESSON_IDS.emotionalConnection,
    sectionId: SECTION_IDS.writingLyrics,
    courseId: COURSE_ID,
    pathId: PATH_IDS.artistry,
    title: 'Creating Emotional Connection',
    description: 'Write lyrics that resonate with listeners',
    type: 'video',
    mdxContent: null,
    videoContent: null,
    quizId: null,
    quizPassingScore: null,
    quizIsRequired: false,
    downloadFiles: null,
    sortOrder: 3,
    durationMinutes: 16,
    isFree: false,
    isPreview: false,
    createdAt: now,
    updatedAt: now,
  }),

  // =============================================================================
  // Section 4: Song Structure
  // =============================================================================
  Lesson.make({
    id: LESSON_IDS.verseChorus,
    sectionId: SECTION_IDS.songStructure,
    courseId: COURSE_ID,
    pathId: PATH_IDS.songwriting,
    title: 'Verse-Chorus Dynamics',
    description: 'Understanding the relationship between verses and choruses',
    type: 'video',
    mdxContent: null,
    videoContent: null,
    quizId: null,
    quizPassingScore: null,
    quizIsRequired: false,
    downloadFiles: null,
    sortOrder: 0,
    durationMinutes: 15,
    isFree: false,
    isPreview: false,
    createdAt: now,
    updatedAt: now,
  }),
  Lesson.make({
    id: LESSON_IDS.bridgesBreakdowns,
    sectionId: SECTION_IDS.songStructure,
    courseId: COURSE_ID,
    pathId: PATH_IDS.songwriting,
    title: 'Bridges & Breakdowns',
    description: 'Adding variety and interest to your songs',
    type: 'text',
    mdxContent: null,
    videoContent: null,
    quizId: null,
    quizPassingScore: null,
    quizIsRequired: false,
    downloadFiles: null,
    sortOrder: 1,
    durationMinutes: 12,
    isFree: false,
    isPreview: false,
    createdAt: now,
    updatedAt: now,
  }),
  Lesson.make({
    id: LESSON_IDS.dynamicArrangement,
    sectionId: SECTION_IDS.songStructure,
    courseId: COURSE_ID,
    pathId: PATH_IDS.artistry,
    title: 'Dynamic Arrangement',
    description: 'Create energy and flow in your song structure',
    type: 'video',
    mdxContent: null,
    videoContent: null,
    quizId: null,
    quizPassingScore: null,
    quizIsRequired: false,
    downloadFiles: null,
    sortOrder: 2,
    durationMinutes: 18,
    isFree: false,
    isPreview: false,
    createdAt: now,
    updatedAt: now,
  }),

  // =============================================================================
  // Section 5: Production Basics
  // =============================================================================
  Lesson.make({
    id: LESSON_IDS.demoRecording,
    sectionId: SECTION_IDS.productionBasics,
    courseId: COURSE_ID,
    pathId: PATH_IDS.songwriting,
    title: 'Recording Your Demos',
    description: 'Capture your ideas with simple recording techniques',
    type: 'video',
    mdxContent: null,
    videoContent: null,
    quizId: null,
    quizPassingScore: null,
    quizIsRequired: false,
    downloadFiles: null,
    sortOrder: 0,
    durationMinutes: 20,
    isFree: false,
    isPreview: false,
    createdAt: now,
    updatedAt: now,
  }),
  Lesson.make({
    id: LESSON_IDS.workingWithProducers,
    sectionId: SECTION_IDS.productionBasics,
    courseId: COURSE_ID,
    pathId: PATH_IDS.business,
    title: 'Working with Producers',
    description: 'How to collaborate effectively with music producers',
    type: 'text',
    mdxContent: null,
    videoContent: null,
    quizId: null,
    quizPassingScore: null,
    quizIsRequired: false,
    downloadFiles: null,
    sortOrder: 1,
    durationMinutes: 15,
    isFree: false,
    isPreview: false,
    createdAt: now,
    updatedAt: now,
  }),
  Lesson.make({
    id: LESSON_IDS.releasingMusic,
    sectionId: SECTION_IDS.productionBasics,
    courseId: COURSE_ID,
    pathId: PATH_IDS.business,
    title: 'Releasing Your Music',
    description: 'Distribution, streaming platforms, and release strategies',
    type: 'video',
    mdxContent: null,
    videoContent: null,
    quizId: null,
    quizPassingScore: null,
    quizIsRequired: false,
    downloadFiles: null,
    sortOrder: 2,
    durationMinutes: 22,
    isFree: false,
    isPreview: false,
    createdAt: now,
    updatedAt: now,
  }),
  Lesson.make({
    id: LESSON_IDS.buildingFanbase,
    sectionId: SECTION_IDS.productionBasics,
    courseId: COURSE_ID,
    pathId: PATH_IDS.business,
    title: 'Building Your Fanbase',
    description: 'Marketing strategies for independent songwriters',
    type: 'text',
    mdxContent: null,
    videoContent: null,
    quizId: null,
    quizPassingScore: null,
    quizIsRequired: false,
    downloadFiles: null,
    sortOrder: 3,
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
// Path Helper Functions
// =============================================================================

export function getPathById(pathId: PathId): Path | undefined {
  return SONGMAKING_PATHS.find((p) => p.id === pathId);
}

export function getPathLessons(pathId: PathId): ReadonlyArray<Lesson> {
  return SONGMAKING_LESSONS.filter((l) => l.pathId === pathId).toSorted(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}

export function getAllPaths(): ReadonlyArray<Path> {
  return SONGMAKING_PATHS.toSorted((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Get progress stats for a specific path
 */
export function getPathProgress(
  pathId: PathId,
  progressMap: Map<LessonId, LessonProgress>,
): { completed: number; total: number; percentage: number } {
  const pathLessons = getPathLessons(pathId);
  const total = pathLessons.length;
  const completed = pathLessons.filter((l) => progressMap.get(l.id)?.status === 'completed').length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percentage };
}

/**
 * Get overall course progress
 */
export function getCourseProgress(progressMap: Map<LessonId, LessonProgress>): {
  completed: number;
  total: number;
  percentage: number;
} {
  const total = SONGMAKING_LESSONS.length;
  const completed = SONGMAKING_LESSONS.filter(
    (l) => progressMap.get(l.id)?.status === 'completed',
  ).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percentage };
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
  Path,
  PathId,
};
