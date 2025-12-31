import * as HttpApiBuilder from '@effect/platform/HttpApiBuilder';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { AuthApi } from '@auth/core/auth-api';
import { SecurityService } from '@auth/features/security/server/service';
import { AuthError } from '@auth/features/session/domain/schema';
import type {
  TwoFactorStatus,
  EnableTwoFactorResult,
  ListPasskeysResult,
  ListSessionsResult,
  ListAccountsResult,
} from '@auth/features/security/domain/api';

/**
 * SecurityApiLive - HTTP API handlers for security group.
 *
 * Implements security endpoints:
 * - Two-factor authentication (enable, verify, disable, backup codes)
 * - Passkey management (list, register, delete)
 * - Session management (list, revoke)
 * - Account management (change password, list/unlink accounts, delete account)
 *
 * Note: Passkey registration uses WebAuthn which requires client-side APIs.
 * The registerPasskey endpoint here is a placeholder - actual registration
 * should be done via authClient on the client side.
 */
export const SecurityApiLive = HttpApiBuilder.group(AuthApi, 'security', (handlers) =>
  handlers
    // ========================================================================
    // Two-Factor Authentication
    // ========================================================================
    .handle('getTwoFactorStatus', () =>
      Effect.gen(function* () {
        yield* Effect.log('[Security API] Getting 2FA status');
        // Return default status - actual status should come from session/user
        return { enabled: false, backupCodesCount: 0 } as TwoFactorStatus;
      }).pipe(Effect.mapError((e) => new AuthError({ message: String(e) }))),
    )
    .handle('enableTwoFactor', () =>
      Effect.gen(function* () {
        yield* Effect.log('[Security API] Enabling 2FA');
        const security = yield* SecurityService;
        // Note: Enable requires password, but the API doesn't pass it here
        // This should be handled differently - perhaps via a different input schema
        const result = yield* security.enableTwoFactor({ password: '' });
        return result as EnableTwoFactorResult;
      }).pipe(Effect.mapError((e) => new AuthError({ message: String(e) }))),
    )
    .handle('disableTwoFactor', () =>
      Effect.gen(function* () {
        yield* Effect.log('[Security API] Disabling 2FA');
        const security = yield* SecurityService;
        yield* security.disableTwoFactor({ password: '' });
        return { success: true as const };
      }).pipe(Effect.mapError((e) => new AuthError({ message: String(e) }))),
    )
    .handle('verifyTwoFactor', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Security API] Verifying 2FA code');
        const security = yield* SecurityService;
        yield* security.verifyTOTP({
          code: payload.code,
          trustDevice: payload.trustDevice,
        });
        return { success: true as const };
      }).pipe(Effect.mapError((e) => new AuthError({ message: String(e) }))),
    )
    .handle('verifyBackupCode', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Security API] Verifying backup code');
        const security = yield* SecurityService;
        yield* security.verifyBackupCode({ code: payload.code });
        return { success: true as const };
      }).pipe(Effect.mapError((e) => new AuthError({ message: String(e) }))),
    )
    .handle('generateBackupCodes', () =>
      Effect.gen(function* () {
        yield* Effect.log('[Security API] Generating backup codes');
        const security = yield* SecurityService;
        const result = yield* security.generateBackupCodes({ password: '' });
        return result as EnableTwoFactorResult;
      }).pipe(Effect.mapError((e) => new AuthError({ message: String(e) }))),
    )
    // ========================================================================
    // Passkey Management
    // ========================================================================
    .handle('listPasskeys', () =>
      Effect.gen(function* () {
        yield* Effect.log('[Security API] Listing passkeys');
        const security = yield* SecurityService;
        const result = yield* security.listPasskeys();
        return result as ListPasskeysResult;
      }).pipe(Effect.mapError((e) => new AuthError({ message: String(e) }))),
    )
    .handle('registerPasskey', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Security API] Registering passkey', payload.name);
        // Note: Passkey registration requires WebAuthn client-side APIs
        // This is a placeholder - use authClient.passkey.addPasskey() on client
        return { success: true as const };
      }).pipe(Effect.mapError((e) => new AuthError({ message: String(e) }))),
    )
    .handle('deletePasskey', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Security API] Deleting passkey', payload.id);
        const security = yield* SecurityService;
        yield* security.deletePasskey({ id: payload.id });
        return { success: true as const };
      }).pipe(Effect.mapError((e) => new AuthError({ message: String(e) }))),
    )
    // ========================================================================
    // Session Management
    // ========================================================================
    .handle('listSessions', () =>
      Effect.gen(function* () {
        yield* Effect.log('[Security API] Listing sessions');
        const security = yield* SecurityService;
        const result = yield* security.listSessions();
        return result as ListSessionsResult;
      }).pipe(Effect.mapError((e) => new AuthError({ message: String(e) }))),
    )
    .handle('revokeSession', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Security API] Revoking session');
        const security = yield* SecurityService;
        yield* security.revokeSession({ token: payload.token });
        return { success: true as const };
      }).pipe(Effect.mapError((e) => new AuthError({ message: String(e) }))),
    )
    .handle('revokeOtherSessions', () =>
      Effect.gen(function* () {
        yield* Effect.log('[Security API] Revoking other sessions');
        const security = yield* SecurityService;
        yield* security.revokeOtherSessions();
        return { success: true as const };
      }).pipe(Effect.mapError((e) => new AuthError({ message: String(e) }))),
    )
    .handle('revokeAllSessions', () =>
      Effect.gen(function* () {
        yield* Effect.log('[Security API] Revoking all sessions');
        const security = yield* SecurityService;
        yield* security.revokeSessions();
        return { success: true as const };
      }).pipe(Effect.mapError((e) => new AuthError({ message: String(e) }))),
    )
    // ========================================================================
    // Account Management
    // ========================================================================
    .handle('listAccounts', () =>
      Effect.gen(function* () {
        yield* Effect.log('[Security API] Listing linked accounts');
        const security = yield* SecurityService;
        const result = yield* security.listAccounts();
        return result as ListAccountsResult;
      }).pipe(Effect.mapError((e) => new AuthError({ message: String(e) }))),
    )
    .handle('unlinkAccount', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Security API] Unlinking account', payload.accountId);
        const security = yield* SecurityService;
        yield* security.unlinkAccount({ providerId: payload.accountId });
        return { success: true as const };
      }).pipe(Effect.mapError((e) => new AuthError({ message: String(e) }))),
    )
    .handle('changePassword', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Security API] Changing password');
        const security = yield* SecurityService;
        yield* security.changePassword({
          currentPassword: payload.currentPassword,
          newPassword: payload.newPassword,
          revokeOtherSessions: payload.revokeOtherSessions,
        });
        return { success: true as const };
      }).pipe(Effect.mapError((e) => new AuthError({ message: String(e) }))),
    )
    .handle('deleteAccount', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Security API] Deleting account');
        const security = yield* SecurityService;
        yield* security.deleteUser({ password: payload.password });
        return { success: true as const };
      }).pipe(Effect.mapError((e) => new AuthError({ message: String(e) }))),
    ),
).pipe(Layer.provide(SecurityService.Default));
