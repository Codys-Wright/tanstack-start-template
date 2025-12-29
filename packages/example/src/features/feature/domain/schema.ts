import * as Schema from 'effect/Schema';

export const FeatureId = Schema.String.pipe(Schema.brand('FeatureId'));
export type FeatureId = typeof FeatureId.Type;

export const Feature = Schema.Struct({
  id: FeatureId,
  name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100)),
  description: Schema.String.pipe(Schema.maxLength(500)),
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc,
});
export type Feature = typeof Feature.Type;

export const CreateFeatureInput = Schema.Struct({
  name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100)),
  description: Schema.String.pipe(Schema.maxLength(500)),
});
export type CreateFeatureInput = typeof CreateFeatureInput.Type;

export const UpdateFeatureInput = Schema.Struct({
  name: Schema.optionalWith(Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100)), {
    as: 'Option',
  }),
  description: Schema.optionalWith(Schema.String.pipe(Schema.maxLength(500)), {
    as: 'Option',
  }),
});
export type UpdateFeatureInput = typeof UpdateFeatureInput.Type;

export class FeatureNotFound extends Schema.TaggedError<FeatureNotFound>()('FeatureNotFound', {
  id: FeatureId,
}) {}

export class FeatureValidationError extends Schema.TaggedError<FeatureValidationError>()(
  'FeatureValidationError',
  {
    field: Schema.String,
    message: Schema.String,
  },
) {}
