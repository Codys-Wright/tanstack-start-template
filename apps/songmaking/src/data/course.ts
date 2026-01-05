/**
 * Mock Course Data for Songmaking
 *
 * This provides static data for the single "Songmaking" course.
 * Later this will be replaced with real data from the @course package.
 */

// =============================================================================
// Types (simplified from @course package for now)
// =============================================================================

export interface Course {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  thumbnailUrl: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'all-levels';
  totalDurationMinutes: number;
  lessonCount: number;
  sectionCount: number;
}

export interface Section {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  lessonCount: number;
  totalDurationMinutes: number;
}

export interface Lesson {
  id: string;
  sectionId: string;
  courseId: string;
  title: string;
  description: string | null;
  type: 'video' | 'text' | 'quiz' | 'assignment' | 'download';
  sortOrder: number;
  durationMinutes: number;
  isFree: boolean;
  isPreview: boolean;
  // Content
  mdxContent?: string;
  editorState?: any; // Lexical SerializedEditorState
  videoContent?: {
    provider: 'youtube' | 'vimeo' | 'custom';
    videoId: string;
    durationSeconds: number;
  };
  // Quiz-specific
  quizId?: string;
  quizPassingScore?: number;
  quizIsRequired?: boolean;
}

export interface LessonProgress {
  lessonId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progressPercent: number;
  completedAt?: string;
}

// =============================================================================
// Mock Data
// =============================================================================

export const SONGMAKING_COURSE: Course = {
  id: 'course-songmaking-001',
  title: 'Songmaking',
  slug: 'songmaking',
  subtitle: 'Learn to write and produce your own songs from scratch',
  description: `This comprehensive course takes you from complete beginner to confident songwriter. 
You'll learn the fundamentals of melody, harmony, lyrics, and song structure, 
then dive into production techniques to bring your songs to life.

Whether you want to write pop hits, heartfelt ballads, or experimental tracks, 
this course gives you the tools and techniques to express yourself through music.`,
  thumbnailUrl: '/images/songmaking-cover.jpg',
  level: 'all-levels',
  totalDurationMinutes: 245,
  lessonCount: 18,
  sectionCount: 5,
};

export const SONGMAKING_SECTIONS: Section[] = [
  {
    id: 'section-001',
    courseId: SONGMAKING_COURSE.id,
    title: 'Getting Started',
    description: 'Set up your creative space and understand the songwriting mindset',
    sortOrder: 0,
    lessonCount: 3,
    totalDurationMinutes: 35,
  },
  {
    id: 'section-002',
    courseId: SONGMAKING_COURSE.id,
    title: 'Melody & Harmony Basics',
    description: 'Learn the building blocks of music that make songs memorable',
    sortOrder: 1,
    lessonCount: 4,
    totalDurationMinutes: 55,
  },
  {
    id: 'section-003',
    courseId: SONGMAKING_COURSE.id,
    title: 'Writing Lyrics',
    description: 'Craft meaningful lyrics that connect with your audience',
    sortOrder: 2,
    lessonCount: 4,
    totalDurationMinutes: 50,
  },
  {
    id: 'section-004',
    courseId: SONGMAKING_COURSE.id,
    title: 'Song Structure',
    description: 'Arrange your ideas into compelling song formats',
    sortOrder: 3,
    lessonCount: 3,
    totalDurationMinutes: 40,
  },
  {
    id: 'section-005',
    courseId: SONGMAKING_COURSE.id,
    title: 'Production Basics',
    description: 'Record and produce your songs with professional techniques',
    sortOrder: 4,
    lessonCount: 4,
    totalDurationMinutes: 65,
  },
];

export const SONGMAKING_LESSONS: Lesson[] = [
  // Section 1: Getting Started
  {
    id: 'lesson-001',
    sectionId: 'section-001',
    courseId: SONGMAKING_COURSE.id,
    title: 'Welcome to Songmaking',
    description: 'An introduction to the course and what you will learn',
    type: 'video',
    sortOrder: 0,
    durationMinutes: 8,
    isFree: true,
    isPreview: true,
    videoContent: {
      provider: 'youtube',
      videoId: 'dQw4w9WgXcQ', // Placeholder
      durationSeconds: 480,
    },
  },
  {
    id: 'lesson-002',
    sectionId: 'section-001',
    courseId: SONGMAKING_COURSE.id,
    title: 'Setting Up Your Creative Space',
    description: 'Create an environment that inspires creativity',
    type: 'text',
    sortOrder: 1,
    durationMinutes: 12,
    isFree: true,
    isPreview: false,
    mdxContent: `# Setting Up Your Creative Space

Your environment plays a huge role in your creative output. Let's set up a space that inspires you.

## The Essentials

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
  },
  {
    id: 'lesson-003',
    sectionId: 'section-001',
    courseId: SONGMAKING_COURSE.id,
    title: 'The Songwriting Mindset',
    description: 'Develop habits and attitudes that support creativity',
    type: 'video',
    sortOrder: 2,
    durationMinutes: 15,
    isFree: false,
    isPreview: false,
    videoContent: {
      provider: 'youtube',
      videoId: 'dQw4w9WgXcQ',
      durationSeconds: 900,
    },
  },

  // Section 2: Melody & Harmony Basics
  {
    id: 'lesson-004',
    sectionId: 'section-002',
    courseId: SONGMAKING_COURSE.id,
    title: 'Understanding Scales',
    description: 'The foundation of melody - major and minor scales',
    type: 'video',
    sortOrder: 0,
    durationMinutes: 14,
    isFree: false,
    isPreview: false,
    videoContent: {
      provider: 'youtube',
      videoId: 'dQw4w9WgXcQ',
      durationSeconds: 840,
    },
  },
  {
    id: 'lesson-005',
    sectionId: 'section-002',
    courseId: SONGMAKING_COURSE.id,
    title: 'Building Chord Progressions',
    description: 'Learn the most common chord progressions in popular music',
    type: 'text',
    sortOrder: 1,
    durationMinutes: 18,
    isFree: false,
    isPreview: false,
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
| Jazz Turnaround | Dm7 - G7 - Cmaj7 - A7 | Sophisticated |

## Exercise

Pick one progression and loop it for 5 minutes. Hum melodies over it.
Don't judge, just explore.`,
  },
  {
    id: 'lesson-006',
    sectionId: 'section-002',
    courseId: SONGMAKING_COURSE.id,
    title: 'Creating Memorable Melodies',
    description: 'Techniques for writing melodies that stick',
    type: 'video',
    sortOrder: 2,
    durationMinutes: 12,
    isFree: false,
    isPreview: false,
    videoContent: {
      provider: 'youtube',
      videoId: 'dQw4w9WgXcQ',
      durationSeconds: 720,
    },
  },
  {
    id: 'lesson-007',
    sectionId: 'section-002',
    courseId: SONGMAKING_COURSE.id,
    title: 'Melody & Harmony Quiz',
    description: 'Test your understanding of scales and chords',
    type: 'quiz',
    sortOrder: 3,
    durationMinutes: 10,
    isFree: false,
    isPreview: false,
  },

  // Section 3: Writing Lyrics
  {
    id: 'lesson-008',
    sectionId: 'section-003',
    courseId: SONGMAKING_COURSE.id,
    title: 'Finding Your Voice',
    description: 'Discover what you want to say in your songs',
    type: 'video',
    sortOrder: 0,
    durationMinutes: 13,
    isFree: false,
    isPreview: false,
    videoContent: {
      provider: 'youtube',
      videoId: 'dQw4w9WgXcQ',
      durationSeconds: 780,
    },
  },
  {
    id: 'lesson-009',
    sectionId: 'section-003',
    courseId: SONGMAKING_COURSE.id,
    title: "Show, Don't Tell",
    description: 'Write vivid, concrete lyrics that paint pictures',
    type: 'text',
    sortOrder: 1,
    durationMinutes: 15,
    isFree: false,
    isPreview: false,
    mdxContent: `# Show, Don't Tell

The difference between amateur and professional lyrics often comes down to this principle.

## Bad vs Good

**Telling:** "I was really sad when you left"

**Showing:** "Your coffee cup still sits by the window, going cold"

The second version creates an image. The reader *feels* the sadness without being told.

## Techniques

### Use Sensory Details
- What do you **see**?
- What do you **hear**?
- What do you **feel** (physically)?
- What do you **smell** or **taste**?

### Be Specific
Instead of "car," say "rusted pickup truck"
Instead of "walked," say "stumbled" or "danced" or "crept"

### Create Metaphors
Compare abstract feelings to concrete things:
- "My heart is a **locked door**"
- "Your love was **summer rain**"

## Exercise

Take these "telling" lines and rewrite them as "showing":

1. "I'm nervous"
2. "The party was boring"
3. "I love you so much"`,
  },
  {
    id: 'lesson-010',
    sectionId: 'section-003',
    courseId: SONGMAKING_COURSE.id,
    title: 'Rhyme Schemes & Flow',
    description: 'Master the musicality of words',
    type: 'video',
    sortOrder: 2,
    durationMinutes: 11,
    isFree: false,
    isPreview: false,
    videoContent: {
      provider: 'youtube',
      videoId: 'dQw4w9WgXcQ',
      durationSeconds: 660,
    },
  },
  {
    id: 'lesson-011',
    sectionId: 'section-003',
    courseId: SONGMAKING_COURSE.id,
    title: 'Writing Exercise: Your First Verse',
    description: 'Put it all together and write a complete verse',
    type: 'assignment',
    sortOrder: 3,
    durationMinutes: 20,
    isFree: false,
    isPreview: false,
    mdxContent: `# Assignment: Write Your First Verse

Now it's time to apply what you've learned!

## Your Task

Write an 8-line verse on the theme: **"A moment of change"**

This could be:
- Leaving home for the first time
- The end of a relationship
- A sudden realization
- A change in seasons

## Requirements

1. Use at least **2 sensory details**
2. Include at least **1 metaphor or simile**
3. Use a consistent **rhyme scheme** (ABAB or AABB)
4. Make it **singable** - read it out loud!

## Tips

- Start with free writing - don't worry about rhymes at first
- Find the emotional core of your moment
- Cut any lines that don't serve the story
- Simple words often work better than fancy ones

## Submit

Share your verse in the community forum for feedback!`,
  },

  // Section 4: Song Structure
  {
    id: 'lesson-012',
    sectionId: 'section-004',
    courseId: SONGMAKING_COURSE.id,
    title: 'Verse, Chorus, Bridge',
    description: 'The building blocks of song structure',
    type: 'video',
    sortOrder: 0,
    durationMinutes: 16,
    isFree: false,
    isPreview: false,
    videoContent: {
      provider: 'youtube',
      videoId: 'dQw4w9WgXcQ',
      durationSeconds: 960,
    },
  },
  {
    id: 'lesson-013',
    sectionId: 'section-004',
    courseId: SONGMAKING_COURSE.id,
    title: 'Common Song Forms',
    description: 'AABA, Verse-Chorus, and other popular structures',
    type: 'text',
    sortOrder: 1,
    durationMinutes: 12,
    isFree: false,
    isPreview: false,
    mdxContent: `# Common Song Forms

Understanding form helps you arrange your ideas effectively.

## The Verse-Chorus Form

The most popular structure in modern music:

\`\`\`
Intro
Verse 1
Chorus
Verse 2
Chorus
Bridge
Chorus (often with variations)
Outro
\`\`\`

## AABA Form

Classic in jazz standards and older pop:

\`\`\`
A (main theme)
A (repeat with variations)
B (bridge - contrasting section)
A (return to theme)
\`\`\`

## When to Break the Rules

Once you understand these forms, you can break them intentionally:

- Skip the intro for immediate impact
- Add a pre-chorus to build tension
- End on the bridge for an unresolved feeling
- Repeat the chorus with new lyrics

The key is making choices that serve your song's emotional journey.`,
  },
  {
    id: 'lesson-014',
    sectionId: 'section-004',
    courseId: SONGMAKING_COURSE.id,
    title: 'Dynamics & Arrangement',
    description: 'Create emotional journeys through dynamics',
    type: 'video',
    sortOrder: 2,
    durationMinutes: 12,
    isFree: false,
    isPreview: false,
    videoContent: {
      provider: 'youtube',
      videoId: 'dQw4w9WgXcQ',
      durationSeconds: 720,
    },
  },

  // Section 5: Production Basics
  {
    id: 'lesson-015',
    sectionId: 'section-005',
    courseId: SONGMAKING_COURSE.id,
    title: 'Introduction to Your DAW',
    description: 'Getting started with digital recording',
    type: 'video',
    sortOrder: 0,
    durationMinutes: 18,
    isFree: false,
    isPreview: false,
    videoContent: {
      provider: 'youtube',
      videoId: 'dQw4w9WgXcQ',
      durationSeconds: 1080,
    },
  },
  {
    id: 'lesson-016',
    sectionId: 'section-005',
    courseId: SONGMAKING_COURSE.id,
    title: 'Recording Your First Demo',
    description: 'Capture your song idea with basic recording',
    type: 'video',
    sortOrder: 1,
    durationMinutes: 15,
    isFree: false,
    isPreview: false,
    videoContent: {
      provider: 'youtube',
      videoId: 'dQw4w9WgXcQ',
      durationSeconds: 900,
    },
  },
  {
    id: 'lesson-017',
    sectionId: 'section-005',
    courseId: SONGMAKING_COURSE.id,
    title: 'Basic Mixing Concepts',
    description: 'Make your recordings sound polished',
    type: 'text',
    sortOrder: 2,
    durationMinutes: 14,
    isFree: false,
    isPreview: false,
    mdxContent: `# Basic Mixing Concepts

Mixing is about making all your elements work together. Here are the fundamentals.

## The Three Dimensions of a Mix

### 1. Volume (Front to Back)
Louder elements feel closer. Use volume to create depth.

### 2. Panning (Left to Right)
Spread elements across the stereo field. Keep bass and vocals centered.

### 3. Frequency (Low to High)
Use EQ to give each element its own space. Cut before you boost.

## Essential Tools

| Tool | Purpose |
|------|---------|
| **EQ** | Shape the frequency content |
| **Compression** | Control dynamics |
| **Reverb** | Create space and depth |
| **Panning** | Position in stereo field |

## The Mixing Order

1. **Balance** - Get the volume levels right first
2. **Pan** - Spread elements in the stereo field
3. **EQ** - Carve space for each element
4. **Compress** - Control dynamics
5. **Effects** - Add reverb, delay, etc.

## Golden Rule

If you can't hear it, mute it. Less is often more in mixing.`,
  },
  {
    id: 'lesson-018',
    sectionId: 'section-005',
    courseId: SONGMAKING_COURSE.id,
    title: 'Final Project: Complete a Song',
    description: "Apply everything you've learned to finish a song",
    type: 'assignment',
    sortOrder: 3,
    durationMinutes: 30,
    isFree: false,
    isPreview: false,
    mdxContent: `# Final Project: Complete a Song

Congratulations on making it this far! Now it's time for the ultimate test.

## Your Mission

Create a complete song from scratch. It should include:

- At least 2 verses
- A memorable chorus
- A bridge or instrumental break
- A basic demo recording

## Checklist

- [ ] Written lyrics with sensory details
- [ ] A chord progression that fits the mood
- [ ] A memorable melody
- [ ] Clear song structure
- [ ] Basic demo recording (even phone quality is fine!)

## Don't Aim for Perfect

Your goal is to **finish**, not to create a masterpiece. 

The difference between amateur and professional songwriters isn't talent - it's the number of songs they've completed.

## Submission

Upload your song to the community forum. Include:
- The song itself (audio file or video)
- Your lyrics
- A brief description of your creative process

## What's Next?

Once you've completed this project, you've proven you can write a song!

Keep writing. The more songs you finish, the better you'll get.

Welcome to the songwriter's journey.`,
  },
];

// =============================================================================
// Helper Functions
// =============================================================================

export function getSectionLessons(sectionId: string): Lesson[] {
  return SONGMAKING_LESSONS.filter((l) => l.sectionId === sectionId).sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}

export function getLessonById(lessonId: string): Lesson | undefined {
  return SONGMAKING_LESSONS.find((l) => l.id === lessonId);
}

export function getSectionById(sectionId: string): Section | undefined {
  return SONGMAKING_SECTIONS.find((s) => s.id === sectionId);
}

export function getNextLesson(currentLessonId: string): Lesson | undefined {
  const currentLesson = getLessonById(currentLessonId);
  if (!currentLesson) return undefined;

  // Try to find next lesson in same section
  const sectionLessons = getSectionLessons(currentLesson.sectionId);
  const currentIndex = sectionLessons.findIndex((l) => l.id === currentLessonId);
  if (currentIndex < sectionLessons.length - 1) {
    return sectionLessons[currentIndex + 1];
  }

  // Move to next section
  const currentSection = getSectionById(currentLesson.sectionId);
  if (!currentSection) return undefined;

  const nextSection = SONGMAKING_SECTIONS.find((s) => s.sortOrder === currentSection.sortOrder + 1);
  if (!nextSection) return undefined;

  const nextSectionLessons = getSectionLessons(nextSection.id);
  return nextSectionLessons[0];
}

export function getPreviousLesson(currentLessonId: string): Lesson | undefined {
  const currentLesson = getLessonById(currentLessonId);
  if (!currentLesson) return undefined;

  // Try to find previous lesson in same section
  const sectionLessons = getSectionLessons(currentLesson.sectionId);
  const currentIndex = sectionLessons.findIndex((l) => l.id === currentLessonId);
  if (currentIndex > 0) {
    return sectionLessons[currentIndex - 1];
  }

  // Move to previous section
  const currentSection = getSectionById(currentLesson.sectionId);
  if (!currentSection) return undefined;

  const prevSection = SONGMAKING_SECTIONS.find((s) => s.sortOrder === currentSection.sortOrder - 1);
  if (!prevSection) return undefined;

  const prevSectionLessons = getSectionLessons(prevSection.id);
  return prevSectionLessons[prevSectionLessons.length - 1];
}

// Mock progress - in reality this would come from the server
export const MOCK_PROGRESS: Map<string, LessonProgress> = new Map([
  ['lesson-001', { lessonId: 'lesson-001', status: 'completed', progressPercent: 100 }],
  ['lesson-002', { lessonId: 'lesson-002', status: 'completed', progressPercent: 100 }],
  ['lesson-003', { lessonId: 'lesson-003', status: 'in_progress', progressPercent: 45 }],
]);
