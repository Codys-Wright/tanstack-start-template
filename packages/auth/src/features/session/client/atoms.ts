import { Atom, Result } from '@effect-atom/atom-react';
import * as Effect from 'effect/Effect';
import { authClient } from './client';
import type { SessionData, SignInInput, SignUpInput } from '../domain/schema';

/**
 * AuthApi - Effect Service wrapper around Better Auth client
 *
 * This wraps the Better Auth React client in Effect, allowing us to use
 * Effect-Atom for state management while leveraging Better Auth's proven
 * cookie handling and session management.
 *
 * Better Auth automatically handles:
 * - HTTP-only cookies with credentials: "include"
 * - Session refresh on window focus
 * - Cross-tab synchronization
 * - Cookie chunking for large sessions
 */
class AuthApi extends Effect.Service<AuthApi>()('@features/auth/AuthApi', {
  effect: Effect.sync(() => ({
    getSession: () =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.getSession();
          return result.data as SessionData;
        },
        catch: (error) => new Error(`Failed to get session: ${error}`),
      }),

    signIn: (input: SignInInput) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.signIn.email({
            email: input.email,
            password: input.password,
            callbackURL: input.callbackURL,
            rememberMe: input.rememberMe,
          });
          if (result.error) {
            throw new Error(result.error.message || 'Sign in failed');
          }
          return result.data;
        },
        catch: (error) =>
          new Error(`Sign in failed: ${error instanceof Error ? error.message : error}`),
      }),

    signInWithGoogle: () =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.signIn.social({
            provider: 'google',
            callbackURL: `${window.location.origin}/auth/callback`,
          });
          if (result.error) {
            throw new Error(result.error.message || 'Google sign in failed');
          }
          // OAuth redirect happens automatically, this won't return
          return result.data;
        },
        catch: (error) => new Error(`Google sign in failed: ${error}`),
      }),

    signInWithPasskey: () =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.signIn.passkey();
          if (result.error) {
            throw new Error(result.error.message || 'Passkey sign in failed');
          }
          return result.data;
        },
        catch: (error) => new Error(`Passkey sign in failed: ${error}`),
      }),

    signInAnonymously: () =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.signIn.anonymous();
          if (result.error) {
            throw new Error(result.error.message || 'Anonymous sign in failed');
          }
          return result.data;
        },
        catch: (error) =>
          new Error(
            `Anonymous sign in failed: ${error instanceof Error ? error.message : String(error)}`,
          ),
      }),

    signOut: () =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.signOut();
          return result.data;
        },
        catch: (error) => new Error(`Sign out failed: ${error}`),
      }),

    signUp: (input: SignUpInput) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.signUp.email({
            name: input.name,
            email: input.email,
            password: input.password,
            image: input.image,
            callbackURL: input.callbackURL,
          });
          if (result.error) {
            throw new Error(result.error.message || 'Sign up failed');
          }
          return result.data;
        },
        catch: (error) =>
          new Error(`Sign up failed: ${error instanceof Error ? error.message : error}`),
      }),

    forgotPassword: (email: string) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.requestPasswordReset({
            email,
            redirectTo: `${window.location.origin}/auth/reset-password`,
          });
          if (result.error) {
            throw new Error(result.error.message || 'Password reset request failed');
          }
          return result.data;
        },
        catch: (error) =>
          new Error(
            `Password reset request failed: ${
              error instanceof Error ? error.message : String(error)
            }`,
          ),
      }),

    resetPassword: (newPassword: string, token: string) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.resetPassword({
            newPassword,
            token,
          });
          if (result.error) {
            throw new Error(result.error.message || 'Password reset failed');
          }
          return result.data;
        },
        catch: (error) =>
          new Error(
            `Password reset failed: ${error instanceof Error ? error.message : String(error)}`,
          ),
      }),

    verifyTwoFactor: (code: string, trustDevice?: boolean) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.twoFactor.verifyOtp({
            code,
            trustDevice: trustDevice ?? false,
          });
          if (result.error) {
            throw new Error(result.error.message || '2FA verification failed');
          }
          return result.data;
        },
        catch: (error) =>
          new Error(
            `2FA verification failed: ${error instanceof Error ? error.message : String(error)}`,
          ),
      }),

    recoverAccount: (code: string) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.twoFactor.verifyBackupCode({
            code,
          });
          if (result.error) {
            throw new Error(result.error.message || 'Account recovery failed');
          }
          return result.data;
        },
        catch: (error) =>
          new Error(
            `Account recovery failed: ${error instanceof Error ? error.message : String(error)}`,
          ),
      }),

    updateName: (name: string) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.updateUser({
            name,
          });
          if (result.error) {
            throw new Error(result.error.message || 'Failed to update name');
          }
          return result.data;
        },
        catch: (error) =>
          new Error(
            `Failed to update name: ${error instanceof Error ? error.message : String(error)}`,
          ),
      }),

    updateImage: (image: string) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.updateUser({
            image,
          });
          if (result.error) {
            throw new Error(result.error.message || 'Failed to update avatar');
          }
          return result.data;
        },
        catch: (error) =>
          new Error(
            `Failed to update avatar: ${error instanceof Error ? error.message : String(error)}`,
          ),
      }),

    changeEmail: (newEmail: string) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.changeEmail({
            newEmail,
            callbackURL: `${window.location.origin}/account/settings`,
          });
          if (result.error) {
            throw new Error(result.error.message || 'Failed to change email');
          }
          return result.data;
        },
        catch: (error) =>
          new Error(
            `Failed to change email: ${error instanceof Error ? error.message : String(error)}`,
          ),
      }),

    changePassword: (currentPassword: string, newPassword: string, revokeOtherSessions?: boolean) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.changePassword({
            currentPassword,
            newPassword,
            revokeOtherSessions,
          });
          if (result.error) {
            throw new Error(result.error.message || 'Failed to change password');
          }
          return result.data;
        },
        catch: (error) =>
          new Error(
            `Failed to change password: ${error instanceof Error ? error.message : String(error)}`,
          ),
      }),

    deleteAccount: (password: string) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.deleteUser({
            password,
          });
          if (result.error) {
            throw new Error(result.error.message || 'Failed to delete account');
          }
          return result.data;
        },
        catch: (error) =>
          new Error(
            `Failed to delete account: ${error instanceof Error ? error.message : String(error)}`,
          ),
      }),
  })),
}) {}

/**
 * Runtime for auth atoms - provides AuthApi service
 */
export const authRuntime = Atom.runtime(AuthApi.Default);

/**
 * sessionAtom - Reactive atom for current authentication session
 *
 * Uses Better Auth client under the hood, which automatically:
 * - Sends HTTP-only cookies with requests
 * - Refreshes session on window focus
 * - Syncs across browser tabs
 *
 * The atom is kept alive to prevent re-fetching on every component mount.
 * During SSR, returns null to avoid multiple server-side fetches - the session
 * will be fetched once on the client after hydration.
 *
 * Uses a deduplication promise to ensure only one fetch happens even if
 * multiple components subscribe simultaneously.
 */
export const sessionAtom = (() => {
  // Deduplication: track in-flight request to prevent multiple simultaneous fetches
  let inFlightPromise: Promise<SessionData> | null = null;

  const remoteAtom = authRuntime
    .atom(
      Effect.gen(function* () {
        // Skip fetching during SSR - session will be fetched on client
        if (typeof window === 'undefined') {
          return null as SessionData;
        }

        // If there's already a request in flight, wait for it
        if (inFlightPromise) {
          return yield* Effect.tryPromise({
            try: () => inFlightPromise!,
            catch: (error) => new Error(`Failed to get session: ${error}`),
          });
        }

        const api = yield* AuthApi;

        // Create the promise and store it for deduplication
        const sessionEffect = api.getSession();
        inFlightPromise = Effect.runPromise(sessionEffect).finally(() => {
          inFlightPromise = null;
        });

        return yield* Effect.tryPromise({
          try: () => inFlightPromise!,
          catch: (error) => new Error(`Failed to get session: ${error}`),
        });
      }),
    )
    .pipe(Atom.keepAlive);

  return Object.assign(
    Atom.writable(
      (get) => get(remoteAtom),
      // Allow manually updating session (for optimistic updates after signIn)
      (ctx, session: SessionData) => {
        ctx.setSelf(Result.success(session));
      },
      // Refresh function
      (refresh) => {
        refresh(remoteAtom);
      },
    ).pipe(Atom.keepAlive),
    { remote: remoteAtom },
  );
})();

/**
 * signInAtom - Atom effect for signing in with email/password
 *
 * On success:
 * 1. Returns SignInResponse
 * 2. Optimistically updates sessionAtom with fresh session data
 */
export const signInAtom = authRuntime.fn<SignInInput>()(
  Effect.fnUntraced(function* (input, get) {
    const api = yield* AuthApi;
    const signInResponse = yield* api.signIn(input);

    // After successful sign-in, fetch fresh session to update sessionAtom
    const freshSession = yield* api.getSession();
    get.set(sessionAtom, freshSession);

    return signInResponse;
  }),
);

/**
 * signInWithGoogleAtom - Atom effect for signing in with Google OAuth
 *
 * Initiates OAuth flow which redirects to Google and back to callback URL.
 * Session will be established after callback redirect.
 */
export const signInWithGoogleAtom = authRuntime.fn<void>()(
  Effect.fnUntraced(function* (_input, _get) {
    const api = yield* AuthApi;
    return yield* api.signInWithGoogle();
  }),
);

/**
 * signInWithPasskeyAtom - Atom effect for signing in with passkey
 *
 * On success:
 * 1. Prompts user for WebAuthn authentication
 * 2. Updates sessionAtom with fresh session data
 */
export const signInWithPasskeyAtom = authRuntime.fn<void>()(
  Effect.fnUntraced(function* (_input, get) {
    const api = yield* AuthApi;
    yield* api.signInWithPasskey();

    // After successful passkey sign-in, fetch fresh session
    const freshSession = yield* api.getSession();
    get.set(sessionAtom, freshSession);
  }),
);

/**
 * signOutAtom - Atom effect for signing out
 *
 * On success:
 * 1. Returns SignOutResponse
 * 2. Clears sessionAtom (sets to null)
 */
export const signOutAtom = authRuntime.fn<void>()(
  Effect.fnUntraced(function* (_input, get) {
    const api = yield* AuthApi;
    const result = yield* api.signOut();

    // Clear session after sign-out
    get.set(sessionAtom, null);

    return result;
  }),
);

/**
 * signUpAtom - Atom effect for signing up with email/password
 *
 * On success:
 * 1. Returns SignUpResponse
 * 2. Optimistically updates sessionAtom with fresh session data
 */
export const signUpAtom = authRuntime.fn<SignUpInput>()(
  Effect.fnUntraced(function* (input, get) {
    const api = yield* AuthApi;
    const signUpResponse = yield* api.signUp(input);

    // After successful sign-up, fetch fresh session to update sessionAtom
    const freshSession = yield* api.getSession();
    get.set(sessionAtom, freshSession);

    return signUpResponse;
  }),
);

/**
 * forgotPasswordAtom - Atom effect for requesting password reset
 *
 * On success:
 * 1. Sends password reset email to user
 * 2. User can then use the link in email to reset their password
 */
export const forgotPasswordAtom = authRuntime.fn<{ email: string }>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* AuthApi;
    return yield* api.forgotPassword(input.email);
  }),
);

/**
 * resetPasswordAtom - Atom effect for resetting password with token
 *
 * On success:
 * 1. Updates user's password
 * 2. User can then sign in with new password
 */
export const resetPasswordAtom = authRuntime.fn<{
  newPassword: string;
  token: string;
}>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* AuthApi;
    return yield* api.resetPassword(input.newPassword, input.token);
  }),
);

/**
 * verifyTwoFactorAtom - Atom effect for verifying 2FA code
 *
 * On success:
 * 1. Verifies OTP code
 * 2. Updates sessionAtom with fresh session data
 * 3. Optionally trusts the device for future logins
 */
export const verifyTwoFactorAtom = authRuntime.fn<{
  code: string;
  trustDevice?: boolean;
}>()(
  Effect.fnUntraced(function* (input, get) {
    const api = yield* AuthApi;
    const result = yield* api.verifyTwoFactor(input.code, input.trustDevice);

    // After successful 2FA verification, fetch fresh session
    const freshSession = yield* api.getSession();
    get.set(sessionAtom, freshSession);

    return result;
  }),
);

/**
 * recoverAccountAtom - Atom effect for account recovery using backup codes
 *
 * On success:
 * 1. Uses backup code to recover account
 * 2. Updates sessionAtom with fresh session data
 */
export const recoverAccountAtom = authRuntime.fn<{ code: string }>()(
  Effect.fnUntraced(function* (input, get) {
    const api = yield* AuthApi;
    const result = yield* api.recoverAccount(input.code);

    // After successful recovery, fetch fresh session
    const freshSession = yield* api.getSession();
    get.set(sessionAtom, freshSession);

    return result;
  }),
);

/**
 * updateNameAtom - Atom effect for updating user name
 *
 * On success:
 * 1. Updates user name
 * 2. Updates sessionAtom with fresh session data
 */
export const updateNameAtom = authRuntime.fn<{ name: string }>()(
  Effect.fnUntraced(function* (input, get) {
    const api = yield* AuthApi;
    const result = yield* api.updateName(input.name);

    // After successful update, fetch fresh session
    const freshSession = yield* api.getSession();
    get.set(sessionAtom, freshSession);

    return result;
  }),
);

/**
 * updateImageAtom - Atom effect for updating user avatar
 *
 * On success:
 * 1. Updates user avatar
 * 2. Updates sessionAtom with fresh session data
 */
export const updateImageAtom = authRuntime.fn<{ image: string }>()(
  Effect.fnUntraced(function* (input, get) {
    const api = yield* AuthApi;
    const result = yield* api.updateImage(input.image);

    // After successful update, fetch fresh session
    const freshSession = yield* api.getSession();
    get.set(sessionAtom, freshSession);

    return result;
  }),
);

/**
 * changeEmailAtom - Atom effect for changing user email
 *
 * On success:
 * 1. Initiates email change process
 * 2. User must verify new email via link
 */
export const changeEmailAtom = authRuntime.fn<{ newEmail: string }>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* AuthApi;
    return yield* api.changeEmail(input.newEmail);
  }),
);

/**
 * changePasswordAtom - Atom effect for changing user password
 *
 * On success:
 * 1. Changes user password
 * 2. Optionally revokes other sessions
 */
export const changePasswordAtom = authRuntime.fn<{
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions?: boolean;
}>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* AuthApi;
    return yield* api.changePassword(
      input.currentPassword,
      input.newPassword,
      input.revokeOtherSessions,
    );
  }),
);

/**
 * deleteAccountAtom - Atom effect for deleting user account
 *
 * Requires password confirmation
 */
export const deleteAccountAtom = authRuntime.fn<{ password: string }>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* AuthApi;
    return yield* api.deleteAccount(input.password);
  }),
);

/**
 * signInAnonymouslyAtom - Atom effect for signing in anonymously
 *
 * Creates a temporary user account without requiring email/password.
 * The user can later upgrade their account by linking a social provider or email/password.
 *
 * On success:
 * 1. Creates anonymous user
 * 2. Updates sessionAtom with the new session
 *
 * @example
 * ```tsx
 * const signInAnonymously = useAtomSet(signInAnonymouslyAtom, { mode: 'promise' });
 *
 * const handleStartQuiz = async () => {
 *   await signInAnonymously({});
 *   // User is now signed in anonymously, can take quiz
 * };
 * ```
 */
export const signInAnonymouslyAtom = authRuntime.fn<void>()(
  Effect.fnUntraced(function* (_input, get) {
    const api = yield* AuthApi;
    const result = yield* api.signInAnonymously();

    // After successful anonymous sign-in, fetch fresh session
    const freshSession = yield* api.getSession();
    get.set(sessionAtom, freshSession);

    return result;
  }),
);

/**
 * isAnonymousAtom - Derived atom that checks if current user is anonymous
 *
 * @example
 * ```tsx
 * const isAnonymous = useAtomValue(isAnonymousAtom);
 *
 * if (isAnonymous) {
 *   // Show "Create Account" prompt
 * }
 * ```
 */
export const isAnonymousAtom = Atom.readable((get) => {
  const sessionResult = get(sessionAtom);

  if (!Result.isSuccess(sessionResult)) {
    return false;
  }

  const session = sessionResult.value;
  if (!session?.user) {
    return false;
  }

  // Check if user has isAnonymous flag set
  return (session.user as { isAnonymous?: boolean }).isAnonymous === true;
});

/**
 * isAdminAtom - Derived atom that checks if current user has admin role
 *
 * @example
 * ```tsx
 * const isAdmin = useAtomValue(isAdminAtom);
 *
 * if (isAdmin) {
 *   // Show admin-only UI
 * }
 * ```
 */
export const isAdminAtom = Atom.readable((get) => {
  const sessionResult = get(sessionAtom);

  if (!Result.isSuccess(sessionResult)) {
    return false;
  }

  const session = sessionResult.value;
  if (!session?.user) {
    return false;
  }

  const role = session.user.role;
  return role === 'admin';
});
