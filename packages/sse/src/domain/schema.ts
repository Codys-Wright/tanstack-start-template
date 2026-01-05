/**
 * @sse/domain - Schema definitions for SSE events
 *
 * Provides type-safe event schemas using Effect Schema.
 * All events use tagged unions for discrimination.
 */

import * as Schema from 'effect/Schema';

// =============================================================================
// Base Event Types
// =============================================================================

/**
 * Keepalive event sent by server to maintain connection.
 * Client should monitor these to detect connection loss.
 */
export class SseKeepalive extends Schema.TaggedClass<SseKeepalive>()('SseKeepalive', {
  timestamp: Schema.Number,
}) {}

/**
 * Error event for communicating server-side errors to clients.
 */
export class SseError extends Schema.TaggedClass<SseError>()('SseError', {
  code: Schema.String,
  message: Schema.String,
}) {}

/**
 * Connection established event.
 */
export class SseConnected extends Schema.TaggedClass<SseConnected>()('SseConnected', {
  connectionId: Schema.String,
}) {}

/**
 * Base SSE system events that all SSE streams include.
 */
export const SseSystemEvent = Schema.Union(SseKeepalive, SseError, SseConnected);
export type SseSystemEvent = typeof SseSystemEvent.Type;

// =============================================================================
// Event Encoding/Decoding
// =============================================================================

/**
 * Encode an event to SSE format string.
 * Format: "event: <tag>\ndata: <json>\n\n"
 */
export const encodeEvent = <T extends { readonly _tag: string }>(event: T): string => {
  const json = JSON.stringify(event);
  return `event: ${event._tag}\ndata: ${json}\n\n`;
};

/**
 * Encode a keepalive comment (no event name, just a comment).
 * Format: ": keepalive\n\n"
 */
export const encodeKeepalive = (): string => {
  return `: keepalive ${Date.now()}\n\n`;
};

/**
 * Create a decoder for a specific event schema.
 */
export const makeEventDecoder = <A, I>(schema: Schema.Schema<A, I>) => {
  const decode = Schema.decodeUnknownSync(schema);
  return (data: string): A => {
    const parsed = JSON.parse(data);
    return decode(parsed);
  };
};

// =============================================================================
// Connection Types
// =============================================================================

/**
 * Unique identifier for an SSE connection.
 */
export const ConnectionId = Schema.String.pipe(Schema.brand('ConnectionId'));
export type ConnectionId = typeof ConnectionId.Type;

/**
 * Configuration for SSE connection behavior.
 */
export interface SseConfig {
  /** Interval between keepalive messages in milliseconds */
  readonly keepaliveInterval: number;
  /** Maximum connection duration in milliseconds (0 = unlimited) */
  readonly maxDuration: number;
  /** Number of retry attempts before giving up */
  readonly retryAttempts: number;
  /** Base delay between retries in milliseconds (uses exponential backoff) */
  readonly retryBaseDelay: number;
}

/**
 * Default SSE configuration.
 */
export const defaultSseConfig: SseConfig = {
  keepaliveInterval: 15000, // 15 seconds
  maxDuration: 0, // Unlimited
  retryAttempts: 5,
  retryBaseDelay: 1000, // 1 second
};
