import * as SqlClient from '@effect/sql/SqlClient';
import * as SqlSchema from '@effect/sql/SqlSchema';
import { PgLive } from '@core/database';
import * as Effect from 'effect/Effect';
import * as S from 'effect/Schema';
import type { ArtistTypeId } from '../domain/schema.js';
import { ArtistTypeNotFoundError, ArtistType } from '../domain/schema.js';

const CreateArtistTypeInput = S.Struct({
  id: S.String,
  name: S.String,
  shortName: S.String,
  abbreviation: S.String,
  order: S.Number,
  icon: S.String,
  coinIcon: S.optional(S.NullOr(S.String)),
  subtitle: S.String,
  elevatorPitch: S.String,
  shortDescription: S.String,
  longDescription: S.String,
  metadata: S.parseJson(
    S.Struct({
      strengths: S.Array(S.String),
      challenges: S.Array(S.String),
      idealCollaborators: S.optional(S.Array(S.String)),
      recommendedPractices: S.optional(S.Array(S.String)),
      careerPaths: S.optional(S.Array(S.String)),
      colorPalette: S.optional(S.Array(S.String)),
      relatedTypes: S.optional(S.Array(S.String)),
    }),
  ),
  notes: S.optional(S.NullOr(S.String)),
  createdAt: S.optional(S.DateTimeUtc),
  updatedAt: S.optional(S.DateTimeUtc),
});

export class ArtistTypesRepo extends Effect.Service<ArtistTypesRepo>()('ArtistTypesRepo', {
  dependencies: [PgLive],
  effect: Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    const findAll = SqlSchema.findAll({
      Result: ArtistType,
      Request: S.Void,
      execute: () => sql`
        SELECT
          id,
          name,
          short_name as "shortName",
          abbreviation,
          "order",
          icon,
          coin_icon as "coinIcon",
          subtitle,
          elevator_pitch as "elevatorPitch",
          short_description as "shortDescription",
          long_description as "longDescription",
          metadata,
          notes,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM artist_types
        ORDER BY "order" ASC
      `,
    });

    const findById = SqlSchema.single({
      Result: ArtistType,
      Request: S.Struct({ id: S.String }),
      execute: ({ id }) => sql`
        SELECT
          id,
          name,
          short_name as "shortName",
          abbreviation,
          "order",
          icon,
          coin_icon as "coinIcon",
          subtitle,
          elevator_pitch as "elevatorPitch",
          short_description as "shortDescription",
          long_description as "longDescription",
          metadata,
          notes,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM artist_types
        WHERE id = ${id}
      `,
    });

    const insert = SqlSchema.single({
      Result: ArtistType,
      Request: CreateArtistTypeInput,
      execute: (request) => {
        const { createdAt, updatedAt, ...insertData } = request;
        if (createdAt !== undefined && updatedAt !== undefined) {
          return sql`
            INSERT INTO artist_types (
              id, name, short_name, abbreviation, "order", icon, coin_icon,
              subtitle, elevator_pitch, short_description, long_description,
              metadata, notes, created_at, updated_at
            ) VALUES (
              ${insertData.id}, ${insertData.name}, ${insertData.shortName},
              ${insertData.abbreviation}, ${insertData.order}, ${insertData.icon},
              ${insertData.coinIcon ?? null}, ${insertData.subtitle},
              ${insertData.elevatorPitch}, ${insertData.shortDescription},
              ${insertData.longDescription}, ${JSON.stringify(insertData.metadata)},
              ${insertData.notes ?? null}, ${createdAt}, ${updatedAt}
            )
            RETURNING
              id,
              name,
              short_name as "shortName",
              abbreviation,
              "order",
              icon,
              coin_icon as "coinIcon",
              subtitle,
              elevator_pitch as "elevatorPitch",
              short_description as "shortDescription",
              long_description as "longDescription",
              metadata,
              notes,
              created_at as "createdAt",
              updated_at as "updatedAt"
          `;
        }
        return sql`
          INSERT INTO artist_types ${sql.insert(insertData)}
          RETURNING
            id,
            name,
            short_name as "shortName",
            abbreviation,
            "order",
            icon,
            coin_icon as "coinIcon",
            subtitle,
            elevator_pitch as "elevatorPitch",
            short_description as "shortDescription",
            long_description as "longDescription",
            metadata,
            notes,
            created_at as "createdAt",
            updated_at as "updatedAt"
        `;
      },
    });

    return {
      findAll: () =>
        findAll(undefined).pipe(
          Effect.catchTags({
            ParseError: Effect.die,
            SqlError: Effect.die,
          }),
        ),

      findById: (id: ArtistTypeId) =>
        findById({ id }).pipe(
          Effect.catchTags({
            NoSuchElementException: () => new ArtistTypeNotFoundError({ id }),
            ParseError: Effect.die,
            SqlError: Effect.die,
          }),
        ),

      insert: (input: typeof CreateArtistTypeInput.Type) =>
        insert(input).pipe(
          Effect.catchTags({
            ParseError: Effect.die,
            SqlError: Effect.die,
          }),
        ),
    } as const;
  }),
}) {}
