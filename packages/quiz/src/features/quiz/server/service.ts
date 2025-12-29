import * as Effect from 'effect/Effect';
import { QuizzesRepo } from '../database/index.js';
import type { QuizId, UpsertQuizPayload } from '../domain/index.js';
import type { Question, QuestionId, UpsertQuestionPayload } from '../questions/schema.js';

/**
 * Transform UpsertQuestionPayload to Question by ensuring all questions have IDs.
 * New questions (without ID) get a generated UUID.
 */
const transformQuestions = (
  questions: ReadonlyArray<UpsertQuestionPayload> | undefined,
): Effect.Effect<ReadonlyArray<Question> | undefined> => {
  if (questions === undefined) {
    return Effect.succeed(undefined);
  }

  return Effect.all(
    questions.map((q) =>
      Effect.gen(function* () {
        const id = q.id ?? (yield* Effect.sync(() => crypto.randomUUID() as QuestionId));
        return {
          id,
          order: q.order,
          title: q.title,
          subtitle: q.subtitle,
          description: q.description,
          data: q.data,
          metadata: q.metadata ?? null,
        } as Question;
      }),
    ),
  );
};

/**
 * QuizService - Business logic layer for quiz operations.
 *
 * This service wraps the QuizzesRepo and provides a clean API for:
 * - Listing quizzes (all and published-only)
 * - Getting a quiz by ID
 * - Creating/updating quizzes (upsert pattern)
 * - Deleting quizzes (soft delete)
 */
export class QuizService extends Effect.Service<QuizService>()('QuizService', {
  dependencies: [QuizzesRepo.Default],
  effect: Effect.gen(function* () {
    const repo = yield* QuizzesRepo;

    return {
      /** List all quizzes (excluding soft-deleted) */
      list: () => repo.findAll(),

      /** List only published quizzes */
      listPublished: () => repo.findPublished(),

      /** Get a specific quiz by ID */
      getById: (id: QuizId) => repo.findById(id),

      /** Create or update a quiz based on whether ID is provided */
      upsert: (input: UpsertQuizPayload) =>
        Effect.gen(function* () {
          // Transform questions to ensure all have IDs
          const questions = yield* transformQuestions(input.questions);

          // If ID is provided, it's an update; otherwise, it's a create
          if (input.id !== undefined) {
            return yield* repo.update({
              id: input.id,
              title: input.title,
              subtitle: input.subtitle,
              description: input.description,
              questions,
              metadata: input.metadata,
              version: input.version,
              isPublished: input.isPublished ?? false,
              isTemp: input.isTemp ?? false,
            });
          }

          return yield* repo.create({
            title: input.title,
            subtitle: input.subtitle,
            description: input.description,
            questions,
            metadata: input.metadata,
            version: input.version,
            isPublished: input.isPublished ?? false,
            isTemp: input.isTemp ?? false,
          });
        }),

      /** Soft delete a quiz by ID */
      delete: (id: QuizId) => repo.del(id),
    } as const;
  }),
}) {}
