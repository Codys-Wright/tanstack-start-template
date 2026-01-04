'use client';

import { useState } from 'react';
import { useAtomSet, useAtomValue, Result } from '@effect-atom/atom-react';
import { useRouter } from '@tanstack/react-router';
import { Button, Card, Input, Label, cn, Separator } from '@shadcn';
import { CheckCircle2, Mail, Lock, User, Loader2 } from 'lucide-react';
import {
  sessionAtom,
  signUpAtom,
  signInWithGoogleAtom,
} from '@auth/features/session/client/atoms.js';

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

export interface ClaimAccountFormProps {
  className?: string;
  /** URL to redirect to after successful account claim */
  callbackURL?: string;
  /** Called after successful account claim */
  onSuccess?: () => void;
}

/**
 * ClaimAccountForm - Form for anonymous users to claim their account
 *
 * Allows anonymous users to upgrade their temporary account to a full account
 * by either:
 * 1. Creating an email/password account
 * 2. Linking with Google OAuth
 *
 * When an anonymous user signs up or links a social account, their existing
 * data (quiz responses, etc.) is automatically migrated to the new account.
 */
export function ClaimAccountForm({
  className,
  callbackURL = '/account/settings',
  onSuccess,
}: ClaimAccountFormProps) {
  const router = useRouter();
  const sessionResult = useAtomValue(sessionAtom);
  const signUp = useAtomSet(signUpAtom, { mode: 'promise' });
  const signInWithGoogle = useAtomSet(signInWithGoogleAtom, {
    mode: 'promise',
  });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Get current user info for pre-filling
  const session = Result.isSuccess(sessionResult) ? sessionResult.value : null;
  const isAnonymous = session?.user && (session.user as { isAnonymous?: boolean }).isAnonymous;

  // If not anonymous, show a message
  if (session && !isAnonymous) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
          <h2 className="text-xl font-semibold">Account Already Claimed</h2>
          <p className="text-muted-foreground">
            Your account is already set up with {session.user?.email}.
          </p>
        </div>
      </Card>
    );
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!password) {
      setError('Please enter a password');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await signUp({
        name: name.trim(),
        email: email.trim(),
        password,
        callbackURL,
      });
      setSuccess(true);
      onSuccess?.();
      // Redirect to account page after successful signup
      router.navigate({ to: callbackURL as '/account/settings' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      // OAuth will redirect, so we don't need to handle success here
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
      setIsGoogleLoading(false);
    }
  };

  if (success) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
          <h2 className="text-xl font-semibold">Account Created!</h2>
          <p className="text-muted-foreground">
            Your account has been successfully created and your data has been preserved.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Claim Your Account</h2>
          <p className="text-muted-foreground">
            Create a permanent account to save your quiz results and access them anytime.
          </p>
        </div>

        {/* Google Sign Up */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || isLoading}
        >
          {isGoogleLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <GoogleIcon className="h-4 w-4 mr-2" />
          )}
          Continue with Google
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
          </div>
        </div>

        {/* Email Sign Up Form */}
        <form onSubmit={handleEmailSignUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        {/* Info */}
        <p className="text-xs text-center text-muted-foreground">
          Your quiz results and data will be automatically linked to your new account.
        </p>
      </div>
    </Card>
  );
}
