import * as Effect from 'effect/Effect';
import { authClient } from '@auth/features/session/client/client';

/**
 * SecurityApi - Effect Service wrapper around Better Auth security operations
 *
 * Wraps Better Auth's passkey, two-factor, session, and account methods in Effect for:
 * - Type-safe error handling
 * - Integration with effect-atom state management
 * - Composable security operations
 */
export class SecurityApi extends Effect.Service<SecurityApi>()('@features/auth/SecurityApi', {
  effect: Effect.sync(() => ({
    // ===== TWO-FACTOR =====

    getTwoFactorStatus: (password: string) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.twoFactor.getTotpUri({ password });
          if (result.error) {
            throw new Error(result.error.message || 'Failed to get 2FA status');
          }
          return {
            enabled: !!result.data,
            backupCodesCount: 0,
          };
        },
        catch: (error) => new Error(`Failed to get 2FA status: ${error}`),
      }),

    enableTwoFactor: (password: string) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.twoFactor.enable({ password });
          if (result.error) {
            throw new Error(result.error.message || 'Failed to enable 2FA');
          }
          return {
            totpURI: result.data?.totpURI || '',
            backupCodes: result.data?.backupCodes || [],
          };
        },
        catch: (error) =>
          new Error(
            `Failed to enable 2FA: ${error instanceof Error ? error.message : String(error)}`,
          ),
      }),

    disableTwoFactor: (password: string) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.twoFactor.disable({ password });
          if (result.error) {
            throw new Error(result.error.message || 'Failed to disable 2FA');
          }
          return result.data;
        },
        catch: (error) =>
          new Error(
            `Failed to disable 2FA: ${error instanceof Error ? error.message : String(error)}`,
          ),
      }),

    verifyTotp: (code: string, trustDevice?: boolean) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.twoFactor.verifyTotp({
            code,
            trustDevice: trustDevice ?? false,
          });
          if (result.error) {
            throw new Error(result.error.message || 'Failed to verify 2FA code');
          }
          return result.data;
        },
        catch: (error) =>
          new Error(
            `Failed to verify 2FA code: ${error instanceof Error ? error.message : String(error)}`,
          ),
      }),

    generateBackupCodes: (password: string) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.twoFactor.generateBackupCodes({
            password,
          });
          if (result.error) {
            throw new Error(result.error.message || 'Failed to generate backup codes');
          }
          return result.data;
        },
        catch: (error) =>
          new Error(
            `Failed to generate backup codes: ${
              error instanceof Error ? error.message : String(error)
            }`,
          ),
      }),

    verifyBackupCode: (code: string) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.twoFactor.verifyBackupCode({
            code,
          });
          if (result.error) {
            throw new Error(result.error.message || 'Failed to verify backup code');
          }
          return result.data;
        },
        catch: (error) =>
          new Error(
            `Failed to verify backup code: ${
              error instanceof Error ? error.message : String(error)
            }`,
          ),
      }),

    // ===== PASSKEYS =====

    listPasskeys: () =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.passkey.listUserPasskeys();
          if (result.error) {
            throw new Error(result.error.message || 'Failed to list passkeys');
          }
          return result.data || [];
        },
        catch: (error) => new Error(`Failed to list passkeys: ${error}`),
      }),

    addPasskey: (name: string) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.passkey.addPasskey({ name });
          if (result.error) {
            throw new Error(result.error.message || 'Failed to add passkey');
          }
          return result.data;
        },
        catch: (error) => new Error(`Failed to add passkey: ${error}`),
      }),

    deletePasskey: (id: string) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.passkey.deletePasskey({ id });
          if (result.error) {
            throw new Error(result.error.message || 'Failed to delete passkey');
          }
          return result.data;
        },
        catch: (error) => new Error(`Failed to delete passkey: ${error}`),
      }),

    // ===== SESSIONS =====

    listSessions: () =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.listSessions();
          if (result.error) {
            throw new Error(result.error.message || 'Failed to list sessions');
          }
          return result.data || [];
        },
        catch: (error) => new Error(`Failed to list sessions: ${error}`),
      }),

    revokeSession: (token: string) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.revokeSession({ token });
          if (result.error) {
            throw new Error(result.error.message || 'Failed to revoke session');
          }
          return result.data;
        },
        catch: (error) => new Error(`Failed to revoke session: ${error}`),
      }),

    revokeOtherSessions: () =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.revokeOtherSessions();
          if (result.error) {
            throw new Error(result.error.message || 'Failed to revoke other sessions');
          }
          return result.data;
        },
        catch: (error) => new Error(`Failed to revoke other sessions: ${error}`),
      }),

    // ===== ACCOUNTS (LINKED PROVIDERS) =====

    listAccounts: () =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.listAccounts();
          if (result.error) {
            throw new Error(result.error.message || 'Failed to list accounts');
          }
          return result.data || [];
        },
        catch: (error) => new Error(`Failed to list accounts: ${error}`),
      }),

    unlinkAccount: (providerId: string, accountId: string) =>
      Effect.tryPromise({
        try: async () => {
          const result = await authClient.unlinkAccount({
            providerId,
            accountId,
          });
          if (result.error) {
            throw new Error(result.error.message || 'Failed to unlink account');
          }
          return result.data;
        },
        catch: (error) => new Error(`Failed to unlink account: ${error}`),
      }),
  })),
}) {}
