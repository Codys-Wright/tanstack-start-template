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
 *
 * All methods use Effect.fn for automatic OpenTelemetry tracing.
 */
export class QuizService extends Effect.Service<QuizService>()('QuizService', {
  dependencies: [QuizzesRepo.Default],
  effect: Effect.gen(function* () {
    const repo = yield* QuizzesRepo;

    return {
      /** List all quizzes (excluding soft-deleted) */
      list: Effect.fn('QuizService.list')(function* () {
        const quizzes = yield* repo.findAll();
        yield* Effect.annotateCurrentSpan('quiz.count', quizzes.length);
        return quizzes;
      }),

      /** List only published quizzes */
      listPublished: Effect.fn('QuizService.listPublished')(function* () {
        const quizzes = yield* repo.findPublished();
        yield* Effect.annotateCurrentSpan('quiz.count', quizzes.length);
        return quizzes;
      }),

      /** Get a specific quiz by ID */
      getById: Effect.fn('QuizService.getById')(function* (id: QuizId) {
        yield* Effect.annotateCurrentSpan('quiz.id', id);
        return yield* repo.findById(id);
      }),

      /** Create or update a quiz based on whether ID is provided */
      upsert: Effect.fn('QuizService.upsert')(function* (input: UpsertQuizPayload) {
        yield* Effect.annotateCurrentSpan('operation', input.id ? 'update' : 'create');

        // Transform questions to ensure all have IDs
        const questions = yield* transformQuestions(input.questions);
        yield* Effect.annotateCurrentSpan('question.count', questions?.length ?? 0);

        // If ID is provided, it's an update; otherwise, it's a create
        if (input.id !== undefined) {
          yield* Effect.annotateCurrentSpan('quiz.id', input.id);
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
      delete: Effect.fn('QuizService.delete')(function* (id: QuizId) {
        yield* Effect.annotateCurrentSpan('quiz.id', id);
        return yield* repo.del(id);
      }),
    } as const;
  }),
}) {}
