import * as Rpc from '@effect/rpc/Rpc';
import * as RpcGroup from '@effect/rpc/RpcGroup';
import * as Schema from 'effect/Schema';
import { Quiz, QuizId, UpsertQuizPayload, QuizNotFoundError } from './schema.js';

export class QuizzesRpc extends RpcGroup.make(
  Rpc.make('list', {
    success: Schema.Array(Quiz),
  }),

  Rpc.make('listPublished', {
    success: Schema.Array(Quiz),
  }),

  Rpc.make('getById', {
    success: Quiz,
    error: QuizNotFoundError,
    payload: { id: QuizId },
  }),

  Rpc.make('upsert', {
    success: Quiz,
    error: QuizNotFoundError,
    payload: { input: UpsertQuizPayload },
  }),

  Rpc.make('delete', {
    success: Schema.Void,
    error: QuizNotFoundError,
    payload: { id: QuizId },
  }),
).prefix('quiz_') {}
