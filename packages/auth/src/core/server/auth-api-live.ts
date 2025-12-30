import * as Layer from "effect/Layer";
import { AccountApiLive } from "../../../features/account/server";
import { SessionApiLive } from "../../../features/session/server";

/**
 * AuthApiLive - All Auth API handlers composed together.
 *
 * Uses AuthApi directly - no complex generics or type casting needed.
 * Compose with HttpLayerRouter.addHttpApi(AuthApi) at the server level.
 *
 * Includes handlers for:
 * - session: Sign in, sign up, sign out, get session
 * - account: Profile management, change email/password, delete account
 *
 * @example
 * ```ts
 * import { AuthApi } from "@auth";
 * import { AuthApiLive } from "@auth/server";
 * import * as HttpLayerRouter from "@effect/platform/HttpLayerRouter";
 *
 * const AuthRoutes = HttpLayerRouter.addHttpApi(AuthApi).pipe(
 *   Layer.provide(AuthApiLive)
 * );
 * ```
 */
export const AuthApiLive = Layer.mergeAll(SessionApiLive, AccountApiLive);
