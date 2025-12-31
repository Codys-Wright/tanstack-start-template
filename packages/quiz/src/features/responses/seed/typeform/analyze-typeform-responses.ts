import * as BunContext from '@effect/platform-bun/BunContext';
import * as BunRuntime from '@effect/platform-bun/BunRuntime';
import { AnalysisService } from '../../../analysis/domain/index.js';
import { AnalysisEngineRepo } from '../../../analysis-engine/database/index.js';
import { AnalysisRepo } from '../../../analysis/database/index.js';
import { QuizzesRepo } from '../../../quiz/database/index.js';
import { ResponsesRepo } from '../../database/index.js';
import { PgLive } from '@core/database';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

// Analysis comparison result
type AnalysisComparison = {
  responseId: string;
  email?: string;
  legacyArtistType: string | null;
  newPrimaryArtistType: string | null;
  newAnalysisResults: Array<{
    endingName: string;
    score: number;
    percentage: number;
  }>;
  match: boolean;
  confidence: number;
};

// Function to run analysis on all Typeform responses and compare with legacy results
const analyzeTypeformResponses = Effect.gen(function* () {
  const responsesRepo = yield* ResponsesRepo;
  const analysisRepo = yield* AnalysisRepo;
  const analysisEngineRepo = yield* AnalysisEngineRepo;
  const analysisService = yield* AnalysisService;
  const quizzesRepo = yield* QuizzesRepo;

  yield* Effect.log('Starting Typeform response analysis...');

  // Get all Typeform responses
  const allResponses = yield* responsesRepo.findAll();
  const typeformResponses = allResponses.filter(
    (response) => response.metadata?.tags?.includes('typeform') === true,
  );

  yield* Effect.log(`Found ${typeformResponses.length} Typeform responses to analyze`);

  if (typeformResponses.length === 0) {
    yield* Effect.log('No Typeform responses found. Please run the seed script first.');
    return;
  }

  // Get the quiz and analysis engine
  const quiz = yield* quizzesRepo.findById(typeformResponses[0]?.quizId ?? ('' as any));
  if (quiz === undefined) {
    yield* Effect.logError('Quiz not found');
    return;
  }

  // Get the analysis engine (assuming there's one active engine)
  const allAnalysisEngines = yield* analysisEngineRepo.findAll();
  const activeEngine = allAnalysisEngines.find((engine) => engine.isPublished === true);

  if (activeEngine === undefined) {
    yield* Effect.logError('No active analysis engine found');
    return;
  }

  yield* Effect.log(`Using analysis engine: ${activeEngine.name} (ID: ${activeEngine.id})`);

  const comparisons: Array<AnalysisComparison> = [];
  let _successCount = 0;
  let errorCount = 0;

  // Analyze each response
  for (const [index, response] of typeformResponses.entries()) {
    try {
      // Extract legacy analysis from metadata
      const legacyAnalysis = response.metadata?.customFields?.legacyAnalysis as
        | {
            primaryArtistType: string | null;
            fullEndingText: string;
            analysisTimestamp: string;
          }
        | undefined;

      const legacyArtistType = legacyAnalysis?.primaryArtistType ?? null;
      const email = response.metadata?.customFields?.email as string | undefined;

      // Run new analysis
      const analysisResult = yield* analysisService.analyzeResponse(activeEngine, quiz, response);

      // Save the analysis result
      yield* analysisRepo.create({
        engineId: activeEngine.id,
        engineVersion: activeEngine.version,
        responseId: response.id,
        endingResults: analysisResult.endingResults,
        metadata: {
          source: 'typeform-reanalysis',
          originalLegacyType: legacyArtistType,
        },
        analyzedAt: yield* DateTime.now,
      });

      // Get the primary result (highest scoring)
      const primaryResult = analysisResult.endingResults.reduce((prev, current) =>
        current.points > prev.points ? current : prev,
      );

      const newPrimaryArtistType = primaryResult.endingId;
      const confidence = primaryResult.percentage;

      // Check if results match
      const match = legacyArtistType === newPrimaryArtistType;

      const comparison: AnalysisComparison = {
        responseId: response.id,
        email: email ?? '',
        legacyArtistType,
        newPrimaryArtistType,
        newAnalysisResults: analysisResult.endingResults.map((result) => ({
          endingName: result.endingId,
          score: result.points,
          percentage: result.percentage,
        })),
        match,
        confidence,
      };

      comparisons.push(comparison);

      if (match) {
        _successCount++;
      } else {
        yield* Effect.log(
          `Mismatch for ${
            email ?? response.id
          }: Legacy="${legacyArtistType}" vs New="${newPrimaryArtistType}"`,
        );
      }

      if (index % 50 === 0) {
        yield* Effect.log(`Analyzed ${index + 1}/${typeformResponses.length} responses...`);
      }
    } catch (error) {
      errorCount++;
      yield* Effect.logError(`Error analyzing response ${response.id}: ${error}`);
    }
  }

  // Generate summary statistics
  const totalAnalyzed = comparisons.length;
  const matches = comparisons.filter((c) => c.match).length;
  const matchRate = totalAnalyzed > 0 ? (matches / totalAnalyzed) * 100 : 0;

  // Artist type distribution comparison
  const legacyDistribution: Record<string, number> = {};
  const newDistribution: Record<string, number> = {};

  comparisons.forEach((comparison) => {
    if (comparison.legacyArtistType !== null && comparison.legacyArtistType) {
      legacyDistribution[comparison.legacyArtistType] =
        (legacyDistribution[comparison.legacyArtistType] ?? 0) + 1;
    }
    if (comparison.newPrimaryArtistType !== null && comparison.newPrimaryArtistType) {
      newDistribution[comparison.newPrimaryArtistType] =
        (newDistribution[comparison.newPrimaryArtistType] ?? 0) + 1;
    }
  });

  yield* Effect.log('\n=== ANALYSIS COMPARISON RESULTS ===');
  yield* Effect.log(`Total responses analyzed: ${totalAnalyzed}`);
  yield* Effect.log(`Successful matches: ${matches}`);
  yield* Effect.log(`Match rate: ${matchRate.toFixed(2)}%`);
  yield* Effect.log(`Errors: ${errorCount}`);

  yield* Effect.log('\n=== LEGACY ARTIST TYPE DISTRIBUTION ===');
  for (const [type, count] of Object.entries(legacyDistribution).sort(([, a], [, b]) => b - a)) {
    yield* Effect.log(`  ${type}: ${count} (${((count / totalAnalyzed) * 100).toFixed(1)}%)`);
  }

  yield* Effect.log('\n=== NEW ANALYSIS ARTIST TYPE DISTRIBUTION ===');
  for (const [type, count] of Object.entries(newDistribution).sort(([, a], [, b]) => b - a)) {
    yield* Effect.log(`  ${type}: ${count} (${((count / totalAnalyzed) * 100).toFixed(1)}%)`);
  }

  // Show mismatches
  const mismatches = comparisons.filter((c) => !c.match);
  if (mismatches.length > 0) {
    yield* Effect.log(`\n=== MISMATCHES (${mismatches.length}) ===`);
    for (const mismatch of mismatches.slice(0, 10)) {
      yield* Effect.log(
        `  ${mismatch.email ?? mismatch.responseId}: "${
          mismatch.legacyArtistType
        }" → "${mismatch.newPrimaryArtistType}" (${mismatch.confidence.toFixed(1)}%)`,
      );
    }
    if (mismatches.length > 10) {
      yield* Effect.log(`  ... and ${mismatches.length - 10} more mismatches`);
    }
  }

  return {
    totalAnalyzed,
    matches,
    matchRate,
    errors: errorCount,
    legacyDistribution,
    newDistribution,
    comparisons,
  };
});

// Run the analysis
const AnalysisLive = Layer.mergeAll(
  ResponsesRepo.Default,
  AnalysisRepo.Default,
  AnalysisEngineRepo.Default,
  AnalysisService.Default,
  QuizzesRepo.Default,
  BunContext.layer,
  PgLive,
);

BunRuntime.runMain(analyzeTypeformResponses.pipe(Effect.provide(AnalysisLive)));
