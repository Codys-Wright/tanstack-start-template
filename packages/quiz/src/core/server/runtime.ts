/**
 * QuizServerRuntime - Server runtime for the @quiz package.
 *
 * This runtime provides all layers needed for the quiz features:
 * - QuizService for quiz CRUD operations
 * - AnalysisServerService for analysis operations
 * - QuizTakerService for active quiz session management
 * - AnalysisEngineServerService for analysis engine operations
 * - TracerLive for OpenTelemetry tracing (exports Effect.fn spans to Jaeger)
 *
 * Apps can either:
 * 1. Use this runtime directly for quiz-related server functions
 * 2. Compose their own runtime that includes these layers
 */

import * as GlobalValue from 'effect/GlobalValue';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as ManagedRuntime from 'effect/ManagedRuntime';

import { TracerLive } from '@core/server';

import { QuizService } from '../../features/quiz/server/index.js';
import { AnalysisServerService } from '../../features/analysis/server/index.js';
import { AnalysisEngineServerService } from '../../features/analysis-engine/server/index.js';
import { QuizTakerService } from '../../features/active-quiz/domain/quiz-taker.service.js';
import { ActiveQuizServerService } from '../../features/active-quiz/server/service.js';
import { ResponsesServerService } from '../../features/responses/server/service.js';

// Use globalValue to persist the memoMap across hot reloads
const memoMap = GlobalValue.globalValue(Symbol.for('@quiz/server-memoMap'), () =>
  Effect.runSync(Layer.makeMemoMap),
);

/**
 * Layer combining all services needed for the quiz package.
 * Includes TracerLive for OpenTelemetry span exports.
 */
export const QuizServerLayer = Layer.mergeAll(
  QuizService.Default,
  AnalysisServerService.Default,
  AnalysisEngineServerService.Default,
  QuizTakerService.Default,
  ActiveQuizServerService.Default,
  ResponsesServerService.Default,
).pipe(Layer.provideMerge(TracerLive));

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
