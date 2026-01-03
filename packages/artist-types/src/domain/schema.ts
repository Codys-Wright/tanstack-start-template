/**
 * Artist Type Domain Schema
 *
 * Defines the core data structures for artist types including:
 * - ArtistType - the main entity with all content fields
 * - ArtistTypeMetadata - nested object for strengths, challenges, etc.
 * - ArtistTypeId - branded string type for type safety
 * - Error types for not found scenarios
 */

import * as HttpApiSchema from '@effect/platform/HttpApiSchema';
import * as S from 'effect/Schema';

// =============================================================================
// BRANDED TYPES
// =============================================================================

/**
 * Branded ID for artist types (e.g., "the-visionary-artist")
 */
export const ArtistTypeId = S.String.pipe(S.brand('ArtistTypeId'));
export type ArtistTypeId = typeof ArtistTypeId.Type;

// =============================================================================
// METADATA SCHEMA
// =============================================================================

/**
 * Metadata sub-schema containing arrays of traits and recommendations
 */
export class ArtistTypeMetadata extends S.Class<ArtistTypeMetadata>('ArtistTypeMetadata')({
  /** Core strengths of this artist type */
  strengths: S.Array(S.String),

  /** Common challenges faced by this artist type */
  challenges: S.Array(S.String),

  /** Artist types that work well with this one */
  idealCollaborators: S.optional(S.Array(S.String)),

  /** Recommended practices for growth */
  recommendedPractices: S.optional(S.Array(S.String)),

  /** Potential career paths */
  careerPaths: S.optional(S.Array(S.String)),

  /** Brand color palette (hex values) */
  colorPalette: S.optional(S.Array(S.String)),

  /** Related artist type IDs */
  relatedTypes: S.optional(S.Array(S.String)),
}) {}

// =============================================================================
// MAIN ARTIST TYPE SCHEMA
// =============================================================================

/**
 * Complete artist type entity with all content fields
 */
export class ArtistType extends S.Class<ArtistType>('ArtistType')({
  // Identity
  id: ArtistTypeId,
  name: S.String,
  shortName: S.String,
  abbreviation: S.String,
  order: S.Number,

  // Icons
  icon: S.String,
  coinIcon: S.optional(S.NullOr(S.String)),

  // Content
  subtitle: S.String,
  elevatorPitch: S.String,
  shortDescription: S.String,
  longDescription: S.String,

  // Metadata (stored as JSON in database)
  metadata: S.parseJson(ArtistTypeMetadata),

  // Additional notes
  notes: S.optional(S.NullOr(S.String)),

  // Timestamps
  createdAt: S.DateTimeUtc,
  updatedAt: S.DateTimeUtc,
}) {}

// =============================================================================
// SEED DATA TYPE (for JSON files)
// =============================================================================

/**
 * Type for raw JSON seed data (before transformation)
 */
export type ArtistTypeSeedData = {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  order: number;
  icon: string;
  coinIcon: string | null;
  subtitle: string;
  elevatorPitch: string;
  shortDescription: string;
  longDescription: string;
  metadata: {
    strengths: string[];
    challenges: string[];
    idealCollaborators?: string[];
    recommendedPractices?: string[];
    careerPaths?: string[];
    colorPalette?: string[];
    relatedTypes?: string[];
  };
  notes: string | null;
};

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * Error thrown when an artist type is not found
 */
export class ArtistTypeNotFoundError extends S.TaggedError<ArtistTypeNotFoundError>()(
  'ArtistTypeNotFoundError',
  { id: S.String },
  HttpApiSchema.annotations({ status: 404 }),
) {
  override get message() {
    return `Artist type '${this.id}' not found`;
  }
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * List of all valid artist type IDs
 */
export const ARTIST_TYPE_IDS = [
  'the-visionary-artist',
  'the-consummate-artist',
  'the-analyzer-artist',
  'the-tech-artist',
  'the-entertainer-artist',
  'the-maverick-artist',
  'the-dreamer-artist',
  'the-feeler-artist',
  'the-tortured-artist',
  'the-solo-artist',
] as const;

export type ArtistTypeIdLiteral = (typeof ARTIST_TYPE_IDS)[number];

/**
 * Check if a string is a valid artist type ID
 */
export const isValidArtistTypeId = (id: string): id is ArtistTypeIdLiteral =>
  ARTIST_TYPE_IDS.includes(id as ArtistTypeIdLiteral);

/**
 * Normalize an artist type slug to a full ID
 * e.g., "visionary" -> "the-visionary-artist"
 */
export const normalizeArtistTypeId = (slug: string): string => {
  // Already a full ID
  if (slug.startsWith('the-') && slug.endsWith('-artist')) {
    return slug;
  }
  // Convert short name to full ID
  return `the-${slug.toLowerCase()}-artist`;
};
