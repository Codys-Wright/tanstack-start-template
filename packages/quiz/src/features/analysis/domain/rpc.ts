import * as Rpc from '@effect/rpc/Rpc';
import * as RpcGroup from '@effect/rpc/RpcGroup';
import * as Schema from 'effect/Schema';
import { ResponseId } from '../../responses/domain/schema.js';
import { AnalysisEngineId, AnalysisResultId } from '../../analysis-engine/domain/schema.js';
import {
  AnalysisResult,
  AnalysisSummary,
  AnalyzeResponseRequest,
  BatchAnalyzeRequest,
  UpsertAnalysisResultPayload,
  AnalysisResultNotFoundError,
  AnalysisFailedError,
} from './schema.js';

export class AnalysisRpc extends RpcGroup.make(
  Rpc.make('list', {
    success: Schema.Array(AnalysisResult),
  }),

  Rpc.make('getById', {
    success: AnalysisResult,
    error: AnalysisResultNotFoundError,
    payload: { id: AnalysisResultId },
  }),

  Rpc.make('getByResponse', {
    success: Schema.Array(AnalysisResult),
    payload: { responseId: ResponseId },
  }),

  Rpc.make('getByEngine', {
    success: Schema.Array(AnalysisResult),
    payload: { engineId: AnalysisEngineId },
  }),

  Rpc.make('analyze', {
    success: AnalysisResult,
    error: AnalysisFailedError,
    payload: { request: AnalyzeResponseRequest },
  }),

  Rpc.make('batchAnalyze', {
    success: Schema.Array(AnalysisResult),
    error: AnalysisFailedError,
    payload: { request: BatchAnalyzeRequest },
  }),

  Rpc.make('upsert', {
    success: AnalysisResult,
    error: AnalysisResultNotFoundError,
    payload: { input: UpsertAnalysisResultPayload },
  }),

  Rpc.make('getSummary', {
    success: AnalysisSummary,
    payload: { engineId: AnalysisEngineId },
  }),

  Rpc.make('delete', {
    success: Schema.Void,
    error: AnalysisResultNotFoundError,
    payload: { id: AnalysisResultId },
  }),
).prefix('analysis_') {}
