import { serializable } from '@core/client/atom-utils';
import { Atom, Result } from '@effect-atom/atom-react';
import * as RpcClientError from '@effect/rpc/RpcClientError';
import * as Arr from 'effect/Array';
import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import { AnalysisResult, UpsertAnalysisResultPayload } from '../domain/index.js';
import { AnalysisResultId } from '../../analysis-engine/domain/schema.js';
import { AnalysisClient } from './client.js';

const AnalysesSchema = Schema.Array(AnalysisResult);

type AnalysesCacheUpdate = Data.TaggedEnum<{
  Upsert: { readonly analysis: AnalysisResult };
  Delete: { readonly id: AnalysisResultId };
}>;

export const analysesAtom = (() => {
  const remoteAtom = AnalysisClient.runtime
    .atom(
      Effect.gen(function* () {
        const client = yield* AnalysisClient;
        return yield* client('analysis_list', undefined);
      }),
    )
    .pipe(
      serializable({
        key: '@quiz/analyses',
        schema: Result.Schema({
          success: AnalysesSchema,
          error: RpcClientError.RpcClientError,
        }),
      }),
    );

  return Object.assign(
    Atom.writable(
      (get) => get(remoteAtom),
      (ctx, update: AnalysesCacheUpdate) => {
        const current = ctx.get(analysesAtom);
        if (!Result.isSuccess(current)) return;

        const nextValue = (() => {
          switch (update._tag) {
            case 'Upsert': {
              const existingIndex = Arr.findFirstIndex(
                current.value,
                (a) => a.id === update.analysis.id,
              );
              return Option.match(existingIndex, {
                onNone: () => Arr.prepend(current.value, update.analysis),
                onSome: (index) => Arr.replace(current.value, index, update.analysis),
              });
            }
            case 'Delete': {
              return Arr.filter(current.value, (a) => a.id !== update.id);
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

export const upsertAnalysisAtom = AnalysisClient.runtime.fn<{
  input: UpsertAnalysisResultPayload;
}>()(
  Effect.fnUntraced(function* ({ input }, get) {
    const client = yield* AnalysisClient;
    const result = yield* client('analysis_upsert', { input });
    get.set(analysesAtom, { _tag: 'Upsert', analysis: result });
    return result;
  }),
);

export const deleteAnalysisAtom = AnalysisClient.runtime.fn<AnalysisResultId>()(
  Effect.fnUntraced(function* (id, get) {
    const client = yield* AnalysisClient;
    yield* client('analysis_delete', { id });
    get.set(analysesAtom, { _tag: 'Delete', id });
  }),
);

export const getAnalysisByIdAtom = AnalysisClient.runtime.fn<AnalysisResultId>()(
  Effect.fnUntraced(function* (id) {
    const client = yield* AnalysisClient;
    return yield* client('analysis_getById', { id });
  }),
);
