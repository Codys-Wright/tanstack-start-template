// Analysis Service
// Effect service for performing quiz analysis using analysis engines

import { Config, DateTime, Effect } from "effect";
import { type Question } from "../quiz/questions/question-rpc.js";
import { type Quiz } from "../quiz/quiz-rpc.js";
import { type QuestionResponse, type QuizResponse } from "../responses/response-rpc.js";
import {
  type AnalysisEngine,
  type AnalysisResultId,
  type EndingDefinition,
  type ScoringConfig,
  defaultScoringConfig,
} from "./analysis-engine-rpc.js";
import {
  type AnalysisResult,
  type EndingResult,
  AnalysisFailedError,
  AnalysisResultNotFoundError,
} from "./analysis-rpc.js";

// ============================================================================
// ANALYSIS CONFIGURATION
// ============================================================================

// Runtime configuration for analysis behavior using Effect Config
export const AnalysisConfig = Config.all({
  // Point values for ideal answers
  primaryPointValue: Config.number("ANALYSIS_PRIMARY_POINT_VALUE").pipe(Config.withDefault(10.0)), // Primary Point Value: 10
  secondaryPointValue: Config.number("ANALYSIS_SECONDARY_POINT_VALUE").pipe(
    Config.withDefault(5.0), // Secondary Point: 5
  ),

  // Point weight multipliers
  primaryPointWeight: Config.number("ANALYSIS_PRIMARY_POINT_WEIGHT").pipe(Config.withDefault(1.0)), // Primary Point Weight: 1
  secondaryPointWeight: Config.number("ANALYSIS_SECONDARY_POINT_WEIGHT").pipe(
    Config.withDefault(1.0), // Secondary Point Weight: 1
  ),

  // Distance falloff for each type
  primaryDistanceFalloff: Config.number("ANALYSIS_PRIMARY_DISTANCE_FALLOFF").pipe(
    Config.withDefault(0.1), // Primary Distance Falloff % 10%
  ),
  secondaryDistanceFalloff: Config.number("ANALYSIS_SECONDARY_DISTANCE_FALLOFF").pipe(
    Config.withDefault(0.5), // Secondary Distance Falloff % 50%
  ),

  // Beta for visual separation
  beta: Config.number("ANALYSIS_BETA").pipe(Config.withDefault(0.8)), // Beta: 1

  // Analysis behavior flags
  disableSecondaryPoints: Config.boolean("ANALYSIS_DISABLE_SECONDARY_POINTS").pipe(
    Config.withDefault(false),
  ),

  // Minimum point values (floor for scoring)
  primaryMinPoints: Config.number("ANALYSIS_PRIMARY_MIN_POINTS").pipe(Config.withDefault(0.0)),
  secondaryMinPoints: Config.number("ANALYSIS_SECONDARY_MIN_POINTS").pipe(Config.withDefault(0.0)),

  // Additional analysis parameters
  minPercentageThreshold: Config.number("ANALYSIS_MIN_PERCENTAGE_THRESHOLD").pipe(
    Config.withDefault(0.0),
  ),
  enableQuestionBreakdown: Config.boolean("ANALYSIS_ENABLE_QUESTION_BREAKDOWN").pipe(
    Config.withDefault(true),
  ),
  maxEndingResults: Config.number("ANALYSIS_MAX_ENDING_RESULTS").pipe(Config.withDefault(10)),
});

// Type is automatically inferred from AnalysisConfig - no need for manual type definition

// ============================================================================
// ANALYSIS SERVICE
// ============================================================================

export class AnalysisService extends Effect.Service<AnalysisService>()(
  "@features/quiz/AnalysisService",
  {
    accessors: true,
    effect: Effect.sync(() => {
      // No need for question index mapping since we're using UUIDs directly

      // Responses should already have correct question UUIDs from the seed script
      // No conversion needed - just return the responses as-is
      const convertResponseQuestionIds = (
        responses: ReadonlyArray<QuestionResponse>,
        questions: ReadonlyArray<Question>,
      ) =>
        Effect.sync(() => {
          // Filter out any responses that don't have valid question IDs
          return responses.filter((response) => {
            const existingQuizQuestion = questions.find((q) => q.id === response.questionId);
            return existingQuizQuestion !== undefined;
          });
        });

      // Compute points for a specific ending given responses and rules
      const computeEndingPoints = (
        responses: ReadonlyArray<QuestionResponse>,
        ending: EndingDefinition,
        scoringConfig: ScoringConfig = defaultScoringConfig,
        analysisConfig?: typeof AnalysisConfig,
      ) =>
        Effect.gen(function* () {
          const runtimeConfig =
            analysisConfig !== undefined ? yield* analysisConfig : yield* AnalysisConfig;

          let totalPoints = 0;
          const questionBreakdown: Array<{
            questionId: string;
            points: number;
            idealAnswers: Array<number>;
            userAnswer: number;
            distance: number;
            weight: number;
          }> = [];

          let matchedRulesCount = 0;
          let processedResponsesCount = 0;

          for (const response of responses) {
            // Only process numeric responses
            if (typeof response.value !== "number") continue;
            processedResponsesCount++;

            // Since we're now using UUIDs directly, we need to match by UUID
            const rule = ending.questionRules.find((r) => r.questionId === response.questionId);
            if (rule === undefined) {
              continue;
            }

            matchedRulesCount++;

            // Skip secondary points if disabled
            if (runtimeConfig.disableSecondaryPoints && !rule.isPrimary) {
              continue;
            }

            // Find the nearest ideal answer
            const nearest = rule.idealAnswers.reduce((best, ideal) => {
              const distance = Math.abs(ideal - (response.value as number));
              return distance < best ? distance : best;
            }, Number.POSITIVE_INFINITY);

            // Get point value and weight based on question type
            // Use runtimeConfig (passed config) first, fallback to scoringConfig for backwards compatibility
            const pointValue = rule.isPrimary
              ? (runtimeConfig.primaryPointValue ?? scoringConfig.primaryPointValue)
              : (runtimeConfig.secondaryPointValue ?? scoringConfig.secondaryPointValue);
            const pointWeight = rule.isPrimary
              ? (runtimeConfig.primaryPointWeight ?? scoringConfig.primaryPointWeight)
              : (runtimeConfig.secondaryPointWeight ?? scoringConfig.secondaryPointWeight);
            const distanceFalloff = rule.isPrimary
              ? (runtimeConfig.primaryDistanceFalloff ?? scoringConfig.primaryDistanceFalloff)
              : (runtimeConfig.secondaryDistanceFalloff ?? scoringConfig.secondaryDistanceFalloff);

            // Calculate points based on distance falloff
            // distanceFalloff represents the percentage of base points (pointValue * pointWeight) taken away per step
            // e.g., 0.5 = 50% of base points subtracted per step, can go negative
            // Special case: when distanceFalloff is 0, only exact matches get points
            const customWeight = rule.weightMultiplier ?? 1.0;
            const basePoints = pointValue * pointWeight * customWeight;

            let points: number;
            if (distanceFalloff === 0) {
              // Only exact matches get points
              points = nearest === 0 ? basePoints : 0;
            } else {
              // Subtract percentage of base points for each step away
              const pointsLostPerStep = basePoints * distanceFalloff;
              points = basePoints - nearest * pointsLostPerStep;
            }

            // Apply minimum point floor
            const minPoints = rule.isPrimary
              ? runtimeConfig.primaryMinPoints
              : runtimeConfig.secondaryMinPoints;
            points = Math.max(points, minPoints);
            totalPoints += points;

            if (runtimeConfig.enableQuestionBreakdown) {
              questionBreakdown.push({
                questionId: response.questionId,
                points,
                idealAnswers: [...rule.idealAnswers],
                userAnswer: response.value,
                distance: nearest,
                weight: pointWeight * customWeight,
              });
            }
          }

          return { questionBreakdown, totalPoints };
        });

      // Compute scores for all endings in an engine
      const computeAllEndingScores = (
        responses: ReadonlyArray<QuestionResponse>,
        engine: AnalysisEngine,
        analysisConfig?: typeof AnalysisConfig,
      ) =>
        Effect.gen(function* () {
          const runtimeConfig =
            analysisConfig !== undefined ? yield* analysisConfig : yield* AnalysisConfig;
          const rawResults: Array<{
            ending: EndingDefinition;
            points: number;
            questionBreakdown: Array<{
              questionId: string;
              points: number;
              idealAnswers: Array<number>;
              userAnswer: number;
              distance: number;
              weight: number;
            }>;
          }> = [];

          // Calculate raw points for each ending
          for (const ending of engine.endings) {
            const { questionBreakdown, totalPoints } = yield* computeEndingPoints(
              responses,
              ending,
              undefined, // Don't pass engine.scoringConfig, let it use analysisConfig
              analysisConfig,
            );

            rawResults.push({
              ending,
              points: totalPoints,
              questionBreakdown,
            });
          }

          // Apply nonlinear amplification to sharpen winners (for visual purposes only)
          // Use engine.scoringConfig beta first, fallback to runtimeConfig for backwards compatibility
          const beta = engine.scoringConfig.beta ?? runtimeConfig.beta;
          const scaled = rawResults.map((r) => Math.pow(r.points, beta));
          const scaledSum = scaled.reduce((sum, value) => sum + value, 0);

          // Normalize to percentages
          const endingResults: Array<EndingResult> = rawResults.map((result, index) => {
            const scaledValue = scaled[index];
            const percentage =
              scaledSum > 0 && scaledValue !== undefined
                ? Number(((scaledValue / scaledSum) * 100).toFixed(1))
                : 0;

            // Find the winner (highest percentage)
            const maxPercentage = Math.max(
              ...rawResults.map((_, i) => {
                const scaledVal = scaled[i];
                return scaledSum > 0 && scaledVal !== undefined
                  ? Number(((scaledVal / scaledSum) * 100).toFixed(1))
                  : 0;
              }),
            );

            return {
              endingId: result.ending.endingId,
              points: result.points,
              percentage,
              isWinner:
                percentage === maxPercentage && percentage > runtimeConfig.minPercentageThreshold,
              questionBreakdown: result.questionBreakdown,
            };
          });

          // Filter by minimum percentage threshold and limit results
          const filteredResults = endingResults
            .filter((result) => result.percentage >= runtimeConfig.minPercentageThreshold)
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, runtimeConfig.maxEndingResults);

          return filteredResults;
        });

      // Analyze a complete quiz response using an analysis engine
      const analyzeResponse = (
        engine: AnalysisEngine,
        quiz: Quiz,
        response: QuizResponse,
        analysisConfig?: typeof AnalysisConfig,
      ) =>
        Effect.gen(function* () {
          // Extract responses and questions
          const responses = response.answers ?? [];
          const questions = quiz.questions ?? [];

          // Convert response question IDs to match quiz question order
          const convertedResponses = yield* convertResponseQuestionIds(responses, questions);

          // Compute all ending scores
          const endingResults = yield* computeAllEndingScores(
            convertedResponses,
            engine,
            analysisConfig,
          );

          // Get current time
          const now = yield* DateTime.now;

          // Create analysis result (without database-managed fields)
          const analysisResult = {
            engineId: engine.id,
            engineVersion: engine.version,
            responseId: response.id,
            endingResults,
            metadata: {
              totalQuestions: questions.length,
              answeredQuestions: responses.length,
              analysisTimestamp: now.toString(),
            },
            analyzedAt: now,
          };

          return analysisResult;
        });

      // Validate analysis inputs
      const validateAnalysisInputs = (engine: AnalysisEngine, quiz: Quiz, response: QuizResponse) =>
        Effect.gen(function* () {
          const responses = response.answers ?? [];

          if (responses.length === 0) {
            return yield* Effect.fail(
              new AnalysisFailedError({
                responseId: response.id,
                engineId: engine.id,
                reason: "No responses provided for analysis",
              }),
            );
          }

          if (engine.endings.length === 0) {
            return yield* Effect.fail(
              new AnalysisFailedError({
                responseId: response.id,
                engineId: engine.id,
                reason: "Analysis engine has no endings defined",
              }),
            );
          }

          if (!engine.isActive) {
            return yield* Effect.fail(
              new AnalysisFailedError({
                responseId: response.id,
                engineId: engine.id,
                reason: "Analysis engine is not active",
              }),
            );
          }

          return { engine, quiz, response };
        });

      // Analyze with validation - convenience method that validates inputs then analyzes
      const analyzeWithValidation = (
        engine: AnalysisEngine,
        quiz: Quiz,
        response: QuizResponse,
        analysisConfig?: typeof AnalysisConfig,
      ) =>
        Effect.gen(function* () {
          yield* validateAnalysisInputs(engine, quiz, response);
          return yield* analyzeResponse(engine, quiz, response, analysisConfig);
        });

      // Get analysis summary for multiple responses
      const getAnalysisSummary = (
        analysisResults: ReadonlyArray<AnalysisResult>,
        _engineId: string,
      ) =>
        Effect.gen(function* () {
          if (analysisResults.length === 0) {
            return yield* Effect.fail(
              new AnalysisResultNotFoundError({ id: "summary" as AnalysisResultId }),
            );
          }

          const firstResult = analysisResults[0];
          if (firstResult === undefined) {
            return yield* Effect.fail(
              new AnalysisResultNotFoundError({ id: "summary" as AnalysisResultId }),
            );
          }

          const endingDistribution = new Map<
            string,
            {
              endingId: string;
              count: number;
              totalPoints: number;
              totalPercentage: number;
            }
          >();

          // Aggregate data across all results
          for (const result of analysisResults) {
            for (const endingResult of result.endingResults) {
              const existing = endingDistribution.get(endingResult.endingId);
              if (existing !== undefined) {
                existing.count += 1;
                existing.totalPoints += endingResult.points;
                existing.totalPercentage += endingResult.percentage;
              } else {
                endingDistribution.set(endingResult.endingId, {
                  endingId: endingResult.endingId,
                  count: 1,
                  totalPoints: endingResult.points,
                  totalPercentage: endingResult.percentage,
                });
              }
            }
          }

          // Convert to final format
          const distribution = Array.from(endingDistribution.values()).map((data) => ({
            endingId: data.endingId,
            count: data.count,
            percentage: Number(((data.count / analysisResults.length) * 100).toFixed(1)),
            averagePoints: Number((data.totalPoints / data.count).toFixed(2)),
            averagePercentage: Number((data.totalPercentage / data.count).toFixed(1)),
          }));

          const now = yield* DateTime.now;

          return {
            engineId: firstResult.engineId,
            engineVersion: firstResult.engineVersion,
            totalResponses: analysisResults.length,
            endingDistribution: distribution,
            generatedAt: now,
          };
        });

      return {
        convertResponseQuestionIds,
        computeEndingPoints,
        computeAllEndingScores,
        analyzeResponse,
        validateAnalysisInputs,
        analyzeWithValidation,
        getAnalysisSummary,
      } as const;
    }),
  },
) {}
