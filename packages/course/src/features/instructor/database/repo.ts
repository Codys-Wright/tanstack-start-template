import { UserId } from '@auth';
import { PgLive } from '@core/database';
import * as SqlClient from '@effect/sql/SqlClient';
import * as SqlSchema from '@effect/sql/SqlSchema';
import * as Effect from 'effect/Effect';
import { flow } from 'effect/Function';
import * as S from 'effect/Schema';

import {
  CreateInstructorInput,
  InstructorId,
  InstructorNotFoundError,
  InstructorProfile,
  InstructorStatus,
  UpdateInstructorInput,
} from '../domain/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Internal Input Schemas
// ─────────────────────────────────────────────────────────────────────────────

const InsertInstructor = S.Struct({
  user_id: UserId,
  display_name: S.String,
  bio: S.NullOr(S.String),
  headline: S.NullOr(S.String),
  avatar_url: S.NullOr(S.String),
  website_url: S.NullOr(S.String),
  linkedin_url: S.NullOr(S.String),
  twitter_url: S.NullOr(S.String),
  youtube_url: S.NullOr(S.String),
  status: InstructorStatus,
});

const UpdateInstructorDb = S.Struct({
  id: InstructorId,
  display_name: S.optional(S.String),
  bio: S.optional(S.NullOr(S.String)),
  headline: S.optional(S.NullOr(S.String)),
  avatar_url: S.optional(S.NullOr(S.String)),
  website_url: S.optional(S.NullOr(S.String)),
  linkedin_url: S.optional(S.NullOr(S.String)),
  twitter_url: S.optional(S.NullOr(S.String)),
  youtube_url: S.optional(S.NullOr(S.String)),
  status: S.optional(InstructorStatus),
});
type UpdateInstructorDb = typeof UpdateInstructorDb.Type;

// ─────────────────────────────────────────────────────────────────────────────
// Repository
// ─────────────────────────────────────────────────────────────────────────────

export class InstructorRepository extends Effect.Service<InstructorRepository>()(
  '@course/InstructorRepository',
  {
    dependencies: [PgLive],
    effect: Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      // ─────────────────────────────────────────────────────────────────────────
      // Queries
      // ─────────────────────────────────────────────────────────────────────────

      const findAll = SqlSchema.findAll({
        Result: InstructorProfile,
        Request: S.Void,
        execute: () => sql`
          SELECT
            id,
            user_id AS "userId",
            display_name AS "displayName",
            bio,
            headline,
            avatar_url AS "avatarUrl",
            website_url AS "websiteUrl",
            linkedin_url AS "linkedinUrl",
            twitter_url AS "twitterUrl",
            youtube_url AS "youtubeUrl",
            total_students AS "totalStudents",
            total_courses AS "totalCourses",
            average_rating AS "averageRating",
            total_reviews AS "totalReviews",
            status,
            approved_at AS "approvedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM
            instructor_profiles
          ORDER BY
            created_at DESC
        `,
      });

      const findById = SqlSchema.single({
        Result: InstructorProfile,
        Request: S.Struct({ id: InstructorId }),
        execute: ({ id }) => sql`
          SELECT
            id,
            user_id AS "userId",
            display_name AS "displayName",
            bio,
            headline,
            avatar_url AS "avatarUrl",
            website_url AS "websiteUrl",
            linkedin_url AS "linkedinUrl",
            twitter_url AS "twitterUrl",
            youtube_url AS "youtubeUrl",
            total_students AS "totalStudents",
            total_courses AS "totalCourses",
            average_rating AS "averageRating",
            total_reviews AS "totalReviews",
            status,
            approved_at AS "approvedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM
            instructor_profiles
          WHERE
            id = ${id}
        `,
      });

      const findByUserId = SqlSchema.single({
        Result: InstructorProfile,
        Request: S.Struct({ userId: UserId }),
        execute: ({ userId }) => sql`
          SELECT
            id,
            user_id AS "userId",
            display_name AS "displayName",
            bio,
            headline,
            avatar_url AS "avatarUrl",
            website_url AS "websiteUrl",
            linkedin_url AS "linkedinUrl",
            twitter_url AS "twitterUrl",
            youtube_url AS "youtubeUrl",
            total_students AS "totalStudents",
            total_courses AS "totalCourses",
            average_rating AS "averageRating",
            total_reviews AS "totalReviews",
            status,
            approved_at AS "approvedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM
            instructor_profiles
          WHERE
            user_id = ${userId}
        `,
      });

      const findApproved = SqlSchema.findAll({
        Result: InstructorProfile,
        Request: S.Void,
        execute: () => sql`
          SELECT
            id,
            user_id AS "userId",
            display_name AS "displayName",
            bio,
            headline,
            avatar_url AS "avatarUrl",
            website_url AS "websiteUrl",
            linkedin_url AS "linkedinUrl",
            twitter_url AS "twitterUrl",
            youtube_url AS "youtubeUrl",
            total_students AS "totalStudents",
            total_courses AS "totalCourses",
            average_rating AS "averageRating",
            total_reviews AS "totalReviews",
            status,
            approved_at AS "approvedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM
            instructor_profiles
          WHERE
            status = 'approved'
          ORDER BY
            total_students DESC
        `,
      });

      const findPending = SqlSchema.findAll({
        Result: InstructorProfile,
        Request: S.Void,
        execute: () => sql`
          SELECT
            id,
            user_id AS "userId",
            display_name AS "displayName",
            bio,
            headline,
            avatar_url AS "avatarUrl",
            website_url AS "websiteUrl",
            linkedin_url AS "linkedinUrl",
            twitter_url AS "twitterUrl",
            youtube_url AS "youtubeUrl",
            total_students AS "totalStudents",
            total_courses AS "totalCourses",
            average_rating AS "averageRating",
            total_reviews AS "totalReviews",
            status,
            approved_at AS "approvedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM
            instructor_profiles
          WHERE
            status = 'pending'
          ORDER BY
            created_at ASC
        `,
      });

      // ─────────────────────────────────────────────────────────────────────────
      // Mutations
      // ─────────────────────────────────────────────────────────────────────────

      const create = SqlSchema.single({
        Result: InstructorProfile,
        Request: InsertInstructor,
        execute: (input) => sql`
          INSERT INTO instructor_profiles ${sql.insert(input)}
          RETURNING
            id,
            user_id AS "userId",
            display_name AS "displayName",
            bio,
            headline,
            avatar_url AS "avatarUrl",
            website_url AS "websiteUrl",
            linkedin_url AS "linkedinUrl",
            twitter_url AS "twitterUrl",
            youtube_url AS "youtubeUrl",
            total_students AS "totalStudents",
            total_courses AS "totalCourses",
            average_rating AS "averageRating",
            total_reviews AS "totalReviews",
            status,
            approved_at AS "approvedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
      });

      const update = SqlSchema.single({
        Result: InstructorProfile,
        Request: UpdateInstructorDb,
        execute: (input) => sql`
          UPDATE instructor_profiles
          SET
            ${sql.update(input, ['id'])},
            updated_at = NOW()
          WHERE
            id = ${input.id}
          RETURNING
            id,
            user_id AS "userId",
            display_name AS "displayName",
            bio,
            headline,
            avatar_url AS "avatarUrl",
            website_url AS "websiteUrl",
            linkedin_url AS "linkedinUrl",
            twitter_url AS "twitterUrl",
            youtube_url AS "youtubeUrl",
            total_students AS "totalStudents",
            total_courses AS "totalCourses",
            average_rating AS "averageRating",
            total_reviews AS "totalReviews",
            status,
            approved_at AS "approvedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
      });

      const approve = SqlSchema.single({
        Result: InstructorProfile,
        Request: S.Struct({ id: InstructorId }),
        execute: ({ id }) => sql`
          UPDATE instructor_profiles
          SET
            status = 'approved',
            approved_at = NOW(),
            updated_at = NOW()
          WHERE
            id = ${id}
          RETURNING
            id,
            user_id AS "userId",
            display_name AS "displayName",
            bio,
            headline,
            avatar_url AS "avatarUrl",
            website_url AS "websiteUrl",
            linkedin_url AS "linkedinUrl",
            twitter_url AS "twitterUrl",
            youtube_url AS "youtubeUrl",
            total_students AS "totalStudents",
            total_courses AS "totalCourses",
            average_rating AS "averageRating",
            total_reviews AS "totalReviews",
            status,
            approved_at AS "approvedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
      });

      const suspend = SqlSchema.single({
        Result: InstructorProfile,
        Request: S.Struct({ id: InstructorId }),
        execute: ({ id }) => sql`
          UPDATE instructor_profiles
          SET
            status = 'suspended',
            updated_at = NOW()
          WHERE
            id = ${id}
          RETURNING
            id,
            user_id AS "userId",
            display_name AS "displayName",
            bio,
            headline,
            avatar_url AS "avatarUrl",
            website_url AS "websiteUrl",
            linkedin_url AS "linkedinUrl",
            twitter_url AS "twitterUrl",
            youtube_url AS "youtubeUrl",
            total_students AS "totalStudents",
            total_courses AS "totalCourses",
            average_rating AS "averageRating",
            total_reviews AS "totalReviews",
            status,
            approved_at AS "approvedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
      });

      const del = SqlSchema.single({
        Result: S.Unknown,
        Request: InstructorId,
        execute: (id) => sql`
          DELETE FROM instructor_profiles
          WHERE id = ${id}
          RETURNING id
        `,
      });

      // ─────────────────────────────────────────────────────────────────────────
      // Public API
      // ─────────────────────────────────────────────────────────────────────────

      return {
        findAll: flow(findAll, Effect.orDie),

        findApproved: flow(findApproved, Effect.orDie),

        findPending: flow(findPending, Effect.orDie),

        findById: (id: InstructorId) =>
          findById({ id }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new InstructorNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        findByUserId: (userId: UserId) =>
          findByUserId({ userId }).pipe(
            Effect.catchTag('NoSuchElementException', () => Effect.succeed(null)),
            Effect.catchTags({
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        create: (input: CreateInstructorInput) =>
          create({
            user_id: input.userId,
            display_name: input.displayName,
            bio: input.bio ?? null,
            headline: input.headline ?? null,
            avatar_url: input.avatarUrl ?? null,
            website_url: input.websiteUrl ?? null,
            linkedin_url: input.linkedinUrl ?? null,
            twitter_url: input.twitterUrl ?? null,
            youtube_url: input.youtubeUrl ?? null,
            status: 'pending',
          }).pipe(Effect.orDie),

        update: (id: InstructorId, input: UpdateInstructorInput) =>
          update({
            id,
            ...(input.displayName !== undefined && {
              display_name: input.displayName,
            }),
            ...(input.bio !== undefined && { bio: input.bio }),
            ...(input.headline !== undefined && { headline: input.headline }),
            ...(input.avatarUrl !== undefined && {
              avatar_url: input.avatarUrl,
            }),
            ...(input.websiteUrl !== undefined && {
              website_url: input.websiteUrl,
            }),
            ...(input.linkedinUrl !== undefined && {
              linkedin_url: input.linkedinUrl,
            }),
            ...(input.twitterUrl !== undefined && {
              twitter_url: input.twitterUrl,
            }),
            ...(input.youtubeUrl !== undefined && {
              youtube_url: input.youtubeUrl,
            }),
          }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new InstructorNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        approve: (id: InstructorId) =>
          approve({ id }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new InstructorNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        suspend: (id: InstructorId) =>
          suspend({ id }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new InstructorNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        delete: (id: InstructorId) =>
          del(id).pipe(
            Effect.asVoid,
            Effect.catchTags({
              NoSuchElementException: () => new InstructorNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),
      } as const;
    }),
  },
) {}
