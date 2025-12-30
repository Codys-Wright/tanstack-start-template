import * as HttpApiBuilder from '@effect/platform/HttpApiBuilder';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { AuthApi } from '@auth/core/auth-api';
import { SecurityService } from './service';
import { AuthError } from '@auth/features/session/domain/api';

/**
 * SecurityApiLive - HTTP API handlers for security group.
 */
export const SecurityApiLive = HttpApiBuilder.group(AuthApi, 'security', (handlers) =>
  handlers
    .handle('getTwoFactorStatus', () =>
      Effect.gen(function* () {
        yield* Effect.log('[Security API] Getting 2FA status');
        const security = yield* SecurityService;
        return yield* security.getTwoFactorStatus();
      }),
    )
    .handle('enableTwoFactor', () =>
      Effect.gen(function* () {
        yield* Effect.log('[Security API] Enabling 2FA');
        const security = yield* SecurityService;
        return yield* security.enableTwoFactor();
      }),
    )
    .handle('verifyTwoFactor', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Security API] Verifying 2FA code', payload.code);
        const security = yield* SecurityService;
        return yield* security.verifyTwoFactor(payload);
      }),
    )
    .handle('verifyBackupCode', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Security API] Verifying backup code', payload.code);
        const security = yield* SecurityService;
        return yield* security.verifyBackupCode(payload);
      }),
    )
    .handle('listPasskeys', () =>
      Effect.gen(function* () {
        yield* Effect.log('[Security API] Listing passkeys');
        const security = yield* SecurityService;
        return yield* security.listPasskeys();
      }),
    )
    .handle('registerPasskey', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Security API] Registering passkey', payload.name);
        const security = yield* SecurityService;
        return yield* security.registerPasskey(payload);
      }),
    )
    .handle('deletePasskey', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Security API] Deleting passkey', payload.id);
        const security = yield* SecurityService;
        return yield* security.deletePasskey(payload);
      }),
    ).pipe(Layer.provide(SecurityService.Default));