import * as Effect from 'effect/Effect';
import { AuthService } from '../../../../core/server/service';

/**
 * Security Service - Wraps Better Auth security operations in Effect
 *
 * Uses auth.api.twoFactor and auth.api.passkey for:
 * - Passkey management (register, list, delete)
 * - Two-factor authentication (enable, verify, backup codes)
 */
export class SecurityService extends Effect.Service<SecurityService>()('SecurityService', {
  dependencies: [AuthService.Default],
  effect: Effect.gen(function* () {
    const auth = yield* AuthService;

    return {
      /**
       * Get two-factor authentication status
       */
      getTwoFactorStatus: () =>
        Effect.tryPromise({
          try: () => auth.api.twoFactor?.listTwoFactor({ query: {} }),
          catch: (error) => new Error(`Failed to get 2FA status: ${error}`),
        }),

      /**
       * Enable two-factor authentication
       */
      enableTwoFactor: () =>
        Effect.tryPromise({
          try: () => auth.api.twoFactor?.enableTwoFactor({ body: {} }),
          catch: (error) => new Error(`Failed to enable 2FA: ${error}`),
        }),

      /**
       * Verify two-factor authentication code
       */
      verifyTwoFactor: (input: { code: string; trustDevice?: boolean }) =>
        Effect.tryPromise({
          try: () => auth.api.twoFactor?.verifyTwoFactor({ body: input }),
          catch: (error) => new Error(`Failed to verify 2FA: ${error}`),
        }),

      /**
       * Verify backup code
       */
      verifyBackupCode: (input: { code: string }) =>
        Effect.tryPromise({
          try: () => auth.api.twoFactor?.verifyBackupCode({ body: input }),
          catch: (error) => new Error(`Failed to verify backup code: ${error}`),
        }),

      /**
       * List passkeys
       */
      listPasskeys: () =>
        Effect.tryPromise({
          try: () => auth.api.passkey?.listPasskeys({ query: {} }),
          catch: (error) => new Error(`Failed to list passkeys: ${error}`),
        }),

      /**
       * Register new passkey
       */
      registerPasskey: (input: { name: string }) =>
        Effect.tryPromise({
          try: () => auth.api.passkey?.registerPasskey({ body: input }),
          catch: (error) => new Error(`Failed to register passkey: ${error}`),
        }),

      /**
       * Delete passkey
       */
      deletePasskey: (input: { id: string }) =>
        Effect.tryPromise({
          try: () => auth.api.passkey?.deletePasskey({ body: input }),
          catch: (error) => new Error(`Failed to delete passkey: ${error}`),
        }),
    };
  }),
}) {}
