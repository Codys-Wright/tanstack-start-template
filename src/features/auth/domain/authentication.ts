import * as Context from "effect/Context";
import type { UserId } from "./user-id.js";

/**
 * Authentication context tag - represents the currently authenticated user.
 * Provided by authentication middleware after successful session validation.
 * 
 * Usage:
 *   const currentUser = yield* Authentication;
 *   const userId = currentUser.userId;
 */
export class Authentication extends Context.Tag("Authentication")<
  Authentication,
  { readonly userId: UserId }
>() {}
