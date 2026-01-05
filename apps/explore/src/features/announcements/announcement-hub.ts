/**
 * Announcement Hub
 *
 * Manages announcements with in-memory storage.
 * Supports SSE broadcasting for real-time updates.
 */

// =============================================================================
// Types
// =============================================================================

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  /** Who can see this announcement (role-based) */
  visibility: 'public' | 'members' | 'admins';
  authorId: string;
  authorName: string;
  published: boolean;
  publishedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface AnnouncementCreated {
  _tag: 'AnnouncementCreated';
  announcement: Announcement;
}

export interface AnnouncementUpdated {
  _tag: 'AnnouncementUpdated';
  announcement: Announcement;
}

export interface AnnouncementDeleted {
  _tag: 'AnnouncementDeleted';
  announcementId: string;
}

export interface AnnouncementPublished {
  _tag: 'AnnouncementPublished';
  announcement: Announcement;
}

export type AnnouncementEvent =
  | AnnouncementCreated
  | AnnouncementUpdated
  | AnnouncementDeleted
  | AnnouncementPublished;

// =============================================================================
// Mock Data
// =============================================================================

const SAMPLE_ANNOUNCEMENTS: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Welcome to the Platform',
    content:
      'Welcome to our new platform! We are excited to have you here. Check out our getting started guide to learn more about the features available to you.',
    priority: 'normal',
    visibility: 'public',
    authorId: 'system',
    authorName: 'System',
    published: true,
    publishedAt: Date.now() - 1000 * 60 * 60 * 24 * 7, // 1 week ago
  },
  {
    title: 'Scheduled Maintenance',
    content:
      'We will be performing scheduled maintenance on January 15th from 2:00 AM to 4:00 AM UTC. During this time, the platform may be temporarily unavailable.',
    priority: 'high',
    visibility: 'public',
    authorId: 'system',
    authorName: 'System',
    published: true,
    publishedAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
  },
  {
    title: 'New Feature: Direct Messages',
    content:
      'We have just launched direct messaging! You can now send private messages to other users. Head over to the chat page to try it out.',
    priority: 'normal',
    visibility: 'members',
    authorId: 'system',
    authorName: 'System',
    published: true,
    publishedAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
  },
  {
    title: 'Admin Meeting Notes',
    content:
      'Meeting notes from the admin sync on January 10th are now available in the shared drive. Please review before the next meeting.',
    priority: 'low',
    visibility: 'admins',
    authorId: 'admin-1',
    authorName: 'Admin User',
    published: true,
    publishedAt: Date.now() - 1000 * 60 * 30, // 30 minutes ago
  },
  {
    title: 'Draft: Upcoming Changes',
    content: 'This is a draft announcement about upcoming changes to the platform.',
    priority: 'normal',
    visibility: 'public',
    authorId: 'admin-1',
    authorName: 'Admin User',
    published: false,
  },
];

// =============================================================================
// Announcement Hub Singleton
// =============================================================================

type EventCallback = (event: AnnouncementEvent) => void;

interface Connection {
  id: string;
  callback: EventCallback;
  userRole: string;
}

class AnnouncementHub {
  private announcements = new Map<string, Announcement>();
  private connections = new Map<string, Connection>();

  constructor() {
    // Initialize with sample announcements
    for (const sample of SAMPLE_ANNOUNCEMENTS) {
      const id = crypto.randomUUID();
      const now = Date.now();
      this.announcements.set(id, {
        ...sample,
        id,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  /**
   * Register a connection for SSE updates
   */
  register(connectionId: string, userRole: string, callback: EventCallback): void {
    this.connections.set(connectionId, {
      id: connectionId,
      callback,
      userRole,
    });
    console.log(
      `[AnnouncementHub] Connection registered: ${connectionId} (${this.connections.size} total)`,
    );
  }

  /**
   * Unregister a connection
   */
  unregister(connectionId: string): void {
    this.connections.delete(connectionId);
    console.log(
      `[AnnouncementHub] Connection unregistered: ${connectionId} (${this.connections.size} total)`,
    );
  }

  /**
   * Broadcast an event to all connections that should see it
   */
  private broadcast(event: AnnouncementEvent, visibility: Announcement['visibility']): void {
    for (const conn of this.connections.values()) {
      // Check if user should see this announcement based on visibility
      if (this.canSeeVisibility(conn.userRole, visibility)) {
        try {
          conn.callback(event);
        } catch (err) {
          console.error(`[AnnouncementHub] Error sending to ${conn.id}:`, err);
        }
      }
    }
  }

  /**
   * Check if a role can see a visibility level
   */
  private canSeeVisibility(role: string, visibility: Announcement['visibility']): boolean {
    switch (visibility) {
      case 'public':
        return true;
      case 'members':
        return role !== 'guest' && role !== 'anonymous';
      case 'admins':
        return (
          role === 'admin' || role === 'superadmin' || role === 'moderator' || role === 'owner'
        );
      default:
        return false;
    }
  }

  /**
   * Get all announcements visible to a user role
   */
  getAll(userRole: string, includeUnpublished = false): Announcement[] {
    const visible: Announcement[] = [];
    for (const announcement of this.announcements.values()) {
      if (this.canSeeVisibility(userRole, announcement.visibility)) {
        if (includeUnpublished || announcement.published) {
          visible.push(announcement);
        }
      }
    }
    // Sort by publishedAt (most recent first), then by createdAt
    return visible.sort((a, b) => {
      const aTime = a.publishedAt ?? a.createdAt;
      const bTime = b.publishedAt ?? b.createdAt;
      return bTime - aTime;
    });
  }

  /**
   * Get a single announcement by ID
   */
  get(id: string, userRole: string): Announcement | null {
    const announcement = this.announcements.get(id);
    if (!announcement) return null;
    if (!this.canSeeVisibility(userRole, announcement.visibility)) return null;
    return announcement;
  }

  /**
   * Create a new announcement
   */
  create(
    input: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'>,
  ): Announcement {
    const id = crypto.randomUUID();
    const now = Date.now();
    const announcement: Announcement = {
      ...input,
      id,
      createdAt: now,
      updatedAt: now,
      publishedAt: input.published ? now : undefined,
    };
    this.announcements.set(id, announcement);

    if (announcement.published) {
      this.broadcast({ _tag: 'AnnouncementPublished', announcement }, announcement.visibility);
    } else {
      // Only broadcast to admins for drafts
      this.broadcast({ _tag: 'AnnouncementCreated', announcement }, 'admins');
    }

    return announcement;
  }

  /**
   * Update an announcement
   */
  update(
    id: string,
    updates: Partial<Omit<Announcement, 'id' | 'createdAt'>>,
  ): Announcement | null {
    const existing = this.announcements.get(id);
    if (!existing) return null;

    const announcement: Announcement = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: Date.now(),
    };
    this.announcements.set(id, announcement);

    this.broadcast({ _tag: 'AnnouncementUpdated', announcement }, announcement.visibility);
    return announcement;
  }

  /**
   * Delete an announcement
   */
  delete(id: string): boolean {
    const existing = this.announcements.get(id);
    if (!existing) return false;

    this.announcements.delete(id);
    this.broadcast({ _tag: 'AnnouncementDeleted', announcementId: id }, existing.visibility);
    return true;
  }

  /**
   * Publish a draft announcement
   */
  publish(id: string): Announcement | null {
    const existing = this.announcements.get(id);
    if (!existing || existing.published) return null;

    const announcement: Announcement = {
      ...existing,
      published: true,
      publishedAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.announcements.set(id, announcement);

    this.broadcast({ _tag: 'AnnouncementPublished', announcement }, announcement.visibility);
    return announcement;
  }

  /**
   * Unpublish an announcement
   */
  unpublish(id: string): Announcement | null {
    const existing = this.announcements.get(id);
    if (!existing || !existing.published) return null;

    const announcement: Announcement = {
      ...existing,
      published: false,
      publishedAt: undefined,
      updatedAt: Date.now(),
    };
    this.announcements.set(id, announcement);

    // Broadcast delete to public, update to admins
    this.broadcast({ _tag: 'AnnouncementDeleted', announcementId: id }, existing.visibility);
    this.broadcast({ _tag: 'AnnouncementUpdated', announcement }, 'admins');
    return announcement;
  }
}

// Singleton instance
export const announcementHub = new AnnouncementHub();
