/**
 * SSE Demo Event Schemas
 */

import * as Schema from 'effect/Schema';

/**
 * A simple tick event with timestamp
 */
export class TickEvent extends Schema.TaggedClass<TickEvent>()('TickEvent', {
  timestamp: Schema.Number,
  count: Schema.Number,
}) {}

/**
 * A chat message event
 */
export class ChatMessage extends Schema.TaggedClass<ChatMessage>()('ChatMessage', {
  id: Schema.String,
  username: Schema.String,
  text: Schema.String,
  timestamp: Schema.Number,
}) {}

/**
 * A user status change event
 */
export class UserStatusEvent extends Schema.TaggedClass<UserStatusEvent>()('UserStatusEvent', {
  username: Schema.String,
  status: Schema.Literal('online', 'offline', 'away'),
  timestamp: Schema.Number,
}) {}

/**
 * A notification event
 */
export class NotificationEvent extends Schema.TaggedClass<NotificationEvent>()(
  'NotificationEvent',
  {
    id: Schema.String,
    type: Schema.Literal('info', 'warning', 'error', 'success'),
    title: Schema.String,
    message: Schema.String,
    timestamp: Schema.Number,
  },
) {}

/**
 * Union of all demo events
 */
export const DemoEvent = Schema.Union(TickEvent, ChatMessage, UserStatusEvent, NotificationEvent);
export type DemoEvent = typeof DemoEvent.Type;
