import { serializable } from '@core/client/atom-utils';
import { Atom, Result } from '@effect-atom/atom-react';
import * as RpcClientError from '@effect/rpc/RpcClientError';
import * as Arr from 'effect/Array';
import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import type { QuizId } from '../../quiz/domain/schema.js';
import { QuizResponse, ResponseId, UpsertResponsePayload } from '../domain/index.js';
import { ResponsesClient } from './client.js';

// List endpoint returns responses (metadata/interactionLogs may be undefined for performance)
const ResponsesSchema = Schema.Array(QuizResponse);

// ============================================================================
// Query Atoms
// ============================================================================

type ResponsesCacheUpdate = Data.TaggedEnum<{
  Upsert: { readonly response: QuizResponse };
  Delete: { readonly id: ResponseId };
}>;

/**
 * Main responses atom with SSR support and optimistic updates.
 */
export const responsesAtom = (() => {
  // Remote atom that fetches from the RPC
  const remoteAtom = ResponsesClient.runtime
    .atom(
      Effect.gen(function* () {
        const client = yield* ResponsesClient;
        return yield* client('response_list', undefined);
      }),
    )
    .pipe(
      serializable({
        key: '@quiz/responses',
        schema: Result.Schema({
          success: ResponsesSchema,
          error: RpcClientError.RpcClientError,
        }),
      }),
    );

  // Writable atom with local cache updates
  return Object.assign(
    Atom.writable(
      (get) => get(remoteAtom),
      (ctx, update: ResponsesCacheUpdate) => {
        const current = ctx.get(responsesAtom);
        if (!Result.isSuccess(current)) return;

        const nextValue = (() => {
          switch (update._tag) {
            case 'Upsert': {
              const existingIndex = Arr.findFirstIndex(
                current.value,
                (r) => r.id === update.response.id,
              );
              return Option.match(existingIndex, {
                onNone: () => Arr.prepend(current.value, update.response),
                onSome: (index) => Arr.replace(current.value, index, update.response),
              });
            }
            case 'Delete': {
              return Arr.filter(current.value, (r) => r.id !== update.id);
            }
          }
        })();

        ctx.setSelf(Result.success(nextValue));
      },
      (refresh) => {
        refresh(remoteAtom);
      },
    ),
    { remote: remoteAtom },
  );
})();

// ============================================================================
// Mutation Atoms with Optimistic Updates
// ============================================================================

/**
 * Upsert response with optimistic cache update.
 */
export const upsertResponseAtom = ResponsesClient.runtime.fn<{
  input: UpsertResponsePayload;
}>()(
  Effect.fnUntraced(function* ({ input }, get) {
    const client = yield* ResponsesClient;
    const result = yield* client('response_upsert', { input });
    get.set(responsesAtom, { _tag: 'Upsert', response: result });
    return result;
  }),
);

/**
 * Delete response with optimistic cache update.
 */
export const deleteResponseAtom = ResponsesClient.runtime.fn<ResponseId>()(
  Effect.fnUntraced(function* (id, get) {
    const client = yield* ResponsesClient;
    yield* client('response_delete', { id });
    get.set(responsesAtom, { _tag: 'Delete', id });
  }),
);

/**
 * Get response by ID.
 */
export const getResponseByIdAtom = ResponsesClient.runtime.fn<ResponseId>()(
  Effect.fnUntraced(function* (id) {
    const client = yield* ResponsesClient;
    return yield* client('response_getById', { id });
  }),
);

/**
 * Get responses by quiz ID.
 */
export const getResponsesByQuizAtom = ResponsesClient.runtime.fn<QuizId>()(
  Effect.fnUntraced(function* (quizId) {
    const client = yield* ResponsesClient;
    return yield* client('response_getByQuiz', { quizId });
  }),
);
