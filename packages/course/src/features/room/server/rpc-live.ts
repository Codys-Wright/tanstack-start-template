import { AuthContext } from '@auth/server';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { CourseRoomRpc } from '../domain/index.js';
import { CourseRoomService } from './service.js';

// ===========================================
// Course Room RPC Live Implementation
// ===========================================

export const CourseRoomRpcLive = CourseRoomRpc.toLayer(
  Effect.gen(function* () {
    const service = yield* CourseRoomService;

    return CourseRoomRpc.of({
      // ─────────────────────────────────────────────────────────────────────
      // Room Queries
      // ─────────────────────────────────────────────────────────────────────

      courseRoom_getRoomById: Effect.fn('CourseRoomRpc.getRoomById')(function* ({ id }) {
        yield* Effect.log(`[RPC] Getting course room by id: ${id}`);
        return yield* service.getRoomById(id);
      }),

      courseRoom_listRoomsByCourse: Effect.fn('CourseRoomRpc.listRoomsByCourse')(function* ({
        courseId,
      }) {
        const auth = yield* AuthContext;
        yield* Effect.log(`[RPC] Listing rooms for course: ${courseId}`);
        return yield* service.listRoomsByCourse(courseId, auth.userId);
      }),

      courseRoom_listMyRooms: Effect.fn('CourseRoomRpc.listMyRooms')(function* () {
        const auth = yield* AuthContext;
        yield* Effect.log(`[RPC] Listing my rooms for user: ${auth.userId}`);
        return yield* service.listMyRooms(auth.userId);
      }),

      // ─────────────────────────────────────────────────────────────────────
      // Room Mutations
      // ─────────────────────────────────────────────────────────────────────

      courseRoom_createRoom: Effect.fn('CourseRoomRpc.createRoom')(function* ({ input }) {
        const auth = yield* AuthContext;
        yield* Effect.log(`[RPC] Creating room for course: ${input.courseId}`);

        // TODO: Generate chat room ID from @chat package
        const chatRoomId =
          crypto.randomUUID() as typeof import('../domain/schema.js').ChatRoomId.Type;

        return yield* service.createRoom({
          courseId: input.courseId,
          chatRoomId,
          roomType: input.roomType,
          name: input.name,
          description: input.description,
          iconEmoji: input.iconEmoji,
          accessLevel: input.accessLevel,
          sectionId: input.sectionId,
          lessonId: input.lessonId,
          creatorId: auth.userId,
          creatorRole: 'instructor', // TODO: Determine role based on course ownership
        });
      }),

      courseRoom_updateRoom: Effect.fn('CourseRoomRpc.updateRoom')(function* ({ id, input }) {
        yield* Effect.log(`[RPC] Updating room: ${id}`);
        return yield* service.updateRoom(id, {
          name: input.name,
          description: input.description,
          iconEmoji: input.iconEmoji,
          accessLevel: input.accessLevel,
          isArchived: input.isArchived,
          isPinned: input.isPinned,
        });
      }),

      courseRoom_archiveRoom: Effect.fn('CourseRoomRpc.archiveRoom')(function* ({ id }) {
        yield* Effect.log(`[RPC] Archiving room: ${id}`);
        yield* service.archiveRoom(id);
      }),

      courseRoom_markRoomRead: Effect.fn('CourseRoomRpc.markRoomRead')(function* ({
        id,
        messageId,
      }) {
        const auth = yield* AuthContext;
        yield* Effect.log(`[RPC] Marking room read: ${id}`);
        yield* service.markRoomRead(id, auth.userId, messageId);
      }),

      // ─────────────────────────────────────────────────────────────────────
      // Announcement Queries
      // ─────────────────────────────────────────────────────────────────────

      courseRoom_getAnnouncementById: Effect.fn('CourseRoomRpc.getAnnouncementById')(function* ({
        id,
      }) {
        yield* AuthContext; // Ensure authenticated
        yield* Effect.log(`[RPC] Getting announcement: ${id}`);
        const announcement = yield* service.getAnnouncementById(id);
        // TODO: Fetch author details from user service
        return {
          announcement,
          authorName: 'Instructor', // Placeholder
          authorAvatarUrl: null,
          isRead: false, // TODO: Check read status
        };
      }),

      courseRoom_listAnnouncementsByCourse: Effect.fn('CourseRoomRpc.listAnnouncementsByCourse')(
        function* ({ courseId, includeUnpublished }) {
          yield* AuthContext; // Ensure authenticated
          yield* Effect.log(`[RPC] Listing announcements for course: ${courseId}`);
          const announcements = yield* service.listAnnouncementsByCourse(
            courseId,
            includeUnpublished ?? false,
          );
          // TODO: Fetch author details and read status
          return announcements.map((announcement) => ({
            announcement,
            authorName: 'Instructor',
            authorAvatarUrl: null,
            isRead: false,
          }));
        },
      ),

      courseRoom_listUnreadAnnouncements: Effect.fn('CourseRoomRpc.listUnreadAnnouncements')(
        function* ({ courseId }) {
          const auth = yield* AuthContext;
          yield* Effect.log(`[RPC] Listing unread announcements for user: ${auth.userId}`);
          const announcements = yield* service.listUnreadAnnouncements(auth.userId, courseId);
          return announcements.map((announcement) => ({
            announcement,
            authorName: 'Instructor',
            authorAvatarUrl: null,
            isRead: false,
          }));
        },
      ),

      // ─────────────────────────────────────────────────────────────────────
      // Announcement Mutations
      // ─────────────────────────────────────────────────────────────────────

      courseRoom_createAnnouncement: Effect.fn('CourseRoomRpc.createAnnouncement')(function* ({
        input,
      }) {
        const auth = yield* AuthContext;
        yield* Effect.log(`[RPC] Creating announcement for course: ${input.courseId}`);
        return yield* service.createAnnouncement({
          courseId: input.courseId,
          authorId: auth.userId,
          title: input.title,
          content: input.content,
          priority: input.priority,
          visibility: input.visibility,
          targetSectionIds: input.targetSectionIds ? [...input.targetSectionIds] : undefined,
          scheduledFor: input.scheduledFor,
          sendEmail: input.sendEmail,
        });
      }),

      courseRoom_updateAnnouncement: Effect.fn('CourseRoomRpc.updateAnnouncement')(function* ({
        id,
        input,
      }) {
        yield* Effect.log(`[RPC] Updating announcement: ${id}`);
        return yield* service.updateAnnouncement(id, {
          title: input.title,
          content: input.content,
          priority: input.priority,
          visibility: input.visibility,
          targetSectionIds: input.targetSectionIds ? [...input.targetSectionIds] : undefined,
          scheduledFor: input.scheduledFor,
          sendEmail: input.sendEmail,
          isPinned: input.isPinned,
        });
      }),

      courseRoom_publishAnnouncement: Effect.fn('CourseRoomRpc.publishAnnouncement')(function* ({
        id,
      }) {
        yield* Effect.log(`[RPC] Publishing announcement: ${id}`);
        return yield* service.publishAnnouncement(id);
      }),

      courseRoom_deleteAnnouncement: Effect.fn('CourseRoomRpc.deleteAnnouncement')(function* ({
        id,
      }) {
        yield* Effect.log(`[RPC] Deleting announcement: ${id}`);
        yield* service.deleteAnnouncement(id);
      }),

      courseRoom_markAnnouncementRead: Effect.fn('CourseRoomRpc.markAnnouncementRead')(function* ({
        id,
      }) {
        const auth = yield* AuthContext;
        yield* Effect.log(`[RPC] Marking announcement read: ${id}`);
        yield* service.markAnnouncementRead(id, auth.userId);
      }),

      // ─────────────────────────────────────────────────────────────────────
      // DM Thread Queries
      // ─────────────────────────────────────────────────────────────────────

      courseRoom_getDmThreadById: Effect.fn('CourseRoomRpc.getDmThreadById')(function* ({ id }) {
        yield* Effect.log(`[RPC] Getting DM thread: ${id}`);
        return yield* service.getDmThreadById(id);
      }),

      courseRoom_getDmThreadByParticipant: Effect.fn('CourseRoomRpc.getDmThreadByParticipant')(
        function* ({ courseId, participantId }) {
          const auth = yield* AuthContext;
          yield* Effect.log(`[RPC] Getting DM thread with participant: ${participantId}`);
          return yield* service.getDmThreadByParticipant(courseId, auth.userId, participantId);
        },
      ),

      courseRoom_listMyDmThreads: Effect.fn('CourseRoomRpc.listMyDmThreads')(function* ({
        courseId,
      }) {
        const auth = yield* AuthContext;
        yield* Effect.log(`[RPC] Listing my DM threads`);
        return yield* service.listMyDmThreads(auth.userId, courseId);
      }),

      // ─────────────────────────────────────────────────────────────────────
      // DM Thread Mutations
      // ─────────────────────────────────────────────────────────────────────

      courseRoom_createDmThread: Effect.fn('CourseRoomRpc.createDmThread')(function* ({ input }) {
        const auth = yield* AuthContext;
        yield* Effect.log(`[RPC] Creating DM thread with: ${input.participantId}`);

        // TODO: Generate chat room ID from @chat package
        const chatRoomId =
          crypto.randomUUID() as typeof import('../domain/schema.js').ChatRoomId.Type;

        return yield* service.createDmThread({
          courseId: input.courseId,
          chatRoomId,
          userId: auth.userId,
          participantId: input.participantId,
        });
      }),
    });
  }),
).pipe(Layer.provide(CourseRoomService.Default));
