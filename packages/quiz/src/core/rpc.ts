/**
 * QuizRpc - Combined RPC group for all quiz features.
 *
 * Merges all feature-level RPC definitions into a single group
 * that can be used in the app's domain configuration.
 */
import { QuizzesRpc } from '../features/quiz/domain/rpc.js';
import { AnalysisRpc } from '../features/analysis/domain/rpc.js';
import { AnalysisEngineRpc } from '../features/analysis-engine/domain/rpc.js';
import { ActiveQuizRpc } from '../features/active-quiz/domain/rpc.js';
import { ResponsesRpc } from '../features/responses/domain/rpc.js';

export const QuizRpc = QuizzesRpc.merge(AnalysisRpc)
  .merge(AnalysisEngineRpc)
  .merge(ActiveQuizRpc)
  .merge(ResponsesRpc);
