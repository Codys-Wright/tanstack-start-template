/**
 * @chat Client Atoms
 *
 * Effect-atom based state management for chat.
 * Follows the same pattern as @example/features/feature/client/atoms.ts
 */

import { serializable } from '@core/client/atom-utils';
import { Atom, Result } from '@effect-atom/atom-react';
import * as RpcClientError from '@effect/rpc/RpcClientError';
import * as Arr from 'effect/Array';
import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as S from 'effect/Schema';

import {
  type ChatMessage,
  type ChatUser,
  type MessageId,
  type MessageWithSender,
  type ReactionSummary,
  type RoomId,
  RoomWithLastMessage,
  type SendMessageInput,
  type UserId,
  type UserStatus,
} from '../domain/schema.js';
import { ChatClient } from './client.js';

// =============================================================================
// Schemas for serialization
// =============================================================================

const RoomsSchema = S.Array(RoomWithLastMessage);

// =============================================================================
// Local UI State (non-RPC)
// =============================================================================

/**
 * Currently selected room ID
 */
export const selectedRoomIdAtom = Atom.make<RoomId | null>(null);

/**
 * Draft message content per room
 */
export const draftAtom = Atom.family((roomId: RoomId) =>
  Atom.make<{
    content: string;
    replyToId: MessageId | null;
    replyToPreview: { author: string; content: string } | null;
  }>({
    content: '',
    replyToId: null,
    replyToPreview: null,
  }),
);

/**
 * Typing users per room (local tracking from events)
 */
export const typingAtom = Atom.family((roomId: RoomId) =>
  Atom.make<{
    users: readonly { userId: UserId; username: string; expiresAt: number }[];
  }>({ users: [] }),
);

/**
 * User presence map (local tracking from events)
 */
export const presenceAtom = Atom.make<Map<UserId, { status: UserStatus; lastSeenAt: number }>>(
  new Map(),
);

/**
 * Chat UI state
 */
export const chatUiAtom = Atom.make<{
  isMemberListVisible: boolean;
  isSearchOpen: boolean;
  searchQuery: string;
}>({
  isMemberListVisible: true,
  isSearchOpen: false,
  searchQuery: '',
});

// =============================================================================
// Rooms Atom (Query + Cache Updates)
// =============================================================================

type RoomsCacheUpdate = Data.TaggedEnum<{
  Upsert: { readonly room: RoomWithLastMessage };
  IncrementUnread: { readonly roomId: RoomId };
  ClearUnread: { readonly roomId: RoomId };
  UpdateLastMessage: {
    readonly roomId: RoomId;
    readonly message: ChatMessage;
    readonly sender: ChatUser;
  };
}>;

/**
 * Main rooms atom with SSR support and optimistic updates.
 */
export const roomsAtom = (() => {
  // Remote atom that fetches from the RPC
  const remoteAtom = ChatClient.runtime
    .atom(
      Effect.gen(function* () {
        const client = yield* ChatClient;
        return yield* client('chat_listRooms', undefined);
      }),
    )
    .pipe(
      serializable({
        key: '@chat/rooms',
        schema: Result.Schema({
          success: RoomsSchema,
          error: RpcClientError.RpcClientError,
        }),
      }),
    );

  // Writable atom with local cache updates
  return Object.assign(
    Atom.writable(
      (get) => get(remoteAtom),
      (ctx, update: RoomsCacheUpdate) => {
        const current = ctx.get(roomsAtom);
        if (!Result.isSuccess(current)) return;

        const nextValue = (() => {
          switch (update._tag) {
            case 'Upsert': {
              const existingIndex = Arr.findFirstIndex(
                current.value,
                (r) => r.room.id === update.room.room.id,
              );
              return Option.match(existingIndex, {
                onNone: () => Arr.prepend(current.value, update.room),
                onSome: (index) => Arr.replace(current.value, index, update.room),
              });
            }
            case 'IncrementUnread': {
              return Arr.map(current.value, (r) =>
                r.room.id === update.roomId ? { ...r, unreadCount: r.unreadCount + 1 } : r,
              );
            }
            case 'ClearUnread': {
              return Arr.map(current.value, (r) =>
                r.room.id === update.roomId ? { ...r, unreadCount: 0 } : r,
              );
            }
            case 'UpdateLastMessage': {
              return Arr.map(current.value, (r) =>
                r.room.id === update.roomId
                  ? {
                      ...r,
                      lastMessage: Option.some(update.message),
                      lastMessageSender: Option.some(update.sender),
                    }
                  : r,
              );
            }
          }
        })();

        ctx.setSelf(Result.success(nextValue));
      },
      (refresh) => {
        refresh(remoteAtom);
      },
    ),
    { remote: remoteAtom },
  );
})();

// =============================================================================
// Messages Atom Family (per room)
// =============================================================================

interface MessagesState {
  messages: readonly MessageWithSender[];
  hasMore: boolean;
  nextCursor: string | null;
  isLoading: boolean;
}

type MessagesCacheUpdate = Data.TaggedEnum<{
  SetMessages: {
    readonly messages: readonly MessageWithSender[];
    readonly hasMore: boolean;
    readonly nextCursor: string | null;
  };
  PrependMessage: { readonly message: MessageWithSender };
  AppendMessages: {
    readonly messages: readonly MessageWithSender[];
    readonly hasMore: boolean;
    readonly nextCursor: string | null;
  };
  UpdateMessage: {
    readonly messageId: MessageId;
    readonly message: ChatMessage;
  };
  DeleteMessage: { readonly messageId: MessageId };
  SetLoading: { readonly isLoading: boolean };
}>;

/**
 * Messages atom per room - fetches from RPC and supports cache updates
 */
export const messagesAtom = Atom.family((roomId: RoomId) => {
  const remoteAtom = ChatClient.runtime.atom(
    Effect.gen(function* () {
      const client = yield* ChatClient;
      const result = yield* client('chat_listMessages', {
        roomId,
        cursor: Option.none(),
        limit: 50,
      });
      return {
        messages: result.messages,
        hasMore: result.hasMore,
        nextCursor: Option.getOrNull(result.nextCursor),
        isLoading: false,
      } as MessagesState;
    }),
  );

  return Atom.writable(
    (get) => get(remoteAtom),
    (ctx, update: MessagesCacheUpdate) => {
      const current = ctx.get(messagesAtom(roomId));
      if (!Result.isSuccess(current)) return;

      const nextValue = ((): MessagesState => {
        switch (update._tag) {
          case 'SetMessages':
            return {
              messages: update.messages,
              hasMore: update.hasMore,
              nextCursor: update.nextCursor,
              isLoading: false,
            };
          case 'PrependMessage': {
            // Check if message already exists (optimistic update)
            const exists = current.value.messages.some(
              (m) => m.message.id === update.message.message.id,
            );
            if (exists) return current.value;
            return {
              ...current.value,
              messages: Arr.prepend(current.value.messages, update.message),
            };
          }
          case 'AppendMessages':
            return {
              messages: [...current.value.messages, ...update.messages],
              hasMore: update.hasMore,
              nextCursor: update.nextCursor,
              isLoading: false,
            };
          case 'UpdateMessage':
            return {
              ...current.value,
              messages: Arr.map(current.value.messages, (m) =>
                m.message.id === update.messageId ? { ...m, message: update.message } : m,
              ),
            };
          case 'DeleteMessage':
            return {
              ...current.value,
              messages: Arr.filter(
                current.value.messages,
                (m) => m.message.id !== update.messageId,
              ),
            };
          case 'SetLoading':
            return { ...current.value, isLoading: update.isLoading };
        }
      })();

      ctx.setSelf(Result.success(nextValue));
    },
    (refresh) => {
      refresh(remoteAtom);
    },
  );
});

// =============================================================================
// Mutation Atoms
// =============================================================================

/**
 * Select a room (updates local state and clears unread)
 */
export const selectRoomAtom = ChatClient.runtime.fn<RoomId | null>()(
  Effect.fnUntraced(function* (roomId, get) {
    get.set(selectedRoomIdAtom, roomId);

    if (roomId) {
      // Clear unread count
      get.set(roomsAtom, { _tag: 'ClearUnread', roomId });
    }
  }),
);

/**
 * Send a message with optimistic update
 */
export const sendMessageAtom = ChatClient.runtime.fn<{
  roomId: RoomId;
  content: string;
  replyToId?: MessageId;
}>()(
  Effect.fnUntraced(function* (input, get) {
    const client = yield* ChatClient;

    // Send the message
    const result = yield* client('chat_sendMessage', {
      input: {
        roomId: input.roomId,
        content: input.content,
        replyToId: Option.fromNullable(input.replyToId),
        attachmentIds: [],
      },
    });

    // Optimistic update - prepend message
    get.set(messagesAtom(input.roomId), {
      _tag: 'PrependMessage',
      message: result,
    });

    // Update room's last message
    get.set(roomsAtom, {
      _tag: 'UpdateLastMessage',
      roomId: input.roomId,
      message: result.message,
      sender: result.sender,
    });

    // Clear draft
    get.set(draftAtom(input.roomId), {
      content: '',
      replyToId: null,
      replyToPreview: null,
    });

    return result;
  }),
);

/**
 * Load more messages (pagination)
 */
export const loadMoreMessagesAtom = ChatClient.runtime.fn<{
  roomId: RoomId;
  cursor: string;
}>()(
  Effect.fnUntraced(function* (input, get) {
    const client = yield* ChatClient;

    // Set loading
    get.set(messagesAtom(input.roomId), {
      _tag: 'SetLoading',
      isLoading: true,
    });

    const result = yield* client('chat_listMessages', {
      roomId: input.roomId,
      cursor: Option.some(input.cursor),
      limit: 50,
    });

    // Append messages
    get.set(messagesAtom(input.roomId), {
      _tag: 'AppendMessages',
      messages: result.messages,
      hasMore: result.hasMore,
      nextCursor: Option.getOrNull(result.nextCursor),
    });

    return result;
  }),
);

/**
 * Add reaction to a message
 */
export const addReactionAtom = ChatClient.runtime.fn<{
  roomId: RoomId;
  messageId: MessageId;
  emoji: string;
}>()(
  Effect.fnUntraced(function* (input, _get) {
    const client = yield* ChatClient;
    yield* client('chat_addReaction', {
      messageId: input.messageId,
      emoji: input.emoji,
    });
    // Real-time event will update the UI
  }),
);

/**
 * Remove reaction from a message
 */
export const removeReactionAtom = ChatClient.runtime.fn<{
  roomId: RoomId;
  messageId: MessageId;
  emoji: string;
}>()(
  Effect.fnUntraced(function* (input, _get) {
    const client = yield* ChatClient;
    yield* client('chat_removeReaction', {
      messageId: input.messageId,
      emoji: input.emoji,
    });
    // Real-time event will update the UI
  }),
);

/**
 * Send typing indicator
 */
export const sendTypingAtom = ChatClient.runtime.fn<{
  roomId: RoomId;
  isTyping: boolean;
}>()(
  Effect.fnUntraced(function* (input, _get) {
    const client = yield* ChatClient;
    yield* client('chat_sendTyping', input);
  }),
);

/**
 * Update draft content
 */
export const updateDraftAtom = ChatClient.runtime.fn<{
  roomId: RoomId;
  content: string;
}>()(
  Effect.fnUntraced(function* (input, get) {
    const current = get.get(draftAtom(input.roomId));
    get.set(draftAtom(input.roomId), { ...current, content: input.content });
  }),
);

/**
 * Set reply target
 */
export const setReplyAtom = ChatClient.runtime.fn<{
  roomId: RoomId;
  replyTo: { messageId: MessageId; author: string; content: string } | null;
}>()(
  Effect.fnUntraced(function* (input, get) {
    const current = get.get(draftAtom(input.roomId));
    if (input.replyTo) {
      get.set(draftAtom(input.roomId), {
        ...current,
        replyToId: input.replyTo.messageId,
        replyToPreview: {
          author: input.replyTo.author,
          content: input.replyTo.content,
        },
      });
    } else {
      get.set(draftAtom(input.roomId), {
        ...current,
        replyToId: null,
        replyToPreview: null,
      });
    }
  }),
);

/**
 * Toggle member list visibility
 */
export const toggleMemberListAtom = ChatClient.runtime.fn()(
  Effect.fnUntraced(function* (_input, get) {
    const ui = get.get(chatUiAtom);
    get.set(chatUiAtom, {
      ...ui,
      isMemberListVisible: !ui.isMemberListVisible,
    });
  }),
);

// =============================================================================
// Derived Atoms
// =============================================================================

/**
 * Selected room details
 */
export const selectedRoomAtom = Atom.make((get) => {
  const roomId = get(selectedRoomIdAtom);
  if (!roomId) return null;

  const roomsResult = get(roomsAtom);
  if (!Result.isSuccess(roomsResult)) return null;

  const room = Arr.findFirst(roomsResult.value, (r) => r.room.id === roomId);
  return Option.getOrNull(room);
});

/**
 * Typing users for currently selected room
 */
export const selectedRoomTypingAtom = Atom.make((get) => {
  const roomId = get(selectedRoomIdAtom);
  if (!roomId) return { users: [] };

  const typing = get(typingAtom(roomId));
  // Filter expired typing indicators
  const now = Date.now();
  return {
    users: typing.users.filter((u) => u.expiresAt > now),
  };
});

/**
 * Draft for currently selected room
 */
export const selectedRoomDraftAtom = Atom.make((get) => {
  const roomId = get(selectedRoomIdAtom);
  if (!roomId) return { content: '', replyToId: null, replyToPreview: null };
  return get(draftAtom(roomId));
});
