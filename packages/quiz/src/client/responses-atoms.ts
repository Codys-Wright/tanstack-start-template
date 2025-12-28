import { ResponsesClient } from './features/responses/client.js';
import { Data, Effect, Array as EffectArray } from 'effect';
import type { Response, UpsertResponsePayload } from './features/responses/schema.js';

const ResponseSchema = Response;

type ResponseCacheUpdate = Data.TaggedEnum<{
  Upsert: { readonly response: Response };
  Delete: { readonly id: string };
}>;

/**
 * Main responses atom with SSR support and optimistic updates.
 */
export const responsesAtom = (() => {
  const remoteAtom = ResponsesClient.runtime.atom(
    Effect.gen(function* () {
      const client = yield* ResponsesClient;
      return yield* client('list');
    }),
  );

  return Object.assign(
    Atom.writable(
      (get) => get(remoteAtom),
      (ctx, update: ResponseCacheUpdate) => {
        const current = ctx.get(responsesAtom);
        if (!Result.isSuccess(current)) return;

        const nextValue = (() => {
          switch (update._tag) {
            case 'Upsert': {
              const existingIndex = EffectArray.findFirstIndex(
                current.value,
                (r) => r.id === update.response.id,
              );
              return Option.match(existingIndex, {
                onNone: () => EffectArray.prepend(current.value, update.response),
                onSome: (index) => EffectArray.replace(current.value, index, update.response),
              });
            }
            case 'Delete': {
              return EffectArray.filter(current.value, (r) => r.id !== update.id);
            }
          }
        })();

        ctx.setSelf(Result.success(nextValue));
      },
    ),
    { remote: remoteAtom },
  );
})();

export const upsertResponseAtom = ResponsesClient.runtime.fn<UpsertResponsePayload>()(
  Effect.fnUntraced(function* (input, get) {
    const client = yield* ResponsesClient;
    const result = yield* client('upsert', { input });
    get.set(responsesAtom, { _tag: 'Upsert', response: result });
    return result;
  }),
);

export const deleteResponseAtom = ResponsesClient.runtime.fn<string>()(
  Effect.fnUntraced(function* (id, get) {
    const client = yield* ResponsesClient;
    yield* client('delete', { id });
    get.set(responsesAtom, { _tag: 'Delete', id });
  }),
);
