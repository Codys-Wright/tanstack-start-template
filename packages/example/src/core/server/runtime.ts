/**
 * ExampleServerRuntime - Server runtime for the @example package.
 *
 * This runtime provides all layers needed for the example feature:
 * - FeatureService for CRUD operations
 * - AuthService for authentication
 * - TracerLive for OpenTelemetry tracing (exports Effect.fn spans to Jaeger)
 *
 * Apps can either:
 * 1. Use this runtime directly for example-related server functions
 * 2. Compose their own runtime that includes these layers
 */

import { globalValue } from 'effect/GlobalValue';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as ManagedRuntime from 'effect/ManagedRuntime';

import { AuthService } from '@auth/server';
import { TracerLive } from '@core/server';

import { FeatureService } from '../../features/feature/server/index.js';

// Use globalValue to persist the memoMap across hot reloads
const memoMap = globalValue(Symbol.for('@example/server-memoMap'), () =>
  Effect.runSync(Layer.makeMemoMap),
);

/**
 * Layer combining all services needed for the example package.
 * Includes AuthService for authentication, FeatureService for features,
 * and TracerLive for OpenTelemetry span exports.
 */
export const ExampleServerLayer = Layer.merge(AuthService.Default, FeatureService.Default).pipe(
  Layer.provideMerge(TracerLive),
);

/**
 * Server runtime for the example package.
 *
 * Use this runtime to run server-side effects that need FeatureService and AuthService.
 * All Effect.fn spans will be exported to Jaeger via OpenTelemetry.
 *
 * @example
 * ```ts
 * import { ExampleServerRuntime } from '@example/server';
 *
 * const result = await ExampleServerRuntime.runPromise(
 *   Effect.gen(function* () {
 *     const service = yield* FeatureService;
 *     return yield* service.list();
 *   })
 * );
 * ```
 */
export const ExampleServerRuntime = globalValue(Symbol.for('@example/server-runtime'), () =>
  ManagedRuntime.make(ExampleServerLayer, memoMap),
);

/**
 * Type helper for the example server runtime.
 */
export type ExampleServerRuntime = typeof ExampleServerRuntime;
