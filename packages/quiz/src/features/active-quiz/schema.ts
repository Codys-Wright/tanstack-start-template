import { Slug } from "@core/domain";
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "@effect/platform";
import { Schema as S } from "effect";
import { AnalysisEngineId } from "../analysis/analysis-engine-rpc.js";
import { QuizId } from "../quiz/quiz-rpc.js";

//1) Create a branded ID type for ActiveQuiz
export const ActiveQuizId = S.UUID.pipe(S.brand("ActiveQuizId"));
export type ActiveQuizId = typeof ActiveQuizId.Type;

//2) Define the ActiveQuiz schema for managing which quiz+engine versions are live
export class ActiveQuiz extends S.Class<ActiveQuiz>("ActiveQuiz")({
  id: ActiveQuizId,
  slug: Slug, // Clean slug like "my-artist-type"
  quizId: QuizId, // Reference to specific quiz version
  engineId: AnalysisEngineId, // Reference to specific engine version

  // Timestamps
  createdAt: S.DateTimeUtc,
  updatedAt: S.DateTimeUtc,
}) {}

//3) Define the upsert payload schema
export class UpsertActiveQuizPayload extends S.Class<UpsertActiveQuizPayload>(
  "UpsertActiveQuizPayload",
)({
  id: S.optional(ActiveQuizId),
  slug: Slug,
  quizId: QuizId,
  engineId: AnalysisEngineId,
}) {}

//4) Define Errors for ActiveQuiz operations
export class ActiveQuizNotFoundError extends S.TaggedError<ActiveQuizNotFoundError>(
  "ActiveQuizNotFoundError",
)(
  "ActiveQuizNotFoundError",
  { slug: S.String },
  HttpApiSchema.annotations({
    status: 404,
  }),
) {
  get message() {
    return `Active quiz with slug ${this.slug} not found`;
  }
}

//5) Export an HttpApiGroup for ActiveQuiz operations
export class ActiveQuizzesGroup extends HttpApiGroup.make("ActiveQuizzes")
  .add(HttpApiEndpoint.get("list", "/").addSuccess(S.Array(ActiveQuiz)))
  .add(
    HttpApiEndpoint.get("bySlug", "/:slug")
      .addSuccess(ActiveQuiz)
      .addError(ActiveQuizNotFoundError)
      .setPayload(
        S.Struct({
          slug: S.String,
        }),
      ),
  )
  .add(
    HttpApiEndpoint.put("upsert", "/")
      .addSuccess(ActiveQuiz)
      .addError(ActiveQuizNotFoundError)
      .setPayload(UpsertActiveQuizPayload),
  )
  .add(
    HttpApiEndpoint.del("delete", "/:slug")
      .setPayload(
        S.Struct({
          slug: S.String,
        }),
      )
      .addSuccess(S.Void)
      .addError(ActiveQuizNotFoundError),
  )
  .prefix("/ActiveQuizzes") {}
