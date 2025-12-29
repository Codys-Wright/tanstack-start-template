import type { Question, QuestionId, UpsertQuestionPayload } from '../questions/schema.js';
import * as Effect from 'effect/Effect';

export class QuestionService extends Effect.Service<QuestionService>()('QuestionService', {
  effect: Effect.succeed({
    create: (payload: UpsertQuestionPayload): Effect.Effect<Question, never> =>
      Effect.gen(function* () {
        // Generate a new ID if one wasn't provided
        const id = payload.id ?? (yield* Effect.sync(() => crypto.randomUUID() as QuestionId));

        // Transform UpsertQuestionPayload to Question
        const question: Question = {
          id,
          order: payload.order,
          title: payload.title,
          subtitle: payload.subtitle,
          description: payload.description,
          data: payload.data,
          metadata: payload.metadata ?? null,
        };

        return question;
      }),

    createMany: (
      payloads: ReadonlyArray<UpsertQuestionPayload>,
    ): Effect.Effect<ReadonlyArray<Question>, never> =>
      Effect.all(
        payloads.map((payload) =>
          Effect.gen(function* () {
            const id = payload.id ?? (yield* Effect.sync(() => crypto.randomUUID() as QuestionId));
            const question: Question = {
              id,
              order: payload.order,
              title: payload.title,
              subtitle: payload.subtitle,
              description: payload.description,
              data: payload.data,
              metadata: payload.metadata ?? null,
            };
            return question;
          }),
        ),
      ),

    update: (payload: UpsertQuestionPayload): Effect.Effect<Question, Error> =>
      Effect.gen(function* () {
        // For updates, ID must be provided
        if (payload.id === undefined) {
          return yield* Effect.fail(new Error('Question ID is required for updates'));
        }

        const question: Question = {
          id: payload.id,
          order: payload.order,
          title: payload.title,
          subtitle: payload.subtitle,
          description: payload.description,
          data: payload.data,
          metadata: payload.metadata ?? null,
        };

        return question;
      }),
  }),
}) {}
