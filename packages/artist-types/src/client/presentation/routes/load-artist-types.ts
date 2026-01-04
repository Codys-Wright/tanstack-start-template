/**
 * Server function for loading artist types.
 *
 * This module provides the loadArtistTypes server function that:
 * 1. Loads all artist types from the database
 * 2. Returns dehydrated atom for SSR hydration
 *
 * @example App route usage:
 * ```tsx
 * // apps/my-app/src/routes/artist-types/index.tsx
 * import { createFileRoute } from '@tanstack/react-router';
 * import { ArtistTypesPage, loadArtistTypes } from '@artist-types';
 *
 * export const Route = createFileRoute('/artist-types/')({
 *   loader: () => loadArtistTypes(),
 *   component: ArtistTypesPageWrapper,
 * });
 *
 * function ArtistTypesPageWrapper() {
 *   const loaderData = Route.useLoaderData();
 *   return <ArtistTypesPage loaderData={loaderData} />;
 * }
 * ```
 */

import type * as Hydration from '@effect-atom/atom/Hydration';
import { Atom, Result } from '@effect-atom/atom-react';
import { createServerFn } from '@tanstack/react-start';
import { globalValue } from 'effect/GlobalValue';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';

import { ArtistTypesServerRuntime } from '../../../core/server/runtime.js';
import { ArtistTypeService } from '../../../server/live-service.js';
import { artistTypesAtom } from '../../atoms.js';
import type { ArtistType } from '../../../domain/schema.js';

// ============================================================================
// Dehydrate Helper
// ============================================================================

/**
 * Dehydrates a single atom value for SSR hydration.
 */
const dehydrate = <A, I>(
  atom: Atom.Atom<A> & {
    [Atom.SerializableTypeId]: { key: string; encode: (value: A) => I };
  },
  value: A,
): Hydration.DehydratedAtom =>
  ({
    '~@effect-atom/atom/DehydratedAtom': true,
    key: atom[Atom.SerializableTypeId].key,
    value: atom[Atom.SerializableTypeId].encode(value),
    dehydratedAt: Date.now(),
  }) as Hydration.DehydratedAtom;

// ============================================================================
// Server-side Cache
// ============================================================================

interface CacheEntry {
  data: Exit.Exit<readonly ArtistType[], unknown>;
  timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Use globalValue to persist cache across hot reloads
const artistTypesCache = globalValue(Symbol.for('@artist-types/list-loader-cache'), () => ({
  entry: null as CacheEntry | null,
}));

// Deduplication: track in-flight request
let inFlightPromise: Promise<Exit.Exit<readonly ArtistType[], unknown>> | null = null;

// ============================================================================
// Server Function
// ============================================================================

/**
 * Server function to load artist types for SSR.
 *
 * This function:
 * 1. Checks server-side cache first
 * 2. Deduplicates concurrent requests
 * 3. Loads all artist types from the service
 * 4. Returns dehydrated atom for HydrationBoundary
 */
export const loadArtistTypes = createServerFn({ method: 'GET' }).handler(async () => {
  // Check cache first
  const cached = artistTypesCache.entry;
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return dehydrate(artistTypesAtom.remote, Result.fromExit(cached.data) as any);
  }

  // If there's already a request in flight, wait for it
  if (inFlightPromise) {
    const exit = await inFlightPromise;
    return dehydrate(artistTypesAtom.remote, Result.fromExit(exit) as any);
  }

  // Create the promise and store it for deduplication
  inFlightPromise = ArtistTypesServerRuntime.runPromiseExit(
    Effect.gen(function* () {
      const service = yield* ArtistTypeService;
      yield* Effect.log('[loadArtistTypes] Loading artist types');
      return yield* service.list();
    }),
  ).finally(() => {
    inFlightPromise = null;
  });

  const artistTypesExit = await inFlightPromise;

  // Cache the result
  artistTypesCache.entry = {
    data: artistTypesExit,
    timestamp: Date.now(),
  };

  // Type coercion needed since server errors differ from RPC client errors
  // The hydration layer normalizes this at runtime
  return dehydrate(artistTypesAtom.remote, Result.fromExit(artistTypesExit) as any);
});
