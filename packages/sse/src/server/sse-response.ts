/**
 * @sse/server - SSE Response utilities for TanStack Start
 *
 * Creates streaming SSE responses that work with TanStack Start's API routes.
 * Uses ReadableStream to stream events to the client.
 */

import * as Effect from 'effect/Effect';
import * as Mailbox from 'effect/Mailbox';
import * as Stream from 'effect/Stream';
import * as Runtime from 'effect/Runtime';
import * as Scope from 'effect/Scope';
import {
  type ConnectionId,
  encodeEvent,
  encodeKeepalive,
  type SseConfig,
  defaultSseConfig,
} from '../domain/schema.js';

// =============================================================================
// Types
// =============================================================================

/**
 * Options for creating an SSE response.
 */
export interface SseResponseOptions<E, R> {
  /** Unique connection ID */
  readonly connectionId: ConnectionId;
  /** SSE configuration */
  readonly config?: Partial<SseConfig>;
  /** Effect to run when connection is established */
  readonly onConnect?: Effect.Effect<void, never, R>;
  /** Effect to run when connection is closed */
  readonly onDisconnect?: Effect.Effect<void, never, R>;
  /** Stream of events to send to the client */
  readonly events: Stream.Stream<E, never, R>;
  /** Runtime to execute effects */
  readonly runtime: Runtime.Runtime<R>;
}

/**
 * Options for creating a hub-backed SSE response.
 */
export interface SseHubResponseOptions<E, R> {
  /** Unique connection ID */
  readonly connectionId: ConnectionId;
  /** SSE configuration */
  readonly config?: Partial<SseConfig>;
  /** Register connection with the hub */
  readonly register: (
    connectionId: ConnectionId,
    mailbox: Mailbox.Mailbox<E>,
  ) => Effect.Effect<void, never, R>;
  /** Unregister connection from the hub */
  readonly unregister: (connectionId: ConnectionId) => Effect.Effect<void, never, R>;
  /** Runtime to execute effects */
  readonly runtime: Runtime.Runtime<R>;
}

// =============================================================================
// SSE Response Helpers
// =============================================================================

/**
 * Create SSE response headers.
 */
export const sseHeaders = (): HeadersInit => ({
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no', // Disable nginx buffering
});

/**
 * Create an SSE Response from an event stream.
 *
 * @example
 * ```ts
 * // In a TanStack Start API route:
 * import { createSseResponse } from '@sse/server';
 *
 * export const Route = createAPIFileRoute('/api/events')({
 *   GET: async ({ request }) => {
 *     const connectionId = crypto.randomUUID() as ConnectionId;
 *     const events = Stream.tick('1 second').pipe(
 *       Stream.map(() => ({ _tag: 'Tick' as const, time: Date.now() }))
 *     );
 *
 *     return createSseResponse({
 *       connectionId,
 *       events,
 *       runtime: serverRuntime,
 *     });
 *   },
 * });
 * ```
 */
export const createSseResponse = <E extends { readonly _tag: string }, R>(
  options: SseResponseOptions<E, R>,
): Response => {
  const config: SseConfig = { ...defaultSseConfig, ...options.config };
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Keepalive interval
      const keepaliveHandle = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(encodeKeepalive()));
        } catch {
          clearInterval(keepaliveHandle);
        }
      }, config.keepaliveInterval);

      // Max duration timeout
      const maxDurationHandle =
        config.maxDuration > 0
          ? setTimeout(() => {
              clearInterval(keepaliveHandle);
              controller.close();
            }, config.maxDuration)
          : undefined;

      // Run the event stream
      const program = Effect.gen(function* () {
        // Call onConnect if provided
        if (options.onConnect) {
          yield* options.onConnect;
        }

        // Process events
        yield* options.events.pipe(
          Stream.tap((event) =>
            Effect.sync(() => {
              try {
                controller.enqueue(encoder.encode(encodeEvent(event)));
              } catch {
                // Stream closed, ignore
              }
            }),
          ),
          Stream.runDrain,
        );
      }).pipe(
        Effect.ensuring(
          Effect.gen(function* () {
            clearInterval(keepaliveHandle);
            if (maxDurationHandle) clearTimeout(maxDurationHandle);
            if (options.onDisconnect) {
              yield* options.onDisconnect;
            }
          }),
        ),
        Effect.catchAll(() => Effect.void),
      );

      Runtime.runFork(options.runtime)(program);
    },
    cancel() {
      // Client disconnected - cleanup handled by ensuring
    },
  });

  return new Response(stream, {
    status: 200,
    headers: sseHeaders(),
  });
};

/**
 * Create an SSE Response backed by an SseHub.
 *
 * This creates a mailbox, registers it with the hub, and streams events
 * from the mailbox to the client. When the client disconnects, it
 * unregisters from the hub.
 *
 * @example
 * ```ts
 * import { createSseHubResponse } from '@sse/server';
 * import { ChatSseHub } from './chat-hub.js';
 *
 * export const Route = createAPIFileRoute('/api/chat/events')({
 *   GET: async ({ request }) => {
 *     const connectionId = crypto.randomUUID() as ConnectionId;
 *     const hub = yield* ChatSseHub;
 *
 *     return createSseHubResponse({
 *       connectionId,
 *       register: (id, mailbox) => hub.registerConnection(id, mailbox),
 *       unregister: (id) => hub.unregisterConnection(id),
 *       runtime: serverRuntime,
 *     });
 *   },
 * });
 * ```
 */
export const createSseHubResponse = <E extends { readonly _tag: string }, R>(
  options: SseHubResponseOptions<E, R>,
): Response => {
  const config: SseConfig = { ...defaultSseConfig, ...options.config };
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Keepalive interval
      const keepaliveHandle = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(encodeKeepalive()));
        } catch {
          clearInterval(keepaliveHandle);
        }
      }, config.keepaliveInterval);

      // Max duration timeout
      const maxDurationHandle =
        config.maxDuration > 0
          ? setTimeout(() => {
              clearInterval(keepaliveHandle);
              controller.close();
            }, config.maxDuration)
          : undefined;

      // Run the hub-backed event stream
      const program = Effect.gen(function* () {
        // Create scope for mailbox lifecycle
        const scope = yield* Scope.make();

        // Create mailbox
        const mailbox = yield* Mailbox.make<E>().pipe(Scope.extend(scope));

        // Register with hub
        yield* options.register(options.connectionId, mailbox);

        // Stream events from mailbox to client
        yield* Mailbox.toStream(mailbox).pipe(
          Stream.tap((event) =>
            Effect.sync(() => {
              try {
                controller.enqueue(encoder.encode(encodeEvent(event)));
              } catch {
                // Stream closed, ignore
              }
            }),
          ),
          Stream.runDrain,
        );
      }).pipe(
        Effect.ensuring(
          Effect.gen(function* () {
            clearInterval(keepaliveHandle);
            if (maxDurationHandle) clearTimeout(maxDurationHandle);
            yield* options.unregister(options.connectionId);
          }),
        ),
        Effect.catchAll(() => Effect.void),
      );

      Runtime.runFork(options.runtime)(program);
    },
    cancel() {
      // Client disconnected - cleanup handled by ensuring
    },
  });

  return new Response(stream, {
    status: 200,
    headers: sseHeaders(),
  });
};

/**
 * Create a simple Effect-based SSE response maker.
 *
 * This is useful when you want to create an SSE response from within
 * an Effect context, getting access to services.
 *
 * @example
 * ```ts
 * const handler = Effect.gen(function* () {
 *   const hub = yield* ChatSseHub;
 *   const connectionId = crypto.randomUUID() as ConnectionId;
 *
 *   return yield* makeSseResponseEffect({
 *     connectionId,
 *     events: hub.subscribeToEvents(connectionId),
 *   });
 * });
 * ```
 */
export const makeSseResponseEffect = <E extends { readonly _tag: string }, R>(options: {
  readonly connectionId: ConnectionId;
  readonly config?: Partial<SseConfig>;
  readonly events: Stream.Stream<E, never, R>;
  readonly onConnect?: Effect.Effect<void, never, R>;
  readonly onDisconnect?: Effect.Effect<void, never, R>;
}): Effect.Effect<Response, never, R> =>
  Effect.gen(function* () {
    const runtime = yield* Effect.runtime<R>();
    return createSseResponse({
      ...options,
      runtime,
    });
  });
