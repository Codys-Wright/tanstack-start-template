/**
 * ArtistTypesServerRuntime - Server runtime for the @artist-types package.
 *
 * This runtime provides all layers needed for artist type features:
 * - ArtistTypeService for CRUD operations
 * - AuthService for authentication
 * - TracerLive for OpenTelemetry tracing (exports Effect.fn spans to Jaeger)
 *
 * Apps can either:
 * 1. Use this runtime directly for artist-type-related server functions
 * 2. Compose their own runtime that includes these layers
 */

import { globalValue } from 'effect/GlobalValue';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as ManagedRuntime from 'effect/ManagedRuntime';

import { AuthService } from '@auth/server';
import { TracerLive } from '@core/server';

import { ArtistTypeService } from '../../server/live-service.js';

// Use globalValue to persist the memoMap across hot reloads
const memoMap = globalValue(Symbol.for('@artist-types/server-memoMap'), () =>
  Effect.runSync(Layer.makeMemoMap),
);

/**
 * Layer combining all services needed for the artist-types package.
 * Includes AuthService for authentication, ArtistTypeService for artist types,
 * and TracerLive for OpenTelemetry span exports.
 */
export const ArtistTypesServerLayer = Layer.merge(
  AuthService.Default,
  ArtistTypeService.Default,
).pipe(Layer.provideMerge(TracerLive));

/**
 * Server runtime for the artist-types package.
 *
 * Use this runtime to run server-side effects that need ArtistTypeService and AuthService.
 * All Effect.fn spans will be exported to Jaeger via OpenTelemetry.
 *
 * @example
 * ```ts
 * import { ArtistTypesServerRuntime } from '@artist-types/server';
 *
 * const result = await ArtistTypesServerRuntime.runPromise(
 *   Effect.gen(function* () {
 *     const service = yield* ArtistTypeService;
 *     return yield* service.list();
 *   })
 * );
 * ```
 */
export const ArtistTypesServerRuntime = globalValue(
  Symbol.for('@artist-types/server-runtime'),
  () => ManagedRuntime.make(ArtistTypesServerLayer, memoMap),
);

/**
 * Type helper for the artist-types server runtime.
 */
export type ArtistTypesServerRuntime = typeof ArtistTypesServerRuntime;
