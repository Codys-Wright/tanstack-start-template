import * as Schema from "effect/Schema";

export const TwoFactorStatus = Schema.Struct({
  enabled: Schema.Boolean,
  backupCodesCount: Schema.Number,
});
export type TwoFactorStatus = typeof TwoFactorStatus.Type;

export const EnableTwoFactorResult = Schema.Struct({
  totpURI: Schema.String,
  backupCodes: Schema.Array(Schema.String),
});
export type EnableTwoFactorResult = typeof EnableTwoFactorResult.Type;

export const VerifyTOTPInput = Schema.Struct({
  code: Schema.String.pipe(
    Schema.pattern(/^\d{6}$/, {
      message: () => "Code must be 6 digits",
    })
  ),
});
export type VerifyTOTPInput = typeof VerifyTOTPInput.Type;
