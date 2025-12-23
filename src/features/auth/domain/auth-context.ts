import * as Context from "effect/Context";
import * as Schema from "effect/Schema";
import type { UserId } from "../policy.js";

/**
 * AuthContext provides authenticated user information to services and handlers.
 * This context is provided by authentication middleware after validating session.
 */
export class AuthContext extends Context.Tag("AuthContext")<
  AuthContext,
  { readonly userId: UserId }
>() {}

/**
 * Error thrown when authentication is required but not provided or invalid.
 */
export class Unauthorized extends Schema.TaggedError<Unauthorized>()(
  "Unauthorized",
  { details: Schema.String },
) {}
