/**
 * Shared Chat Hub
 *
 * A singleton hub that manages all SSE connections and broadcasts
 * messages to all connected clients. This ensures all tabs/clients
 * see the same messages.
 */

// =============================================================================
// Types
// =============================================================================

export interface ChatUser {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  status?: 'online' | 'offline' | 'away';
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'channel' | 'dm';
  /** For DMs, the two participant user IDs */
  participants?: [string, string];
  lastActivity?: number;
}

export interface ChatMessage {
  _tag: 'ChatMessage';
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  timestamp: number;
}

export interface UserTyping {
  _tag: 'UserTyping';
  roomId: string;
  userId: string;
  isTyping: boolean;
}

export interface UserJoined {
  _tag: 'UserJoined';
  roomId: string;
  userId: string;
  timestamp: number;
}

export interface UserLeft {
  _tag: 'UserLeft';
  roomId: string;
  userId: string;
  timestamp: number;
}

export interface Connected {
  _tag: 'Connected';
  connectionId: string;
  userId: string;
  timestamp: number;
}

export interface UsersInfo {
  _tag: 'UsersInfo';
  users: ChatUser[];
}

export interface RoomsInfo {
  _tag: 'RoomsInfo';
  rooms: ChatRoom[];
}

export interface SystemMessage {
  _tag: 'SystemMessage';
  id: string;
  roomId: string;
  content: string;
  timestamp: number;
}

export type ChatEvent =
  | ChatMessage
  | UserTyping
  | UserJoined
  | UserLeft
  | Connected
  | UsersInfo
  | RoomsInfo
  | SystemMessage;

// =============================================================================
// Mock Data
// =============================================================================

export const MOCK_USERS: ChatUser[] = [
  {
    id: 'user1',
    name: 'Alice Johnson',
    username: 'alice',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
  },
  {
    id: 'user2',
    name: 'Bob Smith',
    username: 'bob',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
  },
  {
    id: 'user3',
    name: 'Charlie Brown',
    username: 'charlie',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie',
  },
  {
    id: 'user4',
    name: 'Diana Prince',
    username: 'diana',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=diana',
  },
  {
    id: 'user5',
    name: 'Eve Wilson',
    username: 'eve',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=eve',
  },
];

const CHAT_MESSAGES = [
  'Hey everyone! How is it going?',
  'Good morning! ☀️',
  'Anyone up for a coffee break?',
  'Just pushed my changes to the repo',
  'The new feature is looking great!',
  'Has anyone seen the latest update?',
  'I love this new chat feature!',
  'Working on the SSE implementation',
  'Almost done with my task',
  'Let me know if you need any help',
  'Great work on the PR!',
  "I'll review that in a minute",
  'Sounds good to me 👍',
  'Can we sync up later today?',
  'Just joined the call',
  'BRB, grabbing lunch',
  "I'm back!",
  'That makes sense',
  'Let me check on that',
  'Perfect, thanks!',
];

/** Default channels */
export const DEFAULT_CHANNELS: ChatRoom[] = [
  { id: 'room1', name: 'General', type: 'channel' },
  { id: 'room2', name: 'Random', type: 'channel' },
  { id: 'room3', name: 'Development', type: 'channel' },
];

const ROOM_IDS = DEFAULT_CHANNELS.map((r) => r.id);

// =============================================================================
// Helpers
// =============================================================================

const randomFrom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Generate a consistent DM room ID for two users.
 * Sorts user IDs to ensure the same room ID regardless of who initiates.
 */
export const getDmRoomId = (userId1: string, userId2: string): string => {
  const sorted = [userId1, userId2].sort();
  return `dm:${sorted[0]}:${sorted[1]}`;
};

/**
 * Parse a DM room ID to get the two participant IDs
 */
export const parseDmRoomId = (roomId: string): [string, string] | null => {
  if (!roomId.startsWith('dm:')) return null;
  const parts = roomId.split(':');
  if (parts.length !== 3) return null;
  return [parts[1], parts[2]];
};

/**
 * Check if a user is a participant in a DM room
 */
export const isUserInDmRoom = (roomId: string, userId: string): boolean => {
  const participants = parseDmRoomId(roomId);
  if (!participants) return false;
  return participants.includes(userId);
};

// =============================================================================
// Chat Hub Singleton
// =============================================================================

type ConnectionCallback = (event: ChatEvent) => void;

interface Connection {
  id: string;
  callback: ConnectionCallback;
  userId: string;
}

class ChatHub {
  private connections = new Map<string, Connection>();
  private messageHistory: ChatEvent[] = [];
  private dmMessageHistory = new Map<string, ChatMessage[]>(); // DM room ID -> messages
  private dmRooms = new Map<string, ChatRoom>(); // Track active DM rooms
  private randomMessageInterval: ReturnType<typeof setInterval> | null = null;
  private connectedUsers = new Map<string, ChatUser>(); // userId -> user info

  constructor() {
    // Start generating random messages
    this.startRandomMessages();
  }

  private startRandomMessages() {
    if (this.randomMessageInterval) return;

    this.randomMessageInterval = setInterval(
      () => {
        // Only send messages if there are connections
        if (this.connections.size === 0) return;

        const event = this.createRandomEvent();
        this.broadcast(event);
      },
      randomInt(3000, 6000),
    );
  }

  private createRandomEvent(): ChatEvent {
    const eventType = Math.random();
    if (eventType < 0.85) {
      return this.createRandomMessage();
    } else {
      return this.createTypingEvent();
    }
  }

  private createRandomMessage(): ChatMessage {
    const msg: ChatMessage = {
      _tag: 'ChatMessage',
      id: crypto.randomUUID(),
      roomId: randomFrom(ROOM_IDS),
      senderId: randomFrom(MOCK_USERS).id,
      content: randomFrom(CHAT_MESSAGES),
      timestamp: Date.now(),
    };
    this.messageHistory.push(msg);
    // Keep last 100 messages
    if (this.messageHistory.length > 100) {
      this.messageHistory = this.messageHistory.slice(-100);
    }
    return msg;
  }

  private createTypingEvent(): UserTyping {
    return {
      _tag: 'UserTyping',
      roomId: randomFrom(ROOM_IDS),
      userId: randomFrom(MOCK_USERS).id,
      isTyping: true,
    };
  }

  /**
   * Register a new connection
   */
  register(connectionId: string, userId: string, callback: ConnectionCallback): void {
    this.connections.set(connectionId, { id: connectionId, callback, userId });

    // Track connected user with generated info
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, {
        id: userId,
        name: `User ${userId.slice(-4)}`,
        username: userId,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        status: 'online',
      });
    }

    console.log(
      `[ChatHub] Connection registered: ${connectionId} (${this.connections.size} total)`,
    );

    // Send connection event
    callback({
      _tag: 'Connected',
      connectionId,
      userId,
      timestamp: Date.now(),
    });

    // Send all users (mock + connected)
    callback({
      _tag: 'UsersInfo',
      users: this.getAllUsers(),
    });

    // Send available rooms (channels + user's DMs)
    callback({
      _tag: 'RoomsInfo',
      rooms: this.getRoomsForUser(userId),
    });

    // Send channel message history
    for (const msg of this.messageHistory) {
      callback(msg);
    }

    // Send DM message history for this user
    for (const [roomId, messages] of this.dmMessageHistory) {
      if (isUserInDmRoom(roomId, userId)) {
        for (const msg of messages) {
          callback(msg);
        }
      }
    }

    // Broadcast user joined
    this.broadcast({
      _tag: 'UserJoined',
      roomId: 'room1',
      userId,
      timestamp: Date.now(),
    });
  }

  /**
   * Get all users (mock + connected)
   */
  private getAllUsers(): ChatUser[] {
    const allUsers = new Map<string, ChatUser>();
    // Add mock users
    for (const user of MOCK_USERS) {
      allUsers.set(user.id, { ...user, status: 'online' });
    }
    // Add/update connected users
    for (const [id, user] of this.connectedUsers) {
      allUsers.set(id, user);
    }
    return Array.from(allUsers.values());
  }

  /**
   * Get rooms available to a user (channels + their DMs)
   */
  private getRoomsForUser(userId: string): ChatRoom[] {
    const rooms: ChatRoom[] = [...DEFAULT_CHANNELS];
    // Add DM rooms this user is part of
    for (const [roomId, room] of this.dmRooms) {
      if (isUserInDmRoom(roomId, userId)) {
        rooms.push(room);
      }
    }
    return rooms;
  }

  /**
   * Unregister a connection
   */
  unregister(connectionId: string): void {
    const conn = this.connections.get(connectionId);
    if (conn) {
      this.connections.delete(connectionId);

      // Check if user still has other connections
      let userStillConnected = false;
      for (const c of this.connections.values()) {
        if (c.userId === conn.userId) {
          userStillConnected = true;
          break;
        }
      }

      if (!userStillConnected) {
        // Update user status to offline but keep in list
        const user = this.connectedUsers.get(conn.userId);
        if (user) {
          user.status = 'offline';
        }
        this.broadcast({
          _tag: 'UserLeft',
          roomId: 'room1',
          userId: conn.userId,
          timestamp: Date.now(),
        });
      }

      console.log(
        `[ChatHub] Connection unregistered: ${connectionId} (${this.connections.size} total)`,
      );
    }
  }

  /**
   * Broadcast an event to all connections
   */
  broadcast(event: ChatEvent): void {
    for (const conn of this.connections.values()) {
      try {
        conn.callback(event);
      } catch (err) {
        console.error(`[ChatHub] Error sending to ${conn.id}:`, err);
      }
    }
  }

  /**
   * Send to specific users only (for DMs)
   */
  private sendToUsers(userIds: string[], event: ChatEvent): void {
    for (const conn of this.connections.values()) {
      if (userIds.includes(conn.userId)) {
        try {
          conn.callback(event);
        } catch (err) {
          console.error(`[ChatHub] Error sending to ${conn.id}:`, err);
        }
      }
    }
  }

  /**
   * Send a message from a user
   * For channels: broadcasts to all
   * For DMs: sends only to participants
   */
  sendMessage(roomId: string, senderId: string, content: string): ChatMessage {
    const msg: ChatMessage = {
      _tag: 'ChatMessage',
      id: crypto.randomUUID(),
      roomId,
      senderId,
      content,
      timestamp: Date.now(),
    };

    const participants = parseDmRoomId(roomId);
    if (participants) {
      // This is a DM
      const dmHistory = this.dmMessageHistory.get(roomId) ?? [];
      dmHistory.push(msg);
      // Keep last 100 messages per DM
      if (dmHistory.length > 100) {
        this.dmMessageHistory.set(roomId, dmHistory.slice(-100));
      } else {
        this.dmMessageHistory.set(roomId, dmHistory);
      }

      // Create/update DM room if needed
      if (!this.dmRooms.has(roomId)) {
        const otherUserId = participants[0] === senderId ? participants[1] : participants[0];
        const otherUser =
          this.connectedUsers.get(otherUserId) ?? MOCK_USERS.find((u) => u.id === otherUserId);
        this.dmRooms.set(roomId, {
          id: roomId,
          name: otherUser?.name ?? `User ${otherUserId.slice(-4)}`,
          type: 'dm',
          participants,
          lastActivity: Date.now(),
        });

        // Notify both participants about the new DM room
        this.sendToUsers(participants, {
          _tag: 'RoomsInfo',
          rooms: this.getRoomsForUser(participants[0]),
        });
      }

      // Send only to participants
      this.sendToUsers(participants, msg);
    } else {
      // This is a channel message
      this.messageHistory.push(msg);
      if (this.messageHistory.length > 100) {
        this.messageHistory = this.messageHistory.slice(-100);
      }
      this.broadcast(msg);
    }

    return msg;
  }

  /**
   * Start a DM conversation with a user
   */
  startDm(userId1: string, userId2: string): ChatRoom {
    const roomId = getDmRoomId(userId1, userId2);

    if (!this.dmRooms.has(roomId)) {
      const otherUser =
        this.connectedUsers.get(userId2) ?? MOCK_USERS.find((u) => u.id === userId2);
      const room: ChatRoom = {
        id: roomId,
        name: otherUser?.name ?? `User ${userId2.slice(-4)}`,
        type: 'dm',
        participants: [userId1, userId2].sort() as [string, string],
        lastActivity: Date.now(),
      };
      this.dmRooms.set(roomId, room);

      // Notify both participants
      this.sendToUsers([userId1, userId2], {
        _tag: 'RoomsInfo',
        rooms: [...DEFAULT_CHANNELS, room],
      });
    }

    return this.dmRooms.get(roomId)!;
  }

  /**
   * Send typing indicator
   * For channels: broadcasts to all
   * For DMs: sends only to participants
   */
  sendTyping(roomId: string, userId: string, isTyping: boolean): void {
    const event: UserTyping = {
      _tag: 'UserTyping',
      roomId,
      userId,
      isTyping,
    };

    const participants = parseDmRoomId(roomId);
    if (participants) {
      this.sendToUsers(participants, event);
    } else {
      this.broadcast(event);
    }
  }

  /**
   * Get connected user count
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Get all available users for starting DMs
   */
  getAvailableUsers(): ChatUser[] {
    return this.getAllUsers();
  }
}

// Singleton instance
export const chatHub = new ChatHub();
