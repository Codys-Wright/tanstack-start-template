import * as Rpc from '@effect/rpc/Rpc';
import * as RpcGroup from '@effect/rpc/RpcGroup';
import * as Schema from 'effect/Schema';
import { ActiveQuiz, UpsertActiveQuizPayload, ActiveQuizNotFoundError } from './schema.js';

export class ActiveQuizRpc extends RpcGroup.make(
  Rpc.make('list', {
    success: Schema.Array(ActiveQuiz),
  }),

  Rpc.make('getBySlug', {
    success: ActiveQuiz,
    error: ActiveQuizNotFoundError,
    payload: { slug: Schema.String },
  }),

  Rpc.make('upsert', {
    success: ActiveQuiz,
    error: ActiveQuizNotFoundError,
    payload: { input: UpsertActiveQuizPayload },
  }),

  Rpc.make('delete', {
    success: Schema.Void,
    error: ActiveQuizNotFoundError,
    payload: { slug: Schema.String },
  }),
).prefix('active_quiz_') {}
