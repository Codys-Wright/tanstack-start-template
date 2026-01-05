/**
 * SSE Demo API Endpoint
 *
 * This endpoint streams Server-Sent Events to connected clients using Effect.
 */

import { createFileRoute } from '@tanstack/react-router';
import * as Effect from 'effect/Effect';
import * as Stream from 'effect/Stream';
import * as Schedule from 'effect/Schedule';
import * as Fiber from 'effect/Fiber';
import type { DemoEvent } from '../../features/sse-demo/schema.js';

// SSE headers
const sseHeaders = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
};

// Encode event to SSE format (unnamed events work with onmessage)
const encodeEvent = (event: object): string => {
  return `data: ${JSON.stringify(event)}\n\n`;
};

// Sample data for random events
const usernames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];
const chatMessages = [
  'Hello everyone!',
  'How are you doing?',
  'Nice weather today!',
  'Anyone up for lunch?',
  'Just finished my task!',
  'Good morning!',
];
const notificationMessages = [
  'New feature available',
  'Maintenance scheduled',
  'Update complete',
  'System check passed',
  'Backup completed',
];

const randomFrom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const createRandomEvent = (): DemoEvent => {
  const eventType = Math.floor(Math.random() * 3);
  switch (eventType) {
    case 0:
      return {
        _tag: 'ChatMessage',
        id: crypto.randomUUID(),
        username: randomFrom(usernames),
        text: randomFrom(chatMessages),
        timestamp: Date.now(),
      };
    case 1:
      return {
        _tag: 'UserStatusEvent',
        username: randomFrom(usernames),
        status: randomFrom(['online', 'offline', 'away'] as const),
        timestamp: Date.now(),
      };
    default:
      return {
        _tag: 'NotificationEvent',
        id: crypto.randomUUID(),
        type: randomFrom(['info', 'warning', 'error', 'success'] as const),
        title: 'System Update',
        message: randomFrom(notificationMessages),
        timestamp: Date.now(),
      };
  }
};

// SSE handler using Effect
const sseHandler = async () => {
  const connectionId = crypto.randomUUID();
  const encoder = new TextEncoder();

  console.log(`[SSE] Client connected: ${connectionId}`);

  // Create the Effect stream
  let tickCount = 0;

  // Tick events every 2 seconds
  const tickStream = Stream.repeatEffect(
    Effect.sync((): DemoEvent => {
      tickCount++;
      return {
        _tag: 'TickEvent',
        timestamp: Date.now(),
        count: tickCount,
      };
    }),
  ).pipe(Stream.schedule(Schedule.spaced('2 seconds')));

  // Random events every 5 seconds
  const randomStream = Stream.repeatEffect(Effect.sync(() => createRandomEvent())).pipe(
    Stream.schedule(Schedule.spaced('5 seconds')),
  );

  // Merge streams
  const eventStream = Stream.merge(tickStream, randomStream);

  // Track the running fiber for cleanup
  let runningFiber: Fiber.RuntimeFiber<void, never> | null = null;
  let keepaliveHandle: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(
          encodeEvent({
            _tag: 'Connected',
            connectionId,
            timestamp: Date.now(),
          }),
        ),
      );

      // Keepalive interval (plain JS since it's just a heartbeat)
      keepaliveHandle = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive ${Date.now()}\n\n`));
        } catch {
          if (keepaliveHandle) clearInterval(keepaliveHandle);
        }
      }, 15000);

      // Run the Effect stream
      const program = eventStream.pipe(
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
      console.log(`[SSE] Client disconnected: ${connectionId}`);
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

export const Route = createFileRoute('/api/events')({
  server: {
    handlers: {
      GET: sseHandler,
    },
  },
});
