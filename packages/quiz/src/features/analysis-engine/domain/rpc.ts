import * as Rpc from '@effect/rpc/Rpc';
import * as RpcGroup from '@effect/rpc/RpcGroup';
import * as Schema from 'effect/Schema';
import {
  AnalysisEngine,
  AnalysisEngineId,
  UpsertAnalysisEnginePayload,
  AnalysisEngineNotFoundError,
} from './schema.js';

export class AnalysisEngineRpc extends RpcGroup.make(
  Rpc.make('list', {
    success: Schema.Array(AnalysisEngine),
  }),

  Rpc.make('listPublished', {
    success: Schema.Array(AnalysisEngine),
  }),

  Rpc.make('getById', {
    success: AnalysisEngine,
    error: AnalysisEngineNotFoundError,
    payload: { id: AnalysisEngineId },
  }),

  Rpc.make('upsert', {
    success: AnalysisEngine,
    error: AnalysisEngineNotFoundError,
    payload: { input: UpsertAnalysisEnginePayload },
  }),

  Rpc.make('delete', {
    success: Schema.Void,
    error: AnalysisEngineNotFoundError,
    payload: { id: AnalysisEngineId },
  }),
).prefix('engine_') {}
