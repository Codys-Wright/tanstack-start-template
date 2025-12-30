/**
 * Database Seeding Script
 *
 * Seeds the database with data for development and testing.
 * Uses composable seeders from feature packages.
 *
 * Usage:
 *   bun run db:seed                    # Seed with all data (quiz, responses, analysis, users, etc.)
 *   bun run db:seed --cleanup          # Remove all fake data
 *   bun run db:seed --quiz-only        # Only seed quiz data (no fake users/todos)
 *   bun run db:seed --minimal          # Minimal seed (quiz data only, no responses)
 */

import * as Effect from 'effect/Effect';
import * as Logger from 'effect/Logger';

import { auth, authCleanup } from '@auth/database';
import { runCleanup, runSeed } from '@core/database';
import { example, exampleCleanup } from '@example/database';
import { todo, todoCleanup } from '@todo/database';
import { quiz, quizCleanup } from '@quiz/database';

const isCleanup = process.argv.includes('--cleanup');
const isMinimal = process.argv.includes('--minimal');
const isQuizOnly = process.argv.includes('--quiz-only');

if (isCleanup) {
  // Cleanup mode: remove all data (quiz cleanup first due to dependencies)
  await Effect.runPromise(
    runCleanup(...quizCleanup(), ...exampleCleanup(), ...todoCleanup(), ...authCleanup()).pipe(
      Effect.provide(Logger.pretty),
    ),
  );
} else if (isQuizOnly) {
  // Quiz-only mode: quiz + responses + analysis, no fake users/todos
  await Effect.runPromise(
    runSeed(
      ...quiz({
        includeTypeformResponses: !isMinimal,
        includeAnalysisResults: !isMinimal,
      }),
    ).pipe(Effect.provide(Logger.pretty)),
  );
} else {
  // Default seed mode: all data including Typeform responses and analysis results
  // Use --minimal to skip Typeform responses and analysis
  await Effect.runPromise(
    runSeed(
      ...auth({ users: 50, organizations: 10 }),
      ...todo({ todos: 100 }),
      ...example({ features: 20 }),
      ...quiz({
        includeTypeformResponses: !isMinimal,
        includeAnalysisResults: !isMinimal,
      }),
    ).pipe(Effect.provide(Logger.pretty)),
  );
}
