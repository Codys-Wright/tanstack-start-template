import type { Quiz } from '@/features/quiz/domain/schema.js';
import type { Question } from '@/features/quiz/questions/schema.js';
import type { InteractionLog, QuizSession } from '@/features/responses/domain/schema.js';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';

// Define the QuizTaker service using Effect.Service
export class QuizTakerService extends Effect.Service<QuizTakerService>()(
  '@features/quiz/QuizTakerService',
  {
    accessors: true,
    effect: Effect.sync(
      () =>
        ({
          initializeSession: (_quiz: Quiz) =>
            Effect.gen(function* () {
              const now = yield* DateTime.now;
              return {
                responses: {},
                logs: [],
                sessionMetadata: {
                  startedAt: now,
                },
              } satisfies QuizSession;
            }),

          selectAnswer: (session: QuizSession, questionId: string, rating: number) =>
            Effect.gen(function* () {
              const now = yield* DateTime.now;

              // Initialize first question navigation log if not already done
              const logs =
                session.logs.length === 0
                  ? [
                      {
                        type: 'navigation' as const,
                        questionId,
                        timestamp: now,
                      },
                    ]
                  : session.logs;

              // Check if this is a changed response or new selection
              const isChangedResponse = session.responses[questionId] !== undefined;
              const logMessage = isChangedResponse ? 'changed response to' : 'selected';

              const newLogEntry: InteractionLog = {
                type: 'selection' as const,
                questionId,
                rating,
                action: logMessage,
                timestamp: now,
              };

              return {
                ...session,
                responses: { ...session.responses, [questionId]: rating },
                logs: [...logs, newLogEntry],
              };
            }),

          navigateToQuestion: (
            session: QuizSession,
            currentIndex: number,
            targetIndex: number,
            questions: ReadonlyArray<Question>,
          ) =>
            Effect.gen(function* () {
              const targetQuestion = questions[targetIndex];
              if (targetQuestion === undefined) {
                return session; // No-op if target question doesn't exist
              }

              const now = yield* DateTime.now;

              // Initialize first question navigation log if not already done
              const logs =
                session.logs.length === 0
                  ? [
                      {
                        type: 'navigation' as const,
                        questionId: questions[currentIndex]?.id ?? '',
                        timestamp: now,
                      },
                    ]
                  : session.logs;

              const newLogEntry: InteractionLog = {
                type: 'navigation' as const,
                questionId: targetQuestion.id,
                timestamp: now,
              };

              return {
                ...session,
                logs: [...logs, newLogEntry],
              };
            }),

          submitQuiz: (session: QuizSession) =>
            Effect.gen(function* () {
              const now = yield* DateTime.now;

              const newLogEntry: InteractionLog = {
                type: 'submission' as const,
                timestamp: now,
              };

              return {
                ...session,
                logs: [...session.logs, newLogEntry],
                sessionMetadata: {
                  ...session.sessionMetadata,
                  completedAt: now,
                  totalDurationMs: DateTime.distance(session.sessionMetadata.startedAt, now),
                },
              };
            }),

          getCurrentQuestion: (questions: ReadonlyArray<Question>, index: number) =>
            Effect.succeed(questions[index]),

          canNavigateBack: (index: number) => index > 0,

          canNavigateNext: (index: number, totalQuestions: number) => index < totalQuestions - 1,

          findQuizBySlug: (quizzes: ReadonlyArray<Quiz>, slug: string) =>
            Effect.succeed(
              quizzes.find((quiz) => quiz.title.toLowerCase().replace(/\s+/g, '-') === slug),
            ),

          getQuestionAtIndex: (questions: ReadonlyArray<Question>, index: number) =>
            Effect.succeed(questions[index]),

          getSavedResponse: (session: QuizSession, questionId: string) =>
            Effect.succeed(session.responses[questionId]),

          getRandomCategoryColorClass: (category?: string, colorOn?: boolean) => {
            if (colorOn === false) return 'bg-muted';

            // Use the category (which is the question ID) as the seed for consistent colors
            const questionId = String(category ?? 'default');
            const hash = questionId.split('').reduce((acc, char) => {
              return acc + char.charCodeAt(0);
            }, 0);
            const colorIndex = hash % 10; // Use modulo to get consistent color per question

            // Array of beautiful gradient colors
            const colors = [
              'bg-gradient-to-b from-rose-500/20 to-rose-500/5',
              'bg-gradient-to-b from-pink-500/20 to-pink-500/5',
              'bg-gradient-to-b from-fuchsia-500/20 to-fuchsia-500/5',
              'bg-gradient-to-b from-purple-500/20 to-purple-500/5',
              'bg-gradient-to-b from-violet-500/20 to-violet-500/5',
              'bg-gradient-to-b from-indigo-500/20 to-indigo-500/5',
              'bg-gradient-to-b from-blue-500/20 to-blue-500/5',
              'bg-gradient-to-b from-cyan-500/20 to-cyan-500/5',
              'bg-gradient-to-b from-teal-500/20 to-teal-500/5',
              'bg-gradient-to-b from-emerald-500/20 to-emerald-500/5',
            ];

            return colors[colorIndex] ?? 'bg-gradient-to-b from-gray-500/20 to-gray-500/5';
          },
        }) as const,
    ),
  },
) {}
