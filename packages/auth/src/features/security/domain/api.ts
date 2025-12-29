import * as HttpApiEndpoint from '@effect/platform/HttpApiEndpoint';
import * as HttpApiGroup from '@effect/platform/HttpApiGroup';
import * as HttpApiSchema from '@effect/platform/HttpApiSchema';
import * as Schema from 'effect/Schema';
import { AddPasskeyInput, DeletePasskeyInput, Passkey } from './passkey.js';
import {
  TwoFactorStatus,
  EnableTwoFactorResult,
  VerifyTwoFactorInput,
  VerifyBackupCodeInput,
} from './two-factor.js';

class AuthError extends Schema.TaggedError<AuthError>()(
  'AuthError',
  { message: Schema.String },
  HttpApiSchema.annotations({ status: 400 }),
) {}

/**
 * SecurityApiGroup - HTTP API group for security operations.
 * This is composed into AuthApi.
 *
 * Endpoints:
 * - GET /security/two-factor/status - Get 2FA status
 * - POST /security/two-factor/enable - Enable 2FA
 * - POST /security/two-factor/verify - Verify 2FA code
 * - POST /security/passkey/register - Register new passkey
 * - POST /security/passkey/delete - Delete passkey
 * - GET /security/passkeys - List passkeys
 */
export class SecurityApiGroup extends HttpApiGroup.make('security')
  .add(
    HttpApiEndpoint.get('getTwoFactorStatus', '/two-factor/status')
      .addSuccess(TwoFactorStatus)
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('enableTwoFactor', '/two-factor/enable')
      .addSuccess(EnableTwoFactorResult)
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
    HttpApiEndpoint.get('listPasskeys', '/passkeys')
      .addSuccess(Schema.Struct({ passkeys: Schema.Array(Passkey) }))
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('registerPasskey', '/passkey/register')
      .setPayload(AddPasskeyInput)
      .addSuccess(Schema.Struct({ passkey: Passkey }))
      .addError(AuthError),
  )
  .add(
    HttpApiEndpoint.post('deletePasskey', '/passkey/delete')
      .setPayload(DeletePasskeyInput)
      .addSuccess(Schema.Struct({ success: Schema.Boolean }))
      .addError(AuthError),
  )
  .prefix('/security') {}
