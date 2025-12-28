//this is where the beginning of a new feature starts. We define what states are valid and create a contract that both the client and server must adhere to.
// Because of this, we will get type errors if our client or server are out of sync with our Domain definition of an entity
//
// After writing this file, we branch out in this order
// - Domain:
//     - Add the ResponseGroup to the DomainApi in DomainApi.ts
//
// - Server:
//      1)
//     - Make responses.repo.ts in server/src/internal, this is where the server interacts with the outside world eg/ Database
//     - Make responses.repo.test.ts in server/src/internal, this is our test file for intergration with the database
//
//      2)
//     - Make responses-rpc-live.ts in server/src/, this is the live implementation of this file where we make the handlers for the api and provide the repo
//
//      3)
//     - Add the layer Repo into server/src/server,ts
//
// - Database:
//     - Add a migration file in database/src/migrations which is SQL for creating the table in the database
//
// - Client:
//     - Make response.atom.ts, the entry point for the client through the HttpApi
//     - Any pages related to this feature will go in client/src/features/${featurename}/response.page.tsx, then that component is imported into the main router
//

import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "@effect/platform";
import { Schema as S } from "effect";
import { QuizId } from "../quiz/quiz-rpc.js";

//1) Create a branded ID type for the entity to avoid confusion in logs and merging other id types
export const ResponseId = S.UUID.pipe(S.brand("ResponseId"));
//export a type for use with normal typescript outside of effect
export type ResponseId = typeof ResponseId.Type;

//2) Define the Actual Class Schema of the Entity

// Individual response to a question
export class QuestionResponse extends S.Class<QuestionResponse>("QuestionResponse")({
  questionId: S.String,
  value: S.Union(S.Number, S.String),
  answeredAt: S.optional(S.DateTimeUtc),
  timeSpentMs: S.optional(S.Number.pipe(S.int(), S.nonNegative())),
  questionContent: S.optional(S.String), // Include question content for content-based matching
}) {}

// User interaction log entry
export class InteractionLog extends S.Class<InteractionLog>("InteractionLog")({
  type: S.Union(S.Literal("navigation"), S.Literal("selection"), S.Literal("submission")),
  questionId: S.optional(S.String),
  rating: S.optional(S.Number.pipe(S.int(), S.nonNegative())),
  action: S.optional(S.String),
  timestamp: S.DateTimeUtc,
}) {}

// Session metadata for tracking timing and behavior
export class SessionMetadata extends S.Class<SessionMetadata>("SessionMetadata")({
  startedAt: S.DateTimeUtc,
  completedAt: S.optional(S.DateTimeUtc),
  totalDurationMs: S.optional(S.Number.pipe(S.int(), S.nonNegative())),
  userAgent: S.optional(S.String),
  referrer: S.optional(S.String),
  customFields: S.optional(S.Record({ key: S.String, value: S.Unknown })),
}) {}

//Define any metadata for the schema, this goes through the NullorFromFallible schema util that will keep any JSON that meets our expectations,
// and silently return null if it is malformed data
export class ResponseMetadata extends S.Class<ResponseMetadata>("ResponseMetadata")({
  tags: S.optional(S.Array(S.String)),
  customFields: S.optional(S.Record({ key: S.String, value: S.Unknown })),
}) {}

export class QuizResponse extends S.Class<QuizResponse>("QuizResponse")({
  //every entity should have an Id and a version
  id: ResponseId,
  quizId: QuizId,

  // Core response data
  answers: S.optional(S.parseJson(S.Array(QuestionResponse))),

  // Session tracking
  sessionMetadata: S.parseJson(SessionMetadata),

  // Interaction logging for UX analysis
  interactionLogs: S.optional(S.parseJson(S.Array(InteractionLog))),

  //optional metadata - stored as JSON in database
  metadata: S.optional(S.NullOr(S.parseJson(ResponseMetadata))),

  //Always include a createdAt and UpdatedAt time, but deletedAt is optional for things you want to be able to soft delete
  createdAt: S.DateTimeUtc,
  updatedAt: S.DateTimeUtc,
  deletedAt: S.NullOr(S.DateTimeUtc),
}) {}

// Client-side session state that will be converted to QuizResponse
export type QuizSession = {
  responses: Record<string, number>;
  logs: Array<InteractionLog>;
  sessionMetadata: SessionMetadata;
};

//3) Define the Schema for upserting the entity, this does not need to include createdAt or updatedAt because those are handled
// at the database driver level, we also don't include deletedAt because that is its own operation "softdel"

export class UpsertQuestionResponsePayload extends S.Class<UpsertQuestionResponsePayload>(
  "UpsertQuestionResponsePayload",
)({
  questionId: S.String,
  value: S.Union(S.Number, S.String),
  answeredAt: S.optional(S.DateTimeUtc),
  timeSpentMs: S.optional(S.Number.pipe(S.int(), S.nonNegative())),
}) {}

export class UpsertInteractionLogPayload extends S.Class<UpsertInteractionLogPayload>(
  "UpsertInteractionLogPayload",
)({
  type: S.Union(S.Literal("navigation"), S.Literal("selection"), S.Literal("submission")),
  questionId: S.optional(S.String),
  rating: S.optional(S.Number.pipe(S.int(), S.nonNegative())),
  action: S.optional(S.String),
  timestamp: S.DateTimeUtc,
}) {}

export class UpsertSessionMetadataPayload extends S.Class<UpsertSessionMetadataPayload>(
  "UpsertSessionMetadataPayload",
)({
  startedAt: S.DateTimeUtc,
  completedAt: S.optional(S.DateTimeUtc),
  totalDurationMs: S.optional(S.Number.pipe(S.int(), S.nonNegative())),
  userAgent: S.optional(S.String),
  referrer: S.optional(S.String),
  customFields: S.optional(S.Record({ key: S.String, value: S.Unknown })),
}) {}

export class UpsertResponsePayload extends S.Class<UpsertResponsePayload>("UpsertResponsePayload")({
  id: S.optional(ResponseId),
  quizId: QuizId,

  answers: S.Array(UpsertQuestionResponsePayload),
  sessionMetadata: UpsertSessionMetadataPayload,
  interactionLogs: S.optional(S.Array(UpsertInteractionLogPayload)),
  metadata: S.optional(ResponseMetadata),
}) {}

//4) Define Errors for the entity, this will help us trace any errors back here if something is wrong
export class ResponseNotFoundError extends S.TaggedError<ResponseNotFoundError>(
  "ResponseNotFoundError",
)(
  "ResponseNotFoundError",
  { id: ResponseId },
  HttpApiSchema.annotations({
    status: 404,
  }),
) {
  get message() {
    return `Response with id ${this.id} not found`;
  }
}

export class InvalidQuizError extends S.TaggedError<InvalidQuizError>("InvalidQuizError")(
  "InvalidQuizError",
  { quizId: QuizId },
  HttpApiSchema.annotations({
    status: 400,
  }),
) {
  get message() {
    return `Quiz with id ${this.quizId} not found or invalid`;
  }
}

//5) Export an HttpApiGroup so that we can incoprorate it into our DomainAPI
// This is where we use all the building blocks we made above
export class ResponsesGroup extends HttpApiGroup.make("Responses")
  .add(HttpApiEndpoint.get("list", "/").addSuccess(S.Array(QuizResponse)))
  .add(
    HttpApiEndpoint.get("byId", "/:id")
      .addSuccess(QuizResponse)
      .addError(ResponseNotFoundError)
      .setPayload(
        S.Struct({
          id: ResponseId,
        }),
      ),
  )
  .add(
    HttpApiEndpoint.get("byQuiz", "/quiz/:quizId")
      .addSuccess(S.Array(QuizResponse))
      .addError(InvalidQuizError)
      .setPayload(
        S.Struct({
          quizId: QuizId,
        }),
      ),
  )
  .add(
    HttpApiEndpoint.put("upsert", "/")
      .addSuccess(QuizResponse)
      .addError(ResponseNotFoundError)
      .addError(InvalidQuizError)
      .setPayload(UpsertResponsePayload),
  )
  .add(
    HttpApiEndpoint.del("delete", "/")
      .setPayload(
        S.Struct({
          id: ResponseId,
        }),
      )
      .addSuccess(S.Void)
      .addError(ResponseNotFoundError),
  )
  .prefix("/Responses") {}
