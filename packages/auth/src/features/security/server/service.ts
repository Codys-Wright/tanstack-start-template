import * as Effect from 'effect/Effect';
import { AuthService } from '@auth/core/server/service';

/**
 * Security Service - Wraps Better Auth security operations in Effect
 *
 * Uses auth.api methods for:
 * - Two-factor authentication (enable, verify, backup codes)
 * - Passkey management (register, list, delete)
 * - Session management (list, revoke)
 * - Password management (change password)
 * - Account management (delete account, list linked accounts)
 *
 * Note: We use type assertion (as any) because Better Auth's TypeScript types
 * don't fully expose plugin-added methods, but they exist at runtime.
 */
export class SecurityService extends Effect.Service<SecurityService>()('SecurityService', {
  dependencies: [AuthService.Default],
  effect: Effect.gen(function* () {
    const auth = yield* AuthService;
    // Type assertion needed because Better Auth types don't fully expose plugin methods
    const api = auth.api as any;

    return {
      // ========================================================================
      // Two-Factor Authentication
      // ========================================================================

      /**
       * Enable two-factor authentication for the current user
       * Returns TOTP URI for QR code and backup codes
       */
      enableTwoFactor: (input: { password: string }) =>
        Effect.tryPromise({
          try: () => api.enableTwoFactor({ body: input }),
          catch: (error) => new Error(`Failed to enable 2FA: ${error}`),
        }),

      /**
       * Disable two-factor authentication
       */
      disableTwoFactor: (input: { password: string }) =>
        Effect.tryPromise({
          try: () => api.disableTwoFactor({ body: input }),
          catch: (error) => new Error(`Failed to disable 2FA: ${error}`),
        }),

      /**
       * Verify TOTP code
       */
      verifyTOTP: (input: { code: string; trustDevice?: boolean }) =>
        Effect.tryPromise({
          try: () => api.verifyTOTP({ body: input }),
          catch: (error) => new Error(`Failed to verify TOTP: ${error}`),
        }),

      /**
       * Verify backup code
       */
      verifyBackupCode: (input: { code: string }) =>
        Effect.tryPromise({
          try: () => api.verifyBackupCode({ body: input }),
          catch: (error) => new Error(`Failed to verify backup code: ${error}`),
        }),

      /**
       * Generate new backup codes (regenerates all codes)
       */
      generateBackupCodes: (input: { password: string }) =>
        Effect.tryPromise({
          try: () => api.generateBackupCodes({ body: input }),
          catch: (error) => new Error(`Failed to generate backup codes: ${error}`),
        }),

      // ========================================================================
      // Passkey Management
      // ========================================================================

      /**
       * List user's passkeys
       */
      listPasskeys: () =>
        Effect.tryPromise({
          try: () => api.listUserPasskeys({}),
          catch: (error) => new Error(`Failed to list passkeys: ${error}`),
        }),

      /**
       * Delete a passkey
       */
      deletePasskey: (input: { id: string }) =>
        Effect.tryPromise({
          try: () => api.deletePasskey({ body: input }),
          catch: (error) => new Error(`Failed to delete passkey: ${error}`),
        }),

      // ========================================================================
      // Session Management
      // ========================================================================

      /**
       * List user's sessions
       */
      listSessions: () =>
        Effect.tryPromise({
          try: () => api.listSessions({}),
          catch: (error) => new Error(`Failed to list sessions: ${error}`),
        }),

      /**
       * Revoke a specific session
       */
      revokeSession: (input: { token: string }) =>
        Effect.tryPromise({
          try: () => api.revokeSession({ body: input }),
          catch: (error) => new Error(`Failed to revoke session: ${error}`),
        }),

      /**
       * Revoke all sessions except the current one
       */
      revokeOtherSessions: () =>
        Effect.tryPromise({
          try: () => api.revokeOtherSessions({}),
          catch: (error) => new Error(`Failed to revoke other sessions: ${error}`),
        }),

      /**
       * Revoke all sessions including the current one (logs out everywhere)
       */
      revokeSessions: () =>
        Effect.tryPromise({
          try: () => api.revokeSessions({ body: { sessionTokens: [] } }),
          catch: (error) => new Error(`Failed to revoke all sessions: ${error}`),
        }),

      // ========================================================================
      // Password Management
      // ========================================================================

      /**
       * Change password
       */
      changePassword: (input: {
        currentPassword: string;
        newPassword: string;
        revokeOtherSessions?: boolean;
      }) =>
        Effect.tryPromise({
          try: () => api.changePassword({ body: input }),
          catch: (error) => new Error(`Failed to change password: ${error}`),
        }),

      // ========================================================================
      // Account Management
      // ========================================================================

      /**
       * List linked accounts (e.g., Google, GitHub)
       */
      listAccounts: () =>
        Effect.tryPromise({
          try: () => api.listUserAccounts({}),
          catch: (error) => new Error(`Failed to list accounts: ${error}`),
        }),

      /**
       * Unlink an account
       */
      unlinkAccount: (input: { providerId: string }) =>
        Effect.tryPromise({
          try: () => api.unlinkAccount({ body: input }),
          catch: (error) => new Error(`Failed to unlink account: ${error}`),
        }),

      /**
       * Delete user account
       */
      deleteUser: (input: { password?: string }) =>
        Effect.tryPromise({
          try: () => api.deleteUser({ body: input }),
          catch: (error) => new Error(`Failed to delete account: ${error}`),
        }),
    };
  }),
}) {}
