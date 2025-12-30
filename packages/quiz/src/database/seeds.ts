/**
 * Quiz Database Seeders
 *
 * Composable seeders for creating quiz data including:
 * - Quiz with questions
 * - Analysis Engine with endings
 * - Active Quiz entry
 * - Typeform responses (optional)
 * - Analysis results from Typeform data (optional)
 *
 * Uses the exact same seed data from the reference implementation.
 */

import { makeCleanup, makeSeeder, type CleanupEntry, type SeederEntry } from '@core/database';
import * as SqlClient from '@effect/sql/SqlClient';
import * as Effect from 'effect/Effect';
import { getSeedPayload } from '../features/quiz/seed/seed-quiz.js';
import { getSeedAnalysisEnginePayload } from '../features/analysis/seed/seed-analysis-engine.js';
import { getTypeformResponseSeedData } from '../features/responses/seed/typeform/seed-typeform-responses.js';

// ─────────────────────────────────────────────────────────────────────────────
// Quiz Seeder (Quiz + Questions)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Seeds the Artist Type quiz with all questions.
 * This is the core quiz data.
 */
export const quizzes = makeSeeder({ name: 'quizzes', defaultCount: 1, dependsOn: [] }, () =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const quizPayload = getSeedPayload();

    // Check if quiz already exists
    const existing = yield* sql<{ count: string }>`
      SELECT COUNT(*)::text as count FROM quizzes 
      WHERE title = 'My Artist Type Quiz' 
      AND (version->>'semver')::text = '1.0.0'
      AND deleted_at IS NULL
    `;

    if (Number(existing[0].count) > 0) {
      return { name: 'quizzes', existing: 1, created: 0 };
    }

    // Create the quiz - generate UUIDs for each question and ensure metadata field exists
    // The Question schema uses S.parseJson for metadata, so it expects a JSON string, not raw null
    const questionsWithIds = (quizPayload.questions ?? []).map((q) => ({
      ...q,
      id: crypto.randomUUID(),
      metadata: JSON.stringify(q.metadata ?? null), // parseJson expects a string
    }));
    const questionsJson = JSON.stringify(questionsWithIds);
    const versionJson = JSON.stringify(quizPayload.version);
    const metadataJson = JSON.stringify(quizPayload.metadata ?? {});

    yield* sql`
      INSERT INTO quizzes (
        title, subtitle, description, version, questions, metadata, is_published, is_temp
      ) VALUES (
        ${quizPayload.title},
        ${'Discover your unique creative personality'},
        ${'Take this comprehensive quiz to understand your artist archetype and creative approach.'},
        ${versionJson}::jsonb,
        ${questionsJson}::jsonb,
        ${metadataJson}::jsonb,
        true,
        false
      )
    `;

    yield* Effect.log(`Created quiz: ${quizPayload.title}`);
    return { name: 'quizzes', existing: 0, created: 1 };
  }),
);

// ─────────────────────────────────────────────────────────────────────────────
// Analysis Engine Seeder
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Seeds the Analysis Engine with all artist type endings.
 * Depends on quizzes seeder to get the quiz ID and question IDs.
 */
export const analysisEngines = makeSeeder(
  { name: 'analysis_engines', defaultCount: 1, dependsOn: ['quizzes'] },
  () =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const analysisEnginePayload = getSeedAnalysisEnginePayload();

      // Find the seeded quiz
      const quizRows = yield* sql<{
        id: string;
        questions: string;
        version: string;
      }>`
        SELECT id, questions::text, version::text FROM quizzes 
        WHERE title = 'My Artist Type Quiz' 
        AND (version->>'semver')::text = '1.0.0'
        AND deleted_at IS NULL
        LIMIT 1
      `;

      if (quizRows.length === 0) {
        yield* Effect.logWarning('[analysis_engines] Quiz not found, skipping');
        return { name: 'analysis_engines', existing: 0, created: 0 };
      }

      const quizId = quizRows[0].id;
      const questions = JSON.parse(quizRows[0].questions) as Array<{
        id: string;
        order: number;
      }>;
      const quizVersion = JSON.parse(quizRows[0].version) as { semver: string };

      // Check if analysis engine already exists
      const existingEngine = yield* sql<{ count: string }>`
        SELECT COUNT(*)::text as count FROM analysis_engines 
        WHERE quiz_id = ${quizId}
        AND (version->>'semver')::text = ${quizVersion.semver}
        AND deleted_at IS NULL
      `;

      if (Number(existingEngine[0].count) > 0) {
        return { name: 'analysis_engines', existing: 1, created: 0 };
      }

      // Build question ID mapping (order -> UUID)
      const questionIdMap = new Map<string, string>();
      questions.forEach((question) => {
        questionIdMap.set(question.order.toString(), question.id);
      });

      // Convert engine question rules to use actual question UUIDs
      const updatedEndings = analysisEnginePayload.endings.map((ending) => ({
        ...ending,
        questionRules: ending.questionRules
          .map((rule) => ({
            ...rule,
            questionId: questionIdMap.get(rule.questionId) ?? rule.questionId,
          }))
          .filter((rule) => questions.some((q) => q.id === rule.questionId)),
      }));

      // Log conversion statistics
      const totalEngineRules = analysisEnginePayload.endings.reduce(
        (sum, ending) => sum + ending.questionRules.length,
        0,
      );
      const convertedEngineRules = updatedEndings.reduce(
        (sum, ending) => sum + ending.questionRules.length,
        0,
      );
      yield* Effect.log(
        `Analysis engine rule conversion: ${convertedEngineRules}/${totalEngineRules} rules mapped`,
      );

      // Create the analysis engine
      const versionJson = JSON.stringify(quizVersion);
      const scoringConfigJson = JSON.stringify(analysisEnginePayload.scoringConfig);
      const endingsJson = JSON.stringify(updatedEndings);
      const metadataJson = JSON.stringify({
        ...analysisEnginePayload.metadata,
        linkedQuizVersion: quizVersion,
        linkedQuizId: quizId,
      });

      yield* sql`
        INSERT INTO analysis_engines (
          name, description, version, scoring_config, endings, metadata,
          is_active, is_published, is_temp, quiz_id
        ) VALUES (
          ${analysisEnginePayload.name},
          ${analysisEnginePayload.description},
          ${versionJson}::jsonb,
          ${scoringConfigJson}::jsonb,
          ${endingsJson}::jsonb,
          ${metadataJson}::jsonb,
          true,
          true,
          false,
          ${quizId}
        )
      `;

      yield* Effect.log(`Created analysis engine: ${analysisEnginePayload.name}`);
      return { name: 'analysis_engines', existing: 0, created: 1 };
    }),
);

// ─────────────────────────────────────────────────────────────────────────────
// Active Quiz Seeder
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Seeds the Active Quiz entry that links quiz + engine to a public slug.
 * Depends on both quizzes and analysis_engines seeders.
 */
export const activeQuizzes = makeSeeder(
  {
    name: 'active_quizzes',
    defaultCount: 1,
    dependsOn: ['quizzes', 'analysis_engines'],
  },
  () =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const publicSlug = 'my-artist-type';

      // Find the seeded quiz
      const quizRows = yield* sql<{ id: string; version: string }>`
        SELECT id, version::text FROM quizzes 
        WHERE title = 'My Artist Type Quiz' 
        AND (version->>'semver')::text = '1.0.0'
        AND deleted_at IS NULL
        LIMIT 1
      `;

      if (quizRows.length === 0) {
        yield* Effect.logWarning('[active_quizzes] Quiz not found, skipping');
        return { name: 'active_quizzes', existing: 0, created: 0 };
      }

      const quizId = quizRows[0].id;
      const quizVersion = JSON.parse(quizRows[0].version) as { semver: string };

      // Find the seeded engine
      const engineRows = yield* sql<{ id: string }>`
        SELECT id FROM analysis_engines 
        WHERE quiz_id = ${quizId}
        AND (version->>'semver')::text = ${quizVersion.semver}
        AND deleted_at IS NULL
        LIMIT 1
      `;

      if (engineRows.length === 0) {
        yield* Effect.logWarning('[active_quizzes] Analysis engine not found, skipping');
        return { name: 'active_quizzes', existing: 0, created: 0 };
      }

      const engineId = engineRows[0].id;

      // Check if active quiz already exists
      const existingActiveQuiz = yield* sql<{ id: string }>`
        SELECT id FROM active_quizzes WHERE slug = ${publicSlug} LIMIT 1
      `;

      if (existingActiveQuiz.length > 0) {
        // Update existing
        yield* sql`
          UPDATE active_quizzes 
          SET quiz_id = ${quizId}, engine_id = ${engineId}, updated_at = NOW()
          WHERE slug = ${publicSlug}
        `;
        yield* Effect.log(`Updated active quiz "${publicSlug}"`);
        return { name: 'active_quizzes', existing: 1, created: 0 };
      }

      // Create new active quiz
      yield* sql`
        INSERT INTO active_quizzes (slug, quiz_id, engine_id) 
        VALUES (${publicSlug}, ${quizId}, ${engineId})
      `;

      yield* Effect.log(`Created active quiz "${publicSlug}"`);
      return { name: 'active_quizzes', existing: 0, created: 1 };
    }),
);

// ─────────────────────────────────────────────────────────────────────────────
// Typeform Responses Seeder (Optional)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Seeds Typeform responses with content-based question matching.
 * This is optional and depends on quizzes seeder.
 */
export const typeformResponses = makeSeeder(
  { name: 'typeform_responses', defaultCount: 1, dependsOn: ['quizzes'] },
  () =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const typeformResponseData = getTypeformResponseSeedData();

      // Find the seeded quiz
      const quizRows = yield* sql<{ id: string; questions: string }>`
        SELECT id, questions::text FROM quizzes 
        WHERE title = 'My Artist Type Quiz' 
        AND (version->>'semver')::text = '1.0.0'
        AND deleted_at IS NULL
        LIMIT 1
      `;

      if (quizRows.length === 0) {
        yield* Effect.logWarning('[typeform_responses] Quiz not found, skipping');
        return { name: 'typeform_responses', existing: 0, created: 0 };
      }

      const quizId = quizRows[0].id;
      const questions = JSON.parse(quizRows[0].questions) as Array<{
        id: string;
        title: string;
      }>;

      // Create content-based question ID mapping
      const contentToQuestionIdMap = new Map<string, string>();
      questions.forEach((question) => {
        const contentKey = question.title.toLowerCase().trim();
        contentToQuestionIdMap.set(contentKey, question.id);
      });

      // Manual mappings for common variations
      const manualMappings: Record<string, string> = {
        'i lose myself in my work and find it natural to enter a flow state.':
          'i lose myself in my work and lose track of time.',
        'i lose myself in my work and find it natural to enter a flow state':
          'i lose myself in my work and lose track of time',
      };

      yield* Effect.log(`Processing ${typeformResponseData.length} Typeform responses...`);

      let successCount = 0;
      let errorCount = 0;

      for (const [index, responseData] of typeformResponseData.entries()) {
        try {
          // Convert question IDs using content matching
          const convertedAnswers = responseData.answers
            .map((answer) => {
              const questionContent = (answer as any).questionContent as string | undefined;
              if (questionContent) {
                const normalizedContent = questionContent.toLowerCase().trim();

                // Try exact match first
                let quizQuestionId = contentToQuestionIdMap.get(normalizedContent);

                // Try partial matching
                if (!quizQuestionId) {
                  for (const [contentKey, questionId] of contentToQuestionIdMap.entries()) {
                    if (
                      contentKey.includes(normalizedContent) ||
                      normalizedContent.includes(contentKey)
                    ) {
                      quizQuestionId = questionId;
                      break;
                    }
                  }
                }

                // Try manual mappings
                if (!quizQuestionId) {
                  const manualMatch = manualMappings[normalizedContent];
                  if (manualMatch) {
                    quizQuestionId = contentToQuestionIdMap.get(manualMatch);
                  }
                }

                if (quizQuestionId) {
                  return { ...answer, questionId: quizQuestionId };
                }
              }
              return answer;
            })
            .filter((answer) => questions.some((q) => q.id === answer.questionId));

          const submitDateStr =
            (responseData.sessionMetadata as any).customFields?.submitDate ?? '';
          const submitDate =
            typeof submitDateStr === 'string' && submitDateStr !== ''
              ? new Date(submitDateStr)
              : new Date();

          const answersJson = JSON.stringify(convertedAnswers);
          const sessionMetadataJson = JSON.stringify(responseData.sessionMetadata);
          const interactionLogsJson = JSON.stringify(responseData.interactionLogs);
          const metadataJson = JSON.stringify(responseData.metadata);

          yield* sql`
            INSERT INTO responses (
              quiz_id, answers, session_metadata, interaction_logs, metadata, created_at, updated_at
            ) VALUES (
              ${quizId},
              ${answersJson}::jsonb,
              ${sessionMetadataJson}::jsonb,
              ${interactionLogsJson}::jsonb,
              ${metadataJson}::jsonb,
              ${submitDate.toISOString()},
              ${submitDate.toISOString()}
            )
          `;

          successCount++;

          if (index % 100 === 0 && index > 0) {
            yield* Effect.log(`Processed ${index}/${typeformResponseData.length} responses...`);
          }
        } catch {
          errorCount++;
        }
      }

      yield* Effect.log(`Typeform responses: ${successCount} imported, ${errorCount} errors`);
      return {
        name: 'typeform_responses',
        existing: 0,
        created: successCount,
        details: { errors: errorCount },
      };
    }),
);

// ─────────────────────────────────────────────────────────────────────────────
// Analysis Results Seeder (Optional)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Seeds analysis results from Typeform legacy data.
 * Depends on typeform_responses and analysis_engines seeders.
 */
export const analysisResults = makeSeeder(
  {
    name: 'analysis_results',
    defaultCount: 1,
    dependsOn: ['quizzes', 'analysis_engines', 'typeform_responses'],
  },
  () =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      // Find the seeded quiz
      const quizRows = yield* sql<{ id: string; version: string }>`
        SELECT id, version::text FROM quizzes 
        WHERE title = 'My Artist Type Quiz' 
        AND (version->>'semver')::text = '1.0.0'
        AND deleted_at IS NULL
        LIMIT 1
      `;

      if (quizRows.length === 0) {
        yield* Effect.logWarning('[analysis_results] Quiz not found, skipping');
        return { name: 'analysis_results', existing: 0, created: 0 };
      }

      const quizId = quizRows[0].id;
      const quizVersion = JSON.parse(quizRows[0].version) as { semver: string };

      // Find the seeded engine
      const engineRows = yield* sql<{ id: string }>`
        SELECT id FROM analysis_engines 
        WHERE quiz_id = ${quizId}
        AND (version->>'semver')::text = ${quizVersion.semver}
        AND deleted_at IS NULL
        LIMIT 1
      `;

      if (engineRows.length === 0) {
        yield* Effect.logWarning('[analysis_results] Analysis engine not found, skipping');
        return { name: 'analysis_results', existing: 0, created: 0 };
      }

      const engineId = engineRows[0].id;

      // Get all responses for this quiz
      const responses = yield* sql<{ id: string; metadata: string }>`
        SELECT id, metadata::text FROM responses 
        WHERE quiz_id = ${quizId} AND deleted_at IS NULL
      `;

      yield* Effect.log(`Processing analysis for ${responses.length} responses...`);

      let successCount = 0;
      let errorCount = 0;

      for (const [index, response] of responses.entries()) {
        try {
          // Check if analysis already exists
          const existingAnalysis = yield* sql<{ count: string }>`
            SELECT COUNT(*)::text as count FROM analysis_results 
            WHERE response_id = ${response.id} AND deleted_at IS NULL
          `;

          if (Number(existingAnalysis[0].count) > 0) {
            continue;
          }

          // Get legacy artist type from metadata
          const metadata = JSON.parse(response.metadata || '{}');
          const legacyAnalysis = metadata?.customFields?.legacyAnalysis as
            | { primaryArtistType: string | null }
            | undefined;

          const legacyArtistType = legacyAnalysis?.primaryArtistType ?? null;

          if (legacyArtistType !== null && legacyArtistType.length > 0) {
            const endingId = legacyArtistType.toLowerCase().replace(/\s+/g, '-');
            const now = new Date().toISOString();

            const endingResultsJson = JSON.stringify([
              {
                endingId,
                points: 100,
                percentage: 100,
                isWinner: true,
              },
            ]);

            const analysisMetadataJson = JSON.stringify({
              source: 'typeform-legacy',
              originalArtistType: legacyArtistType,
            });

            const engineVersionJson = JSON.stringify(quizVersion);

            yield* sql`
              INSERT INTO analysis_results (
                engine_id, engine_version, response_id, ending_results, 
                metadata, analyzed_at, created_at, updated_at
              ) VALUES (
                ${engineId},
                ${engineVersionJson}::jsonb,
                ${response.id},
                ${endingResultsJson}::jsonb,
                ${analysisMetadataJson}::jsonb,
                ${now},
                ${now},
                ${now}
              )
            `;

            successCount++;
          }

          if (index % 50 === 0 && index > 0) {
            yield* Effect.log(`Processed ${index}/${responses.length} analysis results...`);
          }
        } catch {
          errorCount++;
        }
      }

      yield* Effect.log(`Analysis results: ${successCount} created, ${errorCount} errors`);
      return {
        name: 'analysis_results',
        existing: 0,
        created: successCount,
        details: { errors: errorCount },
      };
    }),
);

// ─────────────────────────────────────────────────────────────────────────────
// Quiz Seed Composer
// ─────────────────────────────────────────────────────────────────────────────

interface QuizSeedOptions {
  /** Include Typeform responses (default: false) */
  readonly includeTypeformResponses?: boolean;
  /** Include analysis results from Typeform data (default: false) */
  readonly includeAnalysisResults?: boolean;
}

/**
 * Compose quiz seeders with optional includes.
 *
 * @example
 * ```ts
 * quiz()                                      // Core quiz data only
 * quiz({ includeTypeformResponses: true })   // With Typeform responses
 * quiz({ includeTypeformResponses: true, includeAnalysisResults: true })  // Full data
 * ```
 */
export const quiz = (options: QuizSeedOptions = {}): ReadonlyArray<SeederEntry> => {
  const seeders: SeederEntry[] = [quizzes(), analysisEngines(), activeQuizzes()];

  if (options.includeTypeformResponses) {
    seeders.push(typeformResponses());
  }

  if (options.includeAnalysisResults) {
    seeders.push(analysisResults());
  }

  return seeders;
};

// ─────────────────────────────────────────────────────────────────────────────
// Cleanup
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cleanup analysis results.
 */
export const cleanupAnalysisResults = makeCleanup({
  name: 'analysis_results',
  countSql: (sql) =>
    sql<{
      count: number;
    }>`SELECT COUNT(*)::int as count FROM analysis_results`.pipe(Effect.map((r) => r[0].count)),
  deleteSql: (sql) => sql`DELETE FROM analysis_results`.pipe(Effect.asVoid),
});

/**
 * Cleanup responses.
 */
export const cleanupResponses = makeCleanup({
  name: 'responses',
  countSql: (sql) =>
    sql<{ count: number }>`SELECT COUNT(*)::int as count FROM responses`.pipe(
      Effect.map((r) => r[0].count),
    ),
  deleteSql: (sql) => sql`DELETE FROM responses`.pipe(Effect.asVoid),
});

/**
 * Cleanup active quizzes.
 */
export const cleanupActiveQuizzes = makeCleanup({
  name: 'active_quizzes',
  countSql: (sql) =>
    sql<{
      count: number;
    }>`SELECT COUNT(*)::int as count FROM active_quizzes`.pipe(Effect.map((r) => r[0].count)),
  deleteSql: (sql) => sql`DELETE FROM active_quizzes`.pipe(Effect.asVoid),
});

/**
 * Cleanup analysis engines.
 */
export const cleanupAnalysisEngines = makeCleanup({
  name: 'analysis_engines',
  countSql: (sql) =>
    sql<{
      count: number;
    }>`SELECT COUNT(*)::int as count FROM analysis_engines`.pipe(Effect.map((r) => r[0].count)),
  deleteSql: (sql) => sql`DELETE FROM analysis_engines`.pipe(Effect.asVoid),
});

/**
 * Cleanup quizzes.
 */
export const cleanupQuizzes = makeCleanup({
  name: 'quizzes',
  countSql: (sql) =>
    sql<{ count: number }>`SELECT COUNT(*)::int as count FROM quizzes`.pipe(
      Effect.map((r) => r[0].count),
    ),
  deleteSql: (sql) => sql`DELETE FROM quizzes`.pipe(Effect.asVoid),
});

/**
 * Get all quiz cleanup operations in correct order (reverse of dependencies).
 */
export const quizCleanup = (): ReadonlyArray<CleanupEntry> => [
  cleanupAnalysisResults(),
  cleanupResponses(),
  cleanupActiveQuizzes(),
  cleanupAnalysisEngines(),
  cleanupQuizzes(),
];
