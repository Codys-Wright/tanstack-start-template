// Domain schema utilities
// Common schemas and transformations for domain models

import * as Either from 'effect/Either';
import { identity } from 'effect/Function';
import * as Schema from 'effect/Schema';

/**
 * A schema for validating URL slug strings.
 * A slug should contain only lowercase letters, numbers, and hyphens.
 * No leading/trailing hyphens or consecutive hyphens allowed.
 *
 * @category schema
 */
export class Slug extends Schema.String.pipe(
  Schema.filter(
    (s): s is string => {
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      return slugRegex.test(s);
    },
    {
      message: () =>
        'Invalid slug format. Must contain only lowercase letters, numbers, and hyphens, with no consecutive hyphens or leading/trailing hyphens',
      jsonSchema: {
        type: 'string',
        pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
        description: 'A URL-friendly slug containing only lowercase letters, numbers, and hyphens',
        examples: ['hello-world', 'my-awesome-post', 'article-123'],
      },
    },
  ),
) {}

/**
 * A schema for transforming any string into a valid slug.
 * This will automatically convert the input string to a proper slug format.
 * Converts to lowercase, replaces spaces with hyphens, and removes special characters.
 *
 * @category schema
 */
export class SlugFromString extends Schema.transform(Schema.String, Slug, {
  strict: true,
  decode: (input) => {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Remove consecutive hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  },
  encode: identity,
}) {}

/**
 * A schema for validating semantic version strings (semver).
 * Supports format: MAJOR.MINOR.PATCH[-prerelease][+buildmetadata]
 * Examples: "1.0.0", "2.1.3-alpha.1", "1.0.0+build.123"
 *
 * @category schema
 */
export class SemVer extends Schema.String.pipe(
  Schema.filter(
    (s): s is string => {
      const semverRegex =
        /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
      return semverRegex.test(s);
    },
    {
      message: () =>
        'Must be a valid semantic version (e.g., 1.0.0, 2.1.0-alpha.1, 1.0.0+build.123)',
      jsonSchema: {
        type: 'string',
        pattern:
          '^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?$',
        description: 'A semantic version string (e.g., 1.0.0, 2.1.0-alpha.1, 1.0.0+build.123)',
        examples: ['1.0.0', '2.1.0-alpha.1', '1.0.0+build.123'],
      },
    },
  ),
) {}

/**
 * Version schema - combines semver with an optional comment
 *
 * @category schema
 */
export class Version extends Schema.Class<Version>('Version')({
  semver: SemVer,
  comment: Schema.optional(Schema.String),
}) {}

/**
 * Creates a schema that allows null values and falls back to null on decoding errors.
 *
 * @category schema
 */
export const NullOrFromFallible = <A, I, R>(
  schema: Schema.Schema<A, I, R>,
): Schema.NullOr<Schema.Schema<A, I, R>> =>
  Schema.NullOr(schema).pipe(
    Schema.annotations({
      decodingFallback: () => Either.right(null),
    }),
  );

/**
 * A schema for trimming and validating non-empty strings.
 *
 * @category schema
 */
export const TrimNonEmpty = (opts?: {
  message?: string;
}): Schema.refine<string, Schema.filter<typeof Schema.Trim>> =>
  Schema.Trim.pipe(
    Schema.minLength(1),
    Schema.maxLength(5000),
    Schema.annotations({
      message: () => opts?.message ?? 'Expected a non-empty trimmed string',
      override: true,
    }),
  );

/**
 * A schema for validating email addresses.
 *
 * @category schema
 */
export const Email = (opts?: {
  requiredMessage?: string;
  invalidMessage?: string;
}): Schema.refine<string, Schema.filter<typeof Schema.Trim>> =>
  Schema.Trim.pipe(
    Schema.minLength(1, {
      message: () => opts?.requiredMessage ?? 'Email is required',
    }),
    Schema.pattern(
      /^(?!\.)(?!.*\.\.)([A-Z0-9_+-.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9-]*\.)+[A-Z]{2,}$/i,
      {
        message: () => opts?.invalidMessage ?? 'Invalid email',
      },
    ),
    Schema.annotations({
      identifier: 'Email',
    }),
  );
