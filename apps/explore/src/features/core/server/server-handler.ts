/**
 * SSE Server Handler for Explore App
 *
 * Creates SSE streaming responses using the @sse package.
 */

import { createSseResponse, type ConnectionId } from '@sse/server';
import * as Effect from 'effect/Effect';
import * as Stream from 'effect/Stream';
import * as Schedule from 'effect/Schedule';
import * as Runtime from 'effect/Runtime';
import type { DemoEvent } from '../../sse-demo/schema.js';

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

// Random utilities
const randomFrom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Create random demo events
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

/**
 * Create SSE event stream for demo purposes.
 * Emits tick events every 2 seconds and random events every 5 seconds.
 */
export const createDemoEventStream = () => {
  let tickCount = 0;

  // Create tick events stream (every 2 seconds)
  const tickEvents = Stream.repeat(
    Effect.sync((): DemoEvent => {
      tickCount++;
      return {
        _tag: 'TickEvent',
        timestamp: Date.now(),
        count: tickCount,
      };
    }),
    Schedule.spaced('2 seconds'),
  );

  // Create random events stream (every 5 seconds)
  const randomEvents = Stream.repeat(
    Effect.sync((): DemoEvent => createRandomEvent()),
    Schedule.spaced('5 seconds'),
  );

  // Merge both streams
  return Stream.merge(tickEvents, randomEvents);
};

/**
 * SSE handler for the /api/events endpoint.
 */
export const sseHandler = async () => {
  const connectionId = crypto.randomUUID() as ConnectionId;
  const events = createDemoEventStream();

  return createSseResponse({
    connectionId,
    events,
    runtime: Runtime.defaultRuntime,
    config: {
      keepaliveInterval: 15000,
    },
    onConnect: Effect.sync(() => {
      console.log(`[SSE] Client connected: ${connectionId}`);
    }),
    onDisconnect: Effect.sync(() => {
      console.log(`[SSE] Client disconnected: ${connectionId}`);
    }),
  });
};
