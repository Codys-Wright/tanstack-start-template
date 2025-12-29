import * as HttpApiEndpoint from '@effect/platform/HttpApiEndpoint';
import * as HttpApiGroup from '@effect/platform/HttpApiGroup';
import * as Schema from 'effect/Schema';
import { Quiz, QuizId, UpsertQuizPayload, QuizNotFoundError } from './schema.js';

/**
 * QuizzesApiGroup - HTTP API group for quiz CRUD operations.
 * This is composed into the full QuizApi at the package level.
 */
export class QuizzesApiGroup extends HttpApiGroup.make('Quizzes')
  .add(HttpApiEndpoint.get('list', '/').addSuccess(Schema.Array(Quiz)))
  .add(HttpApiEndpoint.get('listPublished', '/published').addSuccess(Schema.Array(Quiz)))
  .add(
    HttpApiEndpoint.get('byId', '/:id')
      .addSuccess(Quiz)
      .addError(QuizNotFoundError)
      .setPath(Schema.Struct({ id: QuizId })),
  )
  .add(
    HttpApiEndpoint.put('upsert', '/')
      .addSuccess(Quiz)
      .addError(QuizNotFoundError)
      .setPayload(UpsertQuizPayload),
  )
  .add(
    HttpApiEndpoint.del('delete', '/')
      .setPayload(Schema.Struct({ id: QuizId }))
      .addSuccess(Schema.Void)
      .addError(QuizNotFoundError),
  )
  .prefix('/quizzes') {}
