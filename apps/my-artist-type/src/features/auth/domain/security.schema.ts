import * as Schema from "effect/Schema";
import { UserId } from "./user.schema.js";

// Passkeys
export const Passkey = Schema.Struct({
	id: Schema.String,
	name: Schema.String,
	publicKey: Schema.String,
	counter: Schema.Number,
	userId: UserId,
	createdAt: Schema.DateTimeUtc,
});
export type Passkey = typeof Passkey.Type;

export const AddPasskeyInput = Schema.Struct({
	name: Schema.String.pipe(
		Schema.minLength(1, {
			message: () => "Passkey name is required",
		}),
		Schema.maxLength(50, {
			message: () => "Passkey name must be less than 50 characters",
		}),
	),
});
export type AddPasskeyInput = typeof AddPasskeyInput.Type;

// Two-Factor Authentication
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
		}),
	),
});
export type VerifyTOTPInput = typeof VerifyTOTPInput.Type;

// Sessions
export const ActiveSession = Schema.Struct({
	id: Schema.String,
	token: Schema.String,
	userAgent: Schema.NullOr(Schema.String),
	ipAddress: Schema.NullOr(Schema.String),
	createdAt: Schema.DateTimeUtc,
	expiresAt: Schema.DateTimeUtc,
	isCurrent: Schema.Boolean,
});
export type ActiveSession = typeof ActiveSession.Type;

// Account management (UpdateUserInput is unique to this file)
export const UpdateUserInput = Schema.Struct({
	name: Schema.optional(
		Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100)),
	),
	image: Schema.optional(Schema.NullOr(Schema.String)),
});
export type UpdateUserInput = typeof UpdateUserInput.Type;

export const DeleteAccountInput = Schema.Struct({
	password: Schema.String.pipe(
		Schema.minLength(1, {
			message: () => "Password is required",
		}),
	),
});
export type DeleteAccountInput = typeof DeleteAccountInput.Type;

// NOTE: Account, ChangePasswordInput, and ChangeEmailInput are now in account.schema.ts and auth.schema.ts
