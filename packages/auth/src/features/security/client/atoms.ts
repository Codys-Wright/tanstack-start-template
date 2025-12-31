import { Atom } from '@effect-atom/atom-react';
import * as Effect from 'effect/Effect';
import { SecurityApi } from './client';

/**
 * Runtime for security atoms - provides SecurityApi service
 */
export const securityRuntime = Atom.runtime(SecurityApi.Default);

// ===== TWO-FACTOR ATOMS =====

/**
 * enableTwoFactorAtom - Enable two-factor authentication for current user
 *
 * On success:
 * 1. Generates TOTP URI for authenticator app
 * 2. Generates backup codes
 */
export const enableTwoFactorAtom = securityRuntime.fn<{ password: string }>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* SecurityApi;
    return yield* api.enableTwoFactor(input.password);
  }),
);

/**
 * disableTwoFactorAtom - Disable two-factor authentication for current user
 */
export const disableTwoFactorAtom = securityRuntime.fn<{ password: string }>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* SecurityApi;
    return yield* api.disableTwoFactor(input.password);
  }),
);

/**
 * verifyTotpAtom - Verify TOTP code during 2FA flow
 */
export const verifyTotpAtom = securityRuntime.fn<{
  code: string;
  trustDevice?: boolean;
}>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* SecurityApi;
    return yield* api.verifyTotp(input.code, input.trustDevice);
  }),
);

/**
 * generateBackupCodesAtom - Generate new backup codes for 2FA
 */
export const generateBackupCodesAtom = securityRuntime.fn<{
  password: string;
}>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* SecurityApi;
    return yield* api.generateBackupCodes(input.password);
  }),
);

/**
 * verifyBackupCodeAtom - Verify backup code during login
 */
export const verifyBackupCodeAtom = securityRuntime.fn<{ code: string }>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* SecurityApi;
    return yield* api.verifyBackupCode(input.code);
  }),
);

// ===== PASSKEY ATOMS =====

/**
 * passkeysAtom - List user's passkeys
 */
export const passkeysAtom = securityRuntime.atom(
  Effect.gen(function* () {
    const api = yield* SecurityApi;
    return yield* api.listPasskeys();
  }),
);

/**
 * addPasskeyAtom - Register a new passkey for current user
 */
export const addPasskeyAtom = securityRuntime.fn<{ name: string }>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* SecurityApi;
    return yield* api.addPasskey(input.name);
  }),
);

/**
 * deletePasskeyAtom - Delete a passkey
 */
export const deletePasskeyAtom = securityRuntime.fn<{ id: string }>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* SecurityApi;
    return yield* api.deletePasskey(input.id);
  }),
);

// ===== SESSION ATOMS =====

/**
 * sessionsAtom - List active sessions for current user
 */
export const sessionsAtom = securityRuntime.atom(
  Effect.gen(function* () {
    const api = yield* SecurityApi;
    return yield* api.listSessions();
  }),
);

/**
 * revokeSessionAtom - Revoke a specific session by token
 */
export const revokeSessionAtom = securityRuntime.fn<{ token: string }>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* SecurityApi;
    return yield* api.revokeSession(input.token);
  }),
);

/**
 * revokeOtherSessionsAtom - Revoke all sessions except current one
 */
export const revokeOtherSessionsAtom = securityRuntime.fn<void>()(
  Effect.fnUntraced(function* () {
    const api = yield* SecurityApi;
    return yield* api.revokeOtherSessions();
  }),
);

/**
 * revokeAllSessionsAtom - Revoke all sessions including current one
 */
export const revokeAllSessionsAtom = securityRuntime.fn<void>()(
  Effect.fnUntraced(function* () {
    const api = yield* SecurityApi;
    return yield* api.revokeOtherSessions();
  }),
);

// ===== ACCOUNTS ATOMS =====

/**
 * accountsAtom - List linked OAuth provider accounts
 */
export const accountsAtom = securityRuntime.atom(
  Effect.gen(function* () {
    const api = yield* SecurityApi;
    return yield* api.listAccounts();
  }),
);

/**
 * unlinkAccountAtom - Unlink a linked OAuth provider account
 */
export const unlinkAccountAtom = securityRuntime.fn<{
  providerId: string;
  accountId: string;
}>()(
  Effect.fnUntraced(function* (input) {
    const api = yield* SecurityApi;
    return yield* api.unlinkAccount(input.providerId, input.accountId);
  }),
);
