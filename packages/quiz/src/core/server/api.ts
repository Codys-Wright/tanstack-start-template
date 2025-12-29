import * as HttpApi from '@effect/platform/HttpApi';
import { QuizzesApiGroup } from '../../features/quiz/domain/api.js';
import { AnalysisGroup } from '../../features/analysis/domain/schema.js';
import { AnalysisEngineGroup } from '../../features/analysis-engine/domain/schema.js';
import { ResponsesGroup } from '../../features/responses/domain/schema.js';
import { ActiveQuizzesGroup } from '../../features/active-quiz/domain/schema.js';

export class QuizApi extends HttpApi.make('quiz-api')
  .add(QuizzesApiGroup)
  .add(AnalysisGroup)
  .add(AnalysisEngineGroup)
  .add(ResponsesGroup)
  .add(ActiveQuizzesGroup) {}
