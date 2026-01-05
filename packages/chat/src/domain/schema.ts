/**
 * @chat Domain Schema
 *
 * Core types and schemas for the chat system using Effect Schema.
 * Includes support for reactions, read receipts, typing indicators, and presence.
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

export const ReactionId = Schema.String.pipe(Schema.brand('ReactionId'));
export type ReactionId = typeof ReactionId.Type;

// =============================================================================
// User Status & Presence
// =============================================================================

export const UserStatus = Schema.Literal('online', 'offline', 'away', 'dnd');
export type UserStatus = typeof UserStatus.Type;

export class UserPresence extends Schema.Class<UserPresence>('UserPresence')({
  userId: UserId,
  status: UserStatus,
  customStatus: Schema.OptionFromNullOr(Schema.String),
  lastSeenAt: Schema.Number,
}) {}

// =============================================================================
// User
// =============================================================================

export class ChatUser extends Schema.Class<ChatUser>('ChatUser')({
  id: UserId,
  name: Schema.String,
  username: Schema.String,
  avatarUrl: Schema.OptionFromNullOr(Schema.String),
  status: UserStatus,
  roleColor: Schema.OptionFromNullOr(Schema.String),
}) {}

// =============================================================================
// Reactions
// =============================================================================

export class MessageReaction extends Schema.Class<MessageReaction>('MessageReaction')({
  id: ReactionId,
  messageId: MessageId,
  userId: UserId,
  emoji: Schema.String,
  createdAt: Schema.Number,
}) {}

// Aggregated reaction for display
export class ReactionSummary extends Schema.Class<ReactionSummary>('ReactionSummary')({
  emoji: Schema.String,
  count: Schema.Number,
  userIds: Schema.Array(UserId),
  reacted: Schema.Boolean, // Whether current user reacted
}) {}

// =============================================================================
// Message Attachments
// =============================================================================

export const AttachmentType = Schema.Literal('image', 'video', 'file', 'audio');
export type AttachmentType = typeof AttachmentType.Type;

export class MessageAttachment extends Schema.Class<MessageAttachment>('MessageAttachment')({
  id: Schema.String,
  type: AttachmentType,
  url: Schema.String,
  filename: Schema.String,
  size: Schema.Number,
  mimeType: Schema.String,
  width: Schema.OptionFromNullOr(Schema.Number),
  height: Schema.OptionFromNullOr(Schema.Number),
  thumbnailUrl: Schema.OptionFromNullOr(Schema.String),
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
  attachments: Schema.Array(MessageAttachment),
  isPinned: Schema.Boolean,
  isDeleted: Schema.Boolean,
}) {}

// For sending messages (no id, timestamp generated server-side)
export class SendMessageInput extends Schema.Class<SendMessageInput>('SendMessageInput')({
  roomId: RoomId,
  content: Schema.String,
  replyToId: Schema.OptionFromNullOr(MessageId),
  attachmentIds: Schema.Array(Schema.String),
}) {}

export class EditMessageInput extends Schema.Class<EditMessageInput>('EditMessageInput')({
  messageId: MessageId,
  content: Schema.String,
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
  iconEmoji: Schema.OptionFromNullOr(Schema.String),
  createdAt: Schema.Number,
  updatedAt: Schema.Number,
  memberIds: Schema.Array(UserId),
  lastMessageAt: Schema.OptionFromNullOr(Schema.Number),
  isArchived: Schema.Boolean,
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

export const MemberRole = Schema.Literal('owner', 'admin', 'moderator', 'member');
export type MemberRole = typeof MemberRole.Type;

export class RoomMember extends Schema.Class<RoomMember>('RoomMember')({
  roomId: RoomId,
  userId: UserId,
  role: MemberRole,
  nickname: Schema.OptionFromNullOr(Schema.String),
  joinedAt: Schema.Number,
  lastReadAt: Schema.OptionFromNullOr(Schema.Number),
  lastReadMessageId: Schema.OptionFromNullOr(MessageId),
  isMuted: Schema.Boolean,
  mutedUntil: Schema.OptionFromNullOr(Schema.Number),
}) {}

// =============================================================================
// Read Receipts
// =============================================================================

export class ReadReceipt extends Schema.Class<ReadReceipt>('ReadReceipt')({
  roomId: RoomId,
  userId: UserId,
  messageId: MessageId,
  readAt: Schema.Number,
}) {}

// =============================================================================
// Real-time Events
// =============================================================================

export class MessageSentEvent extends Schema.Class<MessageSentEvent>('MessageSentEvent')({
  _tag: Schema.Literal('MessageSent'),
  message: ChatMessage,
  sender: ChatUser,
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

export class ReactionAddedEvent extends Schema.Class<ReactionAddedEvent>('ReactionAddedEvent')({
  _tag: Schema.Literal('ReactionAdded'),
  reaction: MessageReaction,
  user: ChatUser,
}) {}

export class ReactionRemovedEvent extends Schema.Class<ReactionRemovedEvent>(
  'ReactionRemovedEvent',
)({
  _tag: Schema.Literal('ReactionRemoved'),
  messageId: MessageId,
  userId: UserId,
  emoji: Schema.String,
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
  username: Schema.String,
  isTyping: Schema.Boolean,
}) {}

export class UserPresenceChangedEvent extends Schema.Class<UserPresenceChangedEvent>(
  'UserPresenceChangedEvent',
)({
  _tag: Schema.Literal('UserPresenceChanged'),
  presence: UserPresence,
}) {}

export class MessageReadEvent extends Schema.Class<MessageReadEvent>('MessageReadEvent')({
  _tag: Schema.Literal('MessageRead'),
  receipt: ReadReceipt,
}) {}

export class MessagePinnedEvent extends Schema.Class<MessagePinnedEvent>('MessagePinnedEvent')({
  _tag: Schema.Literal('MessagePinned'),
  messageId: MessageId,
  roomId: RoomId,
  pinnedBy: UserId,
}) {}

export class MessageUnpinnedEvent extends Schema.Class<MessageUnpinnedEvent>(
  'MessageUnpinnedEvent',
)({
  _tag: Schema.Literal('MessageUnpinned'),
  messageId: MessageId,
  roomId: RoomId,
}) {}

export const ChatEvent = Schema.Union(
  MessageSentEvent,
  MessageEditedEvent,
  MessageDeletedEvent,
  ReactionAddedEvent,
  ReactionRemovedEvent,
  UserJoinedEvent,
  UserLeftEvent,
  UserTypingEvent,
  UserPresenceChangedEvent,
  MessageReadEvent,
  MessagePinnedEvent,
  MessageUnpinnedEvent,
);
export type ChatEvent = typeof ChatEvent.Type;

// =============================================================================
// API Response Types
// =============================================================================

export class RoomWithLastMessage extends Schema.Class<RoomWithLastMessage>('RoomWithLastMessage')({
  room: ChatRoom,
  lastMessage: Schema.OptionFromNullOr(ChatMessage),
  lastMessageSender: Schema.OptionFromNullOr(ChatUser),
  unreadCount: Schema.Number,
}) {}

export class MessageWithSender extends Schema.Class<MessageWithSender>('MessageWithSender')({
  message: ChatMessage,
  sender: ChatUser,
  replyTo: Schema.OptionFromNullOr(ChatMessage),
  replyToSender: Schema.OptionFromNullOr(ChatUser),
  reactions: Schema.Array(ReactionSummary),
}) {}

export class RoomDetails extends Schema.Class<RoomDetails>('RoomDetails')({
  room: ChatRoom,
  members: Schema.Array(ChatUser),
  pinnedMessages: Schema.Array(MessageWithSender),
}) {}

// =============================================================================
// Pagination
// =============================================================================

export class MessagePage extends Schema.Class<MessagePage>('MessagePage')({
  messages: Schema.Array(MessageWithSender),
  hasMore: Schema.Boolean,
  nextCursor: Schema.OptionFromNullOr(Schema.String),
}) {}
