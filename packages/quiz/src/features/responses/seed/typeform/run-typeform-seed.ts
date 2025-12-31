import * as BunContext from '@effect/platform-bun/BunContext';
import * as BunRuntime from '@effect/platform-bun/BunRuntime';
import { QuizzesRepo } from '../../../quiz/database/index.js';
import { ResponsesRepo } from '../../database/index.js';
import { PgLive } from '@core/database';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { getTypeformResponseSeedData } from './seed-typeform-responses.js';

/**
 * Seeds Typeform responses into the database
 * This script reads the processed Typeform data and creates QuizResponse records
 */
const seedTypeformResponses = Effect.gen(function* () {
  const responsesRepo = yield* ResponsesRepo;
  const quizzesRepo = yield* QuizzesRepo;

  yield* Effect.log(`Starting Typeform response seeding...`);

  // Get the seed data
  const seedData = getTypeformResponseSeedData();
  yield* Effect.log(`Found ${seedData.length} responses to process`);

  // Find the quiz by slug (assuming it's "my-artist-type-quiz")
  const quizzes = yield* quizzesRepo.findAll();
  const quiz = quizzes.find((q) => q.title.toLowerCase().includes('artist type'));

  if (quiz === undefined) {
    return yield* Effect.fail(
      new Error("Quiz 'my-artist-type-quiz' not found. Please seed the quiz first."),
    );
  }

  // TypeScript assertion that quiz is defined after the check
  const foundQuiz = quiz as NonNullable<typeof quiz>;

  yield* Effect.log(`Found quiz: ${foundQuiz.title} (ID: ${foundQuiz.id})`);

  let successCount = 0;
  let errorCount = 0;

  // Process each Typeform response
  for (const [index, responseData] of seedData.entries()) {
    try {
      // Create the response with the actual quiz ID
      yield* responsesRepo.create({
        ...responseData,
        quizId: foundQuiz.id, // Use the actual quiz ID from the database
        interactionLogs: [], // Fix type mismatch by providing empty array
      });

      successCount++;

      if (index % 100 === 0) {
        yield* Effect.log(`Processed ${index + 1}/${seedData.length} responses...`);
      }
    } catch (error) {
      errorCount++;
      yield* Effect.logError(`Error processing response ${index + 1}: ${error}`);
    }
  }

  yield* Effect.log(`Seeding completed!`);
  yield* Effect.log(`Successfully imported: ${successCount} responses`);
  yield* Effect.log(`Errors: ${errorCount} responses`);
  yield* Effect.log(`Total processed: ${seedData.length} responses`);

  return {
    successCount,
    errorCount,
    totalProcessed: seedData.length,
  };
});

// Run the seeding script
const SeedLive = Layer.mergeAll(
  ResponsesRepo.Default,
  QuizzesRepo.Default,
  BunContext.layer,
  PgLive,
);

BunRuntime.runMain(
  seedTypeformResponses.pipe(
    Effect.provide(SeedLive),
    Effect.catchAll((error) =>
      Effect.gen(function* () {
        yield* Effect.logError(`Seeding failed: ${error}`);
        return yield* Effect.sync(() => process.exit(1));
      }),
    ),
  ),
);
