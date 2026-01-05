/**
 * @chat/server - Chat SSE Hub
 *
 * SSE hub for real-time chat events.
 * Manages connections per room and broadcasts chat events to room members.
 */

import * as Effect from 'effect/Effect';
import * as Context from 'effect/Context';
import * as Layer from 'effect/Layer';
import * as Ref from 'effect/Ref';
import type * as Mailbox from 'effect/Mailbox';
import type { ConnectionId } from '@sse';
import type { ChatEvent, RoomId, UserId } from '../domain/schema';

// =============================================================================
// Types
// =============================================================================

/**
 * Active chat connection with mailbox and metadata.
 */
export interface ChatConnection {
  readonly connectionId: ConnectionId;
  readonly mailbox: Mailbox.Mailbox<ChatEvent>;
  readonly userId: UserId;
  readonly roomIds: Set<RoomId>;
  lastActivityTimestamp: number;
}

// =============================================================================
// Chat Hub State
// =============================================================================

interface ChatHubState {
  /** Map of connectionId -> connection */
  connections: Map<ConnectionId, ChatConnection>;
  /** Map of roomId -> Set of connectionIds in that room */
  roomConnections: Map<RoomId, Set<ConnectionId>>;
  /** Map of userId -> Set of connectionIds for that user */
  userConnections: Map<UserId, Set<ConnectionId>>;
}

const emptyState = (): ChatHubState => ({
  connections: new Map(),
  roomConnections: new Map(),
  userConnections: new Map(),
});

// =============================================================================
// Chat Hub Service
// =============================================================================

export class ChatHub extends Context.Tag('ChatHub')<
  ChatHub,
  {
    /**
     * Register a new chat SSE connection.
     */
    readonly registerConnection: (
      connectionId: ConnectionId,
      mailbox: Mailbox.Mailbox<ChatEvent>,
      userId: UserId,
      initialRoomIds?: RoomId[],
    ) => Effect.Effect<void>;

    /**
     * Unregister a chat SSE connection.
     */
    readonly unregisterConnection: (connectionId: ConnectionId) => Effect.Effect<void>;

    /**
     * Subscribe a connection to a room.
     */
    readonly subscribeToRoom: (connectionId: ConnectionId, roomId: RoomId) => Effect.Effect<void>;

    /**
     * Unsubscribe a connection from a room.
     */
    readonly unsubscribeFromRoom: (
      connectionId: ConnectionId,
      roomId: RoomId,
    ) => Effect.Effect<void>;

    /**
     * Broadcast an event to all connections in a room.
     */
    readonly broadcastToRoom: (roomId: RoomId, event: ChatEvent) => Effect.Effect<number>;

    /**
     * Send an event to a specific user (all their connections).
     */
    readonly sendToUser: (userId: UserId, event: ChatEvent) => Effect.Effect<number>;

    /**
     * Send an event to a specific connection.
     */
    readonly sendToConnection: (
      connectionId: ConnectionId,
      event: ChatEvent,
    ) => Effect.Effect<boolean>;

    /**
     * Broadcast an event to all connections.
     */
    readonly broadcast: (event: ChatEvent) => Effect.Effect<number>;

    /**
     * Get the count of active connections.
     */
    readonly getConnectionCount: () => Effect.Effect<number>;

    /**
     * Get the count of connections in a room.
     */
    readonly getRoomConnectionCount: (roomId: RoomId) => Effect.Effect<number>;

    /**
     * Get all user IDs currently connected to a room.
     */
    readonly getRoomUsers: (roomId: RoomId) => Effect.Effect<readonly UserId[]>;
  }
>() {}

// =============================================================================
// Live Implementation
// =============================================================================

export const ChatHubLive = Layer.effect(
  ChatHub,
  Effect.gen(function* () {
    const stateRef = yield* Ref.make<ChatHubState>(emptyState());

    const registerConnection = (
      connectionId: ConnectionId,
      mailbox: Mailbox.Mailbox<ChatEvent>,
      userId: UserId,
      initialRoomIds: RoomId[] = [],
    ): Effect.Effect<void> =>
      Effect.gen(function* () {
        const now = Date.now();

        yield* Ref.update(stateRef, (state) => {
          // Create the connection
          const connection: ChatConnection = {
            connectionId,
            mailbox,
            userId,
            roomIds: new Set(initialRoomIds),
            lastActivityTimestamp: now,
          };
          state.connections.set(connectionId, connection);

          // Add to user connections
          let userConns = state.userConnections.get(userId);
          if (!userConns) {
            userConns = new Set();
            state.userConnections.set(userId, userConns);
          }
          userConns.add(connectionId);

          // Add to room connections for initial rooms
          for (const roomId of initialRoomIds) {
            let roomConns = state.roomConnections.get(roomId);
            if (!roomConns) {
              roomConns = new Set();
              state.roomConnections.set(roomId, roomConns);
            }
            roomConns.add(connectionId);
          }

          return state;
        });

        yield* Effect.logDebug(
          `[ChatHub] Registered connection: ${connectionId} for user: ${userId}`,
        );
      });

    const unregisterConnection = (connectionId: ConnectionId): Effect.Effect<void> =>
      Effect.gen(function* () {
        yield* Ref.update(stateRef, (state) => {
          const conn = state.connections.get(connectionId);
          if (!conn) return state;

          // Remove from user connections
          const userConns = state.userConnections.get(conn.userId);
          if (userConns) {
            userConns.delete(connectionId);
            if (userConns.size === 0) {
              state.userConnections.delete(conn.userId);
            }
          }

          // Remove from all room connections
          for (const roomId of conn.roomIds) {
            const roomConns = state.roomConnections.get(roomId);
            if (roomConns) {
              roomConns.delete(connectionId);
              if (roomConns.size === 0) {
                state.roomConnections.delete(roomId);
              }
            }
          }

          // Remove the connection
          state.connections.delete(connectionId);

          return state;
        });

        yield* Effect.logDebug(`[ChatHub] Unregistered connection: ${connectionId}`);
      });

    const subscribeToRoom = (connectionId: ConnectionId, roomId: RoomId): Effect.Effect<void> =>
      Ref.update(stateRef, (state) => {
        const conn = state.connections.get(connectionId);
        if (!conn) return state;

        conn.roomIds.add(roomId);

        let roomConns = state.roomConnections.get(roomId);
        if (!roomConns) {
          roomConns = new Set();
          state.roomConnections.set(roomId, roomConns);
        }
        roomConns.add(connectionId);

        return state;
      });

    const unsubscribeFromRoom = (connectionId: ConnectionId, roomId: RoomId): Effect.Effect<void> =>
      Ref.update(stateRef, (state) => {
        const conn = state.connections.get(connectionId);
        if (!conn) return state;

        conn.roomIds.delete(roomId);

        const roomConns = state.roomConnections.get(roomId);
        if (roomConns) {
          roomConns.delete(connectionId);
          if (roomConns.size === 0) {
            state.roomConnections.delete(roomId);
          }
        }

        return state;
      });

    const broadcastToRoom = (roomId: RoomId, event: ChatEvent): Effect.Effect<number> =>
      Effect.gen(function* () {
        const state = yield* Ref.get(stateRef);
        const roomConns = state.roomConnections.get(roomId);
        if (!roomConns) return 0;

        const now = Date.now();
        let sentCount = 0;

        for (const connectionId of roomConns) {
          const conn = state.connections.get(connectionId);
          if (!conn) continue;

          const success = yield* conn.mailbox.offer(event);
          if (success) {
            conn.lastActivityTimestamp = now;
            sentCount++;
          }
        }

        return sentCount;
      });

    const sendToUser = (userId: UserId, event: ChatEvent): Effect.Effect<number> =>
      Effect.gen(function* () {
        const state = yield* Ref.get(stateRef);
        const userConns = state.userConnections.get(userId);
        if (!userConns) return 0;

        const now = Date.now();
        let sentCount = 0;

        for (const connectionId of userConns) {
          const conn = state.connections.get(connectionId);
          if (!conn) continue;

          const success = yield* conn.mailbox.offer(event);
          if (success) {
            conn.lastActivityTimestamp = now;
            sentCount++;
          }
        }

        return sentCount;
      });

    const sendToConnection = (
      connectionId: ConnectionId,
      event: ChatEvent,
    ): Effect.Effect<boolean> =>
      Effect.gen(function* () {
        const state = yield* Ref.get(stateRef);
        const conn = state.connections.get(connectionId);
        if (!conn) return false;

        const success = yield* conn.mailbox.offer(event);
        if (success) {
          conn.lastActivityTimestamp = Date.now();
        }
        return success;
      });

    const broadcast = (event: ChatEvent): Effect.Effect<number> =>
      Effect.gen(function* () {
        const state = yield* Ref.get(stateRef);
        const now = Date.now();
        let sentCount = 0;

        for (const conn of state.connections.values()) {
          const success = yield* conn.mailbox.offer(event);
          if (success) {
            conn.lastActivityTimestamp = now;
            sentCount++;
          }
        }

        return sentCount;
      });

    const getConnectionCount = (): Effect.Effect<number> =>
      Ref.get(stateRef).pipe(Effect.map((state) => state.connections.size));

    const getRoomConnectionCount = (roomId: RoomId): Effect.Effect<number> =>
      Ref.get(stateRef).pipe(Effect.map((state) => state.roomConnections.get(roomId)?.size ?? 0));

    const getRoomUsers = (roomId: RoomId): Effect.Effect<readonly UserId[]> =>
      Ref.get(stateRef).pipe(
        Effect.map((state) => {
          const roomConns = state.roomConnections.get(roomId);
          if (!roomConns) return [];

          const userIds = new Set<UserId>();
          for (const connectionId of roomConns) {
            const conn = state.connections.get(connectionId);
            if (conn) {
              userIds.add(conn.userId);
            }
          }
          return Array.from(userIds);
        }),
      );

    return {
      registerConnection,
      unregisterConnection,
      subscribeToRoom,
      unsubscribeFromRoom,
      broadcastToRoom,
      sendToUser,
      sendToConnection,
      broadcast,
      getConnectionCount,
      getRoomConnectionCount,
      getRoomUsers,
    };
  }),
);
