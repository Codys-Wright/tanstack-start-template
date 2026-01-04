import { serializable } from '@core/client/atom-utils';
import { Atom, Result } from '@effect-atom/atom-react';
import * as RpcClientError from '@effect/rpc/RpcClientError';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { ArtistTypeClient } from './client.js';

const ArtistTypesSchema = Schema.Array(
  Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    shortName: Schema.String,
    abbreviation: Schema.String,
    order: Schema.Number,
    icon: Schema.String,
    coinIcon: Schema.optional(Schema.NullOr(Schema.String)),
    subtitle: Schema.String,
    elevatorPitch: Schema.String,
    shortDescription: Schema.String,
    longDescription: Schema.String,
    metadata: Schema.Struct({
      strengths: Schema.Array(Schema.String),
      challenges: Schema.Array(Schema.String),
      idealCollaborators: Schema.optional(Schema.Array(Schema.String)),
      recommendedPractices: Schema.optional(Schema.Array(Schema.String)),
      careerPaths: Schema.optional(Schema.Array(Schema.String)),
      colorPalette: Schema.optional(Schema.Array(Schema.String)),
      relatedTypes: Schema.optional(Schema.Array(Schema.String)),
    }),
    notes: Schema.optional(Schema.NullOr(Schema.String)),
    createdAt: Schema.DateTimeUtc,
    updatedAt: Schema.DateTimeUtc,
  }),
);

export const artistTypesAtom = (() => {
  const remoteAtom = ArtistTypeClient.runtime
    .atom(
      Effect.gen(function* () {
        yield* Effect.log('[artistTypesAtom] Fetching artist types from RPC...');
        const client = yield* ArtistTypeClient;
        const result = yield* client('artistType_list', undefined).pipe(
          Effect.tap((data) =>
            Effect.log(`[artistTypesAtom] Successfully fetched ${data.length} artist types`),
          ),
          Effect.tapError((error) =>
            Effect.log(`[artistTypesAtom] Error fetching artist types: ${JSON.stringify(error)}`),
          ),
        );
        return result;
      }),
    )
    .pipe(
      serializable({
        key: '@artist-types/list',
        schema: Result.Schema({
          success: ArtistTypesSchema,
          error: RpcClientError.RpcClientError,
        }) as any,
      }),
      Atom.keepAlive,
    );

  return Object.assign(
    Atom.writable(
      (get) => get(remoteAtom),
      (_ctx, _update: unknown) => {},
      (refresh) => {
        refresh(remoteAtom);
      },
    ).pipe(Atom.keepAlive),
    { remote: remoteAtom },
  );
})();

export const getArtistTypeByIdAtom = ArtistTypeClient.runtime.fn<string>()(
  Effect.fnUntraced(function* (id) {
    const client = yield* ArtistTypeClient;
    return yield* client('artistType_getById', { id });
  }),
);

export const getArtistTypeBySlugAtom = ArtistTypeClient.runtime.fn<string>()(
  Effect.fnUntraced(function* (slug) {
    const client = yield* ArtistTypeClient;
    return yield* client('artistType_getBySlug', { slug });
  }),
);
