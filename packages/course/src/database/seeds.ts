/**
 * Course Database Seeders
 *
 * Composable seeders for creating fake course data.
 * Uses @faker-js/faker for realistic data.
 */

import * as SqlClient from '@effect/sql/SqlClient';
import * as Effect from 'effect/Effect';
import { faker } from '@faker-js/faker';

import { makeCleanup, makeSeeder, type CleanupEntry, type SeederEntry } from '@core/database';

// ─────────────────────────────────────────────────────────────────────────────
// Category Seeder
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_NAMES = [
  'Web Development',
  'Mobile Development',
  'Data Science',
  'Machine Learning',
  'DevOps',
  'Cloud Computing',
  'Cybersecurity',
  'Game Development',
  'UI/UX Design',
  'Database Management',
];

export const categories = makeSeeder(
  { name: 'course_categories', defaultCount: 10, dependsOn: [] },
  (count) =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      const existing = yield* sql<{ count: string }>`
        SELECT COUNT(*)::text as count FROM course_categories WHERE name LIKE '%(Seed)%'
      `;
      const existingCount = Number(existing[0].count);

      if (existingCount >= count) {
        return {
          name: 'course_categories',
          existing: existingCount,
          created: 0,
        };
      }

      const toCreate = Math.min(count - existingCount, CATEGORY_NAMES.length);
      let created = 0;

      for (let i = 0; i < toCreate; i++) {
        const name = `${CATEGORY_NAMES[i]} (Seed)`;
        const slug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        const description = faker.lorem.sentence();

        yield* sql`
          INSERT INTO course_categories (id, name, slug, description, sort_order, is_active, created_at, updated_at)
          VALUES (gen_random_uuid(), ${name}, ${slug}, ${description}, ${i}, true, NOW(), NOW())
          ON CONFLICT (slug) DO NOTHING
        `;

        created++;
      }

      return { name: 'course_categories', existing: existingCount, created };
    }),
);

// ─────────────────────────────────────────────────────────────────────────────
// Instructor Seeder
// ─────────────────────────────────────────────────────────────────────────────

export const instructors = makeSeeder(
  { name: 'instructor_profiles', defaultCount: 5, dependsOn: [] },
  (count) =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      const existing = yield* sql<{ count: string }>`
        SELECT COUNT(*)::text as count FROM instructor_profiles WHERE display_name LIKE '%(Seed)%'
      `;
      const existingCount = Number(existing[0].count);

      if (existingCount >= count) {
        return {
          name: 'instructor_profiles',
          existing: existingCount,
          created: 0,
        };
      }

      // Get some user IDs to link instructors to
      const users = yield* sql<{ id: string }>`
        SELECT id FROM "user" LIMIT ${count}
      `;

      const toCreate = Math.min(count - existingCount, users.length);
      let created = 0;

      for (let i = 0; i < toCreate; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const displayName = `${firstName} ${lastName} (Seed)`;

        yield* sql`
          INSERT INTO instructor_profiles (
            id, user_id, display_name, bio, headline, status,
            total_students, total_courses, total_reviews,
            created_at, updated_at
          )
          VALUES (
            gen_random_uuid(),
            ${users[i].id},
            ${displayName},
            ${faker.lorem.paragraphs(2)},
            ${faker.person.jobTitle()},
            'approved',
            ${faker.number.int({ min: 0, max: 10000 })},
            ${faker.number.int({ min: 1, max: 20 })},
            ${faker.number.int({ min: 0, max: 500 })},
            NOW(),
            NOW()
          )
          ON CONFLICT (user_id) DO NOTHING
        `;

        created++;
      }

      return { name: 'instructor_profiles', existing: existingCount, created };
    }),
);

// ─────────────────────────────────────────────────────────────────────────────
// Course Seeder
// ─────────────────────────────────────────────────────────────────────────────

const COURSE_TOPICS = [
  'Complete Guide to',
  'Master',
  'Learn',
  'Introduction to',
  'Advanced',
  'Professional',
  'Practical',
  'Ultimate',
];

const COURSE_SUBJECTS = [
  'React',
  'TypeScript',
  'Node.js',
  'Python',
  'Machine Learning',
  'Docker',
  'Kubernetes',
  'AWS',
  'GraphQL',
  'Next.js',
];

export const courses = makeSeeder(
  {
    name: 'courses',
    defaultCount: 10,
    dependsOn: ['instructor_profiles', 'course_categories'],
  },
  (count) =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      const existing = yield* sql<{ count: string }>`
        SELECT COUNT(*)::text as count FROM courses WHERE title LIKE '%(Seed)%'
      `;
      const existingCount = Number(existing[0].count);

      if (existingCount >= count) {
        return { name: 'courses', existing: existingCount, created: 0 };
      }

      // Get instructors and categories
      const instructorRows = yield* sql<{ id: string }>`
        SELECT id FROM instructor_profiles WHERE status = 'approved' LIMIT 10
      `;
      const categoryRows = yield* sql<{ id: string }>`
        SELECT id FROM course_categories WHERE is_active = true LIMIT 10
      `;

      if (instructorRows.length === 0) {
        return {
          name: 'courses',
          existing: existingCount,
          created: 0,
          skipped: 'No instructors',
        };
      }

      const toCreate = count - existingCount;
      let created = 0;

      for (let i = 0; i < toCreate; i++) {
        const topic = faker.helpers.arrayElement(COURSE_TOPICS);
        const subject = faker.helpers.arrayElement(COURSE_SUBJECTS);
        const title = `${topic} ${subject} (Seed)`;
        const slug = `${topic}-${subject}-${Date.now()}-${i}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        const instructor = faker.helpers.arrayElement(instructorRows);
        const category = categoryRows.length > 0 ? faker.helpers.arrayElement(categoryRows) : null;
        const level = faker.helpers.arrayElement([
          'beginner',
          'intermediate',
          'advanced',
          'all-levels',
        ]);
        const pricingModel = faker.helpers.arrayElement(['free', 'one-time', 'freemium']);
        const price = pricingModel === 'free' ? null : faker.number.int({ min: 9, max: 199 });

        const pricing = JSON.stringify({
          model: pricingModel,
          price: price,
          currency: price ? 'USD' : undefined,
          freeLessonCount: pricingModel === 'freemium' ? 3 : undefined,
        });

        yield* sql`
          INSERT INTO courses (
            id, instructor_id, title, slug, subtitle, description,
            category_id, level, language, pricing, status,
            total_duration_minutes, lesson_count, section_count,
            enrollment_count, review_count,
            created_at, updated_at
          )
          VALUES (
            gen_random_uuid(),
            ${instructor.id},
            ${title},
            ${slug},
            ${faker.lorem.sentence()},
            ${faker.lorem.paragraphs(3)},
            ${category?.id ?? null},
            ${level},
            'en',
            ${pricing}::jsonb,
            'published',
            ${faker.number.int({ min: 60, max: 600 })},
            ${faker.number.int({ min: 10, max: 100 })},
            ${faker.number.int({ min: 3, max: 15 })},
            ${faker.number.int({ min: 0, max: 5000 })},
            ${faker.number.int({ min: 0, max: 200 })},
            NOW(),
            NOW()
          )
        `;

        created++;
      }

      return { name: 'courses', existing: existingCount, created };
    }),
);

// ─────────────────────────────────────────────────────────────────────────────
// Section Seeder
// ─────────────────────────────────────────────────────────────────────────────

export const sections = makeSeeder(
  { name: 'course_sections', defaultCount: 30, dependsOn: ['courses'] },
  (count) =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      const existing = yield* sql<{ count: string }>`
        SELECT COUNT(*)::text as count FROM course_sections WHERE title LIKE '%(Seed)%'
      `;
      const existingCount = Number(existing[0].count);

      if (existingCount >= count) {
        return { name: 'course_sections', existing: existingCount, created: 0 };
      }

      // Get seeded courses
      const courseRows = yield* sql<{ id: string }>`
        SELECT id FROM courses WHERE title LIKE '%(Seed)%'
      `;

      if (courseRows.length === 0) {
        return {
          name: 'course_sections',
          existing: existingCount,
          created: 0,
          skipped: 'No courses',
        };
      }

      const toCreate = count - existingCount;
      const sectionsPerCourse = Math.ceil(toCreate / courseRows.length);
      let created = 0;

      for (const course of courseRows) {
        for (let i = 0; i < sectionsPerCourse && created < toCreate; i++) {
          const title = `Section ${i + 1}: ${faker.lorem.words(3)} (Seed)`;

          yield* sql`
            INSERT INTO course_sections (
              id, course_id, title, description, sort_order,
              lesson_count, total_duration_minutes,
              created_at, updated_at
            )
            VALUES (
              gen_random_uuid(),
              ${course.id},
              ${title},
              ${faker.lorem.sentence()},
              ${i},
              ${faker.number.int({ min: 3, max: 10 })},
              ${faker.number.int({ min: 15, max: 120 })},
              NOW(),
              NOW()
            )
          `;

          created++;
        }
      }

      return { name: 'course_sections', existing: existingCount, created };
    }),
);

// ─────────────────────────────────────────────────────────────────────────────
// Lesson Seeder
// ─────────────────────────────────────────────────────────────────────────────

export const lessons = makeSeeder(
  { name: 'course_lessons', defaultCount: 100, dependsOn: ['course_sections'] },
  (count) =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      const existing = yield* sql<{ count: string }>`
        SELECT COUNT(*)::text as count FROM course_lessons WHERE title LIKE '%(Seed)%'
      `;
      const existingCount = Number(existing[0].count);

      if (existingCount >= count) {
        return { name: 'course_lessons', existing: existingCount, created: 0 };
      }

      // Get seeded sections with their course IDs
      const sectionRows = yield* sql<{ id: string; course_id: string }>`
        SELECT s.id, s.course_id 
        FROM course_sections s
        JOIN courses c ON c.id = s.course_id
        WHERE s.title LIKE '%(Seed)%'
      `;

      if (sectionRows.length === 0) {
        return {
          name: 'course_lessons',
          existing: existingCount,
          created: 0,
          skipped: 'No sections',
        };
      }

      const toCreate = count - existingCount;
      const lessonsPerSection = Math.ceil(toCreate / sectionRows.length);
      let created = 0;

      for (const section of sectionRows) {
        for (let i = 0; i < lessonsPerSection && created < toCreate; i++) {
          const lessonType = faker.helpers.arrayElement(['video', 'text', 'quiz', 'download']);
          const title = `Lesson ${i + 1}: ${faker.lorem.words(4)} (Seed)`;

          const videoContent =
            lessonType === 'video'
              ? JSON.stringify({
                  provider: faker.helpers.arrayElement(['youtube', 'vimeo']),
                  videoId: faker.string.alphanumeric(11),
                  durationSeconds: faker.number.int({ min: 180, max: 1800 }),
                })
              : null;

          const mdxContent =
            lessonType === 'text'
              ? `# ${title}\n\n${faker.lorem.paragraphs(
                  5,
                )}\n\n## Key Points\n\n${faker.lorem.paragraphs(2)}`
              : null;

          yield* sql`
            INSERT INTO course_lessons (
              id, section_id, course_id, title, description, type,
              mdx_content, video_content, sort_order, duration_minutes,
              is_free, is_preview,
              created_at, updated_at
            )
            VALUES (
              gen_random_uuid(),
              ${section.id},
              ${section.course_id},
              ${title},
              ${faker.lorem.sentence()},
              ${lessonType},
              ${mdxContent},
              ${videoContent}::jsonb,
              ${i},
              ${faker.number.int({ min: 5, max: 30 })},
              ${i === 0},
              ${i < 2},
              NOW(),
              NOW()
            )
          `;

          created++;
        }
      }

      return { name: 'course_lessons', existing: existingCount, created };
    }),
);

// ─────────────────────────────────────────────────────────────────────────────
// Course Seed Composer
// ─────────────────────────────────────────────────────────────────────────────

interface CourseSeedOptions {
  readonly categories?: number;
  readonly instructors?: number;
  readonly courses?: number;
  readonly sections?: number;
  readonly lessons?: number;
}

/**
 * Compose course seeders with optional count overrides.
 *
 * @example
 * ```ts
 * course()                           // defaults
 * course({ courses: 20, lessons: 200 })  // custom counts
 * ```
 */
export const course = (options: CourseSeedOptions = {}): ReadonlyArray<SeederEntry> => [
  categories(options.categories),
  instructors(options.instructors),
  courses(options.courses),
  sections(options.sections),
  lessons(options.lessons),
];

// ─────────────────────────────────────────────────────────────────────────────
// Cleanup
// ─────────────────────────────────────────────────────────────────────────────

export const cleanupLessons = makeCleanup({
  name: 'course_lessons',
  countSql: (sql) =>
    sql<{ count: number }>`
      SELECT COUNT(*)::int as count FROM course_lessons WHERE title LIKE '%(Seed)%'
    `.pipe(Effect.map((r) => r[0].count)),
  deleteSql: (sql) =>
    sql`DELETE FROM course_lessons WHERE title LIKE '%(Seed)%'`.pipe(Effect.asVoid),
});

export const cleanupSections = makeCleanup({
  name: 'course_sections',
  countSql: (sql) =>
    sql<{ count: number }>`
      SELECT COUNT(*)::int as count FROM course_sections WHERE title LIKE '%(Seed)%'
    `.pipe(Effect.map((r) => r[0].count)),
  deleteSql: (sql) =>
    sql`DELETE FROM course_sections WHERE title LIKE '%(Seed)%'`.pipe(Effect.asVoid),
});

export const cleanupCourses = makeCleanup({
  name: 'courses',
  countSql: (sql) =>
    sql<{ count: number }>`
      SELECT COUNT(*)::int as count FROM courses WHERE title LIKE '%(Seed)%'
    `.pipe(Effect.map((r) => r[0].count)),
  deleteSql: (sql) => sql`DELETE FROM courses WHERE title LIKE '%(Seed)%'`.pipe(Effect.asVoid),
});

export const cleanupInstructors = makeCleanup({
  name: 'instructor_profiles',
  countSql: (sql) =>
    sql<{ count: number }>`
      SELECT COUNT(*)::int as count FROM instructor_profiles WHERE display_name LIKE '%(Seed)%'
    `.pipe(Effect.map((r) => r[0].count)),
  deleteSql: (sql) =>
    sql`DELETE FROM instructor_profiles WHERE display_name LIKE '%(Seed)%'`.pipe(Effect.asVoid),
});

export const cleanupCategories = makeCleanup({
  name: 'course_categories',
  countSql: (sql) =>
    sql<{ count: number }>`
      SELECT COUNT(*)::int as count FROM course_categories WHERE name LIKE '%(Seed)%'
    `.pipe(Effect.map((r) => r[0].count)),
  deleteSql: (sql) =>
    sql`DELETE FROM course_categories WHERE name LIKE '%(Seed)%'`.pipe(Effect.asVoid),
});

/**
 * Get all course cleanup operations in correct order (respecting foreign keys).
 */
export const courseCleanup = (): ReadonlyArray<CleanupEntry> => [
  cleanupLessons(),
  cleanupSections(),
  cleanupCourses(),
  cleanupInstructors(),
  cleanupCategories(),
];
