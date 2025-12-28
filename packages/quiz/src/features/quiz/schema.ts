//this is where the beginning of a new feature starts. We define what states are valid and create a contract that both the client and server must adhere to.
// Because of this, we will get type errors if our client or server are out of sync with our Domain definition of an entity
//
// After writing this file, we branch out in this order
// - Domain:
//     - Add the ExampleGroup to the DomainApi in DomainApi.ts
//
// - Server:
//      1)
//     - Make examples.repo.ts in server/src/internal, this is where the server interacts with the outside world eg/ Database
//     - Make examples.repo.test.ts in server/src/internal, this is our test file for intergration with the database
//
//      2)
//     - Make examples-rpc-live.ts in server/src/, this is the live implementation of this file where we make the handlers for the api and provide the repo
//
//      3)
//     - Add the layer Repo into server/src/server,ts
//
// - Database:
//     - Add a migration file in database/src/migrations which is SQL for creating the table in the database
//
// - Client:
//     - Make example.atom.ts, the entry point for the client through the HttpApi
//     - Any pages related to this feature will go in client/src/features/${featurename}/example.page.tsx, then that component is imported into the main router
//

import { NullOrFromFallible, Version } from '@core/domain';
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from '@effect/platform';
import { faker } from '@faker-js/faker';
import { Schema as S } from 'effect';
import { Question, UpsertQuestionPayload } from './questions/schema.js';

//1) Create a branded ID type for the entity to avoid confusion in logs and merging other id types
export const QuizId = S.UUID.pipe(S.brand('QuizId'));
//export a type for use with normal typescript outside of effect
export type QuizId = typeof QuizId.Type;

//2) Define the Actual Class Schema of the Entity

//Define any metadata for the schema, this goes through the NullorFromFallible schema util that will keep any JSON that meets our expectations,
// and silently return null if it is malformed data
export class QuizMetadata extends S.Class<QuizMetadata>('QuizMetadata')({
  tags: S.optional(S.Array(S.String)),
  customFields: S.optional(S.Record({ key: S.String, value: S.Unknown })),
}) {}

export class QuizSettings extends S.Class<QuizSettings>('QuizSettings')({
  customFields: S.optional(S.Record({ key: S.String, value: S.Unknown })),
}) {}

export class Quiz extends S.Class<Quiz>('Quiz')({
  //every entity should have an Id and a version
  id: QuizId,
  version: S.parseJson(Version),

  //Define the actual entity here
  title: S.String,
  subtitle: S.optional(S.NullOr(S.String)),
  description: S.optional(S.NullOr(S.String)),
  questions: S.optional(S.parseJson(S.Array(Question))),
  settings: S.optional(S.NullOr(S.parseJson(NullOrFromFallible(QuizSettings)))),

  //Publishing state - only one version per slug can be published
  isPublished: S.Boolean,

  //Temporary state - for unsaved edits that are auto-saved but not committed
  isTemp: S.Boolean,

  //optional metadata - stored as JSON in database
  metadata: S.optional(S.NullOr(S.parseJson(NullOrFromFallible(QuizMetadata)))),

  //Always include a createdAt and UpdatedAt time, but deletedAt is optional for things you want to be able to soft delete
  createdAt: S.DateTimeUtc,
  updatedAt: S.DateTimeUtc,
  deletedAt: S.NullOr(S.DateTimeUtc),
}) {}

//3) Define the Schema for upserting the entity, this does not need to include createdAt or updatedAt because those are handled
// at the database driver level, we also don't include deletedAt because that is its own operation "softdel"

export class UpsertQuizPayload extends S.Class<UpsertQuizPayload>('UpsertQuizPayload')({
  id: S.optional(QuizId),
  version: S.optional(Version).pipe(
    S.withDefaults({
      constructor: () => new Version({ semver: '1.0.0', comment: 'Initial version' }),
      decoding: () => new Version({ semver: '1.0.0', comment: 'Initial version' }),
    }),
  ),

  title: S.Trim.pipe(
    S.nonEmptyString({
      message: () => 'title is required',
    }),
    S.maxLength(30, {
      message: () => 'Title must be at most 30 characters long',
    }),
  ).annotations({
    arbitrary: () => (fc) => fc.constant(null).map(() => faker.lorem.words(3).slice(0, 30)),
  }),
  subtitle: S.optional(
    S.NullOr(
      S.Trim.pipe(
        S.nonEmptyString({
          message: () => 'subtitle is required',
        }),
        S.maxLength(100, {
          message: () => 'subtitle must be at most 30 characters long',
        }),
      ).annotations({
        arbitrary: () => (fc) => fc.constant(null).map(() => faker.lorem.sentence().slice(0, 100)),
      }),
    ),
  ),
  description: S.optional(
    S.NullOr(
      S.Trim.pipe(
        S.nonEmptyString({
          message: () => 'description is required',
        }),
        S.maxLength(1_000, {
          message: () => 'Description must be at most 1,000 characters long',
        }),
      ).annotations({
        arbitrary: () => (fc) =>
          fc.constant(null).map(() => faker.lorem.paragraphs(2).slice(0, 1000)),
      }),
    ),
  ),

  questions: S.optional(S.Array(UpsertQuestionPayload)),
  settings: S.optional(S.NullOr(S.parseJson(NullOrFromFallible(QuizSettings)))),

  //Publishing state - defaults to false (draft mode)
  isPublished: S.optional(S.Boolean),

  //Temporary state - defaults to false (permanent quiz)
  isTemp: S.optional(S.Boolean),

  metadata: S.optional(QuizMetadata),

  //
}) {}

//5) Define Errors for the entities
export class QuizNotFoundError extends S.TaggedError<QuizNotFoundError>('QuizNotFoundError')(
  'QuizNotFoundError',
  { id: QuizId },
  HttpApiSchema.annotations({
    status: 404,
  }),
) {
  get message() {
    return `Quiz with id ${this.id} not found`;
  }
}

//5) Export an HttpApiGroup so that we can incoprorate it into our DomainAPI
// This is where we use all the building blocks we made above
export class QuizzesGroup extends HttpApiGroup.make('Quizzes')
  .add(HttpApiEndpoint.get('list', '/').addSuccess(S.Array(Quiz)))
  .add(HttpApiEndpoint.get('listPublished', '/published').addSuccess(S.Array(Quiz)))
  .add(
    HttpApiEndpoint.get('byId', '/:id')
      .addSuccess(Quiz)
      .addError(QuizNotFoundError)
      .setPayload(
        S.Struct({
          id: QuizId,
        }),
      ),
  )
  .add(
    HttpApiEndpoint.put('upsert', '/')
      .addSuccess(Quiz)
      .addError(QuizNotFoundError)
      .setPayload(UpsertQuizPayload),
  )
  .add(
    HttpApiEndpoint.del('delete', '/')
      .setPayload(
        S.Struct({
          id: QuizId,
        }),
      )
      .addSuccess(S.Void)
      .addError(QuizNotFoundError),
  )
  .prefix('/Quizzes') {}
