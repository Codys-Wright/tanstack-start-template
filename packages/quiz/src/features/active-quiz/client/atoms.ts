// Active Quiz Client Atoms
// Provides atoms for quiz-taking session state (local) and ActiveQuiz fetching (remote)

import { serializable } from '@core/client/atom-utils';
import { Atom, Result } from '@effect-atom/atom-react';
import * as BrowserKeyValueStore from '@effect/platform-browser/BrowserKeyValueStore';
import * as RpcClientError from '@effect/rpc/RpcClientError';
import * as Arr from 'effect/Array';
import * as Data from 'effect/Data';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import type { Question } from '@quiz/features/quiz/questions/schema.js';
import type { Quiz } from '@quiz/features/quiz/domain/schema.js';
import type { InteractionLog, SessionMetadata } from '@quiz/features/responses/domain/schema.js';
import { ActiveQuiz, UpsertActiveQuizPayload } from '../domain/index.js';
import { ActiveQuizClient } from './client.js';
import { ResponsesClient } from '@quiz/features/responses/client/client.js';
import {
  UpsertResponsePayload,
  UpsertSessionMetadataPayload,
  UpsertQuestionResponsePayload,
  UpsertInteractionLogPayload,
  UserId,
  type ResponseId,
} from '@quiz/features/responses/domain/schema.js';
import { sessionAtom } from '@auth/features/session/client/atoms.js';

const ActiveQuizzesSchema = Schema.Array(ActiveQuiz);

// ============================================================================
// Types
// ============================================================================

// Dev panel config type
export type AnalysisConfigOverrides = {
  primaryPointValue: number;
  secondaryPointValue: number;
  primaryPointWeight: number;
  secondaryPointWeight: number;
  primaryDistanceFalloff: number;
  secondaryDistanceFalloff: number;
  beta: number;
  primaryMinPoints: number;
  secondaryMinPoints: number;
  idealAnswerOverlay: boolean;
  progressBarColors: boolean;
};

// Quiz session state for quiz-taking
export type QuizSessionState = {
  responses: Record<string, number>;
  logs: Array<InteractionLog>;
  sessionMetadata: SessionMetadata;
  currentQuestionIndex: number;
  currentQuiz: Quiz | undefined;
};

// Default dev config
export const defaultDevConfig: AnalysisConfigOverrides = {
  primaryPointValue: 10.0,
  secondaryPointValue: 5.0,
  primaryPointWeight: 1.0,
  secondaryPointWeight: 1.0,
  primaryDistanceFalloff: 0.1,
  secondaryDistanceFalloff: 0.5,
  beta: 0.8,
  primaryMinPoints: 0.0,
  secondaryMinPoints: 0.0,
  idealAnswerOverlay: false,
  progressBarColors: false,
};

// ============================================================================
// Active Quiz Remote Atoms (using RPC)
// ============================================================================

type ActiveQuizCacheUpdate = Data.TaggedEnum<{
  Upsert: { readonly activeQuiz: ActiveQuiz };
  Delete: { readonly slug: string };
}>;

/**
 * Active quizzes list atom with SSR support.
 */
export const activeQuizzesAtom = (() => {
  const remoteAtom = ActiveQuizClient.runtime
    .atom(
      Effect.gen(function* () {
        const client = yield* ActiveQuizClient;
        return yield* client('active_quiz_list', undefined);
      }),
    )
    .pipe(
      serializable({
        key: '@quiz/active-quizzes',
        schema: Result.Schema({
          success: ActiveQuizzesSchema,
          error: RpcClientError.RpcClientError,
        }),
      }),
    );

  return Object.assign(
    Atom.writable(
      (get) => get(remoteAtom),
      (ctx, update: ActiveQuizCacheUpdate) => {
        const current = ctx.get(activeQuizzesAtom);
        if (!Result.isSuccess(current)) return;

        const nextValue = (() => {
          switch (update._tag) {
            case 'Upsert': {
              const existingIndex = Arr.findFirstIndex(
                current.value,
                (aq) => aq.slug === update.activeQuiz.slug,
              );
              return Option.match(existingIndex, {
                onNone: () => Arr.prepend(current.value, update.activeQuiz),
                onSome: (index) => Arr.replace(current.value, index, update.activeQuiz),
              });
            }
            case 'Delete': {
              return Arr.filter(current.value, (aq) => aq.slug !== update.slug);
            }
          }
        })();

        ctx.setSelf(Result.success(nextValue));
      },
      (refresh) => {
        refresh(remoteAtom);
      },
    ),
    { remote: remoteAtom },
  );
})();

/**
 * Get the first active quiz (for My Artist Type).
 */
export const activeQuizAtom = Atom.make((get) => {
  const result = get(activeQuizzesAtom);
  if (!Result.isSuccess(result)) {
    return result as any;
  }
  return Result.success(result.value[0] as ActiveQuiz | undefined);
});

/**
 * Upsert active quiz.
 */
export const upsertActiveQuizAtom = ActiveQuizClient.runtime.fn<{
  input: UpsertActiveQuizPayload;
}>()(
  Effect.fnUntraced(function* ({ input }, get) {
    const client = yield* ActiveQuizClient;
    const result = yield* client('active_quiz_upsert', { input });
    get.set(activeQuizzesAtom, { _tag: 'Upsert', activeQuiz: result });
    return result;
  }),
);

// ============================================================================
// Local Quiz Session Atoms (client-side only, no RPC)
// ============================================================================

// Initial session state
const createInitialSession = (): QuizSessionState => ({
  responses: {},
  logs: [],
  sessionMetadata: {
    startedAt: new Date() as unknown as SessionMetadata['startedAt'],
  },
  currentQuestionIndex: 0,
  currentQuiz: undefined,
});

/**
 * Main quiz session atom - local state for quiz-taking.
 * This is a simple writable atom that stores current session state.
 */
export const quizSessionAtom = Atom.writable(
  () => Result.success(createInitialSession()),
  (ctx, newSession: QuizSessionState) => {
    ctx.setSelf(Result.success(newSession));
  },
);

/**
 * Current question derived from session.
 */
export const currentQuestionAtom = Atom.make((get): Question | undefined => {
  const sessionResult = get(quizSessionAtom);
  if (!Result.isSuccess(sessionResult)) return undefined;

  const session = sessionResult.value;
  if (session.currentQuiz === undefined) return undefined;

  const questions = session.currentQuiz.questions as Array<Question> | undefined;
  return questions?.[session.currentQuestionIndex];
});

/**
 * Saved response for current question.
 */
export const savedResponseAtom = Atom.make((get): number | undefined => {
  const sessionResult = get(quizSessionAtom);
  const question = get(currentQuestionAtom);

  if (!Result.isSuccess(sessionResult) || question === undefined) return undefined;

  return sessionResult.value.responses[question.id as string];
});

/**
 * Navigation state derived from session.
 */
export const navigationStateAtom = Atom.make((get) => {
  const sessionResult = get(quizSessionAtom);

  if (!Result.isSuccess(sessionResult)) {
    return { canGoBack: false, canGoNext: false, isFirst: true, isLast: true };
  }

  const session = sessionResult.value;

  if (session.currentQuiz === undefined) {
    return { canGoBack: false, canGoNext: false, isFirst: true, isLast: true };
  }

  const quiz = session.currentQuiz;
  const questions = quiz.questions as Array<Question> | undefined;
  const totalQuestions = questions?.length ?? 0;
  const currentIndex = session.currentQuestionIndex;

  return {
    canGoBack: currentIndex > 0,
    canGoNext: currentIndex < totalQuestions - 1,
    isFirst: currentIndex === 0,
    isLast: currentIndex === totalQuestions - 1,
  };
});

// ============================================================================
// Session Action Atoms (local mutations)
// ============================================================================

/**
 * Initialize quiz session with a quiz.
 */
export const initializeQuizAtom = Atom.writable(
  () => undefined as Quiz | undefined,
  (ctx, quiz: Quiz) => {
    const now = new Date() as unknown as SessionMetadata['startedAt'];
    ctx.set(quizSessionAtom, {
      responses: {},
      logs: [],
      sessionMetadata: { startedAt: now },
      currentQuestionIndex: 0,
      currentQuiz: quiz,
    });
  },
);

/**
 * Select an answer for the current question.
 */
export const selectAnswerAtom = Atom.writable(
  () => undefined as number | undefined,
  (ctx, rating: number) => {
    const sessionResult = ctx.get(quizSessionAtom);
    const question = ctx.get(currentQuestionAtom);

    if (!Result.isSuccess(sessionResult) || question === undefined) return;

    const session = sessionResult.value;
    const now = new Date() as unknown as InteractionLog['timestamp'];

    ctx.set(quizSessionAtom, {
      ...session,
      responses: {
        ...session.responses,
        [question.id as string]: rating,
      },
      logs: [
        ...session.logs,
        {
          type: 'selection' as const,
          questionId: question.id as string,
          rating,
          timestamp: now,
        },
      ],
    });
  },
);

/**
 * Navigate to a specific question.
 */
export const navigateToQuestionAtom = Atom.writable(
  () => 0,
  (ctx, targetIndex: number) => {
    const sessionResult = ctx.get(quizSessionAtom);

    if (!Result.isSuccess(sessionResult)) return;

    const session = sessionResult.value;

    if (session.currentQuiz === undefined) return;

    const quiz = session.currentQuiz!;
    const questions = quiz.questions as Array<Question> | undefined;
    const totalQuestions = questions?.length ?? 0;

    const newIndex = Math.max(0, Math.min(targetIndex, totalQuestions - 1));

    const now = new Date() as unknown as InteractionLog['timestamp'];

    ctx.set(quizSessionAtom, {
      ...session,
      currentQuestionIndex: newIndex,
      logs: [
        ...session.logs,
        {
          type: 'navigation' as const,
          action: `navigate_to_${newIndex}`,
          timestamp: now,
        },
      ],
    });
  },
);

/**
 * Submit quiz (marks session as completed).
 */
export const submitQuizAtom = Atom.writable(
  () => false,
  (_ctx, _submit: boolean) => {
    const sessionResult = _ctx.get(quizSessionAtom);

    if (!Result.isSuccess(sessionResult)) return;

    const session = sessionResult.value;
    const now = new Date() as unknown as InteractionLog['timestamp'];

    _ctx.set(quizSessionAtom, {
      ...session,
      sessionMetadata: {
        ...session.sessionMetadata,
        completedAt: now,
      },
      logs: [
        ...session.logs,
        {
          type: 'submission' as const,
          action: 'quiz_submitted',
          timestamp: now,
        },
      ],
    });
  },
);

// ============================================================================
// Dev Panel Atoms (local state)
// ============================================================================

/**
 * Dev panel configuration atom.
 */
export const devConfigAtom = Atom.writable(
  () => defaultDevConfig,
  (ctx, config: Partial<AnalysisConfigOverrides>) => {
    const current = ctx.get(devConfigAtom);
    ctx.setSelf({ ...current, ...config });
  },
);

/**
 * Dev panel visibility atom.
 */
export const devPanelVisibleAtom = Atom.writable(
  () => false,
  (ctx, visible: boolean) => {
    ctx.setSelf(visible);
  },
);

// ============================================================================
// Last Response ID (localStorage-persisted)
// ============================================================================

// Create a runtime for localStorage atoms
const localStorageRuntime = Atom.runtime(BrowserKeyValueStore.layerLocalStorage);

/**
 * localStorage-persisted atom for the user's last quiz response ID.
 * Used to show "Your Results" instead of "Take the Quiz" in the navbar.
 */
export const lastResponseIdAtom = Atom.kvs({
  runtime: localStorageRuntime,
  key: 'my-artist-type:last-response-id',
  schema: Schema.NullOr(Schema.String),
  defaultValue: () => null,
});

// ============================================================================
// Quiz Submission Atoms (RPC-based)
// ============================================================================

/**
 * Result of a quiz submission containing the response ID.
 * The server triggers analysis automatically - poll for it separately.
 */
export type QuizSubmissionResult = {
  responseId: ResponseId;
};

/**
 * Submit quiz and save response to database.
 * The server automatically triggers analysis on save.
 * Returns the response ID - the caller should poll for analysis completion.
 */
export const submitQuizAndAnalyzeAtom = ResponsesClient.runtime.fn<{
  session: QuizSessionState;
}>()(
  Effect.fnUntraced(function* ({ session }, get) {
    if (session.currentQuiz === undefined) {
      return yield* Effect.fail(new Error('No quiz loaded'));
    }

    // Get the current user ID from auth session (if authenticated)
    const authSession = get(sessionAtom);
    const userId =
      Result.isSuccess(authSession) && authSession.value?.user?.id
        ? (authSession.value.user.id as UserId)
        : undefined;

    // Get the current timestamp
    const now = yield* DateTime.now;
    const nowDate = DateTime.toDate(now);

    // Convert startedAt to DateTime.Utc - it may be a Date or already a DateTimeUtc
    const startedAtRaw = session.sessionMetadata.startedAt;
    const startDate =
      typeof startedAtRaw === 'string'
        ? new Date(startedAtRaw)
        : startedAtRaw instanceof Date
          ? startedAtRaw
          : DateTime.toDate(startedAtRaw as DateTime.Utc);
    const startedAtUtc = DateTime.unsafeFromDate(startDate);
    const totalDurationMs = nowDate.getTime() - startDate.getTime();

    // Convert session responses to proper schema instances
    const answers = Object.entries(session.responses).map(
      ([questionId, value]) =>
        new UpsertQuestionResponsePayload({
          questionId,
          value,
          answeredAt: now,
        }),
    );

    // Build the session metadata with proper schema instance
    const sessionMetadata = new UpsertSessionMetadataPayload({
      startedAt: startedAtUtc,
      completedAt: now,
      totalDurationMs,
      userAgent:
        typeof navigator !== 'undefined' ? navigator.userAgent : session.sessionMetadata.userAgent,
      referrer:
        typeof document !== 'undefined' ? document.referrer : session.sessionMetadata.referrer,
    });

    // Convert interaction logs to proper schema instances
    const interactionLogs = [
      ...session.logs.map((log) => {
        const timestampRaw = log.timestamp;
        const timestampDate =
          typeof timestampRaw === 'string'
            ? new Date(timestampRaw)
            : timestampRaw instanceof Date
              ? timestampRaw
              : DateTime.toDate(timestampRaw as DateTime.Utc);
        return new UpsertInteractionLogPayload({
          type: log.type,
          questionId: log.questionId,
          rating: log.rating,
          action: log.action,
          timestamp: DateTime.unsafeFromDate(timestampDate),
        });
      }),
      new UpsertInteractionLogPayload({
        type: 'submission',
        action: 'quiz_submitted',
        timestamp: now,
      }),
    ];

    // Create the payload using the proper schema class
    const payload = new UpsertResponsePayload({
      quizId: session.currentQuiz.id,
      userId,
      answers,
      sessionMetadata,
      interactionLogs,
    });

    // Save response to database (server will auto-trigger analysis)
    const responsesClient = yield* ResponsesClient;
    const savedResponse = yield* responsesClient('response_upsert', {
      input: payload,
    });

    // Update local session state to mark as completed
    get.set(quizSessionAtom, {
      ...session,
      sessionMetadata: {
        ...session.sessionMetadata,
        completedAt: nowDate as unknown as SessionMetadata['completedAt'],
        totalDurationMs,
      },
      logs: interactionLogs as unknown as Array<InteractionLog>,
    });

    // Save response ID to localStorage for "Your Results" navbar link
    get.set(lastResponseIdAtom, savedResponse.id);

    return {
      responseId: savedResponse.id,
    } as QuizSubmissionResult;
  }),
);
