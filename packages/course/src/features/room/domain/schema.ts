/**
 * Course Room Domain Schema
 *
 * Types for course-based communication:
 * - CourseRoom: Links courses to chat rooms
 * - CourseAnnouncement: Instructor announcements
 * - CourseDmThread: Direct messages between course participants
 */

import { UserId } from '@auth';
import * as HttpApiSchema from '@effect/platform/HttpApiSchema';
import * as S from 'effect/Schema';

import { CourseId } from '../../course/domain/schema.js';
import { SectionId } from '../../section/domain/schema.js';
import { LessonId } from '../../lesson/domain/schema.js';

// ===========================================
// Branded IDs
// ===========================================

export const CourseRoomId = S.UUID.pipe(S.brand('CourseRoomId'));
export type CourseRoomId = typeof CourseRoomId.Type;

export const AnnouncementId = S.UUID.pipe(S.brand('AnnouncementId'));
export type AnnouncementId = typeof AnnouncementId.Type;

export const CourseDmThreadId = S.UUID.pipe(S.brand('CourseDmThreadId'));
export type CourseDmThreadId = typeof CourseDmThreadId.Type;

// External chat room ID (from @chat package)
export const ChatRoomId = S.String.pipe(S.brand('ChatRoomId'));
export type ChatRoomId = typeof ChatRoomId.Type;

// ===========================================
// Enums / Literals
// ===========================================

export const CourseRoomType = S.Literal('main', 'section', 'lesson', 'direct', 'study_group');
export type CourseRoomType = typeof CourseRoomType.Type;

export const RoomAccessLevel = S.Literal('all_enrolled', 'instructors_only', 'invite_only');
export type RoomAccessLevel = typeof RoomAccessLevel.Type;

export const CourseRoomMemberRole = S.Literal('instructor', 'ta', 'student', 'guest');
export type CourseRoomMemberRole = typeof CourseRoomMemberRole.Type;

export const AnnouncementPriority = S.Literal('low', 'normal', 'high', 'urgent');
export type AnnouncementPriority = typeof AnnouncementPriority.Type;

export const AnnouncementVisibility = S.Literal('all_enrolled', 'section', 'draft');
export type AnnouncementVisibility = typeof AnnouncementVisibility.Type;

// ===========================================
// Course Room Entity
// ===========================================

/**
 * CourseRoom - Links a course to a chat room
 *
 * Each course can have multiple rooms:
 * - Main discussion channel
 * - Section-specific channels
 * - Lesson Q&A channels
 * - Study groups
 * - DMs between participants
 */
export class CourseRoom extends S.Class<CourseRoom>('CourseRoom')({
  id: CourseRoomId,
  courseId: CourseId,
  chatRoomId: ChatRoomId,
  roomType: CourseRoomType,

  // Optional context references
  sectionId: S.optional(S.NullOr(SectionId)),
  lessonId: S.optional(S.NullOr(LessonId)),

  // Room metadata
  name: S.String,
  description: S.optional(S.NullOr(S.String)),
  iconEmoji: S.optional(S.NullOr(S.String)),

  // Access control
  accessLevel: RoomAccessLevel,

  // Settings
  isArchived: S.Boolean,
  isPinned: S.Boolean,
  sortOrder: S.Number,

  // Stats
  memberCount: S.Number,
  messageCount: S.Number,
  lastMessageAt: S.optional(S.NullOr(S.DateTimeUtc)),

  // Timestamps
  createdAt: S.DateTimeUtc,
  updatedAt: S.DateTimeUtc,
}) {}

// ===========================================
// Course Room Member Entity
// ===========================================

export class CourseRoomMember extends S.Class<CourseRoomMember>('CourseRoomMember')({
  id: S.UUID,
  courseRoomId: CourseRoomId,
  userId: UserId,
  role: CourseRoomMemberRole,

  // Notification preferences
  notificationsEnabled: S.Boolean,
  mutedUntil: S.optional(S.NullOr(S.DateTimeUtc)),

  // Read state
  lastReadAt: S.optional(S.NullOr(S.DateTimeUtc)),
  lastReadMessageId: S.optional(S.NullOr(S.String)),

  // Timestamps
  joinedAt: S.DateTimeUtc,
}) {}

// ===========================================
// Course Announcement Entity
// ===========================================

/**
 * CourseAnnouncement - Instructor announcements
 *
 * Supports:
 * - Priority levels (low, normal, high, urgent)
 * - Draft and publishing workflow
 * - Scheduled publishing
 * - Section-specific targeting
 * - Email notifications
 */
export class CourseAnnouncement extends S.Class<CourseAnnouncement>('CourseAnnouncement')({
  id: AnnouncementId,
  courseId: CourseId,
  authorId: UserId,

  // Content
  title: S.String,
  content: S.String,

  // Priority and visibility
  priority: AnnouncementPriority,
  visibility: AnnouncementVisibility,

  // Section targeting
  targetSectionIds: S.Array(SectionId),

  // Publishing state
  isPublished: S.Boolean,
  publishedAt: S.optional(S.NullOr(S.DateTimeUtc)),

  // Pinning
  isPinned: S.Boolean,
  pinnedAt: S.optional(S.NullOr(S.DateTimeUtc)),

  // Scheduling
  scheduledFor: S.optional(S.NullOr(S.DateTimeUtc)),

  // Email notification
  sendEmail: S.Boolean,
  emailSentAt: S.optional(S.NullOr(S.DateTimeUtc)),

  // Stats
  viewCount: S.Number,

  // Timestamps
  createdAt: S.DateTimeUtc,
  updatedAt: S.DateTimeUtc,
}) {}

// ===========================================
// Announcement Read Status
// ===========================================

export class AnnouncementReadStatus extends S.Class<AnnouncementReadStatus>(
  'AnnouncementReadStatus',
)({
  id: S.UUID,
  announcementId: AnnouncementId,
  userId: UserId,
  readAt: S.DateTimeUtc,
}) {}

// ===========================================
// Course DM Thread
// ===========================================

export class CourseDmThread extends S.Class<CourseDmThread>('CourseDmThread')({
  id: CourseDmThreadId,
  courseId: CourseId,
  chatRoomId: ChatRoomId,
  participantIds: S.Array(UserId),
  lastMessageAt: S.optional(S.NullOr(S.DateTimeUtc)),
  createdAt: S.DateTimeUtc,
}) {}

// ===========================================
// Input Schemas
// ===========================================

export class CreateCourseRoomInput extends S.Class<CreateCourseRoomInput>('CreateCourseRoomInput')({
  courseId: CourseId,
  roomType: CourseRoomType,
  name: S.String,
  description: S.optional(S.NullOr(S.String)),
  iconEmoji: S.optional(S.NullOr(S.String)),
  accessLevel: S.optional(RoomAccessLevel),
  sectionId: S.optional(S.NullOr(SectionId)),
  lessonId: S.optional(S.NullOr(LessonId)),
}) {}

export class UpdateCourseRoomInput extends S.Class<UpdateCourseRoomInput>('UpdateCourseRoomInput')({
  name: S.optional(S.String),
  description: S.optional(S.NullOr(S.String)),
  iconEmoji: S.optional(S.NullOr(S.String)),
  accessLevel: S.optional(RoomAccessLevel),
  isArchived: S.optional(S.Boolean),
  isPinned: S.optional(S.Boolean),
}) {}

export class CreateAnnouncementInput extends S.Class<CreateAnnouncementInput>(
  'CreateAnnouncementInput',
)({
  courseId: CourseId,
  title: S.String,
  content: S.String,
  priority: S.optional(AnnouncementPriority),
  visibility: S.optional(AnnouncementVisibility),
  targetSectionIds: S.optional(S.Array(SectionId)),
  scheduledFor: S.optional(S.NullOr(S.DateTimeUtc)),
  sendEmail: S.optional(S.Boolean),
}) {}

export class UpdateAnnouncementInput extends S.Class<UpdateAnnouncementInput>(
  'UpdateAnnouncementInput',
)({
  title: S.optional(S.String),
  content: S.optional(S.String),
  priority: S.optional(AnnouncementPriority),
  visibility: S.optional(AnnouncementVisibility),
  targetSectionIds: S.optional(S.Array(SectionId)),
  scheduledFor: S.optional(S.NullOr(S.DateTimeUtc)),
  sendEmail: S.optional(S.Boolean),
  isPinned: S.optional(S.Boolean),
}) {}

export class CreateDmThreadInput extends S.Class<CreateDmThreadInput>('CreateDmThreadInput')({
  courseId: CourseId,
  participantId: UserId, // The other participant (current user is implicit)
}) {}

// ===========================================
// Response Types
// ===========================================

export class CourseRoomWithUnread extends S.Class<CourseRoomWithUnread>('CourseRoomWithUnread')({
  room: CourseRoom,
  unreadCount: S.Number,
  lastReadAt: S.optional(S.NullOr(S.DateTimeUtc)),
}) {}

export class AnnouncementWithAuthor extends S.Class<AnnouncementWithAuthor>(
  'AnnouncementWithAuthor',
)({
  announcement: CourseAnnouncement,
  authorName: S.String,
  authorAvatarUrl: S.optional(S.NullOr(S.String)),
  isRead: S.Boolean,
}) {}

// ===========================================
// Errors
// ===========================================

export class CourseRoomNotFoundError extends S.TaggedError<CourseRoomNotFoundError>(
  'CourseRoomNotFoundError',
)('CourseRoomNotFoundError', { id: CourseRoomId }, HttpApiSchema.annotations({ status: 404 })) {
  override get message() {
    return `Course room with id ${this.id} not found`;
  }
}

export class AnnouncementNotFoundError extends S.TaggedError<AnnouncementNotFoundError>(
  'AnnouncementNotFoundError',
)('AnnouncementNotFoundError', { id: AnnouncementId }, HttpApiSchema.annotations({ status: 404 })) {
  override get message() {
    return `Announcement with id ${this.id} not found`;
  }
}

export class DmThreadNotFoundError extends S.TaggedError<DmThreadNotFoundError>(
  'DmThreadNotFoundError',
)('DmThreadNotFoundError', { id: CourseDmThreadId }, HttpApiSchema.annotations({ status: 404 })) {
  override get message() {
    return `DM thread with id ${this.id} not found`;
  }
}

export class NotEnrolledError extends S.TaggedError<NotEnrolledError>('NotEnrolledError')(
  'NotEnrolledError',
  { courseId: CourseId },
  HttpApiSchema.annotations({ status: 403 }),
) {
  override get message() {
    return `You must be enrolled in course ${this.courseId} to access this room`;
  }
}

export class NotInstructorError extends S.TaggedError<NotInstructorError>('NotInstructorError')(
  'NotInstructorError',
  { courseId: CourseId },
  HttpApiSchema.annotations({ status: 403 }),
) {
  override get message() {
    return `Only instructors can perform this action for course ${this.courseId}`;
  }
}
