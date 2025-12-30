import * as Effect from 'effect/Effect';
import { ResponsesRepo } from '../database/index.js';
import type { ResponseId, UpsertResponsePayload } from '../domain/schema.js';
import type { QuizId } from '../../quiz/domain/schema.js';

/**
 * ResponsesServerService - Server-side service for quiz response operations.
 *
 * This service wraps ResponsesRepo and provides:
 * - CRUD operations for quiz responses
 * - Upsert logic (create or update based on id presence)
 */
export class ResponsesServerService extends Effect.Service<ResponsesServerService>()(
  'ResponsesServerService',
  {
    dependencies: [ResponsesRepo.Default],
    effect: Effect.gen(function* () {
      const repo = yield* ResponsesRepo;

      return {
        /** List all responses */
        list: () => repo.findAll(),

        /** Get response by ID */
        getById: (id: ResponseId) => repo.findById(id),

        /** Get responses by quiz ID */
        getByQuizId: (quizId: QuizId) => repo.findByQuizId(quizId),

        /** Upsert a response (create if no id, update if id provided) */
        upsert: (input: UpsertResponsePayload) =>
          Effect.gen(function* () {
            if (input.id !== undefined) {
              // Update existing response
              return yield* repo.update({
                id: input.id,
                quizId: input.quizId,
                answers: input.answers,
                sessionMetadata: input.sessionMetadata,
                interactionLogs: input.interactionLogs,
                metadata: input.metadata,
              });
            }

            // Create new response
            return yield* repo.create({
              quizId: input.quizId,
              answers: input.answers,
              sessionMetadata: input.sessionMetadata,
              interactionLogs: input.interactionLogs,
              metadata: input.metadata,
            });
          }),

        /** Delete a response by ID */
        delete: (id: ResponseId) => repo.del(id),
      } as const;
    }),
  },
) {}
