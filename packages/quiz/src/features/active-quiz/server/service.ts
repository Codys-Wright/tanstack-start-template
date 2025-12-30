import * as Effect from 'effect/Effect';
import { ActiveQuizRepo } from '../database/index.js';
import type { UpsertActiveQuizPayload } from '../domain/schema.js';

/**
 * ActiveQuizServerService - Server-side service for active quiz operations.
 *
 * This service wraps ActiveQuizRepo and provides:
 * - CRUD operations for active quizzes
 * - Upsert logic (create or update based on id presence)
 */
export class ActiveQuizServerService extends Effect.Service<ActiveQuizServerService>()(
  'ActiveQuizServerService',
  {
    dependencies: [ActiveQuizRepo.Default],
    effect: Effect.gen(function* () {
      const repo = yield* ActiveQuizRepo;

      return {
        /** List all active quizzes */
        list: () => repo.findAll(),

        /** Get active quiz by slug */
        getBySlug: (slug: string) => repo.findBySlug(slug),

        /** Upsert an active quiz (create if no id, update if id provided) */
        upsert: (input: UpsertActiveQuizPayload) =>
          Effect.gen(function* () {
            if (input.id !== undefined) {
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
        delete: (slug: string) => repo.deleteBySlug(slug),
      } as const;
    }),
  },
) {}
