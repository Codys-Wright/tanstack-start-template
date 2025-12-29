import * as Rpc from '@effect/rpc/Rpc';
import * as RpcGroup from '@effect/rpc/RpcGroup';
import * as Schema from 'effect/Schema';
import { QuizId } from '../../quiz/domain/schema.js';
import {
  QuizResponse,
  ResponseId,
  UpsertResponsePayload,
  ResponseNotFoundError,
  InvalidQuizError,
} from './schema.js';

export class ResponsesRpc extends RpcGroup.make(
  Rpc.make('list', {
    success: Schema.Array(QuizResponse),
  }),

  Rpc.make('getById', {
    success: QuizResponse,
    error: ResponseNotFoundError,
    payload: { id: ResponseId },
  }),

  Rpc.make('getByQuiz', {
    success: Schema.Array(QuizResponse),
    error: InvalidQuizError,
    payload: { quizId: QuizId },
  }),

  Rpc.make('upsert', {
    success: QuizResponse,
    error: Schema.Union(ResponseNotFoundError, InvalidQuizError),
    payload: { input: UpsertResponsePayload },
  }),

  Rpc.make('delete', {
    success: Schema.Void,
    error: ResponseNotFoundError,
    payload: { id: ResponseId },
  }),
).prefix('response_') {}
