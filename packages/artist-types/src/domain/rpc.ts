/**
 * Artist Type RPC Definitions
 *
 * Defines the RPC methods for interacting with artist types:
 * - list: Get all artist types
 * - getById: Get a single artist type by ID
 * - getBySlug: Get a single artist type by slug (short name or full ID)
 */

import * as Rpc from '@effect/rpc/Rpc';
import * as RpcGroup from '@effect/rpc/RpcGroup';
import * as S from 'effect/Schema';
import { ArtistType, ArtistTypeNotFoundError } from './schema.js';

// =============================================================================
// RPC GROUP
// =============================================================================

/**
 * RPC group for artist type operations
 *
 * All methods are prefixed with "artistType_" to avoid naming conflicts
 */
export class ArtistTypeRpc extends RpcGroup.make(
  /**
   * List all artist types, ordered by their display order
   */
  Rpc.make('list', {
    success: S.Array(ArtistType),
  }),

  /**
   * Get a single artist type by its full ID
   * @param id - The full ID (e.g., "the-visionary-artist")
   */
  Rpc.make('getById', {
    success: ArtistType,
    error: ArtistTypeNotFoundError,
    payload: {
      id: S.String,
    },
  }),

  /**
   * Get a single artist type by slug (flexible lookup)
   * @param slug - Either short name ("visionary") or full ID ("the-visionary-artist")
   */
  Rpc.make('getBySlug', {
    success: ArtistType,
    error: ArtistTypeNotFoundError,
    payload: {
      slug: S.String,
    },
  }),
).prefix('artistType_') {}
