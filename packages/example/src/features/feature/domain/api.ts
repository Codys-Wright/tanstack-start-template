import * as HttpApiEndpoint from '@effect/platform/HttpApiEndpoint';
import * as HttpApiGroup from '@effect/platform/HttpApiGroup';
import * as S from 'effect/Schema';
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
  .add(HttpApiEndpoint.get('list', '/features').addSuccess(S.Array(Feature)))
  .add(
    HttpApiEndpoint.get('getById', '/features/:id')
      .setPath(S.Struct({ id: FeatureId }))
      .addSuccess(Feature)
      .addError(FeatureNotFound),
  )
  .add(
    HttpApiEndpoint.post('create', '/features').setPayload(CreateFeatureInput).addSuccess(Feature),
  )
  .add(
    HttpApiEndpoint.patch('update', '/features/:id')
      .setPath(S.Struct({ id: FeatureId }))
      .setPayload(UpdateFeatureInput)
      .addSuccess(Feature)
      .addError(FeatureNotFound),
  )
  .add(
    HttpApiEndpoint.del('remove', '/features/:id')
      .setPath(S.Struct({ id: FeatureId }))
      .addSuccess(S.Void)
      .addError(FeatureNotFound),
  ) {}
