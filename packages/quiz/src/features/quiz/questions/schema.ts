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

import { NullOrFromFallible } from "@core/domain";
import { HttpApiSchema } from "@effect/platform";
import { faker } from "@faker-js/faker";
import { Schema as S } from "effect";
import { QuestionData, UpsertQuestionData } from "./question-types.js";

//1) Create a branded ID type for the entity to avoid confusion in logs and merging other id types
export const QuestionId = S.UUID.pipe(S.brand("QuestionId"));
//export a type for use with normal typescript outside of effect
export type QuestionId = typeof QuestionId.Type;

//2) Define the Actual Class Schema of the Entity

//Define any metadata for the schema, this goes through the NullorFromFallible schema util that will keep any JSON that meets our expectations,
// and silently return null if it is malformed data
export class QuestionMetadata extends S.Class<QuestionMetadata>("QuestionMetadata")({
  tags: S.optional(S.Array(S.String)),
  customFields: S.optional(S.Record({ key: S.String, value: S.Unknown })),
}) {}

export class Question extends S.Class<Question>("Question")({
  id: QuestionId,

  //Define the actual entity here
  order: S.Number,
  title: S.String,
  subtitle: S.optional(S.String),
  description: S.optional(S.String),
  //determines the type, and all type specific fields
  data: QuestionData,

  //optional metadata - stored as JSON in database
  metadata: S.parseJson(NullOrFromFallible(QuestionMetadata)),
}) {}

//3) Define the Schema for upserting the entity, this does not need to include createdAt or updatedAt because those are handled
// at the database driver level, we also don't include deletedAt because that is its own operation "softdel"

export class UpsertQuestionPayload extends S.Class<UpsertQuestionPayload>("UpsertQuestionPayload")({
  id: S.optional(QuestionId),

  order: S.Number.pipe(S.int(), S.nonNegative()).annotations({
    arbitrary: () => (fc) => fc.constant(null).map(() => faker.number.int({ min: 1, max: 50 })),
  }),

  title: S.Trim.pipe(
    S.nonEmptyString({
      message: () => "title is required",
    }),
    S.maxLength(200, {
      message: () => "Title must be at most 200 characters long",
    }),
  ).annotations({
    arbitrary: () => (fc) => fc.constant(null).map(() => faker.lorem.sentence().slice(0, 200)),
  }),
  subtitle: S.optional(
    S.Trim.pipe(
      S.nonEmptyString({
        message: () => "subtitle is required when provided",
      }),
      S.maxLength(300, {
        message: () => "Subtitle must be at most 300 characters long",
      }),
    ).annotations({
      arbitrary: () => (fc) => fc.constant(null).map(() => faker.lorem.words(3).slice(0, 300)),
    }),
  ),
  description: S.optional(
    S.Trim.pipe(
      S.nonEmptyString({
        message: () => "description is required when provided",
      }),
      S.maxLength(1_000, {
        message: () => "Description must be at most 1,000 characters long",
      }),
    ).annotations({
      arbitrary: () => (fc) => fc.constant(null).map(() => faker.lorem.paragraph().slice(0, 1000)),
    }),
  ),

  data: UpsertQuestionData,
  metadata: S.optional(S.NullOr(QuestionMetadata)),

  //
}) {}

//4) Define an Error for the entity, this will help us trace any errors back here if something is wrong
export class QuestionNotFoundError extends S.TaggedError<QuestionNotFoundError>(
  "QuestionNotFoundError",
)(
  "QuestionNotFoundError",
  { id: QuestionId },
  HttpApiSchema.annotations({
    status: 404,
  }),
) {
  get message() {
    return `Question with id ${this.id} not found`;
  }
}
