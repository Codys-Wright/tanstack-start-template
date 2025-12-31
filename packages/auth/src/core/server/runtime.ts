/**
 * AuthServerRuntime - Server runtime for the @auth package.
 *
 * This runtime provides all layers needed for the auth feature:
 * - AuthService for authentication operations
 * - TracerLive for OpenTelemetry tracing (exports Effect.fn spans to Jaeger)
 *
 * Apps can either:
 * 1. Use this runtime directly for auth-related server functions
 * 2. Compose their own runtime that includes these layers
 */

import { globalValue } from 'effect/GlobalValue';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as ManagedRuntime from 'effect/ManagedRuntime';

import { TracerLive } from '@core/server';

import { AuthService } from '@auth/core/server/service';

// Use globalValue to persist the memoMap across hot reloads
const memoMap = globalValue(Symbol.for('@auth/server-memoMap'), () =>
  Effect.runSync(Layer.makeMemoMap),
);

/**
 * Layer combining all services needed for the auth package.
 * Includes AuthService for authentication and TracerLive for OpenTelemetry span exports.
 */
export const AuthServerLayer = AuthService.Default.pipe(Layer.provideMerge(TracerLive));

/**
 * Server runtime for the auth package.
 *
 * Use this runtime to run server-side effects that need AuthService.
 *
 * @example
 * ```ts
 * import { AuthServerRuntime } from '@auth/server';
 *
 * const result = await AuthServerRuntime.runPromise(
 *   Effect.gen(function* () {
 *     const auth = yield* AuthService;
 *     return yield* auth.getSession;
 *   })
 * );
 * ```
 */
export const AuthServerRuntime = globalValue(Symbol.for('@auth/server-runtime'), () =>
  ManagedRuntime.make(AuthServerLayer, memoMap),
);

/**
 * Type helper for the auth server runtime.
 */
export type AuthServerRuntime = typeof AuthServerRuntime;
