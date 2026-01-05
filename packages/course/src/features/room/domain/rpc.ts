import { UserId } from '@auth';
import * as Rpc from '@effect/rpc/Rpc';
import * as RpcGroup from '@effect/rpc/RpcGroup';
import * as S from 'effect/Schema';

import { CourseId } from '../../course/domain/schema.js';
import {
  AnnouncementId,
  AnnouncementNotFoundError,
  AnnouncementWithAuthor,
  CourseAnnouncement,
  CourseDmThread,
  CourseDmThreadId,
  CourseRoom,
  CourseRoomId,
  CourseRoomNotFoundError,
  CourseRoomWithUnread,
  CreateAnnouncementInput,
  CreateCourseRoomInput,
  CreateDmThreadInput,
  DmThreadNotFoundError,
  NotEnrolledError,
  NotInstructorError,
  UpdateAnnouncementInput,
  UpdateCourseRoomInput,
} from './schema.js';

// ===========================================
// Course Room RPC
// ===========================================

export class CourseRoomRpc extends RpcGroup.make(
  // ─────────────────────────────────────────────────────────────────────────────
  // Room Queries
  // ─────────────────────────────────────────────────────────────────────────────

  Rpc.make('getRoomById', {
    success: CourseRoom,
    error: S.Union(CourseRoomNotFoundError, NotEnrolledError),
    payload: { id: CourseRoomId },
  }),

  Rpc.make('listRoomsByCourse', {
    success: S.Array(CourseRoomWithUnread),
    error: NotEnrolledError,
    payload: { courseId: CourseId },
  }),

  Rpc.make('listMyRooms', {
    success: S.Array(CourseRoomWithUnread),
  }),

  // ─────────────────────────────────────────────────────────────────────────────
  // Room Mutations
  // ─────────────────────────────────────────────────────────────────────────────

  Rpc.make('createRoom', {
    success: CourseRoom,
    error: S.Union(NotInstructorError, NotEnrolledError),
    payload: { input: CreateCourseRoomInput },
  }),

  Rpc.make('updateRoom', {
    success: CourseRoom,
    error: S.Union(CourseRoomNotFoundError, NotInstructorError),
    payload: { id: CourseRoomId, input: UpdateCourseRoomInput },
  }),

  Rpc.make('archiveRoom', {
    success: S.Void,
    error: S.Union(CourseRoomNotFoundError, NotInstructorError),
    payload: { id: CourseRoomId },
  }),

  Rpc.make('markRoomRead', {
    success: S.Void,
    error: CourseRoomNotFoundError,
    payload: { id: CourseRoomId, messageId: S.optional(S.String) },
  }),

  // ─────────────────────────────────────────────────────────────────────────────
  // Announcement Queries
  // ─────────────────────────────────────────────────────────────────────────────

  Rpc.make('getAnnouncementById', {
    success: AnnouncementWithAuthor,
    error: S.Union(AnnouncementNotFoundError, NotEnrolledError),
    payload: { id: AnnouncementId },
  }),

  Rpc.make('listAnnouncementsByCourse', {
    success: S.Array(AnnouncementWithAuthor),
    error: NotEnrolledError,
    payload: {
      courseId: CourseId,
      includeUnpublished: S.optional(S.Boolean),
    },
  }),

  Rpc.make('listUnreadAnnouncements', {
    success: S.Array(AnnouncementWithAuthor),
    payload: { courseId: S.optional(CourseId) },
  }),

  // ─────────────────────────────────────────────────────────────────────────────
  // Announcement Mutations
  // ─────────────────────────────────────────────────────────────────────────────

  Rpc.make('createAnnouncement', {
    success: CourseAnnouncement,
    error: NotInstructorError,
    payload: { input: CreateAnnouncementInput },
  }),

  Rpc.make('updateAnnouncement', {
    success: CourseAnnouncement,
    error: S.Union(AnnouncementNotFoundError, NotInstructorError),
    payload: { id: AnnouncementId, input: UpdateAnnouncementInput },
  }),

  Rpc.make('publishAnnouncement', {
    success: CourseAnnouncement,
    error: S.Union(AnnouncementNotFoundError, NotInstructorError),
    payload: { id: AnnouncementId },
  }),

  Rpc.make('deleteAnnouncement', {
    success: S.Void,
    error: S.Union(AnnouncementNotFoundError, NotInstructorError),
    payload: { id: AnnouncementId },
  }),

  Rpc.make('markAnnouncementRead', {
    success: S.Void,
    error: AnnouncementNotFoundError,
    payload: { id: AnnouncementId },
  }),

  // ─────────────────────────────────────────────────────────────────────────────
  // DM Thread Queries
  // ─────────────────────────────────────────────────────────────────────────────

  Rpc.make('getDmThreadById', {
    success: CourseDmThread,
    error: DmThreadNotFoundError,
    payload: { id: CourseDmThreadId },
  }),

  Rpc.make('getDmThreadByParticipant', {
    success: S.NullOr(CourseDmThread),
    error: NotEnrolledError,
    payload: { courseId: CourseId, participantId: UserId },
  }),

  Rpc.make('listMyDmThreads', {
    success: S.Array(CourseDmThread),
    payload: { courseId: S.optional(CourseId) },
  }),

  // ─────────────────────────────────────────────────────────────────────────────
  // DM Thread Mutations
  // ─────────────────────────────────────────────────────────────────────────────

  Rpc.make('createDmThread', {
    success: CourseDmThread,
    error: NotEnrolledError,
    payload: { input: CreateDmThreadInput },
  }),
).prefix('courseRoom_') {}
