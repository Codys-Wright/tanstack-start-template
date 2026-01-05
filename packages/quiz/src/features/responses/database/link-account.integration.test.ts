/**
 * Integration test for anonymous account linking flow.
 *
 * Tests that the OnLinkAccountHandler correctly migrates quiz responses
 * when an anonymous user claims their account.
 *
 * This simulates the flow:
 * 1. Anonymous user takes quiz -> response saved with anonymous userId
 * 2. User claims account (Better Auth creates new user, triggers onLinkAccount)
 * 3. OnLinkAccountHandler.handle() is called
 * 4. Handler calls ResponsesRepo.updateUserIdForResponses()
 * 5. Response now belongs to the new user
 */

import { expect, it } from '@effect/vitest';
import * as BunContext from '@effect/platform-bun/BunContext';
import * as SqlClient from '@effect/sql/SqlClient';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { makePgTestMigrations, withTransactionRollback } from '@core/database';
import { makeOnLinkAccountHandler, OnLinkAccountHandler } from '@auth/server';
import { QuizMigrations } from '../../../database/migrations.js';
import { ResponsesRepo } from './repo.js';
import { UserId } from '../domain/schema.js';
import type { QuizId } from '../../quiz/domain/schema.js';

// =============================================================================
// Test Setup
// =============================================================================

// Create test layer with quiz migrations applied
// Note: user_id column has no FK constraint, so no need to create user table first
const PgTest = makePgTestMigrations(QuizMigrations);

// Repository layer for tests
const TestLayer = ResponsesRepo.DefaultWithoutDependencies.pipe(
  Layer.provideMerge(PgTest),
  Layer.provide(BunContext.layer),
);

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Insert a test quiz (required for foreign key on responses).
 */
const insertTestQuiz = (data?: { id?: string; title?: string }) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const id = data?.id ?? crypto.randomUUID();
    yield* sql`
      INSERT INTO quizzes (id, title, version, is_published, is_temp, questions)
      VALUES (
        ${id},
        ${data?.title ?? 'Test Quiz'},
        '{"semver":"1.0.0","comment":"Test"}'::jsonb,
        true,
        false,
        '[]'::jsonb
      )
    `;
    return id as QuizId;
  });

/**
 * Generate random quiz answers.
 */
const generateRandomAnswers = (questionCount: number = 3) => {
  return Array.from({ length: questionCount }, (_, i) => ({
    questionId: `q${i + 1}`,
    value: Math.floor(Math.random() * 11),
    answeredAt: DateTime.unsafeNow(),
    timeSpentMs: Math.floor(Math.random() * 5000) + 1000,
  }));
};

// =============================================================================
// Integration Tests
// =============================================================================

/**
 * Create the OnLinkAccountHandler that uses ResponsesRepo.
 * This is the same handler pattern used in the actual app (server-handler.ts).
 */
const QuizLinkAccountHandler = makeOnLinkAccountHandler((data) =>
  Effect.gen(function* () {
    const repo = yield* ResponsesRepo;
    yield* repo.updateUserIdForResponses(data.anonymousUserId as UserId, data.newUserId as UserId);
  }),
);

it.layer(TestLayer, { timeout: 60_000 })('Account Linking - Response Migration', (it) => {
  it.scoped(
    'OnLinkAccountHandler - migrates response when handle() is called',
    Effect.fn(function* () {
      const repo = yield* ResponsesRepo;

      // Create fake user IDs (no FK constraint, so we can use any string)
      const anonymousUserId = crypto.randomUUID() as UserId;
      const newUserId = crypto.randomUUID() as UserId;

      // Create a quiz first (required for FK on responses)
      const quizId = yield* insertTestQuiz();

      // Submit a quiz response as the anonymous user
      const now = DateTime.unsafeNow();
      const response = yield* repo.create({
        quizId,
        userId: anonymousUserId,
        answers: generateRandomAnswers(3),
        sessionMetadata: {
          startedAt: now,
          completedAt: now,
          totalDurationMs: 15000,
          userAgent: 'Test Browser',
        },
        interactionLogs: [
          { type: 'navigation', action: 'start', timestamp: now },
          { type: 'submission', action: 'complete', timestamp: now },
        ],
        metadata: null,
      });

      // Verify the response has the anonymous user's ID
      expect(response.userId).toBe(anonymousUserId);

      // Build and call the OnLinkAccountHandler (same as what Better Auth triggers)
      // This is the actual handler that would be wired up in server-handler.ts
      const handlerLayer = Layer.provide(
        QuizLinkAccountHandler,
        ResponsesRepo.DefaultWithoutDependencies,
      );
      const handler = yield* OnLinkAccountHandler.pipe(Effect.provide(handlerLayer));

      // Simulate Better Auth calling onLinkAccount callback
      yield* handler.handle({
        anonymousUserId,
        newUserId,
      });

      // Verify the response now has the new user's ID
      const updatedResponse = yield* repo.findById(response.id);
      expect(updatedResponse.userId).toBe(newUserId);

      // Verify findByUserId works correctly
      const userResponses = yield* repo.findByUserId(newUserId);
      expect(userResponses.length).toBe(1);
      expect(userResponses[0].id).toBe(response.id);

      // Old anonymous user should have no responses
      const oldUserResponses = yield* repo.findByUserId(anonymousUserId);
      expect(oldUserResponses.length).toBe(0);
    }, withTransactionRollback),
  );

  it.scoped(
    'updateUserIdForResponses - handles multiple responses',
    Effect.fn(function* () {
      const repo = yield* ResponsesRepo;

      const anonymousUserId = crypto.randomUUID() as UserId;
      const newUserId = crypto.randomUUID() as UserId;
      const quizId = yield* insertTestQuiz();

      // Submit multiple responses
      const now = DateTime.unsafeNow();
      const responseCount = 3;
      const createdResponseIds: string[] = [];

      for (let i = 0; i < responseCount; i++) {
        const response = yield* repo.create({
          quizId,
          userId: anonymousUserId,
          answers: generateRandomAnswers(3),
          sessionMetadata: { startedAt: now },
          interactionLogs: [],
          metadata: null,
        });
        createdResponseIds.push(response.id);
      }

      // Verify all responses belong to anonymous user
      const anonymousResponses = yield* repo.findByUserId(anonymousUserId);
      expect(anonymousResponses.length).toBe(responseCount);

      // Migrate responses
      yield* repo.updateUserIdForResponses(anonymousUserId, newUserId);

      // All responses should now belong to new user
      const newUserResponses = yield* repo.findByUserId(newUserId);
      expect(newUserResponses.length).toBe(responseCount);

      // Verify each response ID is in the list
      for (const responseId of createdResponseIds) {
        expect(newUserResponses.some((r) => r.id === responseId)).toBe(true);
      }

      // Anonymous user should have no responses
      const remainingAnonymousResponses = yield* repo.findByUserId(anonymousUserId);
      expect(remainingAnonymousResponses.length).toBe(0);
    }, withTransactionRollback),
  );

  it.scoped(
    'updateUserIdForResponses - does not affect other users responses',
    Effect.fn(function* () {
      const repo = yield* ResponsesRepo;

      const anonymousUser1 = crypto.randomUUID() as UserId;
      const anonymousUser2 = crypto.randomUUID() as UserId;
      const newUserId = crypto.randomUUID() as UserId;
      const quizId = yield* insertTestQuiz();
      const now = DateTime.unsafeNow();

      // Each user submits a response
      const response1 = yield* repo.create({
        quizId,
        userId: anonymousUser1,
        answers: generateRandomAnswers(),
        sessionMetadata: { startedAt: now },
        interactionLogs: [],
        metadata: null,
      });

      const response2 = yield* repo.create({
        quizId,
        userId: anonymousUser2,
        answers: generateRandomAnswers(),
        sessionMetadata: { startedAt: now },
        interactionLogs: [],
        metadata: null,
      });

      // User 1 claims their account
      yield* repo.updateUserIdForResponses(anonymousUser1, newUserId);

      // Verify user 1's response was migrated
      const user1Response = yield* repo.findById(response1.id);
      expect(user1Response.userId).toBe(newUserId);

      // Verify user 2's response was NOT affected
      const user2Response = yield* repo.findById(response2.id);
      expect(user2Response.userId).toBe(anonymousUser2);
    }, withTransactionRollback),
  );

  it.scoped(
    'updateUserIdForResponses - handles no responses gracefully',
    Effect.fn(function* () {
      const repo = yield* ResponsesRepo;

      const anonymousUserId = crypto.randomUUID() as UserId;
      const newUserId = crypto.randomUUID() as UserId;

      // Migration should succeed without error even with no responses
      yield* repo.updateUserIdForResponses(anonymousUserId, newUserId);

      // Both users should have 0 responses
      const anonymousResponses = yield* repo.findByUserId(anonymousUserId);
      const newUserResponses = yield* repo.findByUserId(newUserId);

      expect(anonymousResponses.length).toBe(0);
      expect(newUserResponses.length).toBe(0);
    }, withTransactionRollback),
  );

  it.scoped(
    'findByUserId - returns all responses for user',
    Effect.fn(function* () {
      const repo = yield* ResponsesRepo;

      const userId = crypto.randomUUID() as UserId;
      const quizId = yield* insertTestQuiz();
      const now = DateTime.unsafeNow();

      // Submit responses
      const response1 = yield* repo.create({
        quizId,
        userId,
        answers: generateRandomAnswers(),
        sessionMetadata: { startedAt: now },
        interactionLogs: [],
        metadata: null,
      });

      const response2 = yield* repo.create({
        quizId,
        userId,
        answers: generateRandomAnswers(),
        sessionMetadata: { startedAt: now },
        interactionLogs: [],
        metadata: null,
      });

      const response3 = yield* repo.create({
        quizId,
        userId,
        answers: generateRandomAnswers(),
        sessionMetadata: { startedAt: now },
        interactionLogs: [],
        metadata: null,
      });

      // Get user responses
      const userResponses = yield* repo.findByUserId(userId);
      expect(userResponses.length).toBe(3);

      // Verify all response IDs are present (order may vary due to same timestamp)
      const responseIds = userResponses.map((r) => r.id);
      expect(responseIds).toContain(response1.id);
      expect(responseIds).toContain(response2.id);
      expect(responseIds).toContain(response3.id);
    }, withTransactionRollback),
  );

  it.scoped(
    'authenticated user workflow - response saved with real userId from start',
    Effect.fn(function* () {
      const repo = yield* ResponsesRepo;

      // Authenticated user (not anonymous) takes quiz
      const authenticatedUserId = crypto.randomUUID() as UserId;
      const quizId = yield* insertTestQuiz();
      const now = DateTime.unsafeNow();

      const response = yield* repo.create({
        quizId,
        userId: authenticatedUserId,
        answers: generateRandomAnswers(3),
        sessionMetadata: { startedAt: now },
        interactionLogs: [],
        metadata: null,
      });

      // Response should have the authenticated user's ID
      expect(response.userId).toBe(authenticatedUserId);

      // findByUserId should return the response
      const userResponses = yield* repo.findByUserId(authenticatedUserId);
      expect(userResponses.length).toBe(1);
      expect(userResponses[0].id).toBe(response.id);
    }, withTransactionRollback),
  );

  it.scoped(
    'response without userId - handles null userId gracefully',
    Effect.fn(function* () {
      const repo = yield* ResponsesRepo;

      const quizId = yield* insertTestQuiz();
      const now = DateTime.unsafeNow();

      // Create response without userId (legacy or unauthenticated)
      const response = yield* repo.create({
        quizId,
        userId: null,
        answers: generateRandomAnswers(3),
        sessionMetadata: { startedAt: now },
        interactionLogs: [],
        metadata: null,
      });

      // Response should have null userId
      expect(response.userId).toBeNull();

      // findByUserId with a random ID should not find this response
      const randomUserId = crypto.randomUUID() as UserId;
      const userResponses = yield* repo.findByUserId(randomUserId);
      expect(userResponses.length).toBe(0);
    }, withTransactionRollback),
  );

  it.scoped(
    'mixed responses - migration only affects matching userId',
    Effect.fn(function* () {
      const repo = yield* ResponsesRepo;

      const anonymousUserId = crypto.randomUUID() as UserId;
      const authenticatedUserId = crypto.randomUUID() as UserId;
      const newUserId = crypto.randomUUID() as UserId;
      const quizId = yield* insertTestQuiz();
      const now = DateTime.unsafeNow();

      // Anonymous user's response
      const anonymousResponse = yield* repo.create({
        quizId,
        userId: anonymousUserId,
        answers: generateRandomAnswers(),
        sessionMetadata: { startedAt: now },
        interactionLogs: [],
        metadata: null,
      });

      // Authenticated user's response (should not be affected)
      const authResponse = yield* repo.create({
        quizId,
        userId: authenticatedUserId,
        answers: generateRandomAnswers(),
        sessionMetadata: { startedAt: now },
        interactionLogs: [],
        metadata: null,
      });

      // Response with null userId (should not be affected)
      const nullResponse = yield* repo.create({
        quizId,
        userId: null,
        answers: generateRandomAnswers(),
        sessionMetadata: { startedAt: now },
        interactionLogs: [],
        metadata: null,
      });

      // Migrate anonymous user's responses
      yield* repo.updateUserIdForResponses(anonymousUserId, newUserId);

      // Verify anonymous response was migrated
      const updatedAnonymousResponse = yield* repo.findById(anonymousResponse.id);
      expect(updatedAnonymousResponse.userId).toBe(newUserId);

      // Verify authenticated user's response was NOT affected
      const updatedAuthResponse = yield* repo.findById(authResponse.id);
      expect(updatedAuthResponse.userId).toBe(authenticatedUserId);

      // Verify null response was NOT affected
      const updatedNullResponse = yield* repo.findById(nullResponse.id);
      expect(updatedNullResponse.userId).toBeNull();
    }, withTransactionRollback),
  );
});
