import * as Rpc from '@effect/rpc/Rpc';
import * as RpcGroup from '@effect/rpc/RpcGroup';
import * as Schema from 'effect/Schema';
import {
  CreateFeatureInput,
  Feature,
  FeatureId,
  FeatureNotFound,
  UpdateFeatureInput,
} from './schema';

export class FeatureRpc extends RpcGroup.make(
  Rpc.make('list', {
    success: Schema.Array(Feature),
  }),

  Rpc.make('getById', {
    success: Feature,
    error: FeatureNotFound,
    payload: { id: FeatureId },
  }),

  Rpc.make('create', {
    success: Feature,
    payload: { input: CreateFeatureInput },
  }),

  Rpc.make('update', {
    success: Feature,
    error: FeatureNotFound,
    payload: { id: FeatureId, input: UpdateFeatureInput },
  }),

  Rpc.make('remove', {
    success: Schema.Void,
    error: FeatureNotFound,
    payload: { id: FeatureId },
  }),
).prefix('feature_') {}
