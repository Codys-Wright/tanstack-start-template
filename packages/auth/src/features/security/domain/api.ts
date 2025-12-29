import * as HttpApiEndpoint from '@effect/platform/HttpApiEndpoint';
import * as HttpApiGroup from '@effect/platform/HttpApiGroup';
import * as Schema from 'effect/Schema';
import { AuthError, Unauthenticated } from '../../session/domain/schema.js';

export const ChangePasswordInput = Schema.Struct({
  currentPassword: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Current password is required' }),
  ),
  newPassword: Schema.String.pipe(
    Schema.minLength(8, {
      message: () => 'Password must be at least 8 characters',
    }),
  ),
  revokeOtherSessions: Schema.optional(Schema.Boolean),
});

export const DeleteAccountInput = Schema.Struct({
  password: Schema.String.pipe(Schema.minLength(1, { message: () => 'Password is required' })),
});

export const EnableTwoFactorInput = Schema.Struct({});

export const VerifyTwoFactorInput = Schema.Struct({
  code: Schema.String,
  trustDevice: Schema.optional(Schema.Boolean),
});

export const VerifyBackupCodeInput = Schema.Struct({
  code: Schema.String,
});

export const AddPasskeyInput = Schema.Struct({
  name: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Passkey name is required' }),
    Schema.maxLength(50, {
      message: () => 'Passkey name must be less than 50 characters',
    }),
  ),
});

export const DeletePasskeyInput = Schema.Struct({
  id: Schema.String,
});

export const RevokeSessionInput = Schema.Struct({
  token: Schema.String,
});

export const UnlinkAccountInput = Schema.Struct({
  accountId: Schema.String,
});

export const TwoFactorStatus = Schema.Struct({
  enabled: Schema.Boolean,
  backupCodesCount: Schema.Number,
});

export const EnableTwoFactorResult = Schema.Struct({
  totpURI: Schema.String,
  backupCodes: Schema.Array(Schema.String),
});

export const ListPasskeysResult = Schema.Struct({
  passkeys: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      name: Schema.String,
      credentialID: Schema.String,
      counter: Schema.Number,
      deviceType: Schema.optional(Schema.String),
      backedUp: Schema.optional(Schema.Boolean),
      transports: Schema.optional(Schema.String),
      aaguid: Schema.optional(Schema.String),
      createdAt: Schema.DateTimeUtc,
    }),
  ),
});

export const ListSessionsResult = Schema.Struct({
  sessions: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      expiresAt: Schema.DateTimeUtc,
      token: Schema.String,
      createdAt: Schema.DateTimeUtc,
      ipAddress: Schema.optional(Schema.String),
      userAgent: Schema.optional(Schema.String),
      userId: Schema.String,
    }),
  ),
});

export const ListAccountsResult = Schema.Struct({
  accounts: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      accountId: Schema.String,
      providerId: Schema.String,
      userId: Schema.String,
    }),
  ),
});

/**
 * SecurityApiGroup - HTTP API group for security operations.
 *
 * Endpoints:
 * - GET /security/two-factor/status - Get 2FA status
 * - POST /security/two-factor/enable - Enable 2FA
 * - POST /security/two-factor/disable - Disable 2FA
 * - POST /security/two-factor/verify - Verify TOTP code
 * - POST /security/two-factor/verify-backup - Verify backup code
 * - POST /security/two-factor/generate-backup-codes - Generate backup codes
 * - GET /security/passkeys - List passkeys
 * - POST /security/passkey/register - Register passkey
 * - POST /security/passkey/delete - Delete passkey
 * - GET /security/sessions - List sessions
 * - POST /security/sessions/revoke - Revoke session
 * - POST /security/sessions/revoke-other - Revoke other sessions
 * - POST /security/sessions/revoke-all - Revoke all sessions
 * - GET /security/accounts - List linked accounts
 * - DELETE /security/accounts/unlink - Unlink account
 * - POST /security/change-password - Change password
 * - DELETE /security/account - Delete account
 */
export class SecurityApiGroup extends HttpApiGroup.make('security')
  .add(
    HttpApiEndpoint.get('getTwoFactorStatus', '/two-factor/status')
      .addSuccess(TwoFactorStatus)
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('enableTwoFactor', '/two-factor/enable')
      .setPayload(EnableTwoFactorInput)
      .addSuccess(EnableTwoFactorResult)
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('disableTwoFactor', '/two-factor/disable')
      .addSuccess(Schema.Struct({ success: Schema.Boolean }))
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('verifyTwoFactor', '/two-factor/verify')
      .setPayload(VerifyTwoFactorInput)
      .addSuccess(Schema.Struct({ success: Schema.Boolean }))
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('verifyBackupCode', '/two-factor/verify-backup')
      .setPayload(VerifyBackupCodeInput)
      .addSuccess(Schema.Struct({ success: Schema.Boolean }))
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('generateBackupCodes', '/two-factor/generate-backup-codes')
      .addSuccess(EnableTwoFactorResult)
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.get('listPasskeys', '/passkeys')
      .addSuccess(ListPasskeysResult)
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('registerPasskey', '/passkey/register')
      .setPayload(AddPasskeyInput)
      .addSuccess(ListPasskeysResult)
      .addSuccess(Schema.Struct({ success: Schema.Boolean }))
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('deletePasskey', '/passkey/delete')
      .setPayload(DeletePasskeyInput)
      .addSuccess(Schema.Struct({ success: Schema.Boolean }))
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.get('listSessions', '/sessions')
      .addSuccess(ListSessionsResult)
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('revokeSession', '/sessions/revoke')
      .setPayload(RevokeSessionInput)
      .addSuccess(Schema.Struct({ success: Schema.Boolean }))
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('revokeOtherSessions', '/sessions/revoke-other')
      .addSuccess(Schema.Struct({ success: Schema.Boolean }))
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('revokeAllSessions', '/sessions/revoke-all')
      .addSuccess(Schema.Struct({ success: Schema.Boolean }))
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.get('listAccounts', '/accounts')
      .addSuccess(ListAccountsResult)
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.delete('unlinkAccount', '/accounts/:accountId')
      .setPayload(UnlinkAccountInput)
      .addSuccess(Schema.Struct({ success: Schema.Boolean }))
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('changePassword', '/change-password')
      .setPayload(ChangePasswordInput)
      .addSuccess(Schema.Struct({ success: Schema.Boolean }))
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.delete('deleteAccount', '/account')
      .setPayload(DeleteAccountInput)
      .addSuccess(Schema.Struct({ success: Schema.Boolean }))
      .addError(AuthError),
  )
  .prefix('/security') {}
