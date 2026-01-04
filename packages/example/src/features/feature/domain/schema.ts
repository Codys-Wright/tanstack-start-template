import * as S from 'effect/Schema';

export const FeatureId = S.String.pipe(S.brand('FeatureId'));
export type FeatureId = typeof FeatureId.Type;

export const Feature = S.Struct({
  id: FeatureId,
  name: S.String.pipe(S.minLength(1), S.maxLength(100)),
  description: S.String.pipe(S.maxLength(500)),
  createdAt: S.DateTimeUtc,
  updatedAt: S.DateTimeUtc,
});
export type Feature = typeof Feature.Type;

export const CreateFeatureInput = S.Struct({
  name: S.String.pipe(S.minLength(1), S.maxLength(100)),
  description: S.String.pipe(S.maxLength(500)),
});
export type CreateFeatureInput = typeof CreateFeatureInput.Type;

export const UpdateFeatureInput = S.Struct({
  name: S.optionalWith(S.String.pipe(S.minLength(1), S.maxLength(100)), {
    as: 'Option',
  }),
  description: S.optionalWith(S.String.pipe(S.maxLength(500)), {
    as: 'Option',
  }),
});
export type UpdateFeatureInput = typeof UpdateFeatureInput.Type;

export class FeatureNotFound extends S.TaggedError<FeatureNotFound>()('FeatureNotFound', {
  id: FeatureId,
}) {}

export class FeatureValidationError extends S.TaggedError<FeatureValidationError>()(
  'FeatureValidationError',
  {
    field: S.String,
    message: S.String,
  },
) {}
