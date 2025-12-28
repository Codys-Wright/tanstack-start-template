import type { QuestionResponse, ResponseMetadata, SessionMetadata } from "../../response-rpc.js";
import typeformProcessedData from "./typeform-processed.json" with { type: "json" };

type TypeformResponse = {
  id: string;
  answers: Array<{ questionId: string; value: number; questionContent: string }>;
  artistType: string;
  legacyAnalysis: {
    primaryArtistType: string | null;
    fullEndingText: string;
    analysisTimestamp: string;
  } | null;
  metadata: {
    source: string;
    originalRecord: unknown;
    processedAt: string;
    totalQuestions: number;
    email?: string;
    startDate?: string;
    submitDate?: string;
    responseType?: string;
    networkId?: string;
    legacyAnalysis?: {
      primaryArtistType: string | null;
      fullEndingText: string;
      analysisTimestamp: string;
    } | null;
    typeformResponse?: {
      id: string;
      answers: Array<{ questionId: string; value: number }>;
      artistType: string;
      legacyAnalysis: {
        primaryArtistType: string | null;
        fullEndingText: string;
        analysisTimestamp: string;
      } | null;
      metadata: unknown;
    };
  };
};

type ProcessedTypeformData = {
  quizId: string;
  quizVersionId: string;
  responses: Array<TypeformResponse>;
  summary: {
    totalProcessed: number;
    totalOriginal: number;
    questionsMatched: number;
    artistTypesFound: number;
  };
};

type TypeformResponseSeedData = {
  quizId: string;
  answers: Array<QuestionResponse>;
  sessionMetadata: SessionMetadata;
  interactionLogs: Array<unknown>;
  metadata: ResponseMetadata;
};

/**
 * Creates the Typeform response seed data
 * This data can be used by external seed scripts to insert responses into the database
 */
export const getTypeformResponseSeedData = (): Array<TypeformResponseSeedData> => {
  const data = typeformProcessedData as ProcessedTypeformData;

  return data.responses.map((typeformResponse) => {
    // Convert Typeform answers to QuestionResponse format
    const answers: Array<QuestionResponse> = typeformResponse.answers.map((answer) => ({
      questionId: answer.questionId,
      value: answer.value,
      answeredAt: undefined, // Typeform doesn't have individual answer timestamps
      timeSpentMs: undefined,
      questionContent: answer.questionContent, // Include question content for content-based matching
    }));

    // Create session metadata using real dates from Typeform
    const startDateStr = typeformResponse.metadata.startDate ?? "";
    const submitDateStr = typeformResponse.metadata.submitDate ?? "";

    const startDate = startDateStr !== "" ? new Date(startDateStr) : new Date();
    const submitDate = submitDateStr !== "" ? new Date(submitDateStr) : new Date();
    const durationMs = submitDate.getTime() - startDate.getTime();

    // Use Typeform dates as strings
    const startedAt = startDate.toISOString();
    const completedAt = submitDate.toISOString();

    const sessionMetadata = {
      startedAt,
      completedAt,
      totalDurationMs: durationMs > 0 ? durationMs : undefined,
      userAgent: "Typeform Import",
      referrer: "typeform.com",
      customFields: {
        typeformId: typeformResponse.id,
        artistType: typeformResponse.artistType,
        email: typeformResponse.metadata.email,
        responseType: typeformResponse.metadata.responseType,
        networkId: typeformResponse.metadata.networkId,
        submitDate: typeformResponse.metadata.submitDate,
      },
    } as unknown as SessionMetadata;

    // Create response metadata
    const responseMetadata: ResponseMetadata = {
      tags: ["typeform", "imported", "legacy"],
      customFields: {
        source: "typeform",
        originalId: typeformResponse.id,
        artistType: typeformResponse.artistType,
        email: typeformResponse.metadata.email,
        startDate: typeformResponse.metadata.startDate,
        submitDate: typeformResponse.metadata.submitDate,
        responseType: typeformResponse.metadata.responseType,
        networkId: typeformResponse.metadata.networkId,
        importDate: new Date().toISOString(),
        originalMetadata: typeformResponse.metadata,
        legacyAnalysis: typeformResponse.legacyAnalysis,
        // Include the entire Typeform response object
        typeformResponse: typeformResponse.metadata.typeformResponse ?? {
          id: typeformResponse.id,
          answers: typeformResponse.answers,
          artistType: typeformResponse.artistType,
          legacyAnalysis: typeformResponse.legacyAnalysis,
          metadata: typeformResponse.metadata,
        },
      },
    };

    return {
      quizId: data.quizId, // This will need to be mapped to actual quiz ID
      answers,
      sessionMetadata,
      interactionLogs: [], // No interaction logs for Typeform data
      metadata: responseMetadata,
    };
  });
};
