/**
 * @chat Domain RPC
 *
 * RPC definitions for the chat system using @effect/rpc.
 */

import * as Rpc from '@effect/rpc/Rpc';
import * as RpcGroup from '@effect/rpc/RpcGroup';
import * as S from 'effect/Schema';
import {
  ChatEvent,
  ChatMessage,
  ChatRoom,
  ChatUser,
  CreateRoomInput,
  EditMessageInput,
  MessageId,
  MessagePage,
  MessageWithSender,
  RoomDetails,
  RoomId,
  RoomWithLastMessage,
  SendMessageInput,
  UserId,
  UserStatus,
} from './schema.js';

// =============================================================================
// Error Types
// =============================================================================

export class RoomNotFound extends S.TaggedError<RoomNotFound>()('RoomNotFound', {
  roomId: RoomId,
}) {}

export class MessageNotFound extends S.TaggedError<MessageNotFound>()('MessageNotFound', {
  messageId: MessageId,
}) {}

export class Unauthorized extends S.TaggedError<Unauthorized>()('Unauthorized', {
  message: S.String,
}) {}

// =============================================================================
// RPC Group
// =============================================================================

export class ChatRpc extends RpcGroup.make(
  // Room Operations
  Rpc.make('listRooms', {
    success: S.Array(RoomWithLastMessage),
  }),

  Rpc.make('getRoom', {
    success: RoomDetails,
    error: RoomNotFound,
    payload: { roomId: RoomId },
  }),

  Rpc.make('createRoom', {
    success: ChatRoom,
    payload: { input: CreateRoomInput },
  }),

  Rpc.make('joinRoom', {
    success: S.Void,
    error: RoomNotFound,
    payload: { roomId: RoomId },
  }),

  Rpc.make('leaveRoom', {
    success: S.Void,
    error: RoomNotFound,
    payload: { roomId: RoomId },
  }),

  // Message Operations
  Rpc.make('listMessages', {
    success: MessagePage,
    error: RoomNotFound,
    payload: {
      roomId: RoomId,
      cursor: S.OptionFromNullOr(S.String),
      limit: S.optional(S.Number),
    },
  }),

  Rpc.make('sendMessage', {
    success: MessageWithSender,
    error: S.Union(RoomNotFound, Unauthorized),
    payload: { input: SendMessageInput },
  }),

  Rpc.make('editMessage', {
    success: ChatMessage,
    error: S.Union(MessageNotFound, Unauthorized),
    payload: { input: EditMessageInput },
  }),

  Rpc.make('deleteMessage', {
    success: S.Void,
    error: S.Union(MessageNotFound, Unauthorized),
    payload: { messageId: MessageId },
  }),

  // Reactions
  Rpc.make('addReaction', {
    success: S.Void,
    error: MessageNotFound,
    payload: { messageId: MessageId, emoji: S.String },
  }),

  Rpc.make('removeReaction', {
    success: S.Void,
    error: MessageNotFound,
    payload: { messageId: MessageId, emoji: S.String },
  }),

  // Typing Indicators
  Rpc.make('sendTyping', {
    success: S.Void,
    payload: { roomId: RoomId, isTyping: S.Boolean },
  }),

  // Presence
  Rpc.make('updatePresence', {
    success: S.Void,
    payload: { status: UserStatus },
  }),

  // Read Receipts
  Rpc.make('markAsRead', {
    success: S.Void,
    payload: { roomId: RoomId, messageId: MessageId },
  }),

  // Event Stream (returns stream of events)
  Rpc.make('connect', {
    success: S.Array(ChatEvent),
    stream: true,
  }),
).prefix('chat_') {}
