import { ApiClient, makeAtomRuntime, withToast } from '@core/client';
import { Atom, Registry, Result } from '@effect-atom/atom-react';
import type { QuizId } from '../quiz/schema.js';
import type { QuizResponse, ResponseId, UpsertResponsePayload } from './schema.js';
import { Data, Effect, Array as EffectArray } from 'effect';

const runtime = makeAtomRuntime(ApiClient.Default);

const remoteAtom = runtime.atom(
  Effect.fn(function* () {
    const api = yield* ApiClient;
    return yield* api.http.Responses.list();
  }),
);

type Action = Data.TaggedEnum<{
  Upsert: { readonly response: QuizResponse };
  Del: { readonly id: ResponseId };
}>;
const Action = Data.taggedEnum<Action>();

export const responsesAtom = Object.assign(
  Atom.writable(
    (get: Atom.Context) => get(remoteAtom),
    (ctx, action: Action) => {
      const result = ctx.get(responsesAtom);
      if (!Result.isSuccess(result)) return;

      const update = Action.$match(action, {
        Del: ({ id }) => result.value.filter((response) => response.id !== id),
        Upsert: ({ response }) => {
          const existing = result.value.find((r) => r.id === response.id);
          if (existing !== undefined)
            return result.value.map((r) => (r.id === response.id ? response : r));
          return EffectArray.prepend(result.value, response);
        },
      });

      ctx.setSelf(Result.success(update));
    },
  ),
  {
    remote: remoteAtom,
  },
);

export const upsertResponseAtom = runtime.fn(
  Effect.fn(
    function* (payload: UpsertResponsePayload) {
      const registry = yield* Registry.AtomRegistry;
      const api = yield* ApiClient;

      const response = yield* api.http.Responses.upsert({ payload });
      registry.set(responsesAtom, Action.Upsert({ response }));
    },
    withToast({
      onWaiting: (payload) => `${payload.id !== undefined ? 'Updating' : 'Creating'} response...`,
      onSuccess: 'Response saved',
      onFailure: 'Failed to save response',
    }),
  ),
);

export const deleteResponseAtom = runtime.fn(
  Effect.fn(
    function* (id: ResponseId) {
      const registry = yield* Registry.AtomRegistry;
      const api = yield* ApiClient;
      yield* api.http.Responses.delete({ payload: { id } });
      registry.set(responsesAtom, Action.Del({ id }));
    },
    withToast({
      onWaiting: 'Deleting response...',
      onSuccess: 'Response deleted',
      onFailure: 'Failed to delete response',
    }),
  ),
);

export const getResponsesByQuizAtom = runtime.fn(
  Effect.fn(
    function* (quizId: QuizId) {
      const api = yield* ApiClient;
      return yield* api.http.Responses.byQuiz({ payload: { quizId } });
    },
    withToast({
      onWaiting: 'Loading responses...',
      onSuccess: 'Responses loaded',
      onFailure: 'Failed to load responses',
    }),
  ),
);

export const getResponseByIdAtom = runtime.fn(
  Effect.fn(
    function* (id: ResponseId) {
      const api = yield* ApiClient;
      return yield* api.http.Responses.byId({ payload: { id } });
    },
    withToast({
      onWaiting: 'Loading response...',
      onSuccess: 'Response loaded',
      onFailure: 'Failed to load response',
    }),
  ),
);
