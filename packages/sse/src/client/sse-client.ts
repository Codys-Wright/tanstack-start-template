/**
 * @sse/client - SSE Client for browser-side event consumption
 *
 * Provides Effect-based SSE client that connects to SSE endpoints,
 * parses events, and exposes them as an Effect Stream.
 */

import * as Effect from 'effect/Effect';
import * as Stream from 'effect/Stream';
import * as PubSub from 'effect/PubSub';
import * as Schedule from 'effect/Schedule';
import * as Schema from 'effect/Schema';
import type * as Scope from 'effect/Scope';
import { type SseConfig, defaultSseConfig } from '../domain/schema.js';

// =============================================================================
// Types
// =============================================================================

/**
 * Error that occurs during SSE connection.
 */
export class SseConnectionError extends Schema.TaggedError<SseConnectionError>()(
  'SseConnectionError',
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
  },
) {}

/**
 * Options for creating an SSE client.
 */
export interface SseClientOptions<E> {
  /** URL to connect to */
  readonly url: string;
  /** SSE configuration */
  readonly config?: Partial<SseConfig>;
  /** Schema for parsing events */
  readonly eventSchema: Schema.Schema<E, unknown>;
  /** Custom headers to send with the request */
  readonly headers?: Record<string, string>;
}

/**
 * Interface for an SSE service.
 */
export interface SseService<E> {
  readonly events: Stream.Stream<E>;
  readonly publish: (event: E) => Effect.Effect<boolean>;
}

// =============================================================================
// SSE Client
// =============================================================================

/**
 * Create an SSE client that connects to a URL and streams events.
 *
 * The client automatically handles:
 * - Connection establishment
 * - Event parsing with the provided schema
 * - Keepalive detection (reconnects if no keepalive received)
 * - Automatic reconnection with exponential backoff
 * - Graceful cleanup on disconnect
 *
 * @example
 * ```ts
 * import { createSseClient } from '@sse/client';
 * import { ChatEvent } from './schema.js';
 *
 * const client = createSseClient({
 *   url: '/api/chat/events',
 *   eventSchema: ChatEvent,
 * });
 *
 * // Subscribe to events
 * client.events.pipe(
 *   Stream.tap((event) => Effect.log('Received event:', event)),
 *   Stream.runDrain,
 * );
 * ```
 */
export const createSseClient = <E extends { readonly _tag: string }>(
  options: SseClientOptions<E>,
): {
  readonly events: Stream.Stream<E, SseConnectionError>;
  readonly connect: Effect.Effect<void, SseConnectionError>;
} => {
  const config: SseConfig = { ...defaultSseConfig, ...options.config };
  const decode = Schema.decodeUnknownSync(options.eventSchema);

  const events = Stream.async<E, SseConnectionError>((emit) => {
    let eventSource: EventSource | null = null;
    let lastEventTime = Date.now();
    let keepaliveCheckHandle: ReturnType<typeof setInterval> | null = null;

    const cleanup = () => {
      if (keepaliveCheckHandle) {
        clearInterval(keepaliveCheckHandle);
        keepaliveCheckHandle = null;
      }
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };

    const connect = () => {
      cleanup();

      try {
        eventSource = new EventSource(options.url);
        lastEventTime = Date.now();

        // Set up keepalive monitoring
        keepaliveCheckHandle = setInterval(() => {
          const timeSinceLastEvent = Date.now() - lastEventTime;
          // If no event received for 2x keepalive interval, consider connection dead
          if (timeSinceLastEvent > config.keepaliveInterval * 2) {
            console.warn('[SSE] Connection appears dead, reconnecting...');
            connect();
          }
        }, config.keepaliveInterval);

        eventSource.onopen = () => {
          lastEventTime = Date.now();
          console.log('[SSE] Connected to', options.url);
        };

        eventSource.onerror = (error) => {
          console.error('[SSE] Connection error:', error);
          cleanup();
          // Emit error and let the retry logic handle reconnection
          emit.fail(
            new SseConnectionError({
              message: 'SSE connection error',
              cause: error,
            }),
          );
        };

        // Handle all events via the message handler
        eventSource.onmessage = (event) => {
          lastEventTime = Date.now();
          // Skip keepalive comments (they come as empty messages or comments)
          if (!event.data || event.data.trim() === '') {
            return;
          }

          try {
            const parsed = JSON.parse(event.data);
            const decoded = decode(parsed);
            emit.single(decoded);
          } catch (err) {
            console.warn('[SSE] Failed to parse event:', event.data, err);
          }
        };
      } catch (err) {
        cleanup();
        emit.fail(
          new SseConnectionError({
            message: 'Failed to create EventSource',
            cause: err,
          }),
        );
      }
    };

    // Initial connection
    connect();

    // Return cleanup function
    return Effect.sync(cleanup);
  });

  // Add retry logic with exponential backoff
  const eventsWithRetry = events.pipe(
    Stream.retry(
      Schedule.exponential(config.retryBaseDelay).pipe(
        Schedule.union(Schedule.recurs(config.retryAttempts)),
      ),
    ),
  );

  const connectEffect = Effect.async<void, SseConnectionError>((resume) => {
    // This is a convenience method - the actual connection happens
    // when you start consuming the stream
    resume(Effect.void);
  });

  return {
    events: eventsWithRetry,
    connect: connectEffect,
  };
};

/**
 * Create an SSE service implementation that manages a connection and distributes events via PubSub.
 *
 * Use this with Context.Tag and Layer.scoped to create your own service.
 *
 * @example
 * ```ts
 * import * as Context from 'effect/Context';
 * import * as Layer from 'effect/Layer';
 * import { type SseService, createSseServiceImpl } from '@sse/client';
 * import type { ChatEvent } from './schema.js';
 *
 * export class ChatSseService extends Context.Tag('ChatSseService')<
 *   ChatSseService,
 *   SseService<ChatEvent>
 * >() {}
 *
 * export const ChatSseServiceLive = Layer.scoped(
 *   ChatSseService,
 *   createSseServiceImpl({
 *     identifier: 'ChatSse',
 *     url: '/api/chat/events',
 *     eventSchema: ChatEvent,
 *   })
 * );
 * ```
 */
export const createSseServiceImpl = <E extends { readonly _tag: string }>(options: {
  readonly identifier: string;
  readonly url: string;
  readonly config?: Partial<SseConfig>;
  readonly eventSchema: Schema.Schema<E, unknown>;
}): Effect.Effect<SseService<E>, never, Scope.Scope> =>
  Effect.gen(function* () {
    const pubSub = yield* PubSub.unbounded<E>();
    const client = createSseClient(options);

    // Start consuming events and publishing to PubSub
    yield* client.events.pipe(
      Stream.tap((event) => pubSub.publish(event)),
      Stream.tapErrorCause((cause) => Effect.logError(`[${options.identifier}] SSE error:`, cause)),
      Stream.retry(
        Schedule.exponential(
          options.config?.retryBaseDelay ?? defaultSseConfig.retryBaseDelay,
        ).pipe(
          Schedule.union(
            Schedule.recurs(options.config?.retryAttempts ?? defaultSseConfig.retryAttempts),
          ),
        ),
      ),
      Stream.runDrain,
      Effect.forkScoped,
    );

    return {
      events: Stream.fromPubSub(pubSub),
      publish: (event: E) => pubSub.publish(event),
    };
  });
