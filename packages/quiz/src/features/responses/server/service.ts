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
 *
 * All methods use Effect.fn for automatic OpenTelemetry tracing.
 */
export class ResponsesServerService extends Effect.Service<ResponsesServerService>()(
  'ResponsesServerService',
  {
    dependencies: [ResponsesRepo.Default],
    effect: Effect.gen(function* () {
      const repo = yield* ResponsesRepo;

      return {
        /** List all responses */
        list: Effect.fn('ResponsesService.list')(function* () {
          const responses = yield* repo.findAll();
          yield* Effect.annotateCurrentSpan('response.count', responses.length);
          return responses;
        }),

        /** Get response by ID */
        getById: Effect.fn('ResponsesService.getById')(function* (id: ResponseId) {
          yield* Effect.annotateCurrentSpan('response.id', id);
          return yield* repo.findById(id);
        }),

        /** Get responses by quiz ID */
        getByQuizId: Effect.fn('ResponsesService.getByQuizId')(function* (quizId: QuizId) {
          yield* Effect.annotateCurrentSpan('quiz.id', quizId);
          const responses = yield* repo.findByQuizId(quizId);
          yield* Effect.annotateCurrentSpan('response.count', responses.length);
          return responses;
        }),

        /** Upsert a response (create if no id, update if id provided) */
        upsert: Effect.fn('ResponsesService.upsert')(function* (input: UpsertResponsePayload) {
          yield* Effect.annotateCurrentSpan('quiz.id', input.quizId);
          yield* Effect.annotateCurrentSpan('operation', input.id ? 'update' : 'create');

          if (input.id !== undefined) {
            yield* Effect.annotateCurrentSpan('response.id', input.id);
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
        delete: Effect.fn('ResponsesService.delete')(function* (id: ResponseId) {
          yield* Effect.annotateCurrentSpan('response.id', id);
          return yield* repo.del(id);
        }),
      } as const;
    }),
  },
) {}
