/**
 * QuizServerRuntime - Server runtime for the @quiz package.
 *
 * This runtime provides all layers needed for the quiz features:
 * - QuestionService for quiz CRUD operations
 * - AnalysisService for analysis operations
 * - QuizTakerService for active quiz session management
 * - AnalysisEngineService for analysis engine operations
 *
 * Apps can either:
 * 1. Use this runtime directly for quiz-related server functions
 * 2. Compose their own runtime that includes these layers
 */

import * as GlobalValue from 'effect/GlobalValue';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as ManagedRuntime from 'effect/ManagedRuntime';

import { QuestionService } from '../../features/quiz/server/index.js';
import { AnalysisService } from '../../features/analysis/server/index.js';
import { AnalysisEngineService } from '../../features/analysis-engine/server/index.js';
import { QuizTakerService } from '../../features/active-quiz/domain/index.js';

// Use globalValue to persist the memoMap across hot reloads
const memoMap = GlobalValue.globalValue(Symbol.for('@quiz/server-memoMap'), () =>
  Effect.runSync(Layer.makeMemoMap),
);

/**
 * Layer combining all services needed for the quiz package.
 */
export const QuizServerLayer = Layer.mergeAll(
  QuestionService.Default,
  AnalysisService.Default,
  AnalysisEngineService.Default,
  QuizTakerService.Default,
);

/**
 * Server runtime for the quiz package.
 *
 * Use this runtime to run server-side effects that need quiz services.
 *
 * @example
 * ```ts
 * import { QuizServerRuntime } from '@quiz/server';
 *
 * const result = await QuizServerRuntime.runPromise(
 *   Effect.gen(function* () {
 *     const service = yield* QuestionService;
 *     return yield* service.create(...);
 *   })
 * );
 * ```
 */
export const QuizServerRuntime = GlobalValue.globalValue(Symbol.for('@quiz/server-runtime'), () =>
  ManagedRuntime.make(QuizServerLayer, memoMap),
);

/**
 * Type helper for the quiz server runtime.
 */
export type QuizServerRuntime = typeof QuizServerRuntime;
