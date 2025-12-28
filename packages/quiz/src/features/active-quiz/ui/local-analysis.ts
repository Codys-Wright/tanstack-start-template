import type { AnalysisEngine, Question, Quiz, QuizResponse } from "@features/quiz/domain";
import { AnalysisConfig, AnalysisService } from "@features/quiz/domain";
import { Config, DateTime, Effect } from "effect";
import { endingNameToArtistType } from "../components/artist-type/artist-data-utils.js";
import type { ArtistData } from "../components/artist-type/artist-type-graph-card.js";
import type { AnalysisConfigOverrides } from "./dev-panel.js";

// Create a reverse mapping from endingId to full artist names
const createEndingIdToFullNameMapping = (): Record<string, string> => {
  const mapping: Record<string, string> = {};

  // Create the reverse mapping from the existing endingNameToArtistType
  Object.keys(endingNameToArtistType).forEach((fullName) => {
    // Convert "The Visionary Artist" to "the-visionary-artist" (same as analysis engine)
    const endingId = fullName.toLowerCase().replace(/\s+/g, "-");
    mapping[endingId] = fullName;
  });

  return mapping;
};

// Convert responses to the format expected by the analysis service
const convertResponsesToServiceFormat = (
  responses: Record<string, number>,
  _questions: Array<Question>,
): Array<{ questionId: string; value: number }> => {
  return Object.entries(responses).map(([questionId, value]) => ({
    questionId,
    value,
  }));
};

// Transform local analysis results to ArtistData format
const transformLocalAnalysisToArtistData = (
  results: Array<{ endingId: string; points: number; percentage: number }>,
): Array<ArtistData> => {
  const endingIdToFullName = createEndingIdToFullNameMapping();

  const transformed = results.map((result) => {
    // Get the full name from the endingId
    const fullName = endingIdToFullName[result.endingId];

    // Now map to artist type using the existing mapping
    const artistType = fullName !== undefined ? endingNameToArtistType[fullName] : result.endingId;

    const transformedResult = {
      artistType: artistType ?? result.endingId,
      percentage: result.percentage,
      points: result.points,
      fullName: fullName ?? result.endingId,
      databaseId: result.endingId,
    };

    return transformedResult;
  });

  return transformed;
};

// Create a custom config from dev overrides
const createCustomConfig = (overrides: Partial<AnalysisConfigOverrides>): typeof AnalysisConfig => {
  // Only override the values that are provided, otherwise use the default config
  return Config.all({
    primaryPointValue:
      overrides.primaryPointValue !== undefined
        ? Config.succeed(overrides.primaryPointValue)
        : AnalysisConfig.pipe(Config.map((c) => c.primaryPointValue)),
    secondaryPointValue:
      overrides.secondaryPointValue !== undefined
        ? Config.succeed(overrides.secondaryPointValue)
        : AnalysisConfig.pipe(Config.map((c) => c.secondaryPointValue)),
    primaryPointWeight:
      overrides.primaryPointWeight !== undefined
        ? Config.succeed(overrides.primaryPointWeight)
        : AnalysisConfig.pipe(Config.map((c) => c.primaryPointWeight)),
    secondaryPointWeight:
      overrides.secondaryPointWeight !== undefined
        ? Config.succeed(overrides.secondaryPointWeight)
        : AnalysisConfig.pipe(Config.map((c) => c.secondaryPointWeight)),
    primaryDistanceFalloff:
      overrides.primaryDistanceFalloff !== undefined
        ? Config.succeed(overrides.primaryDistanceFalloff)
        : AnalysisConfig.pipe(Config.map((c) => c.primaryDistanceFalloff)),
    secondaryDistanceFalloff:
      overrides.secondaryDistanceFalloff !== undefined
        ? Config.succeed(overrides.secondaryDistanceFalloff)
        : AnalysisConfig.pipe(Config.map((c) => c.secondaryDistanceFalloff)),
    beta:
      overrides.beta !== undefined
        ? Config.succeed(overrides.beta)
        : AnalysisConfig.pipe(Config.map((c) => c.beta)),
    primaryMinPoints:
      overrides.primaryMinPoints !== undefined
        ? Config.succeed(overrides.primaryMinPoints)
        : AnalysisConfig.pipe(Config.map((c) => Number(c.primaryMinPoints))),
    secondaryMinPoints:
      overrides.secondaryMinPoints !== undefined
        ? Config.succeed(overrides.secondaryMinPoints)
        : AnalysisConfig.pipe(Config.map((c) => Number(c.secondaryMinPoints))),
    disableSecondaryPoints: Config.succeed(false),
    minPercentageThreshold: Config.succeed(0.0),
    enableQuestionBreakdown: Config.succeed(true),
    maxEndingResults: Config.succeed(10),
  });
};

// Main function to perform local analysis using the actual analysis service
export const performLocalAnalysis = (
  responses: Record<string, number>,
  quiz: Quiz,
  engine?: AnalysisEngine,
  configOverrides?: Partial<AnalysisConfigOverrides>,
): Array<ArtistData> => {
  // Convert responses to the format expected by the analysis service
  const serviceResponses = convertResponsesToServiceFormat(responses, [...(quiz.questions ?? [])]);

  // Debug logging removed for production

  // Create a mock response object
  const now = Effect.runSync(DateTime.now);
  const mockResponse: QuizResponse = {
    id: "local-response" as QuizResponse["id"],
    quizId: quiz.id,
    answers: serviceResponses,
    sessionMetadata: { startedAt: now },
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  if (engine === undefined) {
    throw new Error("Analysis engine is required for local analysis");
  }
  const analysisEngine = engine;

  const customConfig =
    configOverrides !== undefined ? createCustomConfig(configOverrides) : undefined;

  const analysisResult = Effect.runSync(
    Effect.provide(
      AnalysisService.pipe(
        Effect.flatMap((service) =>
          service.analyzeResponse(analysisEngine, quiz, mockResponse, customConfig),
        ),
      ),
      AnalysisService.Default,
    ),
  );

  // Transform the analysis result to ArtistData format
  const mappedResults = ((analysisResult as any).endingResults ?? []).map((result: any) => ({
    endingId: result.endingId,
    points: result.points,
    percentage: result.percentage,
  }));

  const artistData = transformLocalAnalysisToArtistData(mappedResults);

  // Log artist type distribution summary
  const distribution = artistData
    .sort((a, b) => b.percentage - a.percentage)
    .map((item) => `${item.artistType}: ${item.percentage.toFixed(1)}%`)
    .join(", ");
  console.log("🎨 Artist Type Distribution:", distribution);

  return artistData;
};

// Hook to get real-time analysis data
export const useLocalAnalysis = (
  responses: Record<string, number>,
  quiz: Quiz | undefined,
  engine?: AnalysisEngine,
  configOverrides?: Partial<AnalysisConfigOverrides>,
): Array<ArtistData> => {
  if (quiz === undefined) return [];

  return performLocalAnalysis(responses, quiz, engine, configOverrides);
};

// Compare local analysis with server analysis
export const compareAnalyses = (
  localAnalysis: Array<ArtistData>,
  serverAnalysis: Array<ArtistData>,
): {
  isSimilar: boolean;
  differences: Array<{
    artistType: string;
    localPercentage: number;
    serverPercentage: number;
    difference: number;
  }>;
} => {
  const differences: Array<{
    artistType: string;
    localPercentage: number;
    serverPercentage: number;
    difference: number;
  }> = [];

  let isSimilar = true;
  const threshold = 10; // 10% difference threshold

  localAnalysis.forEach((local) => {
    const server = serverAnalysis.find((s) => s.artistType === local.artistType);
    if (server !== undefined) {
      const difference = Math.abs(local.percentage - server.percentage);
      if (difference > threshold) {
        isSimilar = false;
      }
      differences.push({
        artistType: local.artistType,
        localPercentage: local.percentage,
        serverPercentage: server.percentage,
        difference,
      });
    }
  });

  return { isSimilar, differences };
};
