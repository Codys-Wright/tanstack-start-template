import { Avatar, Button, Card, Input, Separator, cn } from '@shadcn';
import { Result, useAtom, useAtomValue } from '@effect-atom/atom-react';
import { useForm } from '@tanstack/react-form';
import {
  CameraIcon,
  CheckIcon,
  LinkIcon,
  Loader2Icon,
  MailIcon,
  PencilIcon,
  UnlinkIcon,
  UserRoundIcon,
  XIcon,
} from 'lucide-react';
import { useState } from 'react';

import {
  sessionAtom,
  updateNameAtom,
  updateImageAtom,
  changeEmailAtom,
} from '@auth/features/session/client/atoms';
import {
  accountsAtom,
  linkSocialAtom,
  unlinkAccountAtom,
} from '@auth/features/security/client/atoms';

export interface AccountSettingsCardsProps {
  className?: string;
}

// Provider display configuration
const PROVIDERS = {
  google: {
    name: 'Google',
    icon: GoogleIcon,
    color: 'text-red-500',
  },
} as const;

type SupportedProvider = keyof typeof PROVIDERS;

/**
 * AccountSettingsCards - Modern account settings page
 *
 * Features:
 * - Profile header with avatar
 * - Inline editing for name and avatar
 * - Email change with verification
 * - Connected social accounts
 */
export function AccountSettingsCards({ className }: AccountSettingsCardsProps) {
  const sessionResult = useAtomValue(sessionAtom);
  const session = Result.builder(sessionResult)
    .onSuccess((value) => value)
    .orNull();
  const user = session?.user || null;

  if (!user) return null;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Profile Card */}
      <ProfileSection user={user} />

      {/* Email Section */}
      <EmailSection user={user} />

      {/* Connected Accounts */}
      <ConnectedAccountsSection />
    </div>
  );
}

// ============================================================================
// Profile Section
// ============================================================================

interface User {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
}

function ProfileSection({ user }: { user: User }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);

  return (
    <Card>
      <Card.Header className="pb-4">
        <Card.Title className="text-lg">Profile</Card.Title>
        <Card.Description>Your public profile information</Card.Description>
      </Card.Header>
      <Card.Content className="space-y-6">
        {/* Avatar Row */}
        <div className="flex items-center gap-4">
          <ProfileAvatar user={user} isEditing={isEditingAvatar} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">Profile photo</p>
            {!isEditingAvatar ? (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-sm"
                onClick={() => setIsEditingAvatar(true)}
              >
                Change photo
              </Button>
            ) : (
              <AvatarEditForm
                currentImage={user.image}
                onCancel={() => setIsEditingAvatar(false)}
                onSuccess={() => setIsEditingAvatar(false)}
              />
            )}
          </div>
        </div>

        <Separator />

        {/* Name Row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">Display name</p>
            {!isEditingName ? (
              <p className="text-base font-medium truncate">{user.name || 'Not set'}</p>
            ) : (
              <NameEditForm
                currentName={user.name}
                onCancel={() => setIsEditingName(false)}
                onSuccess={() => setIsEditingName(false)}
              />
            )}
          </div>
          {!isEditingName && (
            <Button variant="ghost" size="icon" onClick={() => setIsEditingName(true)}>
              <PencilIcon className="size-4" />
            </Button>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}

function ProfileAvatar({ user, isEditing }: { user: User; isEditing: boolean }) {
  const name = user.name || user.email;

  return (
    <div className="relative">
      <Avatar className={cn('size-16 border-2 border-border', isEditing && 'opacity-50')}>
        <Avatar.Image src={user.image || undefined} alt={name} />
        <Avatar.Fallback className="text-lg">
          {name?.slice(0, 2).toUpperCase() || <UserRoundIcon className="size-8" />}
        </Avatar.Fallback>
      </Avatar>
      {isEditing && (
        <div className="absolute inset-0 flex items-center justify-center">
          <CameraIcon className="size-6 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

function NameEditForm({
  currentName,
  onCancel,
  onSuccess,
}: {
  currentName?: string | null;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [updateResult, updateName] = useAtom(updateNameAtom);
  const isLoading = Result.isInitial(updateResult) && updateResult.waiting;

  const form = useForm({
    defaultValues: { name: currentName || '' },
    onSubmit: async ({ value }) => {
      if (value.name.trim()) {
        updateName({ name: value.name.trim() });
      }
    },
  });

  // Handle success
  if (Result.isSuccess(updateResult)) {
    onSuccess();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
      className="flex items-center gap-2 mt-1"
    >
      <form.Field name="name">
        {(field) => (
          <Input
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            placeholder="Your name"
            className="h-8 w-48"
            autoFocus
            disabled={isLoading}
          />
        )}
      </form.Field>
      <Button type="submit" size="icon" variant="ghost" className="size-8" disabled={isLoading}>
        {isLoading ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <CheckIcon className="size-4" />
        )}
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="size-8"
        onClick={onCancel}
        disabled={isLoading}
      >
        <XIcon className="size-4" />
      </Button>
    </form>
  );
}

function AvatarEditForm({
  currentImage,
  onCancel,
  onSuccess,
}: {
  currentImage?: string | null;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [updateResult, updateImage] = useAtom(updateImageAtom);
  const isLoading = Result.isInitial(updateResult) && updateResult.waiting;

  const form = useForm({
    defaultValues: { image: currentImage || '' },
    onSubmit: async ({ value }) => {
      if (value.image.trim()) {
        try {
          new URL(value.image);
          updateImage({ image: value.image.trim() });
        } catch {
          // Invalid URL
        }
      }
    },
  });

  // Handle success
  if (Result.isSuccess(updateResult)) {
    onSuccess();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
      className="flex items-center gap-2 mt-1"
    >
      <form.Field name="image">
        {(field) => (
          <Input
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            placeholder="https://example.com/photo.jpg"
            className="h-8 flex-1 text-xs"
            autoFocus
            disabled={isLoading}
          />
        )}
      </form.Field>
      <Button type="submit" size="icon" variant="ghost" className="size-8" disabled={isLoading}>
        {isLoading ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <CheckIcon className="size-4" />
        )}
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="size-8"
        onClick={onCancel}
        disabled={isLoading}
      >
        <XIcon className="size-4" />
      </Button>
    </form>
  );
}

// ============================================================================
// Email Section
// ============================================================================

function EmailSection({ user }: { user: User }) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Card>
      <Card.Header className="pb-4">
        <Card.Title className="text-lg flex items-center gap-2">
          <MailIcon className="size-4" />
          Email
        </Card.Title>
        <Card.Description>Manage your email address</Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            {!isEditing ? (
              <>
                <p className="text-sm font-medium text-muted-foreground">Email address</p>
                <p className="text-base truncate">{user.email}</p>
              </>
            ) : (
              <EmailEditForm
                currentEmail={user.email}
                onCancel={() => setIsEditing(false)}
                onSuccess={() => setIsEditing(false)}
              />
            )}
          </div>
          {!isEditing && (
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
              <PencilIcon className="size-4" />
            </Button>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}

function EmailEditForm({
  currentEmail,
  onCancel,
  onSuccess,
}: {
  currentEmail: string;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [changeResult, changeEmail] = useAtom(changeEmailAtom);
  const [submitted, setSubmitted] = useState(false);
  const isLoading = Result.isInitial(changeResult) && changeResult.waiting;

  const form = useForm({
    defaultValues: { newEmail: '' },
    onSubmit: async ({ value }) => {
      if (value.newEmail.trim() && value.newEmail !== currentEmail) {
        changeEmail({ newEmail: value.newEmail.trim() });
        setSubmitted(true);
      }
    },
  });

  const error = Result.builder(changeResult)
    .onFailure((f) => f)
    .orNull();

  // Show success message
  if (submitted && Result.isSuccess(changeResult)) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-green-600">
          Verification email sent! Check your inbox to confirm the change.
        </p>
        <Button variant="outline" size="sm" onClick={onCancel}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
      className="space-y-3"
    >
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">Current email</p>
        <p className="text-sm text-muted-foreground">{currentEmail}</p>
      </div>
      <form.Field
        name="newEmail"
        validators={{
          onChange: ({ value }) => {
            if (!value) return 'Email is required';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
            if (value === currentEmail) return 'Must be different from current email';
            return undefined;
          },
        }}
      >
        {(field) => (
          <div className="space-y-1">
            <label className="text-sm font-medium">New email</label>
            <Input
              type="email"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="newemail@example.com"
              autoFocus
              disabled={isLoading}
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-xs text-destructive">{field.state.meta.errors[0]}</p>
            )}
          </div>
        )}
      </form.Field>

      {error && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : 'Failed to update email'}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2Icon className="size-4 mr-1 animate-spin" />
              Sending...
            </>
          ) : (
            'Send verification'
          )}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ============================================================================
// Connected Accounts Section
// ============================================================================

function ConnectedAccountsSection() {
  const accountsResult = useAtomValue(accountsAtom);
  const [linkResult, linkSocial] = useAtom(linkSocialAtom);
  const [unlinkResult, unlinkAccount] = useAtom(unlinkAccountAtom);

  const accounts = Result.builder(accountsResult)
    .onSuccess((v) => v)
    .orNull();

  const isLinking = Result.isInitial(linkResult) && linkResult.waiting;
  const isUnlinking = Result.isInitial(unlinkResult) && unlinkResult.waiting;

  const isProviderLinked = (providerId: string) =>
    accounts?.some((a) => a.providerId === providerId) ?? false;

  const getLinkedAccount = (providerId: string) =>
    accounts?.find((a) => a.providerId === providerId);

  const handleLink = (provider: SupportedProvider) => {
    linkSocial({ provider });
  };

  const handleUnlink = (providerId: string) => {
    const account = getLinkedAccount(providerId);
    if (account) {
      unlinkAccount({ providerId, accountId: account.id });
    }
  };

  return (
    <Card>
      <Card.Header className="pb-4">
        <Card.Title className="text-lg flex items-center gap-2">
          <LinkIcon className="size-4" />
          Connected Accounts
        </Card.Title>
        <Card.Description>Link accounts for easier sign in</Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="space-y-3">
          {(Object.keys(PROVIDERS) as SupportedProvider[]).map((providerId) => {
            const provider = PROVIDERS[providerId];
            const isLinked = isProviderLinked(providerId);
            const Icon = provider.icon;

            return (
              <div
                key={providerId}
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'size-8 flex items-center justify-center rounded-full bg-background',
                      provider.color,
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{provider.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {isLinked ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>

                {isLinked ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnlink(providerId)}
                    disabled={isUnlinking}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    {isUnlinking ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <>
                        <UnlinkIcon className="size-4 mr-1" />
                        Disconnect
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLink(providerId)}
                    disabled={isLinking}
                  >
                    {isLinking ? <Loader2Icon className="size-4 animate-spin" /> : 'Connect'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </Card.Content>
    </Card>
  );
}

// ============================================================================
// Icons
// ============================================================================

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
