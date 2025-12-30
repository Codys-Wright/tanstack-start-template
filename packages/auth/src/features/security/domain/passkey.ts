import * as Schema from 'effect/Schema';
import { UserId } from '@auth/features/user/domain/schema';

/**
 * Branded PasskeyId type for type safety
 */
export const PasskeyId = Schema.String.pipe(Schema.brand('PasskeyId'));
export type PasskeyId = typeof PasskeyId.Type;

/**
 * Passkey entity - represents a WebAuthn passkey credential
 */
export const Passkey = Schema.Struct({
  id: PasskeyId,
  name: Schema.String,
  publicKey: Schema.String,
  counter: Schema.Number,
  userId: UserId,
  credentialID: Schema.optional(Schema.String),
  deviceType: Schema.optional(Schema.String),
  backedUp: Schema.optional(Schema.Boolean),
  transports: Schema.optional(Schema.String),
  aaguid: Schema.optional(Schema.String),
  createdAt: Schema.DateTimeUtc,
});
export type Passkey = typeof Passkey.Type;

/**
 * Input for adding a passkey
 */
export const AddPasskeyInput = Schema.Struct({
  name: Schema.String.pipe(
    Schema.minLength(1, {
      message: () => 'Passkey name is required',
    }),
    Schema.maxLength(50, {
      message: () => 'Passkey name must be less than 50 characters',
    }),
  ),
});
export type AddPasskeyInput = typeof AddPasskeyInput.Type;

/**
 * Input for deleting a passkey
 */
export const DeletePasskeyInput = Schema.Struct({
  id: PasskeyId,
});
export type DeletePasskeyInput = typeof DeletePasskeyInput.Type;
