import * as Schema from 'effect/Schema';

/**
 * Two-factor authentication status
 */
export const TwoFactorStatus = Schema.Struct({
  enabled: Schema.Boolean,
  backupCodesCount: Schema.Number,
});
export type TwoFactorStatus = typeof TwoFactorStatus.Type;

/**
 * Result from enabling two-factor authentication
 */
export const EnableTwoFactorResult = Schema.Struct({
  totpURI: Schema.String,
  backupCodes: Schema.Array(Schema.String),
});
export type EnableTwoFactorResult = typeof EnableTwoFactorResult.Type;

/**
 * Input for verifying TOTP code
 */
export const VerifyTOTPInput = Schema.Struct({
  code: Schema.String.pipe(
    Schema.pattern(/^\d{6}$/, {
      message: () => 'Code must be 6 digits',
    }),
  ),
});
export type VerifyTOTPInput = typeof VerifyTOTPInput.Type;

/**
 * Input for verifying two-factor during login
 */
export const VerifyTwoFactorInput = Schema.Struct({
  code: Schema.String,
  trustDevice: Schema.optional(Schema.Boolean),
});
export type VerifyTwoFactorInput = typeof VerifyTwoFactorInput.Type;

/**
 * Input for verifying backup code
 */
export const VerifyBackupCodeInput = Schema.Struct({
  code: Schema.String,
});
export type VerifyBackupCodeInput = typeof VerifyBackupCodeInput.Type;

/**
 * TwoFactor entity as stored in database
 */
export const TwoFactor = Schema.Struct({
  id: Schema.String,
  secret: Schema.String,
  backupCodes: Schema.String, // JSON string array
  userId: Schema.String,
});
export type TwoFactor = typeof TwoFactor.Type;
