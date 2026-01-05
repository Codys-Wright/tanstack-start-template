/**
 * Announcements Page
 *
 * Displays announcements with role-based visibility.
 * Admins/moderators can create, edit, publish, and delete announcements.
 * Regular users can only view published announcements based on their role.
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Badge, Card, Dialog, Input, Textarea, Select } from '@shadcn';
import {
  ArrowLeft,
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  AlertCircle,
  Info,
  Bell,
  Shield,
  Users,
  Globe,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  visibility: 'public' | 'members' | 'admins';
  authorId: string;
  authorName: string;
  published: boolean;
  publishedAt?: number;
  createdAt: number;
  updatedAt: number;
}

type UserRole = 'guest' | 'user' | 'member' | 'moderator' | 'admin' | 'superadmin';

// =============================================================================
// Route
// =============================================================================

export const Route = createFileRoute('/announcements')({
  component: AnnouncementsPage,
});

// =============================================================================
// Helpers
// =============================================================================

const canManageAnnouncements = (role: UserRole): boolean => {
  return ['admin', 'superadmin', 'moderator'].includes(role);
};

const canDeleteAnnouncements = (role: UserRole): boolean => {
  return ['admin', 'superadmin'].includes(role);
};

const getPriorityIcon = (priority: Announcement['priority']) => {
  switch (priority) {
    case 'urgent':
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case 'high':
      return <AlertCircle className="w-4 h-4 text-orange-500" />;
    case 'normal':
      return <Info className="w-4 h-4 text-blue-500" />;
    case 'low':
      return <Bell className="w-4 h-4 text-gray-500" />;
  }
};

const getPriorityBadge = (priority: Announcement['priority']) => {
  const variants: Record<
    Announcement['priority'],
    'destructive' | 'default' | 'secondary' | 'outline'
  > = {
    urgent: 'destructive',
    high: 'default',
    normal: 'secondary',
    low: 'outline',
  };
  return (
    <Badge variant={variants[priority]} className="capitalize">
      {priority}
    </Badge>
  );
};

const getVisibilityIcon = (visibility: Announcement['visibility']) => {
  switch (visibility) {
    case 'admins':
      return <Shield className="w-4 h-4" />;
    case 'members':
      return <Users className="w-4 h-4" />;
    case 'public':
      return <Globe className="w-4 h-4" />;
  }
};

const formatDate = (timestamp: number) => {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
};

// =============================================================================
// Components
// =============================================================================

function AnnouncementsPage() {
  // Role selector for demo (in a real app, this would come from auth)
  const [selectedRole, setSelectedRole] = useState<UserRole>('member');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  const isAdmin = canManageAnnouncements(selectedRole);
  const canDelete = canDeleteAnnouncements(selectedRole);

  // Fetch announcements
  const fetchAnnouncements = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        role: selectedRole,
        drafts: isAdmin ? 'true' : 'false',
      });
      const response = await fetch(`/api/announcements?${params}`);
      const data = await response.json();
      setAnnouncements(data.announcements ?? []);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedRole, isAdmin]);

  useEffect(() => {
    setLoading(true);
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Create announcement
  const handleCreate = async (data: {
    title: string;
    content: string;
    priority: Announcement['priority'];
    visibility: Announcement['visibility'];
    published: boolean;
  }) => {
    try {
      const response = await fetch(`/api/announcements?role=${selectedRole}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          authorId: `${selectedRole}-user`,
          authorName: `${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} User`,
        }),
      });

      if (response.ok) {
        await fetchAnnouncements();
        setShowCreateDialog(false);
      }
    } catch (err) {
      console.error('Failed to create announcement:', err);
    }
  };

  // Update announcement
  const handleUpdate = async (
    id: string,
    data: Partial<Announcement> | { action: 'publish' | 'unpublish' },
  ) => {
    try {
      const response = await fetch(`/api/announcements?role=${selectedRole}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });

      if (response.ok) {
        await fetchAnnouncements();
        setEditingAnnouncement(null);
      }
    } catch (err) {
      console.error('Failed to update announcement:', err);
    }
  };

  // Delete announcement
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const response = await fetch(`/api/announcements?role=${selectedRole}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        await fetchAnnouncements();
      }
    } catch (err) {
      console.error('Failed to delete announcement:', err);
    }
  };

  // Separate published and drafts
  const publishedAnnouncements = useMemo(
    () => announcements.filter((a) => a.published),
    [announcements],
  );
  const draftAnnouncements = useMemo(
    () => announcements.filter((a) => !a.published),
    [announcements],
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b p-4 flex items-center gap-4">
        <a href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </a>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Megaphone className="w-6 h-6" />
            Announcements
          </h1>
          <p className="text-sm text-muted-foreground">
            Stay updated with the latest news and updates
          </p>
        </div>

        {/* Role Selector (Demo) */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Viewing as:</span>
          <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
            <Select.Trigger className="w-32">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="guest">Guest</Select.Item>
              <Select.Item value="member">Member</Select.Item>
              <Select.Item value="moderator">Moderator</Select.Item>
              <Select.Item value="admin">Admin</Select.Item>
              <Select.Item value="superadmin">Super Admin</Select.Item>
            </Select.Content>
          </Select>
        </div>

        {/* Create Button (Admin only) */}
        {isAdmin && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Announcement
          </Button>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-8">
        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading announcements...</div>
        ) : (
          <>
            {/* Drafts Section (Admin only) */}
            {isAdmin && draftAnnouncements.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <EyeOff className="w-5 h-5 text-muted-foreground" />
                  Drafts
                  <Badge variant="outline">{draftAnnouncements.length}</Badge>
                </h2>
                <div className="space-y-4">
                  {draftAnnouncements.map((announcement) => (
                    <AnnouncementCard
                      key={announcement.id}
                      announcement={announcement}
                      isAdmin={isAdmin}
                      canDelete={canDelete}
                      onEdit={() => setEditingAnnouncement(announcement)}
                      onPublish={() => handleUpdate(announcement.id, { action: 'publish' })}
                      onDelete={() => handleDelete(announcement.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Published Announcements */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-muted-foreground" />
                Published Announcements
                <Badge variant="secondary">{publishedAnnouncements.length}</Badge>
              </h2>

              {publishedAnnouncements.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">
                  <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No announcements to display</p>
                  {selectedRole === 'guest' && (
                    <p className="text-sm mt-2">Sign in to see member-only announcements</p>
                  )}
                </Card>
              ) : (
                <div className="space-y-4">
                  {publishedAnnouncements.map((announcement) => (
                    <AnnouncementCard
                      key={announcement.id}
                      announcement={announcement}
                      isAdmin={isAdmin}
                      canDelete={canDelete}
                      onEdit={() => setEditingAnnouncement(announcement)}
                      onUnpublish={() => handleUpdate(announcement.id, { action: 'unpublish' })}
                      onDelete={() => handleDelete(announcement.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Create Dialog */}
      <CreateAnnouncementDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={handleCreate}
      />

      {/* Edit Dialog */}
      {editingAnnouncement && (
        <EditAnnouncementDialog
          announcement={editingAnnouncement}
          onClose={() => setEditingAnnouncement(null)}
          onSave={(data) => handleUpdate(editingAnnouncement.id, data)}
        />
      )}
    </div>
  );
}

// =============================================================================
// Announcement Card
// =============================================================================

function AnnouncementCard({
  announcement,
  isAdmin,
  canDelete,
  onEdit,
  onPublish,
  onUnpublish,
  onDelete,
}: {
  announcement: Announcement;
  isAdmin: boolean;
  canDelete: boolean;
  onEdit?: () => void;
  onPublish?: () => void;
  onUnpublish?: () => void;
  onDelete?: () => void;
}) {
  return (
    <Card className={`p-4 ${!announcement.published ? 'opacity-75 border-dashed' : ''}`}>
      <div className="flex items-start gap-4">
        <div className="mt-1">{getPriorityIcon(announcement.priority)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold">{announcement.title}</h3>
            {getPriorityBadge(announcement.priority)}
            <Badge variant="outline" className="gap-1">
              {getVisibilityIcon(announcement.visibility)}
              <span className="capitalize">{announcement.visibility}</span>
            </Badge>
            {!announcement.published && <Badge variant="secondary">Draft</Badge>}
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {announcement.content}
          </p>
          <div className="text-xs text-muted-foreground mt-2">
            By {announcement.authorName} &bull;{' '}
            {announcement.publishedAt
              ? `Published ${formatDate(announcement.publishedAt)}`
              : `Created ${formatDate(announcement.createdAt)}`}
          </div>
        </div>

        {/* Admin Actions */}
        {isAdmin && (
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button variant="ghost" size="icon" onClick={onEdit}>
                <Pencil className="w-4 h-4" />
              </Button>
            )}
            {onPublish && !announcement.published && (
              <Button variant="ghost" size="icon" onClick={onPublish} title="Publish">
                <Eye className="w-4 h-4" />
              </Button>
            )}
            {onUnpublish && announcement.published && (
              <Button variant="ghost" size="icon" onClick={onUnpublish} title="Unpublish">
                <EyeOff className="w-4 h-4" />
              </Button>
            )}
            {canDelete && onDelete && (
              <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

// =============================================================================
// Create Dialog
// =============================================================================

function CreateAnnouncementDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: {
    title: string;
    content: string;
    priority: Announcement['priority'];
    visibility: Announcement['visibility'];
    published: boolean;
  }) => void;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<Announcement['priority']>('normal');
  const [visibility, setVisibility] = useState<Announcement['visibility']>('public');
  const [publishNow, setPublishNow] = useState(false);

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;
    onCreate({ title, content, priority, visibility, published: publishNow });
    setTitle('');
    setContent('');
    setPriority('normal');
    setVisibility('public');
    setPublishNow(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="sm:max-w-lg">
        <Dialog.Header>
          <Dialog.Title>Create Announcement</Dialog.Title>
          <Dialog.Description>Create a new announcement for your users.</Dialog.Description>
        </Dialog.Header>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder="Announcement title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Content</label>
            <Textarea
              placeholder="Write your announcement..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as Announcement['priority'])}
              >
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="low">Low</Select.Item>
                  <Select.Item value="normal">Normal</Select.Item>
                  <Select.Item value="high">High</Select.Item>
                  <Select.Item value="urgent">Urgent</Select.Item>
                </Select.Content>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Visibility</label>
              <Select
                value={visibility}
                onValueChange={(v) => setVisibility(v as Announcement['visibility'])}
              >
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="public">Public (Everyone)</Select.Item>
                  <Select.Item value="members">Members Only</Select.Item>
                  <Select.Item value="admins">Admins Only</Select.Item>
                </Select.Content>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="publishNow"
              checked={publishNow}
              onChange={(e) => setPublishNow(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="publishNow" className="text-sm">
              Publish immediately
            </label>
          </div>
        </div>

        <Dialog.Footer>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || !content.trim()}>
            {publishNow ? 'Create & Publish' : 'Save as Draft'}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}

// =============================================================================
// Edit Dialog
// =============================================================================

function EditAnnouncementDialog({
  announcement,
  onClose,
  onSave,
}: {
  announcement: Announcement;
  onClose: () => void;
  onSave: (data: Partial<Announcement>) => void;
}) {
  const [title, setTitle] = useState(announcement.title);
  const [content, setContent] = useState(announcement.content);
  const [priority, setPriority] = useState(announcement.priority);
  const [visibility, setVisibility] = useState(announcement.visibility);

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;
    onSave({ title, content, priority, visibility });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <Dialog.Content className="sm:max-w-lg">
        <Dialog.Header>
          <Dialog.Title>Edit Announcement</Dialog.Title>
        </Dialog.Header>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Content</label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as Announcement['priority'])}
              >
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="low">Low</Select.Item>
                  <Select.Item value="normal">Normal</Select.Item>
                  <Select.Item value="high">High</Select.Item>
                  <Select.Item value="urgent">Urgent</Select.Item>
                </Select.Content>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Visibility</label>
              <Select
                value={visibility}
                onValueChange={(v) => setVisibility(v as Announcement['visibility'])}
              >
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="public">Public (Everyone)</Select.Item>
                  <Select.Item value="members">Members Only</Select.Item>
                  <Select.Item value="admins">Admins Only</Select.Item>
                </Select.Content>
              </Select>
            </div>
          </div>
        </div>

        <Dialog.Footer>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || !content.trim()}>
            Save Changes
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
