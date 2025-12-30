import * as Effect from 'effect/Effect';
import { ActiveQuizRepo } from '../database/index.js';
import type { UpsertActiveQuizPayload } from '../domain/schema.js';

/**
 * ActiveQuizServerService - Server-side service for active quiz operations.
 *
 * This service wraps ActiveQuizRepo and provides:
 * - CRUD operations for active quizzes
 * - Upsert logic (create or update based on id presence)
 *
 * All methods use Effect.fn for automatic OpenTelemetry tracing.
 */
export class ActiveQuizServerService extends Effect.Service<ActiveQuizServerService>()(
  'ActiveQuizServerService',
  {
    dependencies: [ActiveQuizRepo.Default],
    effect: Effect.gen(function* () {
      const repo = yield* ActiveQuizRepo;

      return {
        /** List all active quizzes */
        list: Effect.fn('ActiveQuizService.list')(function* () {
          const quizzes = yield* repo.findAll();
          yield* Effect.annotateCurrentSpan('activeQuiz.count', quizzes.length);
          return quizzes;
        }),

        /** Get active quiz by slug */
        getBySlug: Effect.fn('ActiveQuizService.getBySlug')(function* (slug: string) {
          yield* Effect.annotateCurrentSpan('activeQuiz.slug', slug);
          return yield* repo.findBySlug(slug);
        }),

        /** Upsert an active quiz (create if no id, update if id provided) */
        upsert: Effect.fn('ActiveQuizService.upsert')(function* (input: UpsertActiveQuizPayload) {
          yield* Effect.annotateCurrentSpan('activeQuiz.slug', input.slug);
          yield* Effect.annotateCurrentSpan('operation', input.id ? 'update' : 'create');

          if (input.id !== undefined) {
            yield* Effect.annotateCurrentSpan('activeQuiz.id', input.id);
            // Update existing active quiz
            return yield* repo.update({
              id: input.id,
              slug: input.slug,
              quizId: input.quizId,
              engineId: input.engineId,
            });
          }

          // Create new active quiz
          return yield* repo.create({
            slug: input.slug,
            quizId: input.quizId,
            engineId: input.engineId,
          });
        }),

        /** Delete an active quiz by slug */
        delete: Effect.fn('ActiveQuizService.delete')(function* (slug: string) {
          yield* Effect.annotateCurrentSpan('activeQuiz.slug', slug);
          return yield* repo.deleteBySlug(slug);
        }),
      } as const;
    }),
  },
) {}
