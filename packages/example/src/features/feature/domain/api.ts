import * as HttpApiEndpoint from '@effect/platform/HttpApiEndpoint';
import * as HttpApiGroup from '@effect/platform/HttpApiGroup';
import * as Schema from 'effect/Schema';
import {
  Feature,
  FeatureId,
  CreateFeatureInput,
  UpdateFeatureInput,
  FeatureNotFound,
} from './schema';

/**
 * FeatureApiGroup - HTTP API group for feature CRUD operations.
 * This is composed into the full ExampleApi at the package level.
 *
 * Endpoints:
 * - GET /features - List all features
 * - GET /features/:id - Get feature by ID
 * - POST /features - Create new feature
 * - PATCH /features/:id - Update feature
 * - DELETE /features/:id - Delete feature
 */
export class FeatureApiGroup extends HttpApiGroup.make('features')
  .add(HttpApiEndpoint.get('list', '/features').addSuccess(Schema.Array(Feature)))
  .add(
    HttpApiEndpoint.get('getById', '/features/:id')
      .setPath(Schema.Struct({ id: FeatureId }))
      .addSuccess(Feature)
      .addError(FeatureNotFound),
  )
  .add(
    HttpApiEndpoint.post('create', '/features').setPayload(CreateFeatureInput).addSuccess(Feature),
  )
  .add(
    HttpApiEndpoint.patch('update', '/features/:id')
      .setPath(Schema.Struct({ id: FeatureId }))
      .setPayload(UpdateFeatureInput)
      .addSuccess(Feature)
      .addError(FeatureNotFound),
  )
  .add(
    HttpApiEndpoint.del('remove', '/features/:id')
      .setPath(Schema.Struct({ id: FeatureId }))
      .addSuccess(Schema.Void)
      .addError(FeatureNotFound),
  ) {}
