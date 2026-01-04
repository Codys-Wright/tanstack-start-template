'use client';

import { useState } from 'react';
import { useAtomValue, useAtomSet, useAtomRefresh, Result } from '@effect-atom/atom-react';
import { Button, Card, cn, Badge } from '@shadcn';
import { Link2, Unlink, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { sessionAtom } from '@auth/features/session/client/atoms.js';
import {
  accountsAtom,
  linkSocialAtom,
  unlinkAccountAtom,
} from '@auth/features/security/client/atoms.js';

// Google icon component
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export interface LinkAccountCardProps {
  className?: string;
  /** URL to redirect to after linking */
  callbackURL?: string;
}

interface LinkedAccount {
  id: string;
  providerId: string;
  accountId: string;
  createdAt?: Date;
}

/**
 * LinkAccountCard - Card for managing linked OAuth accounts
 *
 * Allows users to:
 * 1. View currently linked accounts
 * 2. Link new OAuth providers (Google, etc.)
 * 3. Unlink existing accounts
 */
export function LinkAccountCard({
  className,
  callbackURL = '/account/settings',
}: LinkAccountCardProps) {
  const sessionResult = useAtomValue(sessionAtom);
  const accountsResult = useAtomValue(accountsAtom);
  const refreshAccounts = useAtomRefresh(accountsAtom);
  const linkSocial = useAtomSet(linkSocialAtom, { mode: 'promise' });
  const unlinkAccount = useAtomSet(unlinkAccountAtom, { mode: 'promise' });

  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [unlinkingAccountId, setUnlinkingAccountId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const session = Result.isSuccess(sessionResult) ? sessionResult.value : null;
  const accounts: LinkedAccount[] = Result.isSuccess(accountsResult)
    ? (accountsResult.value as LinkedAccount[])
    : [];
  const isLoadingAccounts = !Result.isSuccess(accountsResult) && !Result.isFailure(accountsResult);

  // Check if Google is already linked
  const hasGoogleLinked = accounts.some((acc) => acc.providerId === 'google');
  // Check if user has a credential (email/password) account
  const hasCredentialAccount = accounts.some((acc) => acc.providerId === 'credential');

  // User must have at least one way to sign in
  const canUnlinkGoogle = hasGoogleLinked && (hasCredentialAccount || accounts.length > 1);

  const handleLinkGoogle = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsLinkingGoogle(true);
    try {
      await linkSocial({
        provider: 'google',
        callbackURL,
      });
      // OAuth will redirect
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link Google account');
      setIsLinkingGoogle(false);
    }
  };

  const handleUnlinkAccount = async (providerId: string, accountId: string) => {
    setError(null);
    setSuccessMessage(null);
    setUnlinkingAccountId(accountId);
    try {
      await unlinkAccount({ providerId, accountId });
      setSuccessMessage(`Successfully unlinked ${providerId} account`);
      refreshAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlink account');
    } finally {
      setUnlinkingAccountId(null);
    }
  };

  if (!session) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center text-muted-foreground">
          Please sign in to manage linked accounts.
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Linked Accounts
          </h3>
          <p className="text-sm text-muted-foreground">
            Connect your account to additional sign-in methods for easier access.
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}
        {successMessage && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            {successMessage}
          </div>
        )}

        {/* Linked Accounts List */}
        <div className="space-y-3">
          {/* Google Account */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <GoogleIcon className="h-5 w-5" />
              <div>
                <div className="font-medium">Google</div>
                {hasGoogleLinked ? (
                  <Badge variant="secondary" className="text-xs">
                    Connected
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">Not connected</span>
                )}
              </div>
            </div>
            {hasGoogleLinked ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const googleAccount = accounts.find((acc) => acc.providerId === 'google');
                  if (googleAccount) {
                    handleUnlinkAccount('google', googleAccount.accountId);
                  }
                }}
                disabled={!canUnlinkGoogle || unlinkingAccountId !== null}
              >
                {unlinkingAccountId ===
                accounts.find((acc) => acc.providerId === 'google')?.accountId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Unlink className="h-4 w-4 mr-1" />
                    Unlink
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLinkGoogle}
                disabled={isLinkingGoogle}
              >
                {isLinkingGoogle ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Link2 className="h-4 w-4 mr-1" />
                    Link
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Email/Password Account Info */}
          {hasCredentialAccount && (
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 flex items-center justify-center text-muted-foreground">
                  @
                </div>
                <div>
                  <div className="font-medium">Email & Password</div>
                  <span className="text-xs text-muted-foreground">{session.user?.email}</span>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                Primary
              </Badge>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoadingAccounts && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Info */}
        {!canUnlinkGoogle && hasGoogleLinked && !hasCredentialAccount && (
          <p className="text-xs text-muted-foreground">
            You cannot unlink your only sign-in method. Add a password or another provider first.
          </p>
        )}
      </div>
    </Card>
  );
}
