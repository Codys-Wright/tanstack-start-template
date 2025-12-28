import { parse } from "csv-parse/sync";
import { Effect } from "effect";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname as pathDirname } from "path";
import { fileURLToPath } from "url";

type TypeformResponse = {
  id: string;
  answers: Array<{ questionId: string; value: number; questionContent: string }>;
  artistType: string;
  legacyAnalysis: {
    primaryArtistType: string | null;
    fullEndingText: string;
    analysisTimestamp: string;
  } | null;
  metadata: unknown;
};

type QuizQuestion = {
  order: number;
  description: string;
  data: {
    type: string;
    minLabel?: string;
    maxLabel?: string;
    minRating?: number;
    maxRating?: number;
  };
};

// Get the current directory
const filename = fileURLToPath(import.meta.url);
const currentDir = pathDirname(filename);

// Load the quiz questions from the correct path
const quizDataPath = join(
  currentDir,
  "../../../quiz/questions/seed/data/artist-type-questions.json",
);
const quizData = JSON.parse(readFileSync(quizDataPath, "utf8")) as {
  questions: Array<QuizQuestion>;
};
const questions: Array<QuizQuestion> = quizData.questions;

// Load the Typeform CSV
const csvPath = join(currentDir, "responses.csv");
const csvData = readFileSync(csvPath, "utf8");
const records = parse(csvData, {
  columns: true,
  skip_empty_lines: true,
  // Handle quoted fields with newlines properly
  quote: '"',
  escape: '"',
  relax_quotes: true,
  relax_column_count: true,
});

// Function to find question ID by content (fuzzy matching)
function findQuestionId(content: string): number | null {
  const normalizedContent = content.trim().toLowerCase();

  for (const question of questions) {
    const questionContent = question.description.toLowerCase();

    // Exact match
    if (questionContent === normalizedContent) {
      return question.order;
    }

    // Partial match (if content is similar)
    if (
      questionContent.includes(normalizedContent) ||
      normalizedContent.includes(questionContent)
    ) {
      return question.order;
    }

    // More flexible matching - check for key words
    const contentWords = normalizedContent.split(/\s+/).filter((w) => w.length > 3);
    const questionWords = questionContent.split(/\s+/).filter((w) => w.length > 3);

    const commonWords = contentWords.filter((word) => questionWords.includes(word));
    if (commonWords.length >= Math.min(3, Math.min(contentWords.length, questionWords.length))) {
      return question.order;
    }
  }

  return null;
}

// Function to extract artist type from ending text
function extractArtistType(endingText: string): string | null {
  if (!endingText || endingText.trim().length === 0) {
    return null;
  }

  // Clean up the text - remove extra whitespace and normalize line breaks
  const cleanText = endingText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();

  // Primary pattern: "Your Primary Artist Type is:" followed by "*The [Type] Artist*"
  const primaryPattern = /your\s+primary\s+artist\s+type\s+is:?\s*\*([^*]+)\*/i;
  const primaryMatch = cleanText.match(primaryPattern);

  if (primaryMatch !== null) {
    const extracted = primaryMatch[1]?.trim();
    if (extracted?.toLowerCase().includes("artist")) {
      return extracted;
    }
  }

  // Alternative pattern: Look for any "*The [Something] Artist*" pattern
  const artistPattern = /\*(the\s+[^*]*artist)\*/gi;
  const artistMatches = cleanText.match(artistPattern);

  if (artistMatches !== null && artistMatches.length > 0) {
    // Take the first match and clean it up
    const firstMatch = artistMatches[0].replace(/\*/g, "").trim();
    if (firstMatch.toLowerCase().includes("artist")) {
      return firstMatch;
    }
  }

  // Debug: log if we can't extract anything
  if (cleanText.toLowerCase().includes("artist type")) {
    Effect.runSync(
      Effect.log(`Could not extract artist type from: ${cleanText.substring(0, 200)}...`),
    );
  }

  return null;
}

// Function to extract detailed legacy analysis from ending text
function extractLegacyAnalysis(endingText: string): {
  primaryArtistType: string | null;
  fullEndingText: string;
  analysisTimestamp: string;
} {
  const primaryArtistType = extractArtistType(endingText);

  return {
    primaryArtistType,
    fullEndingText: endingText,
    analysisTimestamp: new Date().toISOString(),
  };
}

// Process each Typeform response
const processedResponses: Array<TypeformResponse> = [];

Effect.runSync(Effect.log(`Processing ${records.length} records...`));
Effect.runSync(Effect.log("Sample record keys:", Object.keys(records[0] ?? {})));

records.forEach((record, index: number) => {
  const typedRecord = record as Record<string, string>;
  const responseId = `typeform-${index + 1}`;
  const answers: Array<{ questionId: string; value: number; questionContent: string }> = [];

  // Process each column (question)
  Object.entries(typedRecord).forEach(([columnName, value]) => {
    // Skip the first column (#) and the last column (email)
    if (columnName === "#" || columnName.includes("email")) {
      return;
    }

    // Find the corresponding question ID
    const questionId = findQuestionId(columnName);
    if (questionId !== null) {
      // Convert the value to a number (assuming 0-10 scale)
      const numericValue = parseInt(value, 10);
      if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 10) {
        answers.push({
          questionId: questionId.toString(),
          value: numericValue,
          questionContent: columnName, // Include the original question content
        });
      }
    } else if (index === 0) {
      // Debug first record
      Effect.runSync(Effect.log(`No match found for question: "${columnName}"`));
    }
  });

  // Extract artist type and legacy analysis from the ending (last column that's not email)
  let artistType: string | null = null;
  let legacyAnalysis: ReturnType<typeof extractLegacyAnalysis> | null = null;
  const columns = Object.keys(typedRecord);
  for (let i = columns.length - 1; i >= 0; i--) {
    const columnName = columns[i];
    if (columnName !== undefined && !columnName.includes("email") && columnName !== "#") {
      const columnValue = typedRecord[columnName];
      if (columnValue !== undefined && columnValue.length > 0) {
        artistType = extractArtistType(columnValue);
        legacyAnalysis = extractLegacyAnalysis(columnValue);

        // Debug: Log all records that contain "Visionary" to see what's happening
        if (
          columnValue.includes("Visionary Artist") &&
          columnValue.includes("Your Primary Artist Type is")
        ) {
          Effect.runSync(Effect.log(`Found Visionary record ${index + 1}:`));
          Effect.runSync(Effect.log("Column:", columnName));
          Effect.runSync(Effect.log("Content preview:", columnValue.substring(0, 300)));
          Effect.runSync(Effect.log("Extracted artist type:", artistType));
        }

        if (index === 0 && columnName === "Ending") {
          Effect.runSync(Effect.log("Ending column content:", columnValue));
          Effect.runSync(Effect.log("Extracted artist type:", artistType));
          Effect.runSync(Effect.log("Legacy analysis:", legacyAnalysis));
        }
        break;
      }
    }
  }

  // Create metadata with original Typeform data
  const emailKey =
    "*You're almost done! *Please fill in your email below to get your quiz results and stay updated on upcoming workshops, events, and tools to help you grow as an artist.\n\n*NOTE:* _*Your Quiz Results will be available via a button at the bottom of the next page.*_";

  const metadata = {
    source: "typeform",
    originalRecord: typedRecord,
    processedAt: new Date().toISOString(),
    totalQuestions: answers.length,
    email: typedRecord[emailKey],
    startDate: typedRecord["Start Date (UTC)"],
    submitDate: typedRecord["Submit Date (UTC)"],
    responseType: typedRecord["Response Type"],
    networkId: typedRecord["Network ID"],
    // Legacy analysis data from Typeform
    legacyAnalysis,
    // Include the entire Typeform response object
    typeformResponse: {
      id: responseId,
      answers,
      artistType,
      legacyAnalysis,
      metadata: {
        source: "typeform",
        originalRecord: typedRecord,
        processedAt: new Date().toISOString(),
        totalQuestions: answers.length,
        email: typedRecord[emailKey],
        startDate: typedRecord["Start Date (UTC)"],
        submitDate: typedRecord["Submit Date (UTC)"],
        responseType: typedRecord["Response Type"],
        networkId: typedRecord["Network ID"],
        legacyAnalysis,
      },
    },
  };

  if (answers.length > 0 && artistType !== null) {
    processedResponses.push({
      id: responseId,
      answers,
      artistType,
      legacyAnalysis,
      metadata,
    });
  }
});

// Save the processed data
const output = {
  quizId: "artist-type-quiz",
  quizVersionId: "v1.2.0",
  responses: processedResponses,
  summary: {
    totalProcessed: processedResponses.length,
    totalOriginal: records.length,
    questionsMatched: questions.length,
    artistTypesFound: [...new Set(processedResponses.map((r) => r.artistType))].length,
  },
};

const outputPath = join(currentDir, "typeform-processed.json");
writeFileSync(outputPath, JSON.stringify(output, null, 2));

Effect.runSync(Effect.log(`Processed ${processedResponses.length} responses from Typeform data`));
Effect.runSync(Effect.log(`Output saved to ${outputPath}`));

// Log some statistics
const artistTypeCounts: Record<string, number> = {};
processedResponses.forEach((response) => {
  artistTypeCounts[response.artistType] = (artistTypeCounts[response.artistType] ?? 0) + 1;
});

Effect.runSync(Effect.log("\nArtist Type Distribution:"));
Object.entries(artistTypeCounts).forEach(([type, count]) => {
  Effect.runSync(Effect.log(`  ${type}: ${count}`));
});

// Calculate total artist type counts and compare to processed responses
const totalArtistTypeCounts = Object.values(artistTypeCounts).reduce(
  (sum, count) => sum + count,
  0,
);
Effect.runSync(Effect.log(`\nSummary:`));
Effect.runSync(Effect.log(`  Total responses processed: ${processedResponses.length}`));
Effect.runSync(Effect.log(`  Total artist type counts: ${totalArtistTypeCounts}`));
Effect.runSync(
  Effect.log(
    `  Match: ${totalArtistTypeCounts === processedResponses.length ? "✅ YES" : "❌ NO"}`,
  ),
);
