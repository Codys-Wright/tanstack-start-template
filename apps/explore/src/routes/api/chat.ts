/**
 * Chat SSE API Endpoint
 *
 * Streams chat messages and events using Server-Sent Events.
 * Sends random messages from mock users to test the chat UI.
 */

import { createFileRoute } from '@tanstack/react-router';
import * as Effect from 'effect/Effect';
import * as Stream from 'effect/Stream';
import * as Schedule from 'effect/Schedule';
import * as Fiber from 'effect/Fiber';

// =============================================================================
// Types
// =============================================================================

interface ChatUser {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
}

interface ChatMessage {
  _tag: 'ChatMessage';
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  timestamp: number;
}

interface UserTyping {
  _tag: 'UserTyping';
  roomId: string;
  userId: string;
  isTyping: boolean;
}

interface UserJoined {
  _tag: 'UserJoined';
  roomId: string;
  userId: string;
  timestamp: number;
}

interface UserLeft {
  _tag: 'UserLeft';
  roomId: string;
  userId: string;
  timestamp: number;
}

interface Connected {
  _tag: 'Connected';
  connectionId: string;
  timestamp: number;
}

type ChatEvent = ChatMessage | UserTyping | UserJoined | UserLeft | Connected;

// =============================================================================
// Mock Data
// =============================================================================

const MOCK_USERS: ChatUser[] = [
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

const ROOM_IDS = ['room1', 'room2', 'room3'];

// =============================================================================
// Helpers
// =============================================================================

const randomFrom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const createRandomMessage = (): ChatMessage => ({
  _tag: 'ChatMessage',
  id: crypto.randomUUID(),
  roomId: randomFrom(ROOM_IDS),
  senderId: randomFrom(MOCK_USERS).id,
  content: randomFrom(CHAT_MESSAGES),
  timestamp: Date.now(),
});

const createTypingEvent = (): UserTyping => ({
  _tag: 'UserTyping',
  roomId: randomFrom(ROOM_IDS),
  userId: randomFrom(MOCK_USERS).id,
  isTyping: Math.random() > 0.5,
});

const createRandomEvent = (): ChatEvent => {
  const eventType = Math.random();
  if (eventType < 0.7) {
    return createRandomMessage();
  } else if (eventType < 0.9) {
    return createTypingEvent();
  } else {
    const user = randomFrom(MOCK_USERS);
    const isJoin = Math.random() > 0.5;
    return isJoin
      ? {
          _tag: 'UserJoined',
          roomId: randomFrom(ROOM_IDS),
          userId: user.id,
          timestamp: Date.now(),
        }
      : {
          _tag: 'UserLeft',
          roomId: randomFrom(ROOM_IDS),
          userId: user.id,
          timestamp: Date.now(),
        };
  }
};

// =============================================================================
// SSE Headers
// =============================================================================

const sseHeaders = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
};

const encodeEvent = (event: object): string => {
  return `data: ${JSON.stringify(event)}\n\n`;
};

// =============================================================================
// SSE Handler
// =============================================================================

const chatSseHandler = async () => {
  const connectionId = crypto.randomUUID();
  const encoder = new TextEncoder();

  console.log(`[Chat SSE] Client connected: ${connectionId}`);

  // Create the Effect stream - random messages every 2-5 seconds
  const eventStream = Stream.repeatEffect(Effect.sync(() => createRandomEvent())).pipe(
    Stream.schedule(Schedule.spaced(`${randomInt(2000, 5000)} millis`)),
    // Add some variability to the timing
    Stream.tap(() =>
      Effect.sync(() => {
        // Randomly adjust next delay
      }),
    ),
  );

  // Also send a burst of initial messages
  const initialMessages = Stream.fromIterable(
    Array.from({ length: 5 }, () => createRandomMessage()),
  ).pipe(Stream.schedule(Schedule.spaced('500 millis')));

  // Merge initial burst with ongoing stream
  const fullStream = Stream.concat(initialMessages, eventStream);

  let runningFiber: Fiber.RuntimeFiber<void, never> | null = null;
  let keepaliveHandle: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Send connection event
      controller.enqueue(
        encoder.encode(
          encodeEvent({
            _tag: 'Connected',
            connectionId,
            timestamp: Date.now(),
          } satisfies Connected),
        ),
      );

      // Send user info for the client to use
      controller.enqueue(
        encoder.encode(
          encodeEvent({
            _tag: 'UsersInfo',
            users: MOCK_USERS,
          }),
        ),
      );

      // Keepalive every 15 seconds
      keepaliveHandle = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive ${Date.now()}\n\n`));
        } catch {
          if (keepaliveHandle) clearInterval(keepaliveHandle);
        }
      }, 15000);

      // Run the event stream
      const program = fullStream.pipe(
        Stream.tap((event) =>
          Effect.sync(() => {
            try {
              controller.enqueue(encoder.encode(encodeEvent(event)));
            } catch {
              // Stream closed
            }
          }),
        ),
        Stream.runDrain,
        Effect.catchAll(() => Effect.void),
      );

      runningFiber = Effect.runFork(program);
    },
    cancel() {
      console.log(`[Chat SSE] Client disconnected: ${connectionId}`);
      if (keepaliveHandle) clearInterval(keepaliveHandle);
      if (runningFiber) {
        Effect.runFork(Fiber.interrupt(runningFiber));
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: sseHeaders,
  });
};

// =============================================================================
// Route
// =============================================================================

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      GET: chatSseHandler,
    },
  },
});
