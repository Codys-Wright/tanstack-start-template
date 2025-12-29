import { QuizzesApiGroup } from '../../features/quiz/domain/api.js';
import { AnalysisApiGroup } from '../../features/analysis/domain/api.js';
import { AnalysisEngineApiGroup } from '../../features/analysis-engine/domain/api.js';
import { ResponsesApiGroup } from '../../features/responses/domain/api.js';
import { ActiveQuizzesApiGroup } from '../../features/active-quiz/domain/api.js';
import * as HttpApi from '@effect/platform/HttpApi';

export class QuizApi extends HttpApi.make('quiz-api')
  .add(QuizzesApiGroup)
  .add(AnalysisApiGroup)
  .add(AnalysisEngineApiGroup)
  .add(ResponsesApiGroup)
  .add(ActiveQuizzesApiGroup) {}
