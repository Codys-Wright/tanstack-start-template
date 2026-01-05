import { UserId } from '@auth';
import { PgLive } from '@core/database';
import * as SqlClient from '@effect/sql/SqlClient';
import * as SqlSchema from '@effect/sql/SqlSchema';
import type * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as S from 'effect/Schema';

import { CourseId } from '../../course/domain/schema.js';
import { SectionId } from '../../section/domain/schema.js';
import {
  AnnouncementId,
  AnnouncementNotFoundError,
  AnnouncementPriority,
  AnnouncementVisibility,
  ChatRoomId,
  CourseAnnouncement,
  CourseDmThread,
  CourseDmThreadId,
  CourseRoom,
  CourseRoomId,
  CourseRoomMember,
  CourseRoomMemberRole,
  CourseRoomNotFoundError,
  CourseRoomType,
  DmThreadNotFoundError,
  RoomAccessLevel,
} from '../domain/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Internal Input Schemas
// ─────────────────────────────────────────────────────────────────────────────

const InsertCourseRoom = S.Struct({
  course_id: S.UUID,
  chat_room_id: ChatRoomId,
  room_type: CourseRoomType,
  section_id: S.NullOr(S.UUID),
  lesson_id: S.NullOr(S.UUID),
  name: S.String,
  description: S.NullOr(S.String),
  icon_emoji: S.NullOr(S.String),
  access_level: RoomAccessLevel,
});

const InsertAnnouncement = S.Struct({
  course_id: S.UUID,
  author_id: UserId,
  title: S.String,
  content: S.String,
  priority: AnnouncementPriority,
  visibility: AnnouncementVisibility,
  target_section_ids: S.String, // JSON array
  scheduled_for: S.NullOr(S.DateTimeUtc),
  send_email: S.Boolean,
});

const InsertDmThread = S.Struct({
  course_id: S.UUID,
  chat_room_id: ChatRoomId,
  participant_ids: S.String, // JSON array
});

// ─────────────────────────────────────────────────────────────────────────────
// Course Room Repository
// ─────────────────────────────────────────────────────────────────────────────

export class CourseRoomRepository extends Effect.Service<CourseRoomRepository>()(
  '@course/CourseRoomRepository',
  {
    dependencies: [PgLive],
    effect: Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      // ─────────────────────────────────────────────────────────────────────
      // Room Queries
      // ─────────────────────────────────────────────────────────────────────

      const findRoomById = SqlSchema.single({
        Result: CourseRoom,
        Request: S.Struct({ id: CourseRoomId }),
        execute: ({ id }) => sql`
          SELECT
            id,
            course_id AS "courseId",
            chat_room_id AS "chatRoomId",
            room_type AS "roomType",
            section_id AS "sectionId",
            lesson_id AS "lessonId",
            name,
            description,
            icon_emoji AS "iconEmoji",
            access_level AS "accessLevel",
            is_archived AS "isArchived",
            is_pinned AS "isPinned",
            sort_order AS "sortOrder",
            member_count AS "memberCount",
            message_count AS "messageCount",
            last_message_at AS "lastMessageAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM
            course_rooms
          WHERE
            id = ${id}
        `,
      });

      const findRoomsByCourse = SqlSchema.findAll({
        Result: CourseRoom,
        Request: S.Struct({ courseId: CourseId }),
        execute: ({ courseId }) => sql`
          SELECT
            id,
            course_id AS "courseId",
            chat_room_id AS "chatRoomId",
            room_type AS "roomType",
            section_id AS "sectionId",
            lesson_id AS "lessonId",
            name,
            description,
            icon_emoji AS "iconEmoji",
            access_level AS "accessLevel",
            is_archived AS "isArchived",
            is_pinned AS "isPinned",
            sort_order AS "sortOrder",
            member_count AS "memberCount",
            message_count AS "messageCount",
            last_message_at AS "lastMessageAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM
            course_rooms
          WHERE
            course_id = ${courseId}
            AND is_archived = false
          ORDER BY
            is_pinned DESC,
            sort_order ASC,
            created_at ASC
        `,
      });

      const findRoomsByUser = SqlSchema.findAll({
        Result: CourseRoom,
        Request: S.Struct({ userId: UserId }),
        execute: ({ userId }) => sql`
          SELECT
            cr.id,
            cr.course_id AS "courseId",
            cr.chat_room_id AS "chatRoomId",
            cr.room_type AS "roomType",
            cr.section_id AS "sectionId",
            cr.lesson_id AS "lessonId",
            cr.name,
            cr.description,
            cr.icon_emoji AS "iconEmoji",
            cr.access_level AS "accessLevel",
            cr.is_archived AS "isArchived",
            cr.is_pinned AS "isPinned",
            cr.sort_order AS "sortOrder",
            cr.member_count AS "memberCount",
            cr.message_count AS "messageCount",
            cr.last_message_at AS "lastMessageAt",
            cr.created_at AS "createdAt",
            cr.updated_at AS "updatedAt"
          FROM
            course_rooms cr
          INNER JOIN
            course_room_members crm ON cr.id = crm.course_room_id
          WHERE
            crm.user_id = ${userId}
            AND cr.is_archived = false
          ORDER BY
            cr.last_message_at DESC NULLS LAST
        `,
      });

      // ─────────────────────────────────────────────────────────────────────
      // Room Mutations
      // ─────────────────────────────────────────────────────────────────────

      const createRoom = SqlSchema.single({
        Result: CourseRoom,
        Request: InsertCourseRoom,
        execute: (input) => sql`
          INSERT INTO course_rooms ${sql.insert(input)}
          RETURNING
            id,
            course_id AS "courseId",
            chat_room_id AS "chatRoomId",
            room_type AS "roomType",
            section_id AS "sectionId",
            lesson_id AS "lessonId",
            name,
            description,
            icon_emoji AS "iconEmoji",
            access_level AS "accessLevel",
            is_archived AS "isArchived",
            is_pinned AS "isPinned",
            sort_order AS "sortOrder",
            member_count AS "memberCount",
            message_count AS "messageCount",
            last_message_at AS "lastMessageAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
      });

      const updateRoom = SqlSchema.single({
        Result: CourseRoom,
        Request: S.Struct({
          id: CourseRoomId,
          name: S.optional(S.String),
          description: S.optional(S.NullOr(S.String)),
          icon_emoji: S.optional(S.NullOr(S.String)),
          access_level: S.optional(RoomAccessLevel),
          is_archived: S.optional(S.Boolean),
          is_pinned: S.optional(S.Boolean),
        }),
        execute: (input) => sql`
          UPDATE course_rooms
          SET
            ${sql.update(input, ['id'])},
            updated_at = NOW()
          WHERE
            id = ${input.id}
          RETURNING
            id,
            course_id AS "courseId",
            chat_room_id AS "chatRoomId",
            room_type AS "roomType",
            section_id AS "sectionId",
            lesson_id AS "lessonId",
            name,
            description,
            icon_emoji AS "iconEmoji",
            access_level AS "accessLevel",
            is_archived AS "isArchived",
            is_pinned AS "isPinned",
            sort_order AS "sortOrder",
            member_count AS "memberCount",
            message_count AS "messageCount",
            last_message_at AS "lastMessageAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
      });

      // ─────────────────────────────────────────────────────────────────────
      // Room Member Queries/Mutations
      // ─────────────────────────────────────────────────────────────────────

      const findMembership = SqlSchema.single({
        Result: CourseRoomMember,
        Request: S.Struct({ roomId: CourseRoomId, userId: UserId }),
        execute: ({ roomId, userId }) => sql`
          SELECT
            id,
            course_room_id AS "courseRoomId",
            user_id AS "userId",
            role,
            notifications_enabled AS "notificationsEnabled",
            muted_until AS "mutedUntil",
            last_read_at AS "lastReadAt",
            last_read_message_id AS "lastReadMessageId",
            joined_at AS "joinedAt"
          FROM
            course_room_members
          WHERE
            course_room_id = ${roomId}
            AND user_id = ${userId}
        `,
      });

      const addMember = SqlSchema.single({
        Result: CourseRoomMember,
        Request: S.Struct({
          course_room_id: CourseRoomId,
          user_id: UserId,
          role: CourseRoomMemberRole,
        }),
        execute: (input) => sql`
          INSERT INTO course_room_members ${sql.insert(input)}
          RETURNING
            id,
            course_room_id AS "courseRoomId",
            user_id AS "userId",
            role,
            notifications_enabled AS "notificationsEnabled",
            muted_until AS "mutedUntil",
            last_read_at AS "lastReadAt",
            last_read_message_id AS "lastReadMessageId",
            joined_at AS "joinedAt"
        `,
      });

      const updateMemberReadState = SqlSchema.void({
        Request: S.Struct({
          roomId: CourseRoomId,
          userId: UserId,
          messageId: S.optional(S.String),
        }),
        execute: ({ roomId, userId, messageId }) => sql`
          UPDATE course_room_members
          SET
            last_read_at = NOW(),
            last_read_message_id = ${messageId ?? null}
          WHERE
            course_room_id = ${roomId}
            AND user_id = ${userId}
        `,
      });

      // ─────────────────────────────────────────────────────────────────────
      // Announcement Queries
      // ─────────────────────────────────────────────────────────────────────

      const findAnnouncementById = SqlSchema.single({
        Result: CourseAnnouncement,
        Request: S.Struct({ id: AnnouncementId }),
        execute: ({ id }) => sql`
          SELECT
            id,
            course_id AS "courseId",
            author_id AS "authorId",
            title,
            content,
            priority,
            visibility,
            target_section_ids AS "targetSectionIds",
            is_published AS "isPublished",
            published_at AS "publishedAt",
            is_pinned AS "isPinned",
            pinned_at AS "pinnedAt",
            scheduled_for AS "scheduledFor",
            send_email AS "sendEmail",
            email_sent_at AS "emailSentAt",
            view_count AS "viewCount",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM
            course_announcements
          WHERE
            id = ${id}
        `,
      });

      const findAnnouncementsByCourse = SqlSchema.findAll({
        Result: CourseAnnouncement,
        Request: S.Struct({
          courseId: CourseId,
          includeUnpublished: S.Boolean,
        }),
        execute: ({ courseId, includeUnpublished }) => sql`
          SELECT
            id,
            course_id AS "courseId",
            author_id AS "authorId",
            title,
            content,
            priority,
            visibility,
            target_section_ids AS "targetSectionIds",
            is_published AS "isPublished",
            published_at AS "publishedAt",
            is_pinned AS "isPinned",
            pinned_at AS "pinnedAt",
            scheduled_for AS "scheduledFor",
            send_email AS "sendEmail",
            email_sent_at AS "emailSentAt",
            view_count AS "viewCount",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM
            course_announcements
          WHERE
            course_id = ${courseId}
            ${includeUnpublished ? sql`` : sql`AND is_published = true`}
          ORDER BY
            is_pinned DESC,
            published_at DESC NULLS LAST,
            created_at DESC
        `,
      });

      const findUnreadAnnouncements = SqlSchema.findAll({
        Result: CourseAnnouncement,
        Request: S.Struct({
          userId: UserId,
          courseId: S.optional(CourseId),
        }),
        execute: ({ userId, courseId }) => sql`
          SELECT
            a.id,
            a.course_id AS "courseId",
            a.author_id AS "authorId",
            a.title,
            a.content,
            a.priority,
            a.visibility,
            a.target_section_ids AS "targetSectionIds",
            a.is_published AS "isPublished",
            a.published_at AS "publishedAt",
            a.is_pinned AS "isPinned",
            a.pinned_at AS "pinnedAt",
            a.scheduled_for AS "scheduledFor",
            a.send_email AS "sendEmail",
            a.email_sent_at AS "emailSentAt",
            a.view_count AS "viewCount",
            a.created_at AS "createdAt",
            a.updated_at AS "updatedAt"
          FROM
            course_announcements a
          LEFT JOIN
            announcement_read_status ars 
            ON a.id = ars.announcement_id AND ars.user_id = ${userId}
          WHERE
            a.is_published = true
            AND ars.id IS NULL
            ${courseId ? sql`AND a.course_id = ${courseId}` : sql``}
          ORDER BY
            a.published_at DESC
        `,
      });

      // ─────────────────────────────────────────────────────────────────────
      // Announcement Mutations
      // ─────────────────────────────────────────────────────────────────────

      const createAnnouncement = SqlSchema.single({
        Result: CourseAnnouncement,
        Request: InsertAnnouncement,
        execute: (input) => sql`
          INSERT INTO course_announcements ${sql.insert(input)}
          RETURNING
            id,
            course_id AS "courseId",
            author_id AS "authorId",
            title,
            content,
            priority,
            visibility,
            target_section_ids AS "targetSectionIds",
            is_published AS "isPublished",
            published_at AS "publishedAt",
            is_pinned AS "isPinned",
            pinned_at AS "pinnedAt",
            scheduled_for AS "scheduledFor",
            send_email AS "sendEmail",
            email_sent_at AS "emailSentAt",
            view_count AS "viewCount",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
      });

      const updateAnnouncement = SqlSchema.single({
        Result: CourseAnnouncement,
        Request: S.Struct({
          id: AnnouncementId,
          title: S.optional(S.String),
          content: S.optional(S.String),
          priority: S.optional(AnnouncementPriority),
          visibility: S.optional(AnnouncementVisibility),
          target_section_ids: S.optional(S.String),
          scheduled_for: S.optional(S.NullOr(S.DateTimeUtc)),
          send_email: S.optional(S.Boolean),
          is_pinned: S.optional(S.Boolean),
        }),
        execute: (input) => sql`
          UPDATE course_announcements
          SET
            ${sql.update(input, ['id'])},
            updated_at = NOW()
          WHERE
            id = ${input.id}
          RETURNING
            id,
            course_id AS "courseId",
            author_id AS "authorId",
            title,
            content,
            priority,
            visibility,
            target_section_ids AS "targetSectionIds",
            is_published AS "isPublished",
            published_at AS "publishedAt",
            is_pinned AS "isPinned",
            pinned_at AS "pinnedAt",
            scheduled_for AS "scheduledFor",
            send_email AS "sendEmail",
            email_sent_at AS "emailSentAt",
            view_count AS "viewCount",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
      });

      const publishAnnouncement = SqlSchema.single({
        Result: CourseAnnouncement,
        Request: S.Struct({ id: AnnouncementId }),
        execute: ({ id }) => sql`
          UPDATE course_announcements
          SET
            is_published = true,
            published_at = NOW(),
            updated_at = NOW()
          WHERE
            id = ${id}
          RETURNING
            id,
            course_id AS "courseId",
            author_id AS "authorId",
            title,
            content,
            priority,
            visibility,
            target_section_ids AS "targetSectionIds",
            is_published AS "isPublished",
            published_at AS "publishedAt",
            is_pinned AS "isPinned",
            pinned_at AS "pinnedAt",
            scheduled_for AS "scheduledFor",
            send_email AS "sendEmail",
            email_sent_at AS "emailSentAt",
            view_count AS "viewCount",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
      });

      const deleteAnnouncement = SqlSchema.void({
        Request: AnnouncementId,
        execute: (id) => sql`
          DELETE FROM course_announcements
          WHERE id = ${id}
        `,
      });

      const markAnnouncementRead = SqlSchema.void({
        Request: S.Struct({ announcementId: AnnouncementId, userId: UserId }),
        execute: ({ announcementId, userId }) => sql`
          INSERT INTO announcement_read_status (announcement_id, user_id)
          VALUES (${announcementId}, ${userId})
          ON CONFLICT (announcement_id, user_id) DO NOTHING
        `,
      });

      // ─────────────────────────────────────────────────────────────────────
      // DM Thread Queries
      // ─────────────────────────────────────────────────────────────────────

      const findDmThreadById = SqlSchema.single({
        Result: CourseDmThread,
        Request: S.Struct({ id: CourseDmThreadId }),
        execute: ({ id }) => sql`
          SELECT
            id,
            course_id AS "courseId",
            chat_room_id AS "chatRoomId",
            participant_ids AS "participantIds",
            last_message_at AS "lastMessageAt",
            created_at AS "createdAt"
          FROM
            course_dm_threads
          WHERE
            id = ${id}
        `,
      });

      const findDmThreadByParticipants = SqlSchema.single({
        Result: CourseDmThread,
        Request: S.Struct({
          courseId: CourseId,
          participantIds: S.String, // JSON array string
        }),
        execute: ({ courseId, participantIds }) => sql`
          SELECT
            id,
            course_id AS "courseId",
            chat_room_id AS "chatRoomId",
            participant_ids AS "participantIds",
            last_message_at AS "lastMessageAt",
            created_at AS "createdAt"
          FROM
            course_dm_threads
          WHERE
            course_id = ${courseId}
            AND participant_ids = ${participantIds}::jsonb
        `,
      });

      const findDmThreadsByUser = SqlSchema.findAll({
        Result: CourseDmThread,
        Request: S.Struct({
          userId: UserId,
          courseId: S.optional(CourseId),
        }),
        execute: ({ userId, courseId }) => sql`
          SELECT
            id,
            course_id AS "courseId",
            chat_room_id AS "chatRoomId",
            participant_ids AS "participantIds",
            last_message_at AS "lastMessageAt",
            created_at AS "createdAt"
          FROM
            course_dm_threads
          WHERE
            participant_ids @> ${JSON.stringify([userId])}::jsonb
            ${courseId ? sql`AND course_id = ${courseId}` : sql``}
          ORDER BY
            last_message_at DESC NULLS LAST
        `,
      });

      // ─────────────────────────────────────────────────────────────────────
      // DM Thread Mutations
      // ─────────────────────────────────────────────────────────────────────

      const createDmThread = SqlSchema.single({
        Result: CourseDmThread,
        Request: InsertDmThread,
        execute: (input) => sql`
          INSERT INTO course_dm_threads ${sql.insert(input)}
          RETURNING
            id,
            course_id AS "courseId",
            chat_room_id AS "chatRoomId",
            participant_ids AS "participantIds",
            last_message_at AS "lastMessageAt",
            created_at AS "createdAt"
        `,
      });

      // ─────────────────────────────────────────────────────────────────────
      // Public API
      // ─────────────────────────────────────────────────────────────────────

      return {
        // Room operations
        findRoomById: (id: CourseRoomId) =>
          findRoomById({ id }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new CourseRoomNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        findRoomsByCourse: (courseId: CourseId) =>
          findRoomsByCourse({ courseId }).pipe(Effect.orDie),

        findRoomsByUser: (userId: UserId) => findRoomsByUser({ userId }).pipe(Effect.orDie),

        createRoom: (input: {
          courseId: CourseId;
          chatRoomId: ChatRoomId;
          roomType: typeof CourseRoomType.Type;
          sectionId?: SectionId | null;
          lessonId?: string | null;
          name: string;
          description?: string | null;
          iconEmoji?: string | null;
          accessLevel: typeof RoomAccessLevel.Type;
        }) =>
          createRoom({
            course_id: input.courseId,
            chat_room_id: input.chatRoomId,
            room_type: input.roomType,
            section_id: input.sectionId ?? null,
            lesson_id: input.lessonId ?? null,
            name: input.name,
            description: input.description ?? null,
            icon_emoji: input.iconEmoji ?? null,
            access_level: input.accessLevel,
          }).pipe(Effect.orDie),

        updateRoom: (
          id: CourseRoomId,
          input: {
            name?: string;
            description?: string | null;
            iconEmoji?: string | null;
            accessLevel?: typeof RoomAccessLevel.Type;
            isArchived?: boolean;
            isPinned?: boolean;
          },
        ) =>
          updateRoom({
            id,
            ...(input.name !== undefined && { name: input.name }),
            ...(input.description !== undefined && {
              description: input.description,
            }),
            ...(input.iconEmoji !== undefined && {
              icon_emoji: input.iconEmoji,
            }),
            ...(input.accessLevel !== undefined && {
              access_level: input.accessLevel,
            }),
            ...(input.isArchived !== undefined && {
              is_archived: input.isArchived,
            }),
            ...(input.isPinned !== undefined && { is_pinned: input.isPinned }),
          }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new CourseRoomNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        // Member operations
        findMembership: (roomId: CourseRoomId, userId: UserId) =>
          findMembership({ roomId, userId }).pipe(
            Effect.catchTag('NoSuchElementException', () => Effect.succeed(null)),
            Effect.catchTags({
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        addMember: (roomId: CourseRoomId, userId: UserId, role: typeof CourseRoomMemberRole.Type) =>
          addMember({
            course_room_id: roomId,
            user_id: userId,
            role,
          }).pipe(Effect.orDie),

        updateMemberReadState: (roomId: CourseRoomId, userId: UserId, messageId?: string) =>
          updateMemberReadState({ roomId, userId, messageId }).pipe(Effect.orDie),

        // Announcement operations
        findAnnouncementById: (id: AnnouncementId) =>
          findAnnouncementById({ id }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new AnnouncementNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        findAnnouncementsByCourse: (courseId: CourseId, includeUnpublished: boolean = false) =>
          findAnnouncementsByCourse({ courseId, includeUnpublished }).pipe(Effect.orDie),

        findUnreadAnnouncements: (userId: UserId, courseId?: CourseId) =>
          findUnreadAnnouncements({ userId, courseId }).pipe(Effect.orDie),

        createAnnouncement: (input: {
          courseId: CourseId;
          authorId: UserId;
          title: string;
          content: string;
          priority?: typeof AnnouncementPriority.Type;
          visibility?: typeof AnnouncementVisibility.Type;
          targetSectionIds?: SectionId[];
          scheduledFor?: DateTime.Utc | null;
          sendEmail?: boolean;
        }) =>
          createAnnouncement({
            course_id: input.courseId,
            author_id: input.authorId,
            title: input.title,
            content: input.content,
            priority: input.priority ?? 'normal',
            visibility: input.visibility ?? 'all_enrolled',
            target_section_ids: JSON.stringify(input.targetSectionIds ?? []),
            scheduled_for: input.scheduledFor ?? null,
            send_email: input.sendEmail ?? false,
          }).pipe(Effect.orDie),

        updateAnnouncement: (
          id: AnnouncementId,
          input: {
            title?: string;
            content?: string;
            priority?: typeof AnnouncementPriority.Type;
            visibility?: typeof AnnouncementVisibility.Type;
            targetSectionIds?: SectionId[];
            scheduledFor?: DateTime.Utc | null;
            sendEmail?: boolean;
            isPinned?: boolean;
          },
        ) =>
          updateAnnouncement({
            id,
            ...(input.title !== undefined && { title: input.title }),
            ...(input.content !== undefined && { content: input.content }),
            ...(input.priority !== undefined && { priority: input.priority }),
            ...(input.visibility !== undefined && {
              visibility: input.visibility,
            }),
            ...(input.targetSectionIds !== undefined && {
              target_section_ids: JSON.stringify(input.targetSectionIds),
            }),
            ...(input.scheduledFor !== undefined && {
              scheduled_for: input.scheduledFor,
            }),
            ...(input.sendEmail !== undefined && {
              send_email: input.sendEmail,
            }),
            ...(input.isPinned !== undefined && { is_pinned: input.isPinned }),
          }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new AnnouncementNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        publishAnnouncement: (id: AnnouncementId) =>
          publishAnnouncement({ id }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new AnnouncementNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        deleteAnnouncement: (id: AnnouncementId) => deleteAnnouncement(id).pipe(Effect.orDie),

        markAnnouncementRead: (announcementId: AnnouncementId, userId: UserId) =>
          markAnnouncementRead({ announcementId, userId }).pipe(Effect.orDie),

        // DM Thread operations
        findDmThreadById: (id: CourseDmThreadId) =>
          findDmThreadById({ id }).pipe(
            Effect.catchTags({
              NoSuchElementException: () => new DmThreadNotFoundError({ id }),
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        findDmThreadByParticipants: (courseId: CourseId, participantIds: UserId[]) =>
          findDmThreadByParticipants({
            courseId,
            participantIds: JSON.stringify(participantIds.sort()),
          }).pipe(
            Effect.catchTag('NoSuchElementException', () => Effect.succeed(null)),
            Effect.catchTags({
              ParseError: Effect.die,
              SqlError: Effect.die,
            }),
          ),

        findDmThreadsByUser: (userId: UserId, courseId?: CourseId) =>
          findDmThreadsByUser({ userId, courseId }).pipe(Effect.orDie),

        createDmThread: (input: {
          courseId: CourseId;
          chatRoomId: ChatRoomId;
          participantIds: UserId[];
        }) =>
          createDmThread({
            course_id: input.courseId,
            chat_room_id: input.chatRoomId,
            participant_ids: JSON.stringify(input.participantIds.sort()),
          }).pipe(Effect.orDie),
      } as const;
    }),
  },
) {}
