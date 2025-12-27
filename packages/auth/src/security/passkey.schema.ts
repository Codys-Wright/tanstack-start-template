import * as Schema from "effect/Schema";
import { UserId } from "../user/user.schema.js";

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
    })
  ),
});
export type AddPasskeyInput = typeof AddPasskeyInput.Type;
