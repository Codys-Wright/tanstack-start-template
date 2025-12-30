/**
 * Server function for loading quiz taker data.
 *
 * This module provides the loadQuizTaker server function that:
 * 1. Loads quizzes, engines, and active quiz data
 * 2. Returns dehydrated atoms for SSR hydration
 *
 * @example App route usage:
 * ```tsx
 * // apps/my-app/src/routes/quiz.tsx
 * import { createFileRoute } from '@tanstack/react-router';
 * import { QuizTakerPage, loadQuizTaker } from '@quiz';
 *
 * export const Route = createFileRoute('/quiz')({
 *   loader: () => loadQuizTaker(),
 *   component: QuizPageWrapper,
 * });
 *
 * function QuizPageWrapper() {
 *   const loaderData = Route.useLoaderData();
 *   return <QuizTakerPage loaderData={loaderData} />;
 * }
 * ```
 */

import type * as Hydration from '@effect-atom/atom/Hydration';
import { Atom, Result } from '@effect-atom/atom-react';
import { createServerFn } from '@tanstack/react-start';
import * as Effect from 'effect/Effect';

import { QuizServerRuntime } from '../../../core/server/runtime.js';
import { QuizService } from '../../quiz/server/index.js';
import { AnalysisEngineServerService } from '../../analysis-engine/server/index.js';
import { quizzesAtom } from '../../quiz/client/atoms.js';
import { enginesAtom } from '../../analysis-engine/client/atoms.js';
import { activeQuizzesAtom } from '../client/atoms.js';
import { ActiveQuizServerService } from '../server/service.js';

// ============================================================================
// Dehydrate Helper
// ============================================================================

/**
 * Dehydrates a single atom value for SSR hydration.
 */
const dehydrate = <A, I>(
  atom: Atom.Atom<A> & {
    [Atom.SerializableTypeId]: { key: string; encode: (value: A) => I };
  },
  value: A,
): Hydration.DehydratedAtom =>
  ({
    '~@effect-atom/atom/DehydratedAtom': true,
    key: atom[Atom.SerializableTypeId].key,
    value: atom[Atom.SerializableTypeId].encode(value),
    dehydratedAt: Date.now(),
  }) as Hydration.DehydratedAtom;

// ============================================================================
// Types
// ============================================================================

export interface QuizTakerLoaderData {
  quizzes: Hydration.DehydratedAtom;
  engines: Hydration.DehydratedAtom;
  activeQuizzes: Hydration.DehydratedAtom;
}

// ============================================================================
// Server Function
// ============================================================================

/**
 * Server function to load quiz taker data for SSR.
 *
 * This function:
 * 1. Loads all quizzes
 * 2. Loads all analysis engines
 * 3. Loads all active quizzes
 * 4. Returns dehydrated atoms for HydrationBoundary
 */
export const loadQuizTaker = createServerFn({ method: 'GET' }).handler(
  async (): Promise<QuizTakerLoaderData> => {
    console.log('[loadQuizTaker] Starting SSR data fetch...');

    const result = await QuizServerRuntime.runPromiseExit(
      Effect.gen(function* () {
        const quizService = yield* QuizService;
        const engineService = yield* AnalysisEngineServerService;
        const activeQuizService = yield* ActiveQuizServerService;

        console.log('[loadQuizTaker] Services acquired, fetching data...');

        // Load all data in parallel
        const [quizzes, engines, activeQuizzes] = yield* Effect.all([
          quizService.list(),
          engineService.list(),
          activeQuizService.list(),
        ]);

        console.log('[loadQuizTaker] Data fetched:', {
          quizzesCount: quizzes.length,
          enginesCount: engines.length,
          activeQuizzesCount: activeQuizzes.length,
        });

        return { quizzes, engines, activeQuizzes };
      }),
    );

    const data = Result.fromExit(result);

    if (Result.isSuccess(data)) {
      return {
        quizzes: dehydrate(quizzesAtom.remote, Result.success(data.value.quizzes)),
        engines: dehydrate(enginesAtom.remote, Result.success(data.value.engines)),
        activeQuizzes: dehydrate(
          activeQuizzesAtom.remote,
          Result.success(data.value.activeQuizzes),
        ),
      };
    }

    // Return error state for all atoms
    const errorResult = Result.failure(data.cause);
    return {
      quizzes: dehydrate(quizzesAtom.remote, errorResult as any),
      engines: dehydrate(enginesAtom.remote, errorResult as any),
      activeQuizzes: dehydrate(activeQuizzesAtom.remote, errorResult as any),
    };
  },
);
