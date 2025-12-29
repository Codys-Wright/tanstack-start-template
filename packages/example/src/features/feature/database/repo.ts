import { PgLive } from '@core/database';
import * as SqlClient from '@effect/sql/SqlClient';
import * as SqlSchema from '@effect/sql/SqlSchema';
import * as Effect from 'effect/Effect';
import { flow } from 'effect/Function';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import {
  CreateFeatureInput,
  Feature,
  FeatureId,
  FeatureNotFound,
  UpdateFeatureInput,
} from '../domain';

export class FeatureRepository extends Effect.Service<FeatureRepository>()(
  '@example/database/FeatureRepository',
  {
    dependencies: [PgLive],
    effect: Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      const list = flow(
        SqlSchema.findAll({
          Request: Schema.Void,
          Result: Feature,
          execute: () => sql`
            SELECT
              id,
              name,
              description,
              created_at AS "createdAt",
              updated_at AS "updatedAt"
            FROM
              public.features
            ORDER BY
              created_at DESC
          `,
        }),
        Effect.orDie,
        Effect.withSpan('FeatureRepository.list'),
      );

      const getById = (id: FeatureId) =>
        Effect.gen(function* () {
          const result = yield* SqlSchema.findOne({
            Request: FeatureId,
            Result: Feature,
            execute: (reqId) => sql`
              SELECT
                id,
                name,
                description,
                created_at AS "createdAt",
                updated_at AS "updatedAt"
              FROM
                public.features
              WHERE
                id = ${reqId}
            `,
          })(id);

          return yield* Option.match(result, {
            onNone: () => Effect.fail(new FeatureNotFound({ id })),
            onSome: Effect.succeed,
          });
        }).pipe(Effect.orDie, Effect.withSpan('FeatureRepository.getById'));

      const create = flow(
        SqlSchema.single({
          Request: CreateFeatureInput,
          Result: Feature,
          execute: (input) => sql`
            INSERT INTO public.features (name, description)
            VALUES (${input.name}, ${input.description})
            RETURNING
              id,
              name,
              description,
              created_at AS "createdAt",
              updated_at AS "updatedAt"
          `,
        }),
        Effect.orDie,
        Effect.withSpan('FeatureRepository.create'),
      );

      const update = (id: FeatureId, input: UpdateFeatureInput) =>
        Effect.gen(function* () {
          const nameValue = Option.getOrNull(input.name);
          const descriptionValue = Option.getOrNull(input.description);

          if (nameValue === null && descriptionValue === null) {
            // No updates, just return the existing feature
            return yield* getById(id);
          }

          // Build dynamic update query based on what's provided
          const result = yield* Effect.gen(function* () {
            if (nameValue !== null && descriptionValue !== null) {
              return yield* SqlSchema.findOne({
                Request: Schema.Struct({
                  id: FeatureId,
                  name: Schema.String,
                  description: Schema.String,
                }),
                Result: Feature,
                execute: (req) => sql`
                  UPDATE public.features
                  SET
                    name = ${req.name},
                    description = ${req.description},
                    updated_at = NOW()
                  WHERE id = ${req.id}
                  RETURNING
                    id,
                    name,
                    description,
                    created_at AS "createdAt",
                    updated_at AS "updatedAt"
                `,
              })({ id, name: nameValue, description: descriptionValue });
            } else if (nameValue !== null) {
              return yield* SqlSchema.findOne({
                Request: Schema.Struct({
                  id: FeatureId,
                  name: Schema.String,
                }),
                Result: Feature,
                execute: (req) => sql`
                  UPDATE public.features
                  SET
                    name = ${req.name},
                    updated_at = NOW()
                  WHERE id = ${req.id}
                  RETURNING
                    id,
                    name,
                    description,
                    created_at AS "createdAt",
                    updated_at AS "updatedAt"
                `,
              })({ id, name: nameValue });
            } else {
              return yield* SqlSchema.findOne({
                Request: Schema.Struct({
                  id: FeatureId,
                  description: Schema.String,
                }),
                Result: Feature,
                execute: (req) => sql`
                  UPDATE public.features
                  SET
                    description = ${req.description},
                    updated_at = NOW()
                  WHERE id = ${req.id}
                  RETURNING
                    id,
                    name,
                    description,
                    created_at AS "createdAt",
                    updated_at AS "updatedAt"
                `,
              })({ id, description: descriptionValue! });
            }
          });

          return yield* Option.match(result, {
            onNone: () => Effect.fail(new FeatureNotFound({ id })),
            onSome: Effect.succeed,
          });
        }).pipe(Effect.orDie, Effect.withSpan('FeatureRepository.update'));

      const remove = flow(
        SqlSchema.void({
          Request: FeatureId,
          execute: (id) => sql`
            DELETE FROM public.features
            WHERE id = ${id}
          `,
        }),
        Effect.orDie,
        Effect.withSpan('FeatureRepository.remove'),
      );

      return {
        list,
        getById,
        create,
        update,
        remove,
      } as const;
    }),
  },
) {}
