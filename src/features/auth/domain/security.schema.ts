import * as Schema from "effect/Schema";
import { UserId } from "./auth.user-id.js";

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

// Linked Accounts (OAuth providers)
export const Account = Schema.Struct({
	id: Schema.String,
	providerId: Schema.String, // "credential", "google", "github", etc.
	accountId: Schema.String,
	userId: UserId,
	createdAt: Schema.DateTimeUtc,
});
export type Account = typeof Account.Type;

// Account management
export const UpdateUserInput = Schema.Struct({
	name: Schema.optional(
		Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100)),
	),
	image: Schema.optional(Schema.NullOr(Schema.String)),
});
export type UpdateUserInput = typeof UpdateUserInput.Type;

export const ChangePasswordInput = Schema.Struct({
	currentPassword: Schema.String.pipe(
		Schema.minLength(1, {
			message: () => "Current password is required",
		}),
	),
	newPassword: Schema.String.pipe(
		Schema.minLength(8, {
			message: () => "Password must be at least 8 characters",
		}),
		Schema.maxLength(100, {
			message: () => "Password must be less than 100 characters",
		}),
	),
});
export type ChangePasswordInput = typeof ChangePasswordInput.Type;

export const ChangeEmailInput = Schema.Struct({
	newEmail: Schema.String.pipe(
		Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
			message: () => "Invalid email address",
		}),
	),
});
export type ChangeEmailInput = typeof ChangeEmailInput.Type;

export const DeleteAccountInput = Schema.Struct({
	password: Schema.String.pipe(
		Schema.minLength(1, {
			message: () => "Password is required",
		}),
	),
});
export type DeleteAccountInput = typeof DeleteAccountInput.Type;
