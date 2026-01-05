import { UserId } from '@auth';
import type * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';

import { CourseId } from '../../course/domain/schema.js';
import { SectionId } from '../../section/domain/schema.js';
import { LessonId } from '../../lesson/domain/schema.js';
import { CourseRoomRepository } from '../database/repo.js';
import type {
  AnnouncementId,
  AnnouncementPriority,
  AnnouncementVisibility,
  ChatRoomId,
  CourseDmThreadId,
  CourseRoomId,
  CourseRoomMemberRole,
  CourseRoomType,
  CourseRoomWithUnread,
  RoomAccessLevel,
} from '../domain/index.js';

// ===========================================
// Course Room Service
// ===========================================

export class CourseRoomService extends Effect.Service<CourseRoomService>()(
  '@course/CourseRoomService',
  {
    dependencies: [CourseRoomRepository.Default],
    effect: Effect.gen(function* () {
      const repo = yield* CourseRoomRepository;

      // ─────────────────────────────────────────────────────────────────────
      // Room Operations
      // ─────────────────────────────────────────────────────────────────────

      const getRoomById = (id: CourseRoomId) => repo.findRoomById(id);

      const listRoomsByCourse = (courseId: CourseId, userId: UserId) =>
        Effect.gen(function* () {
          const rooms = yield* repo.findRoomsByCourse(courseId);

          // Get unread counts for each room
          const roomsWithUnread: CourseRoomWithUnread[] = yield* Effect.all(
            rooms.map((room) =>
              Effect.gen(function* () {
                const membership = yield* repo.findMembership(room.id, userId);
                // TODO: Calculate actual unread count based on last_read_at vs messages
                const unreadCount = 0; // Placeholder - would need message timestamps
                return {
                  room,
                  unreadCount,
                  lastReadAt: membership?.lastReadAt,
                } as CourseRoomWithUnread;
              }),
            ),
          );

          return roomsWithUnread;
        });

      const listMyRooms = (userId: UserId) =>
        Effect.gen(function* () {
          const rooms = yield* repo.findRoomsByUser(userId);

          const roomsWithUnread: CourseRoomWithUnread[] = yield* Effect.all(
            rooms.map((room) =>
              Effect.gen(function* () {
                const membership = yield* repo.findMembership(room.id, userId);
                const unreadCount = 0; // Placeholder
                return {
                  room,
                  unreadCount,
                  lastReadAt: membership?.lastReadAt,
                } as CourseRoomWithUnread;
              }),
            ),
          );

          return roomsWithUnread;
        });

      const createRoom = (input: {
        courseId: CourseId;
        chatRoomId: ChatRoomId;
        roomType: typeof CourseRoomType.Type;
        name: string;
        description?: string | null;
        iconEmoji?: string | null;
        accessLevel?: typeof RoomAccessLevel.Type;
        sectionId?: SectionId | null;
        lessonId?: LessonId | null;
        creatorId: UserId;
        creatorRole: typeof CourseRoomMemberRole.Type;
      }) =>
        Effect.gen(function* () {
          const room = yield* repo.createRoom({
            courseId: input.courseId,
            chatRoomId: input.chatRoomId,
            roomType: input.roomType,
            name: input.name,
            description: input.description,
            iconEmoji: input.iconEmoji,
            accessLevel: input.accessLevel ?? 'all_enrolled',
            sectionId: input.sectionId,
            lessonId: input.lessonId,
          });

          // Add creator as member
          yield* repo.addMember(room.id, input.creatorId, input.creatorRole);

          return room;
        });

      const updateRoom = (
        id: CourseRoomId,
        input: {
          name?: string;
          description?: string | null;
          iconEmoji?: string | null;
          accessLevel?: typeof RoomAccessLevel.Type;
          isArchived?: boolean;
          isPinned?: boolean;
        },
      ) => repo.updateRoom(id, input);

      const archiveRoom = (id: CourseRoomId) => repo.updateRoom(id, { isArchived: true });

      const markRoomRead = (id: CourseRoomId, userId: UserId, messageId?: string) =>
        repo.updateMemberReadState(id, userId, messageId);

      // ─────────────────────────────────────────────────────────────────────
      // Announcement Operations
      // ─────────────────────────────────────────────────────────────────────

      const getAnnouncementById = (id: AnnouncementId) => repo.findAnnouncementById(id);

      const listAnnouncementsByCourse = (courseId: CourseId, includeUnpublished: boolean = false) =>
        repo.findAnnouncementsByCourse(courseId, includeUnpublished);

      const listUnreadAnnouncements = (userId: UserId, courseId?: CourseId) =>
        repo.findUnreadAnnouncements(userId, courseId);

      const createAnnouncement = (input: {
        courseId: CourseId;
        authorId: UserId;
        title: string;
        content: string;
        priority?: typeof AnnouncementPriority.Type;
        visibility?: typeof AnnouncementVisibility.Type;
        targetSectionIds?: SectionId[];
        scheduledFor?: DateTime.Utc | null;
        sendEmail?: boolean;
      }) => repo.createAnnouncement(input);

      const updateAnnouncement = (
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
      ) => repo.updateAnnouncement(id, input);

      const publishAnnouncement = (id: AnnouncementId) => repo.publishAnnouncement(id);

      const deleteAnnouncement = (id: AnnouncementId) => repo.deleteAnnouncement(id);

      const markAnnouncementRead = (id: AnnouncementId, userId: UserId) =>
        repo.markAnnouncementRead(id, userId);

      // ─────────────────────────────────────────────────────────────────────
      // DM Thread Operations
      // ─────────────────────────────────────────────────────────────────────

      const getDmThreadById = (id: CourseDmThreadId) => repo.findDmThreadById(id);

      const getDmThreadByParticipant = (
        courseId: CourseId,
        userId: UserId,
        participantId: UserId,
      ) => {
        const participantIds = [userId, participantId];
        return repo.findDmThreadByParticipants(courseId, participantIds);
      };

      const listMyDmThreads = (userId: UserId, courseId?: CourseId) =>
        repo.findDmThreadsByUser(userId, courseId);

      const createDmThread = (input: {
        courseId: CourseId;
        chatRoomId: ChatRoomId;
        userId: UserId;
        participantId: UserId;
      }) =>
        Effect.gen(function* () {
          // Check if thread already exists
          const existing = yield* repo.findDmThreadByParticipants(input.courseId, [
            input.userId,
            input.participantId,
          ]);

          if (existing) {
            return existing;
          }

          // Create new thread
          return yield* repo.createDmThread({
            courseId: input.courseId,
            chatRoomId: input.chatRoomId,
            participantIds: [input.userId, input.participantId],
          });
        });

      // ─────────────────────────────────────────────────────────────────────
      // Return public API
      // ─────────────────────────────────────────────────────────────────────

      return {
        // Room operations
        getRoomById,
        listRoomsByCourse,
        listMyRooms,
        createRoom,
        updateRoom,
        archiveRoom,
        markRoomRead,

        // Announcement operations
        getAnnouncementById,
        listAnnouncementsByCourse,
        listUnreadAnnouncements,
        createAnnouncement,
        updateAnnouncement,
        publishAnnouncement,
        deleteAnnouncement,
        markAnnouncementRead,

        // DM Thread operations
        getDmThreadById,
        getDmThreadByParticipant,
        listMyDmThreads,
        createDmThread,
      } as const;
    }),
  },
) {}
