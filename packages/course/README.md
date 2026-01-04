# @course - Course Learning Platform

A comprehensive course management package for building online learning platforms like Udemy or Skillshare.

## Features

### Core Entities

| Feature         | Description                                                     |
| --------------- | --------------------------------------------------------------- |
| **Course**      | Main course entity with pricing, categorization, and publishing |
| **Section**     | Organizational units for grouping lessons                       |
| **Lesson**      | Individual learning units (video, MDX text, quiz, downloads)    |
| **Instructor**  | Instructor profiles linked to user accounts                     |
| **Enrollment**  | User course enrollments with access control                     |
| **Progress**    | Lesson-level progress tracking                                  |
| **Review**      | Course ratings and reviews                                      |
| **Certificate** | Completion certificates with verification                       |
| **Category**    | Hierarchical course categories                                  |

### Lesson Content Types

- **Video**: YouTube/Vimeo embeds with watch progress
- **Text**: MDX content with Tailwind Typography styling
- **Quiz**: Integration with `@quiz` package
- **Assignment**: MDX-based assignments
- **Download**: Downloadable resources

### MDX Components

The MDX content in text lessons supports custom components:

```mdx
# Lesson Title

This is a text lesson with rich content.

<Quiz id="quiz-123" />

<VideoEmbed provider="youtube" videoId="abc123" />

<CodePlayground language="typescript">
  const greeting = "Hello, World!"; console.log(greeting);
</CodePlayground>

<DownloadButton file="resources.zip" />
```

## Package Structure

```
src/
├── features/
│   ├── course/          # Course CRUD, publishing, pricing
│   ├── section/         # Section ordering
│   ├── lesson/          # Lesson content (MDX, video, quiz)
│   ├── instructor/      # Instructor profiles
│   ├── enrollment/      # Enrollments & access control
│   ├── progress/        # Progress tracking
│   ├── review/          # Reviews & ratings
│   ├── certificate/     # Completion certificates
│   └── category/        # Course categories
├── database/
│   └── migrations/      # SQL migrations
├── index.ts             # Main exports
├── server.ts            # Server layer exports
└── database.ts          # Database exports
```

## Database Schema

See `src/database/migrations/0001_course_tables.ts` for the complete schema.

Key tables:

- `course_categories` - Hierarchical categories
- `instructor_profiles` - Instructor data
- `courses` - Course metadata and pricing
- `course_sections` - Section organization
- `course_lessons` - Lesson content
- `course_enrollments` - User enrollments
- `lesson_progress` - Progress tracking
- `course_reviews` - Reviews and ratings
- `course_certificates` - Completion certificates

## Usage

```typescript
import { Course, CreateCourseInput, CourseId } from "@course";

// Create a course
const input: CreateCourseInput = {
  instructorId: myInstructorId,
  title: "Introduction to TypeScript",
  description: "Learn TypeScript from scratch",
  level: "beginner",
  pricing: { model: "free" },
};
```

## Implementation Status

### Completed

- [x] Domain schemas for all 9 features
- [x] Database migration (`0001_course_tables.ts`)
- [x] All 9 repositories implemented:
  - [x] `CategoryRepository` - CRUD, hierarchical queries, slug generation
  - [x] `InstructorRepository` - Profile management, approval workflow
  - [x] `CourseRepository` - CRUD, publish/archive, category/instructor queries
  - [x] `SectionRepository` - CRUD, ordering within courses
  - [x] `LessonRepository` - CRUD, multiple content types, ordering
  - [x] `EnrollmentRepository` - Enrollment management, access checks
  - [x] `ProgressRepository` - Lesson progress tracking, completion
  - [x] `ReviewRepository` - Reviews, instructor responses, helpful votes
  - [x] `CertificateRepository` - Certificate issuance, verification codes

### Remaining Work

#### Phase 1: Database & Seeds

- [ ] Create `seeds.ts` for test data generation
- [ ] Write repository tests for all features

#### Phase 2: Server Layer (RPC/API)

- [ ] Create service layer for each feature
- [ ] Implement RPC handlers with Effect HttpApi
- [ ] Add authorization middleware (instructor-only routes, enrolled-user routes)
- [ ] Implement course statistics updates (enrollment count, ratings, etc.)

#### Phase 3: Client Layer

- [ ] Create Jotai atoms for state management
- [ ] Implement TanStack Query hooks
- [ ] Build client-side caching strategy

#### Phase 4: UI Components

- [ ] Course listing/grid component
- [ ] Course detail page
- [ ] Lesson player (video, MDX, quiz integration)
- [ ] Progress indicators
- [ ] Review/rating UI
- [ ] Instructor dashboard
- [ ] Certificate viewer/download

#### Phase 5: Advanced Features

- [ ] Full-text search with filters (category, level, price)
- [ ] MDX rendering with custom components (`<Quiz />`, `<VideoEmbed />`, `<CodePlayground />`)
- [ ] Video player with resume position
- [ ] Course recommendations
- [ ] Gamification (badges, streaks, leaderboards)

#### Phase 6: Future Integrations

- [ ] Payment integration (Stripe)
- [ ] Email notifications (enrollment, completion, certificate)
- [ ] Real-time chat for courses (`@chat` package)
- [ ] Analytics dashboard for instructors

## Architecture Notes

### Repository Pattern

All repositories follow the Effect Service pattern:

```typescript
export class SomeRepository extends Effect.Service<SomeRepository>()(
  '@course/SomeRepository',
  {
    dependencies: [PgLive],
    effect: Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      // SqlSchema queries...
      return { findAll, findById, create, update, delete } as const;
    }),
  },
) {}
```

### Error Handling

Each feature has typed errors extending `S.TaggedError`:

- `CourseNotFoundError` (404)
- `EnrollmentNotFoundError` (404)
- `AlreadyEnrolledError` (409)
- `InstructorNotApprovedError` (403)
- etc.

### Pricing Models

Courses support multiple pricing strategies:

- `free` - Completely free
- `one-time` - Single purchase
- `subscription` - Requires active subscription
- `freemium` - Some lessons free, rest behind paywall

### Denormalized Stats

For performance, several stats are denormalized:

- Course: `enrollmentCount`, `reviewCount`, `averageRating`, `lessonCount`
- Instructor: `totalStudents`, `totalCourses`, `averageRating`
- Enrollment: `progressPercent`, `completedLessonCount`

These should be updated via database triggers or service layer methods.
