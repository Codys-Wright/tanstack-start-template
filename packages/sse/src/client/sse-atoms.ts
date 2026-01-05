/**
 * @sse/client - SSE Atom utilities for Effect-Atom integration
 *
 * Provides factories for creating atoms that subscribe to SSE streams.
 */

import { Atom } from '@effect-atom/atom-react';
import * as Effect from 'effect/Effect';
import * as Stream from 'effect/Stream';
import * as PubSub from 'effect/PubSub';
import * as Schedule from 'effect/Schedule';
import * as Schema from 'effect/Schema';
import { type SseConfig, defaultSseConfig } from '../domain/schema.js';
import { createSseClient, SseConnectionError } from './sse-client.js';

// =============================================================================
// Types
// =============================================================================

/**
 * Options for creating an SSE consumer atom.
 */
export interface SseConsumerAtomOptions<E, A extends E, R> {
  /** Atom runtime to use */
  readonly runtime: Atom.AtomRuntime<R, unknown>;
  /** Identifier for logging */
  readonly identifier: string;
  /** URL to connect to */
  readonly url: string;
  /** Event schema */
  readonly eventSchema: Schema.Schema<E, unknown>;
  /** Predicate to filter events */
  readonly predicate: (event: E) => event is A;
  /** Handler for matched events */
  readonly handler: (event: A) => Effect.Effect<void, unknown, R>;
  /** SSE configuration */
  readonly config?: Partial<SseConfig>;
}

/**
 * Options for creating an SSE connection atom.
 */
export interface SseConnectionAtomOptions<E> {
  /** Identifier for logging */
  readonly identifier: string;
  /** URL to connect to */
  readonly url: string;
  /** Event schema */
  readonly eventSchema: Schema.Schema<E, unknown>;
  /** SSE configuration */
  readonly config?: Partial<SseConfig>;
}

/**
 * Interface for an SSE PubSub service.
 */
export interface SsePubSubService<E> {
  readonly changes: Stream.Stream<E>;
  readonly publish: (event: E) => Effect.Effect<boolean>;
}

// =============================================================================
// SSE Atoms
// =============================================================================

/**
 * Create an SSE connection atom that maintains a persistent SSE connection.
 *
 * This is similar to the eventStreamAtom from the reference project,
 * but uses SSE instead of WebSockets.
 *
 * @example
 * ```ts
 * import { makeSseConnectionAtom } from '@sse/client';
 * import { ChatEvent } from './schema.js';
 *
 * export const chatSseAtom = makeSseConnectionAtom({
 *   identifier: 'ChatSSE',
 *   url: '/api/chat/events',
 *   eventSchema: ChatEvent,
 * }).pipe(Atom.keepAlive);
 * ```
 */
export const makeSseConnectionAtom = <E extends { readonly _tag: string }>(
  options: SseConnectionAtomOptions<E>,
): Stream.Stream<E, SseConnectionError> => {
  const config: SseConfig = { ...defaultSseConfig, ...options.config };
  const client = createSseClient({
    url: options.url,
    eventSchema: options.eventSchema,
    config,
  });

  return client.events.pipe(
    Stream.tap(() => Effect.logDebug(`[${options.identifier}] Received event`)),
    Stream.tapErrorCause((cause) =>
      Effect.logError(`[${options.identifier}] Connection error:`, cause),
    ),
    Stream.retry(
      Schedule.exponential(config.retryBaseDelay).pipe(
        Schedule.union(Schedule.recurs(config.retryAttempts)),
      ),
    ),
  );
};

/**
 * Create an SSE PubSub service implementation for distributing events.
 *
 * Use this with Context.Tag and Layer.effect to create your own PubSub service.
 *
 * @example
 * ```ts
 * import * as Context from 'effect/Context';
 * import * as Layer from 'effect/Layer';
 * import { type SsePubSubService, createSsePubSubImpl } from '@sse/client';
 * import type { ChatEvent } from './schema.js';
 *
 * export class ChatEventStream extends Context.Tag('ChatEventStream')<
 *   ChatEventStream,
 *   SsePubSubService<ChatEvent>
 * >() {}
 *
 * export const ChatEventStreamLive = Layer.effect(
 *   ChatEventStream,
 *   createSsePubSubImpl<ChatEvent>()
 * );
 * ```
 */
export const createSsePubSubImpl = <E extends { readonly _tag: string }>(): Effect.Effect<
  SsePubSubService<E>
> =>
  Effect.gen(function* () {
    const pubSub = yield* PubSub.unbounded<E>();
    return {
      changes: Stream.fromPubSub(pubSub),
      publish: (event: E) => pubSub.publish(event),
    };
  });

/**
 * Create a factory for making SSE consumer atoms.
 *
 * Similar to makeEventStreamAtom from the reference project.
 *
 * @example
 * ```ts
 * import { makeSseConsumerAtom } from '@sse/client';
 * import { chatRuntime, ChatEventStream } from './atom-runtime.js';
 * import { ChatMessage } from './schema.js';
 *
 * export const newMessageAtom = makeSseConsumerAtom({
 *   runtime: chatRuntime,
 *   identifier: 'NewMessage',
 *   url: '/api/chat/events',
 *   eventSchema: ChatMessage,
 *   predicate: (e): e is ChatMessage => e._tag === 'ChatMessage',
 *   handler: (message) => Effect.gen(function* () {
 *     // Handle new message
 *     yield* Effect.log('New message:', message.text);
 *   }),
 * });
 * ```
 */
export const makeSseConsumerAtom = <E extends { readonly _tag: string }, A extends E, R>(
  options: SseConsumerAtomOptions<E, A, R>,
) => {
  const config: SseConfig = { ...defaultSseConfig, ...options.config };

  return options.runtime
    .atom(
      Effect.gen(function* () {
        yield* Effect.acquireRelease(
          Effect.logInfo(`[${options.identifier}] SSE consumer acquired`),
          () => Effect.logInfo(`[${options.identifier}] SSE consumer released`),
        );

        const client = createSseClient({
          url: options.url,
          eventSchema: options.eventSchema,
          config,
        });

        yield* client.events.pipe(
          Stream.filter(options.predicate),
          Stream.tap((event) => Effect.logDebug(`[${options.identifier}] Received:`, event)),
          Stream.tap((event) => options.handler(event)),
          Stream.tapErrorCause((cause) => Effect.logError(`[${options.identifier}] Error:`, cause)),
          Stream.retry(
            Schedule.exponential(config.retryBaseDelay).pipe(
              Schedule.union(Schedule.recurs(config.retryAttempts)),
            ),
          ),
          Stream.runDrain,
        );
      }),
    )
    .pipe(Atom.setIdleTTL(0));
};
