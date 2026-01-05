/**
 * @sse/server - SseHub types and utilities for managing SSE connections
 *
 * Provides types and a factory for creating SSE hub services.
 * Each feature that needs SSE should create its own hub using the Context.Tag pattern.
 */

import * as Clock from 'effect/Clock';
import * as Effect from 'effect/Effect';
import type * as Mailbox from 'effect/Mailbox';
import * as MutableHashMap from 'effect/MutableHashMap';
import * as Option from 'effect/Option';
import * as SynchronizedRef from 'effect/SynchronizedRef';
import type { ConnectionId } from '../domain/schema.js';

// =============================================================================
// Types
// =============================================================================

/**
 * Represents an active SSE connection with its mailbox for sending events.
 */
export interface ActiveConnection<E> {
  readonly connectionId: ConnectionId;
  readonly mailbox: Mailbox.Mailbox<E>;
  readonly metadata: Record<string, unknown>;
  lastActivityTimestamp: number;
}

/**
 * Interface for an SSE Hub service.
 */
export interface SseHubService<E> {
  /** Register a new SSE connection */
  readonly registerConnection: (
    connectionId: ConnectionId,
    mailbox: Mailbox.Mailbox<E>,
    metadata?: Record<string, unknown>,
  ) => Effect.Effect<void>;

  /** Unregister an SSE connection and shutdown its mailbox */
  readonly unregisterConnection: (connectionId: ConnectionId) => Effect.Effect<void>;

  /** Broadcast an event to all connected clients */
  readonly broadcast: (event: E) => Effect.Effect<void>;

  /** Send an event to a specific connection */
  readonly sendTo: (connectionId: ConnectionId, event: E) => Effect.Effect<boolean>;

  /** Send an event to connections matching a predicate on metadata */
  readonly sendToMatching: (
    predicate: (metadata: Record<string, unknown>) => boolean,
    event: E,
  ) => Effect.Effect<number>;

  /** Get the count of active connections */
  readonly getConnectionCount: () => Effect.Effect<number>;

  /** Get all connection IDs */
  readonly getConnectionIds: () => Effect.Effect<readonly ConnectionId[]>;
}

// =============================================================================
// SseHub Implementation Factory
// =============================================================================

/**
 * Create the implementation for an SSE Hub service.
 *
 * Use this with Context.Tag and Layer.effect to create your own hub.
 *
 * @example
 * ```ts
 * import * as Context from 'effect/Context';
 * import * as Layer from 'effect/Layer';
 * import { type SseHubService, createSseHubImpl } from '@sse/server';
 * import type { ChatEvent } from './schema.js';
 *
 * export class ChatHub extends Context.Tag('ChatHub')<
 *   ChatHub,
 *   SseHubService<ChatEvent>
 * >() {}
 *
 * export const ChatHubLive = Layer.scoped(
 *   ChatHub,
 *   createSseHubImpl<ChatEvent>('ChatHub')
 * );
 * ```
 */
export const createSseHubImpl = <E>(
  identifier: string,
): Effect.Effect<SseHubService<E>, never, never> =>
  Effect.gen(function* () {
    const connections = yield* SynchronizedRef.make(
      MutableHashMap.empty<ConnectionId, ActiveConnection<E>>(),
    );

    const registerConnection = (
      connectionId: ConnectionId,
      mailbox: Mailbox.Mailbox<E>,
      metadata: Record<string, unknown> = {},
    ): Effect.Effect<void> =>
      SynchronizedRef.updateEffect(connections, (map) =>
        Clock.currentTimeMillis.pipe(
          Effect.map((now) => {
            const activeConnection: ActiveConnection<E> = {
              connectionId,
              mailbox,
              metadata,
              lastActivityTimestamp: now,
            };
            return MutableHashMap.set(map, connectionId, activeConnection);
          }),
          Effect.tap(() =>
            Effect.logDebug(`[${identifier}] Registered connection: ${connectionId}`),
          ),
        ),
      );

    const unregisterConnection = (connectionId: ConnectionId): Effect.Effect<void> =>
      SynchronizedRef.updateEffect(connections, (map) => {
        const connectionOpt = MutableHashMap.get(map, connectionId);

        if (Option.isNone(connectionOpt)) {
          return Effect.succeed(map);
        }

        MutableHashMap.remove(map, connectionId);

        return connectionOpt.value.mailbox.shutdown.pipe(
          Effect.as(map),
          Effect.tap(() =>
            Effect.logDebug(`[${identifier}] Unregistered connection: ${connectionId}`),
          ),
        );
      });

    const broadcast = (event: E): Effect.Effect<void> =>
      SynchronizedRef.updateEffect(connections, (map) =>
        Clock.currentTimeMillis.pipe(
          Effect.flatMap((now) => {
            const allConnections = Array.from(MutableHashMap.values(map));

            if (allConnections.length === 0) {
              return Effect.succeed(map);
            }

            return Effect.forEach(
              allConnections,
              (conn) =>
                conn.mailbox.offer(event).pipe(
                  Effect.tap((success) =>
                    success
                      ? Effect.sync(() => {
                          conn.lastActivityTimestamp = now;
                        })
                      : Effect.logWarning(
                          `[${identifier}] Mailbox ${conn.connectionId} is already done, skipping send.`,
                        ),
                  ),
                ),
              { discard: true },
            ).pipe(Effect.as(map));
          }),
        ),
      );

    const sendTo = (connectionId: ConnectionId, event: E): Effect.Effect<boolean> =>
      SynchronizedRef.modifyEffect(connections, (map) => {
        const connectionOpt = MutableHashMap.get(map, connectionId);

        if (Option.isNone(connectionOpt)) {
          return Effect.succeed([false as boolean, map] as const);
        }

        return Clock.currentTimeMillis.pipe(
          Effect.flatMap((now) =>
            connectionOpt.value.mailbox.offer(event).pipe(
              Effect.tap((success) => {
                if (success) {
                  connectionOpt.value.lastActivityTimestamp = now;
                }
              }),
              Effect.map((success) => [success, map] as const),
            ),
          ),
        );
      });

    const sendToMatching = (
      predicate: (metadata: Record<string, unknown>) => boolean,
      event: E,
    ): Effect.Effect<number> =>
      SynchronizedRef.modifyEffect(connections, (map) =>
        Clock.currentTimeMillis.pipe(
          Effect.flatMap((now) => {
            const matchingConnections = Array.from(MutableHashMap.values(map)).filter((conn) =>
              predicate(conn.metadata),
            );

            if (matchingConnections.length === 0) {
              return Effect.succeed([0, map] as const);
            }

            return Effect.forEach(
              matchingConnections,
              (conn) =>
                conn.mailbox.offer(event).pipe(
                  Effect.tap((success) => {
                    if (success) {
                      conn.lastActivityTimestamp = now;
                    }
                  }),
                  Effect.map((success): number => (success ? 1 : 0)),
                ),
              { concurrency: 'unbounded' },
            ).pipe(
              Effect.map((results) => results.reduce((a: number, b: number) => a + b, 0 as number)),
              Effect.map((count) => [count, map] as const),
            );
          }),
        ),
      );

    const getConnectionCount = (): Effect.Effect<number> =>
      SynchronizedRef.get(connections).pipe(Effect.map((map) => MutableHashMap.size(map)));

    const getConnectionIds = (): Effect.Effect<readonly ConnectionId[]> =>
      SynchronizedRef.get(connections).pipe(
        Effect.map((map) => Array.from(MutableHashMap.keys(map))),
      );

    return {
      registerConnection,
      unregisterConnection,
      broadcast,
      sendTo,
      sendToMatching,
      getConnectionCount,
      getConnectionIds,
    };
  });
