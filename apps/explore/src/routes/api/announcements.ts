/**
 * Announcements API Endpoint
 *
 * Provides CRUD operations for announcements with role-based access control.
 * - GET: List announcements (public can see public, members can see member+public, admins can see all)
 * - POST: Create announcement (admin/moderator only)
 * - PUT: Update/publish/unpublish announcement (admin/moderator only)
 * - DELETE: Delete announcement (admin only)
 */

import { createFileRoute } from '@tanstack/react-router';
import {
  announcementHub,
  type Announcement,
  type AnnouncementEvent,
} from '../../features/announcements/announcement-hub.js';

// =============================================================================
// SSE Headers
// =============================================================================

const sseHeaders = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
};

const jsonHeaders = {
  'Content-Type': 'application/json',
};

const encodeEvent = (event: object): string => {
  return `data: ${JSON.stringify(event)}\n\n`;
};

// =============================================================================
// Helpers
// =============================================================================

/** Get user role from query params (in a real app, this would come from session) */
const getUserRole = (url: URL): string => {
  return url.searchParams.get('role') ?? 'guest';
};

/** Check if user can create/update announcements */
const canManageAnnouncements = (role: string): boolean => {
  return ['admin', 'superadmin', 'moderator', 'owner'].includes(role);
};

/** Check if user can delete announcements */
const canDeleteAnnouncements = (role: string): boolean => {
  return ['admin', 'superadmin', 'owner'].includes(role);
};

// =============================================================================
// GET Handler - List/SSE Stream
// =============================================================================

const getHandler = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const userRole = getUserRole(url);
  const stream = url.searchParams.get('stream') === 'true';
  const includeUnpublished =
    url.searchParams.get('drafts') === 'true' && canManageAnnouncements(userRole);

  // If not streaming, return list of announcements
  if (!stream) {
    const announcements = announcementHub.getAll(userRole, includeUnpublished);
    return new Response(JSON.stringify({ announcements }), {
      status: 200,
      headers: jsonHeaders,
    });
  }

  // SSE streaming mode
  const connectionId = crypto.randomUUID();
  const encoder = new TextEncoder();
  let isOpen = true;
  let keepaliveHandle: ReturnType<typeof setInterval> | null = null;

  const readableStream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Register for updates
      announcementHub.register(connectionId, userRole, (event: AnnouncementEvent) => {
        if (!isOpen) return;
        try {
          controller.enqueue(encoder.encode(encodeEvent(event)));
        } catch {
          isOpen = false;
        }
      });

      // Send initial announcements
      const announcements = announcementHub.getAll(userRole, includeUnpublished);
      controller.enqueue(
        encoder.encode(
          encodeEvent({
            _tag: 'InitialAnnouncements',
            announcements,
          }),
        ),
      );

      // Keepalive
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
      isOpen = false;
      if (keepaliveHandle) clearInterval(keepaliveHandle);
      announcementHub.unregister(connectionId);
    },
  });

  return new Response(readableStream, {
    status: 200,
    headers: sseHeaders,
  });
};

// =============================================================================
// POST Handler - Create Announcement
// =============================================================================

const postHandler = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const userRole = getUserRole(url);

  // Check permission
  if (!canManageAnnouncements(userRole)) {
    return new Response(
      JSON.stringify({
        error: 'Permission denied',
        message: 'You do not have permission to create announcements',
      }),
      { status: 403, headers: jsonHeaders },
    );
  }

  try {
    const body = await request.json();
    const { title, content, priority, visibility, authorId, authorName, published } = body as {
      title: string;
      content: string;
      priority?: Announcement['priority'];
      visibility?: Announcement['visibility'];
      authorId: string;
      authorName: string;
      published?: boolean;
    };

    if (!title || !content || !authorId || !authorName) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: title, content, authorId, authorName',
        }),
        { status: 400, headers: jsonHeaders },
      );
    }

    const announcement = announcementHub.create({
      title,
      content,
      priority: priority ?? 'normal',
      visibility: visibility ?? 'public',
      authorId,
      authorName,
      published: published ?? false,
    });

    return new Response(JSON.stringify({ success: true, announcement }), {
      status: 201,
      headers: jsonHeaders,
    });
  } catch (err) {
    console.error('[Announcements API] Error creating:', err);
    return new Response(JSON.stringify({ error: 'Failed to create announcement' }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};

// =============================================================================
// PUT Handler - Update/Publish/Unpublish
// =============================================================================

const putHandler = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const userRole = getUserRole(url);

  // Check permission
  if (!canManageAnnouncements(userRole)) {
    return new Response(
      JSON.stringify({
        error: 'Permission denied',
        message: 'You do not have permission to update announcements',
      }),
      { status: 403, headers: jsonHeaders },
    );
  }

  try {
    const body = await request.json();
    const { id, action, ...updates } = body as {
      id: string;
      action?: 'publish' | 'unpublish';
      title?: string;
      content?: string;
      priority?: Announcement['priority'];
      visibility?: Announcement['visibility'];
    };

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing announcement ID' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    let announcement: Announcement | null = null;

    if (action === 'publish') {
      announcement = announcementHub.publish(id);
    } else if (action === 'unpublish') {
      announcement = announcementHub.unpublish(id);
    } else {
      announcement = announcementHub.update(id, updates);
    }

    if (!announcement) {
      return new Response(JSON.stringify({ error: 'Announcement not found' }), {
        status: 404,
        headers: jsonHeaders,
      });
    }

    return new Response(JSON.stringify({ success: true, announcement }), {
      status: 200,
      headers: jsonHeaders,
    });
  } catch (err) {
    console.error('[Announcements API] Error updating:', err);
    return new Response(JSON.stringify({ error: 'Failed to update announcement' }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};

// =============================================================================
// DELETE Handler - Delete Announcement
// =============================================================================

const deleteHandler = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const userRole = getUserRole(url);

  // Check permission - only admins can delete
  if (!canDeleteAnnouncements(userRole)) {
    return new Response(
      JSON.stringify({
        error: 'Permission denied',
        message: 'You do not have permission to delete announcements',
      }),
      { status: 403, headers: jsonHeaders },
    );
  }

  try {
    const body = await request.json();
    const { id } = body as { id: string };

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing announcement ID' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const deleted = announcementHub.delete(id);

    if (!deleted) {
      return new Response(JSON.stringify({ error: 'Announcement not found' }), {
        status: 404,
        headers: jsonHeaders,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: jsonHeaders,
    });
  } catch (err) {
    console.error('[Announcements API] Error deleting:', err);
    return new Response(JSON.stringify({ error: 'Failed to delete announcement' }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};

// =============================================================================
// Route
// =============================================================================

export const Route = createFileRoute('/api/announcements')({
  server: {
    handlers: {
      GET: getHandler,
      POST: postHandler,
      PUT: putHandler,
      DELETE: deleteHandler,
    },
  },
});
