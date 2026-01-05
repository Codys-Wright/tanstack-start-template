/**
 * @chat Domain Schema
 *
 * Core types and schemas for the chat system using Effect Schema.
 */

import * as Schema from 'effect/Schema';

// =============================================================================
// Branded IDs
// =============================================================================

export const UserId = Schema.String.pipe(Schema.brand('UserId'));
export type UserId = typeof UserId.Type;

export const RoomId = Schema.String.pipe(Schema.brand('RoomId'));
export type RoomId = typeof RoomId.Type;

export const MessageId = Schema.String.pipe(Schema.brand('MessageId'));
export type MessageId = typeof MessageId.Type;

// =============================================================================
// User
// =============================================================================

export class ChatUser extends Schema.Class<ChatUser>('ChatUser')({
  id: UserId,
  name: Schema.String,
  username: Schema.String,
  avatarUrl: Schema.OptionFromNullOr(Schema.String),
  status: Schema.Literal('online', 'offline', 'away'),
}) {}

// =============================================================================
// Message
// =============================================================================

export class ChatMessage extends Schema.Class<ChatMessage>('ChatMessage')({
  id: MessageId,
  roomId: RoomId,
  senderId: UserId,
  content: Schema.String,
  timestamp: Schema.Number,
  editedAt: Schema.OptionFromNullOr(Schema.Number),
  replyToId: Schema.OptionFromNullOr(MessageId),
}) {}

// For sending messages (no id, timestamp generated server-side)
export class SendMessageInput extends Schema.Class<SendMessageInput>('SendMessageInput')({
  roomId: RoomId,
  content: Schema.String,
  replyToId: Schema.OptionFromNullOr(MessageId),
}) {}

// =============================================================================
// Room
// =============================================================================

export const RoomType = Schema.Literal('direct', 'group', 'channel');
export type RoomType = typeof RoomType.Type;

export class ChatRoom extends Schema.Class<ChatRoom>('ChatRoom')({
  id: RoomId,
  name: Schema.String,
  type: RoomType,
  description: Schema.OptionFromNullOr(Schema.String),
  avatarUrl: Schema.OptionFromNullOr(Schema.String),
  createdAt: Schema.Number,
  updatedAt: Schema.Number,
  memberIds: Schema.Array(UserId),
  lastMessageAt: Schema.OptionFromNullOr(Schema.Number),
}) {}

export class CreateRoomInput extends Schema.Class<CreateRoomInput>('CreateRoomInput')({
  name: Schema.String,
  type: RoomType,
  description: Schema.OptionFromNullOr(Schema.String),
  memberIds: Schema.Array(UserId),
}) {}

// =============================================================================
// Room Member
// =============================================================================

export const MemberRole = Schema.Literal('owner', 'admin', 'member');
export type MemberRole = typeof MemberRole.Type;

export class RoomMember extends Schema.Class<RoomMember>('RoomMember')({
  roomId: RoomId,
  userId: UserId,
  role: MemberRole,
  joinedAt: Schema.Number,
  lastReadAt: Schema.OptionFromNullOr(Schema.Number),
}) {}

// =============================================================================
// Real-time Events
// =============================================================================

export class MessageSentEvent extends Schema.Class<MessageSentEvent>('MessageSentEvent')({
  _tag: Schema.Literal('MessageSent'),
  message: ChatMessage,
}) {}

export class MessageEditedEvent extends Schema.Class<MessageEditedEvent>('MessageEditedEvent')({
  _tag: Schema.Literal('MessageEdited'),
  message: ChatMessage,
}) {}

export class MessageDeletedEvent extends Schema.Class<MessageDeletedEvent>('MessageDeletedEvent')({
  _tag: Schema.Literal('MessageDeleted'),
  messageId: MessageId,
  roomId: RoomId,
}) {}

export class UserJoinedEvent extends Schema.Class<UserJoinedEvent>('UserJoinedEvent')({
  _tag: Schema.Literal('UserJoined'),
  roomId: RoomId,
  user: ChatUser,
}) {}

export class UserLeftEvent extends Schema.Class<UserLeftEvent>('UserLeftEvent')({
  _tag: Schema.Literal('UserLeft'),
  roomId: RoomId,
  userId: UserId,
}) {}

export class UserTypingEvent extends Schema.Class<UserTypingEvent>('UserTypingEvent')({
  _tag: Schema.Literal('UserTyping'),
  roomId: RoomId,
  userId: UserId,
  isTyping: Schema.Boolean,
}) {}

export class UserStatusChangedEvent extends Schema.Class<UserStatusChangedEvent>(
  'UserStatusChangedEvent',
)({
  _tag: Schema.Literal('UserStatusChanged'),
  userId: UserId,
  status: Schema.Literal('online', 'offline', 'away'),
}) {}

export const ChatEvent = Schema.Union(
  MessageSentEvent,
  MessageEditedEvent,
  MessageDeletedEvent,
  UserJoinedEvent,
  UserLeftEvent,
  UserTypingEvent,
  UserStatusChangedEvent,
);
export type ChatEvent = typeof ChatEvent.Type;

// =============================================================================
// API Response Types
// =============================================================================

export class RoomWithLastMessage extends Schema.Class<RoomWithLastMessage>('RoomWithLastMessage')({
  room: ChatRoom,
  lastMessage: Schema.OptionFromNullOr(ChatMessage),
  unreadCount: Schema.Number,
}) {}

export class MessageWithSender extends Schema.Class<MessageWithSender>('MessageWithSender')({
  message: ChatMessage,
  sender: ChatUser,
}) {}
