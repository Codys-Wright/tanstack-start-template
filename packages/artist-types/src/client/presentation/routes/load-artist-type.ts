/**
 * Server function for loading a single artist type.
 *
 * This module provides the loadArtistType server function that:
 * 1. Loads a single artist type by ID or slug from the database
 * 2. Returns the artist type data for page rendering
 *
 * @example App route usage:
 * ```tsx
 * // apps/my-app/src/routes/artist-types/$slug.tsx
 * import { createFileRoute } from '@tanstack/react-router';
 * import { ArtistTypeDetailPage, loadArtistType } from '@artist-types';
 *
 * export const Route = createFileRoute('/artist-types/$slug')({
 *   loader: ({ params }) => loadArtistType({ data: params.slug }),
 *   component: ArtistTypeDetailPageWrapper,
 * });
 *
 * function ArtistTypeDetailPageWrapper() {
 *   const loaderData = Route.useLoaderData();
 *   return <ArtistTypeDetailPage artistType={loaderData} />;
 * }
 * ```
 */

import { createServerFn } from '@tanstack/react-start';
import { globalValue } from 'effect/GlobalValue';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Schema from 'effect/Schema';

import { ArtistTypesServerRuntime } from '../../../core/server/runtime.js';
import { ArtistTypeService } from '../../../server/live-service.js';
import { ArtistType } from '../../../domain/schema.js';

// ============================================================================
// Types
// ============================================================================

/** Encoded (JSON-serializable) version of ArtistType - DateTimeUtc becomes ISO string */
export type EncodedArtistType = typeof ArtistType.Encoded;

export interface ArtistTypeDetailLoaderData {
  artistType: EncodedArtistType | null;
  error: string | null;
}

// ============================================================================
// Simple In-Memory Cache
// ============================================================================

interface CacheEntry {
  data: ArtistTypeDetailLoaderData;
  timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Use globalValue to persist cache across hot reloads
const artistTypeCache = globalValue(
  Symbol.for('@artist-types/detail-cache'),
  () => new Map<string, CacheEntry>(),
);

function getCached(slug: string): ArtistTypeDetailLoaderData | null {
  const entry = artistTypeCache.get(slug);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    artistTypeCache.delete(slug);
    return null;
  }
  return entry.data;
}

function setCache(slug: string, data: ArtistTypeDetailLoaderData): void {
  artistTypeCache.set(slug, { data, timestamp: Date.now() });
}

// ============================================================================
// Server Function
// ============================================================================

/**
 * Server function to load a single artist type for SSR.
 *
 * This function:
 * 1. Checks in-memory cache first
 * 2. Loads an artist type by slug (flexible lookup)
 * 3. Returns the artist type or an error message
 */
export const loadArtistType = createServerFn({ method: 'GET' })
  .inputValidator((slug: string) => slug)
  .handler(async (ctx): Promise<ArtistTypeDetailLoaderData> => {
    const slug = ctx.data;

    // Check cache first
    const cached = getCached(slug);
    if (cached) {
      return cached;
    }

    const exit = await ArtistTypesServerRuntime.runPromiseExit(
      Effect.gen(function* () {
        const service = yield* ArtistTypeService;
        yield* Effect.log(`[loadArtistType] Loading artist type: ${slug}`);
        return yield* service.getBySlug(slug);
      }),
    );

    let result: ArtistTypeDetailLoaderData;

    if (Exit.isSuccess(exit)) {
      // Encode the ArtistType to JSON-serializable format (DateTimeUtc -> ISO string)
      const encodedArtistType = Schema.encodeSync(ArtistType)(exit.value);
      result = { artistType: encodedArtistType, error: null };
    } else {
      // Handle error case - check if it's an ArtistTypeNotFoundError
      const failureOption = Cause.failureOption(exit.cause);
      if (failureOption._tag === 'Some') {
        const error = failureOption.value as { _tag?: string };
        if (error._tag === 'ArtistTypeNotFoundError') {
          result = {
            artistType: null,
            error: `Artist type not found: ${slug}`,
          };
        } else {
          result = {
            artistType: null,
            error: 'An error occurred while loading the artist type',
          };
        }
      } else {
        result = {
          artistType: null,
          error: 'An error occurred while loading the artist type',
        };
      }
    }

    // Cache the result (even errors, to prevent repeated failed lookups)
    setCache(slug, result);

    return result;
  });
