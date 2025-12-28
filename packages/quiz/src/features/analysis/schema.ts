// Analysis Domain Schema
// This defines the structure for performing analysis and managing analysis results

import { Version } from "@core/domain";
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "@effect/platform";
import { Schema as S } from "effect";
import { QuizNotFoundError } from "../quiz/quiz-rpc.js";
import { ResponseId, ResponseNotFoundError } from "../responses/response-rpc.js";
import {
  AnalysisEngineId,
  AnalysisEngineNotFoundError,
  AnalysisResultId,
} from "./analysis-engine-rpc.js";

// ============================================================================
// ANALYSIS RESULT TYPES
// ============================================================================

// Result for a specific ending from an analysis
export class EndingResult extends S.Class<EndingResult>("EndingResult")({
  // Ending identifier
  endingId: S.String,

  // Raw points scored
  points: S.Number,

  // Normalized percentage (0-100)
  percentage: S.Number,

  // Whether this was the winning ending
  isWinner: S.Boolean,

  // Breakdown of points by question (for debugging/analysis)
  questionBreakdown: S.optional(
    S.Array(
      S.Struct({
        questionId: S.String,
        points: S.Number,
        idealAnswers: S.Array(S.Number),
        userAnswer: S.Number,
        distance: S.Number,
        weight: S.Number,
      }),
    ),
  ),
}) {}

// Complete analysis result for a response
export class AnalysisResult extends S.Class<AnalysisResult>("AnalysisResult")({
  // Unique identifier
  id: AnalysisResultId,

  // Which engine was used
  engineId: AnalysisEngineId,
  engineVersion: S.parseJson(Version),

  // Which response was analyzed
  responseId: ResponseId,

  // Results for each ending
  endingResults: S.parseJson(S.Array(EndingResult)),

  // Metadata about the analysis
  metadata: S.optional(S.NullOr(S.parseJson(S.Record({ key: S.String, value: S.Unknown })))),

  // When the analysis was performed
  analyzedAt: S.DateTimeUtc,

  // Always include a createdAt and UpdatedAt time, but deletedAt is optional for things you want to be able to soft delete
  createdAt: S.DateTimeUtc,
  updatedAt: S.DateTimeUtc,
  deletedAt: S.NullOr(S.DateTimeUtc),
}) {}

// ============================================================================
// UPSERT SCHEMAS
// ============================================================================

// Upsert schema for analysis results (without database-managed fields)
export class UpsertAnalysisResultPayload extends S.Class<UpsertAnalysisResultPayload>(
  "UpsertAnalysisResultPayload",
)({
  id: S.optional(AnalysisResultId),
  engineId: AnalysisEngineId,
  engineVersion: S.parseJson(Version),
  responseId: ResponseId,
  endingResults: S.parseJson(S.Array(EndingResult)),
  metadata: S.optional(S.NullOr(S.parseJson(S.Record({ key: S.String, value: S.Unknown })))),
  analyzedAt: S.DateTimeUtc,
}) {}

// ============================================================================
// ANALYSIS REQUEST TYPES
// ============================================================================

// Request to analyze a response with a specific engine
export class AnalyzeResponseRequest extends S.Class<AnalyzeResponseRequest>(
  "AnalyzeResponseRequest",
)({
  responseId: ResponseId,
  engineId: AnalysisEngineId,
  // Optional: override scoring config for this analysis
  scoringConfigOverride: S.optional(S.Record({ key: S.String, value: S.Unknown })),
}) {}

// Request to get analysis results
export class GetAnalysisRequest extends S.Class<GetAnalysisRequest>("GetAnalysisRequest")({
  responseId: ResponseId,
  engineId: S.optional(AnalysisEngineId), // If not provided, get all analyses for response
}) {}

// Request to analyze multiple responses in batch
export class BatchAnalyzeRequest extends S.Class<BatchAnalyzeRequest>("BatchAnalyzeRequest")({
  responseIds: S.Array(ResponseId),
  engineId: AnalysisEngineId,
  // Optional: override scoring config for this batch analysis
  scoringConfigOverride: S.optional(S.Record({ key: S.String, value: S.Unknown })),
}) {}

// ============================================================================
// ANALYSIS SUMMARY TYPES
// ============================================================================

// Summary of analysis results across multiple responses
export class AnalysisSummary extends S.Class<AnalysisSummary>("AnalysisSummary")({
  // Which engine was used
  engineId: AnalysisEngineId,
  engineVersion: S.parseJson(Version),

  // Total number of responses analyzed
  totalResponses: S.Number,

  // Distribution of endings across all responses
  endingDistribution: S.Array(
    S.Struct({
      endingId: S.String,
      count: S.Number,
      percentage: S.Number,
      averagePoints: S.Number,
      averagePercentage: S.Number,
    }),
  ),

  // When the summary was generated
  generatedAt: S.DateTimeUtc,
}) {}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class AnalysisResultNotFoundError extends S.TaggedError<AnalysisResultNotFoundError>(
  "AnalysisResultNotFoundError",
)(
  "AnalysisResultNotFoundError",
  { id: AnalysisResultId },
  HttpApiSchema.annotations({
    status: 404,
  }),
) {
  get message() {
    return `Analysis result with id ${this.id} not found`;
  }
}

export class AnalysisFailedError extends S.TaggedError<AnalysisFailedError>("AnalysisFailedError")(
  "AnalysisFailedError",
  { responseId: S.String, engineId: AnalysisEngineId, reason: S.String },
  HttpApiSchema.annotations({
    status: 500,
  }),
) {
  get message() {
    return `Analysis failed for response ${this.responseId} with engine ${this.engineId}: ${this.reason}`;
  }
}

export class AnalysisResultNotFoundForResponseError extends S.TaggedError<AnalysisResultNotFoundForResponseError>(
  "AnalysisResultNotFoundForResponseError",
)(
  "AnalysisResultNotFoundForResponseError",
  { responseId: ResponseId, engineId: AnalysisEngineId },
  HttpApiSchema.annotations({
    status: 404,
  }),
) {
  get message() {
    return `Analysis result not found for response ${this.responseId} with engine ${this.engineId}`;
  }
}

// ============================================================================
// HTTP API DEFINITION
// ============================================================================

export class AnalysisGroup extends HttpApiGroup.make("Analysis")
  .add(
    HttpApiEndpoint.post("analyze", "/:engineId/analyze")
      .addSuccess(AnalysisResult)
      .addError(AnalysisEngineNotFoundError)
      .addError(AnalysisFailedError)
      .addError(QuizNotFoundError)
      .addError(ResponseNotFoundError)
      .setPayload(
        S.Struct({
          engineId: AnalysisEngineId,
          request: AnalyzeResponseRequest,
        }),
      ),
  )
  .add(
    HttpApiEndpoint.post("batchAnalyze", "/:engineId/batch-analyze")
      .addSuccess(S.Array(AnalysisResult))
      .addError(AnalysisEngineNotFoundError)
      .addError(AnalysisFailedError)
      .addError(QuizNotFoundError)
      .addError(ResponseNotFoundError)
      .setPayload(
        S.Struct({
          engineId: AnalysisEngineId,
          request: BatchAnalyzeRequest,
        }),
      ),
  )
  .add(
    HttpApiEndpoint.get("getAnalysis", "/responses/:responseId/analysis")
      .addSuccess(S.Array(AnalysisResult))
      .addError(AnalysisResultNotFoundError)
      .setPayload(
        S.Struct({
          responseId: ResponseId,
        }),
      ),
  )
  .add(HttpApiEndpoint.get("list", "/").addSuccess(S.Array(AnalysisResult)))
  .add(
    HttpApiEndpoint.get("getById", "/:id")
      .addSuccess(AnalysisResult)
      .addError(AnalysisResultNotFoundError)
      .setPayload(
        S.Struct({
          id: AnalysisResultId,
        }),
      ),
  )
  .add(
    HttpApiEndpoint.get("getByEngine", "/engines/:engineId")
      .addSuccess(S.Array(AnalysisResult))
      .setPayload(
        S.Struct({
          engineId: AnalysisEngineId,
        }),
      ),
  )
  .add(
    HttpApiEndpoint.put("upsert", "/")
      .addSuccess(AnalysisResult)
      .addError(AnalysisResultNotFoundError)
      .setPayload(UpsertAnalysisResultPayload),
  )
  .add(
    HttpApiEndpoint.get("getAnalysisSummary", "/:engineId/summary")
      .addSuccess(AnalysisSummary)
      .addError(AnalysisEngineNotFoundError)
      .setPayload(
        S.Struct({
          engineId: AnalysisEngineId,
        }),
      ),
  )
  .add(
    HttpApiEndpoint.del("deleteAnalysis", "/:id")
      .addSuccess(S.Void)
      .addError(AnalysisResultNotFoundError)
      .setPayload(
        S.Struct({
          id: AnalysisResultId,
        }),
      ),
  )
  .prefix("/Analysis") {}
