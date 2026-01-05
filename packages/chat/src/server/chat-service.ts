/**
 * @chat/server - Chat Service
 *
 * In-memory chat service for demo purposes.
 * In production, this would be backed by a database.
 */

import * as Effect from 'effect/Effect';
import * as Context from 'effect/Context';
import * as Layer from 'effect/Layer';
import * as Ref from 'effect/Ref';
import * as HashMap from 'effect/HashMap';
import * as Option from 'effect/Option';
import * as Array from 'effect/Array';
import {
  type UserId,
  type RoomId,
  type MessageId,
  type ChatUser,
  type ChatMessage,
  type ChatRoom,
  type SendMessageInput,
  type CreateRoomInput,
  MessageSentEvent,
} from '../domain/schema.js';

// =============================================================================
// Chat State
// =============================================================================

interface ChatState {
  users: HashMap.HashMap<UserId, ChatUser>;
  rooms: HashMap.HashMap<RoomId, ChatRoom>;
  messages: HashMap.HashMap<RoomId, ChatMessage[]>;
  roomMembers: HashMap.HashMap<RoomId, Set<UserId>>;
}

const initialState: ChatState = {
  users: HashMap.empty(),
  rooms: HashMap.empty(),
  messages: HashMap.empty(),
  roomMembers: HashMap.empty(),
};

// =============================================================================
// Chat Service Interface & Tag
// =============================================================================

export class ChatService extends Context.Tag('ChatService')<
  ChatService,
  {
    // User operations
    readonly getUser: (userId: UserId) => Effect.Effect<Option.Option<ChatUser>>;
    readonly upsertUser: (user: ChatUser) => Effect.Effect<ChatUser>;
    readonly getUsers: (userIds: UserId[]) => Effect.Effect<ChatUser[]>;

    // Room operations
    readonly getRoom: (roomId: RoomId) => Effect.Effect<Option.Option<ChatRoom>>;
    readonly createRoom: (input: CreateRoomInput, creatorId: UserId) => Effect.Effect<ChatRoom>;
    readonly getUserRooms: (userId: UserId) => Effect.Effect<ChatRoom[]>;
    readonly joinRoom: (roomId: RoomId, userId: UserId) => Effect.Effect<void>;
    readonly leaveRoom: (roomId: RoomId, userId: UserId) => Effect.Effect<void>;

    // Message operations
    readonly sendMessage: (
      input: SendMessageInput,
      senderId: UserId,
    ) => Effect.Effect<MessageSentEvent>;
    readonly getMessages: (
      roomId: RoomId,
      limit?: number,
      before?: number,
    ) => Effect.Effect<ChatMessage[]>;
    readonly getMessage: (messageId: MessageId) => Effect.Effect<Option.Option<ChatMessage>>;
  }
>() {}

// =============================================================================
// In-Memory Implementation
// =============================================================================

export const ChatServiceLive = Layer.effect(
  ChatService,
  Effect.gen(function* () {
    const stateRef = yield* Ref.make<ChatState>(initialState);

    return {
      getUser: (userId: UserId) =>
        Ref.get(stateRef).pipe(Effect.map((state) => HashMap.get(state.users, userId))),

      upsertUser: (user: ChatUser) =>
        Ref.update(stateRef, (state) => ({
          ...state,
          users: HashMap.set(state.users, user.id, user),
        })).pipe(Effect.as(user)),

      getUsers: (userIds: UserId[]) =>
        Ref.get(stateRef).pipe(
          Effect.map((state) =>
            userIds
              .map((id) => HashMap.get(state.users, id))
              .filter(Option.isSome)
              .map((opt) => opt.value),
          ),
        ),

      getRoom: (roomId: RoomId) =>
        Ref.get(stateRef).pipe(Effect.map((state) => HashMap.get(state.rooms, roomId))),

      createRoom: (input: CreateRoomInput, creatorId: UserId) =>
        Effect.gen(function* () {
          const roomId = crypto.randomUUID() as RoomId;
          const now = Date.now();

          const room: ChatRoom = {
            id: roomId,
            name: input.name,
            type: input.type,
            description: input.description,
            avatarUrl: Option.none(),
            createdAt: now,
            updatedAt: now,
            memberIds: [creatorId, ...input.memberIds],
            lastMessageAt: Option.none(),
          };

          yield* Ref.update(stateRef, (state) => ({
            ...state,
            rooms: HashMap.set(state.rooms, roomId, room),
            messages: HashMap.set(state.messages, roomId, []),
            roomMembers: HashMap.set(
              state.roomMembers,
              roomId,
              new Set([creatorId, ...input.memberIds]),
            ),
          }));

          return room;
        }),

      getUserRooms: (userId: UserId) =>
        Ref.get(stateRef).pipe(
          Effect.map((state) =>
            Array.fromIterable(HashMap.values(state.rooms)).filter((room) =>
              room.memberIds.includes(userId),
            ),
          ),
        ),

      joinRoom: (roomId: RoomId, userId: UserId) =>
        Ref.update(stateRef, (state) => {
          const room = HashMap.get(state.rooms, roomId);
          if (Option.isNone(room)) return state;

          const updatedRoom = {
            ...room.value,
            memberIds: [...room.value.memberIds, userId],
          };

          const members = HashMap.get(state.roomMembers, roomId).pipe(
            Option.getOrElse(() => new Set<UserId>()),
          );
          members.add(userId);

          return {
            ...state,
            rooms: HashMap.set(state.rooms, roomId, updatedRoom),
            roomMembers: HashMap.set(state.roomMembers, roomId, members),
          };
        }),

      leaveRoom: (roomId: RoomId, userId: UserId) =>
        Ref.update(stateRef, (state) => {
          const room = HashMap.get(state.rooms, roomId);
          if (Option.isNone(room)) return state;

          const updatedRoom = {
            ...room.value,
            memberIds: room.value.memberIds.filter((id) => id !== userId),
          };

          const members = HashMap.get(state.roomMembers, roomId).pipe(
            Option.getOrElse(() => new Set<UserId>()),
          );
          members.delete(userId);

          return {
            ...state,
            rooms: HashMap.set(state.rooms, roomId, updatedRoom),
            roomMembers: HashMap.set(state.roomMembers, roomId, members),
          };
        }),

      sendMessage: (input: SendMessageInput, senderId: UserId) =>
        Effect.gen(function* () {
          const messageId = crypto.randomUUID() as MessageId;
          const now = Date.now();

          const message: ChatMessage = {
            id: messageId,
            roomId: input.roomId,
            senderId,
            content: input.content,
            timestamp: now,
            editedAt: Option.none(),
            replyToId: input.replyToId,
          };

          yield* Ref.update(stateRef, (state) => {
            const existingMessages = HashMap.get(state.messages, input.roomId).pipe(
              Option.getOrElse(() => [] as ChatMessage[]),
            );

            const room = HashMap.get(state.rooms, input.roomId);
            const updatedRooms = Option.isSome(room)
              ? HashMap.set(state.rooms, input.roomId, {
                  ...room.value,
                  lastMessageAt: Option.some(now),
                  updatedAt: now,
                })
              : state.rooms;

            return {
              ...state,
              messages: HashMap.set(state.messages, input.roomId, [...existingMessages, message]),
              rooms: updatedRooms,
            };
          });

          return new MessageSentEvent({ _tag: 'MessageSent', message });
        }),

      getMessages: (roomId: RoomId, limit = 50, before?: number) =>
        Ref.get(stateRef).pipe(
          Effect.map((state) => {
            const messages = HashMap.get(state.messages, roomId).pipe(
              Option.getOrElse(() => [] as ChatMessage[]),
            );

            let filtered = messages;
            if (before !== undefined) {
              filtered = messages.filter((m) => m.timestamp < before);
            }

            // Return most recent messages first
            return filtered.slice(-limit).reverse();
          }),
        ),

      getMessage: (messageId: MessageId) =>
        Ref.get(stateRef).pipe(
          Effect.map((state) => {
            for (const messages of HashMap.values(state.messages)) {
              const found = messages.find((m) => m.id === messageId);
              if (found) return Option.some(found);
            }
            return Option.none();
          }),
        ),
    };
  }),
);
