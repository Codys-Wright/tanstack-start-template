import { Badge, Button, Card, cn, Skeleton } from '@shadcn';
import { Result, useAtom, useAtomValue, useAtomRefresh } from '@effect-atom/atom-react';
import {
  KeyIcon,
  MonitorIcon,
  SmartphoneIcon,
  TabletIcon,
  GlobeIcon,
  Loader2Icon,
  LogOutIcon,
  ShieldCheckIcon,
} from 'lucide-react';
import { useEffect } from 'react';
import { sessionAtom } from '@auth/features/session/client/atoms';
import {
  sessionsAtom,
  revokeSessionAtom,
  revokeOtherSessionsAtom,
} from '@auth/features/security/client/atoms';

export interface SecuritySettingsCardsProps {
  className?: string;
}

export function SecuritySettingsCards({ className }: SecuritySettingsCardsProps) {
  const sessionResult = useAtomValue(sessionAtom);
  const user = Result.isSuccess(sessionResult) ? sessionResult.value?.user : null;

  if (!user) return null;

  return (
    <div className={cn('flex w-full flex-col gap-4 md:gap-6', className)}>
      {/* Active Sessions Card */}
      <ActiveSessionsCard />

      {/* Change Password Card */}
      <ChangePasswordCard />

      {/* Two-Factor Authentication Card */}
      <TwoFactorCard />
    </div>
  );
}

// ============================================================================
// Active Sessions Card
// ============================================================================

interface Session {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

function ActiveSessionsCard() {
  const sessionsResult = useAtomValue(sessionsAtom);
  const refreshSessions = useAtomRefresh(sessionsAtom);
  const currentSessionResult = useAtomValue(sessionAtom);
  const [revokeResult, revokeSession] = useAtom(revokeSessionAtom);
  const [revokeOthersResult, revokeOtherSessions] = useAtom(revokeOtherSessionsAtom);

  const sessions = Result.builder(sessionsResult)
    .onSuccess((v) => v as Session[])
    .orNull();

  const currentSession = Result.builder(currentSessionResult)
    .onSuccess((v) => v)
    .orNull();

  const error = Result.builder(sessionsResult)
    .onFailure((e) => e)
    .orNull();

  // Show loading when initial or when waiting for refresh
  const isLoading = Result.isInitial(sessionsResult) || sessionsResult.waiting;
  const isRevoking = Result.isInitial(revokeResult) && revokeResult.waiting;
  const isRevokingOthers = Result.isInitial(revokeOthersResult) && revokeOthersResult.waiting;

  // Refresh sessions list after successful revocation
  useEffect(() => {
    if (Result.isSuccess(revokeResult) || Result.isSuccess(revokeOthersResult)) {
      refreshSessions();
    }
  }, [revokeResult, revokeOthersResult, refreshSessions]);

  const handleRevokeSession = (token: string) => {
    revokeSession({ token });
  };

  const handleRevokeOtherSessions = () => {
    revokeOtherSessions();
  };

  // Count other sessions (not current)
  const otherSessionsCount = sessions
    ? sessions.filter((s) => s.token !== currentSession?.session?.token).length
    : 0;

  return (
    <Card>
      <Card.Header className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <Card.Title className="flex items-center gap-2 text-lg">
              <MonitorIcon className="size-4" />
              Active Sessions
            </Card.Title>
            <Card.Description>Manage your active login sessions across devices</Card.Description>
          </div>
          {otherSessionsCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevokeOtherSessions}
              disabled={isRevokingOthers}
              className="text-destructive hover:text-destructive"
            >
              {isRevokingOthers ? (
                <Loader2Icon className="size-4 animate-spin mr-1" />
              ) : (
                <LogOutIcon className="size-4 mr-1" />
              )}
              Sign out other sessions
            </Button>
          )}
        </div>
      </Card.Header>

      <Card.Content>
        {error ? (
          <div className="text-center py-6 text-destructive">
            <MonitorIcon className="mx-auto size-8 mb-2 opacity-50" />
            <p>Failed to load sessions</p>
            <p className="text-sm mt-1 text-muted-foreground">
              {error instanceof Error ? error.message : 'Please try again later'}
            </p>
          </div>
        ) : isLoading && !sessions ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                <Skeleton className="size-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : sessions && sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((session) => {
              const isCurrentSession = session.token === currentSession?.session?.token;
              const deviceInfo = parseUserAgent(session.userAgent);

              return (
                <div
                  key={session.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border',
                    isCurrentSession && 'bg-primary/5 border-primary/20',
                  )}
                >
                  <div
                    className={cn(
                      'size-10 rounded-lg flex items-center justify-center',
                      isCurrentSession
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    <DeviceIcon device={deviceInfo.device} className="size-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">
                        {deviceInfo.browser} on {deviceInfo.os}
                      </p>
                      {isCurrentSession && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      {session.ipAddress && (
                        <>
                          <GlobeIcon className="size-3" />
                          <span>{session.ipAddress}</span>
                          <span>·</span>
                        </>
                      )}
                      <span>{formatSessionDate(session.createdAt)}</span>
                    </div>
                  </div>

                  {!isCurrentSession && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeSession(session.token)}
                      disabled={isRevoking}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      {isRevoking ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : (
                        <LogOutIcon className="size-4" />
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <MonitorIcon className="mx-auto size-8 mb-2 opacity-50" />
            <p>No active sessions found</p>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}

// Parse user agent to extract device, browser, and OS info
function parseUserAgent(userAgent?: string): {
  device: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  os: string;
} {
  if (!userAgent) {
    return { device: 'unknown', browser: 'Unknown Browser', os: 'Unknown OS' };
  }

  // Detect device type
  let device: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'desktop';
  if (/tablet|ipad/i.test(userAgent)) {
    device = 'tablet';
  } else if (/mobile|iphone|android.*mobile/i.test(userAgent)) {
    device = 'mobile';
  }

  // Detect browser
  let browser = 'Unknown Browser';
  if (/edg/i.test(userAgent)) {
    browser = 'Edge';
  } else if (/chrome/i.test(userAgent) && !/chromium/i.test(userAgent)) {
    browser = 'Chrome';
  } else if (/firefox/i.test(userAgent)) {
    browser = 'Firefox';
  } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
    browser = 'Safari';
  } else if (/opera|opr/i.test(userAgent)) {
    browser = 'Opera';
  }

  // Detect OS
  let os = 'Unknown OS';
  if (/windows/i.test(userAgent)) {
    os = 'Windows';
  } else if (/macintosh|mac os/i.test(userAgent)) {
    os = 'macOS';
  } else if (/linux/i.test(userAgent) && !/android/i.test(userAgent)) {
    os = 'Linux';
  } else if (/iphone|ipad/i.test(userAgent)) {
    os = 'iOS';
  } else if (/android/i.test(userAgent)) {
    os = 'Android';
  }

  return { device, browser, os };
}

// Device icon component
function DeviceIcon({
  device,
  className,
}: {
  device: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  className?: string;
}) {
  switch (device) {
    case 'mobile':
      return <SmartphoneIcon className={className} />;
    case 'tablet':
      return <TabletIcon className={className} />;
    case 'desktop':
    default:
      return <MonitorIcon className={className} />;
  }
}

// Format session date
function formatSessionDate(date: Date): string {
  const now = new Date();
  const sessionDate = new Date(date);
  const diffMs = now.getTime() - sessionDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      if (diffMinutes < 1) return 'Just now';
      return `${diffMinutes}m ago`;
    }
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return sessionDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  }
}

// ============================================================================
// Change Password Card
// ============================================================================

function ChangePasswordCard() {
  return (
    <Card>
      <Card.Header>
        <Card.Title className="flex items-center gap-2 text-lg">
          <KeyIcon className="size-4" />
          Change Password
        </Card.Title>
        <Card.Description>Update your password to keep your account secure.</Card.Description>
      </Card.Header>

      <Card.Content>
        <div className="text-center py-8 text-muted-foreground">
          <KeyIcon className="mx-auto size-8 mb-2 opacity-50" />
          <p>Password change functionality coming soon...</p>
          <p className="text-sm mt-1">For now, use the forgot password feature if needed.</p>
        </div>
      </Card.Content>
    </Card>
  );
}

// ============================================================================
// Two-Factor Authentication Card
// ============================================================================

function TwoFactorCard() {
  return (
    <Card>
      <Card.Header>
        <Card.Title className="flex items-center gap-2 text-lg">
          <ShieldCheckIcon className="size-4" />
          Two-Factor Authentication
        </Card.Title>
        <Card.Description>
          Add an extra layer of security to your account with 2FA.
        </Card.Description>
      </Card.Header>

      <Card.Content>
        <div className="text-center py-8 text-muted-foreground">
          <ShieldCheckIcon className="mx-auto size-8 mb-2 opacity-50" />
          <p>Two-factor authentication coming soon...</p>
          <p className="text-sm mt-1">Use authenticator apps or SMS for added security.</p>
        </div>
      </Card.Content>
    </Card>
  );
}
