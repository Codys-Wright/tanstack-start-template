/**
 * Chat SSE API Endpoint
 *
 * Streams chat messages and events using Server-Sent Events.
 * Uses a shared hub so all connected clients see the same messages.
 */

import { createFileRoute } from '@tanstack/react-router';
import { chatHub, type ChatEvent } from '../../features/chat/chat-hub.js';

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
// GET Handler - SSE Stream
// =============================================================================

const chatSseHandler = async ({ request }: { request: Request }) => {
  const connectionId = crypto.randomUUID();
  const encoder = new TextEncoder();

  // Get userId from query param or generate one
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId') ?? `anon-${connectionId.slice(0, 8)}`;

  console.log(`[Chat SSE] Client connecting: ${connectionId} (user: ${userId})`);

  let keepaliveHandle: ReturnType<typeof setInterval> | null = null;
  let isOpen = true;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Register with the hub
      chatHub.register(connectionId, userId, (event: ChatEvent) => {
        if (!isOpen) return;
        try {
          controller.enqueue(encoder.encode(encodeEvent(event)));
        } catch {
          // Stream closed
          isOpen = false;
        }
      });

      // Keepalive every 15 seconds
      keepaliveHandle = setInterval(() => {
        if (!isOpen) {
          if (keepaliveHandle) clearInterval(keepaliveHandle);
          return;
        }
        try {
          controller.enqueue(encoder.encode(`: keepalive ${Date.now()}\n\n`));
        } catch {
          if (keepaliveHandle) clearInterval(keepaliveHandle);
          isOpen = false;
        }
      }, 15000);
    },
    cancel() {
      console.log(`[Chat SSE] Client disconnected: ${connectionId}`);
      isOpen = false;
      if (keepaliveHandle) clearInterval(keepaliveHandle);
      chatHub.unregister(connectionId);
    },
  });

  return new Response(stream, {
    status: 200,
    headers: sseHeaders,
  });
};

// =============================================================================
// POST Handler - Send Message
// =============================================================================

const sendMessageHandler = async ({ request }: { request: Request }) => {
  try {
    const body = await request.json();
    const { roomId, senderId, content } = body as {
      roomId: string;
      senderId: string;
      content: string;
    };

    if (!roomId || !senderId || !content) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const message = chatHub.sendMessage(roomId, senderId, content);
    return new Response(JSON.stringify({ success: true, message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[Chat API] Error sending message:', err);
    return new Response(JSON.stringify({ error: 'Failed to send message' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// =============================================================================
// Route
// =============================================================================

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      GET: chatSseHandler,
      POST: sendMessageHandler,
    },
  },
});
