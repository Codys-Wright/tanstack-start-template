import { Result, useAtomRefresh, useAtomSet, useAtomValue } from '@effect-atom/atom-react';
import { HydrationBoundary } from '@effect-atom/atom-react/ReactHydration';
import { isAdminAtom, sessionAtom, signInAnonymouslyAtom } from '@auth';
import { activeQuizzesAtom } from '../client/atoms.js';
import type { Question } from '@quiz/features/quiz/questions/schema.js';
import type { Quiz } from '@quiz/features/quiz/domain/schema.js';
import { Button, Card, cn, DropdownMenu } from '@shadcn';
import { SettingsIcon } from 'lucide-react';
import React from 'react';
import {
  ArtistTypeAmbientBackground,
  ArtistTypeGraphCard,
} from '../components/artist-type/index.js';
import { QuestionCard } from '../components/question-card.js';
import { QuizProgressBar } from '../components/quiz-progress-bar.js';
import { enginesAtom } from '@quiz/features/analysis-engine/client/atoms.js';

import { quizzesAtom } from '@quiz/features/quiz/client/atoms.js';
import {
  activeQuizAtom,
  currentQuestionAtom,
  initializeQuizAtom,
  navigateToQuestionAtom,
  navigationStateAtom,
  quizSessionAtom,
  savedResponseAtom,
  selectAnswerAtom,
  submitQuizAndAnalyzeAtom,
  type AnalysisConfigOverrides,
} from '../client/atoms.js';
import { DevPanel } from './dev-panel.js';
import { performLocalAnalysis } from './local-analysis.js';
import type { QuizTakerLoaderData } from './load-quiz-taker.js';
import { QuizTakerPageSkeleton } from './quiz-taker-skeleton.js';

// PageContainer component with padding and layout (no background)
type PageContainerProps = {
  children: React.ReactNode;
};

const PageContainer: React.FC<PageContainerProps> = ({ children }) => (
  <div className="relative w-full max-h-screen md:max-h-none h-[100dvh] md:h-auto px-4 pt-24 pb-16 md:pt-24 md:pb-8 flex flex-col overflow-hidden md:overflow-visible">
    {children}
  </div>
);

// Quiz Taker State Atoms are now imported from quiz-taker-atoms.js

const SuccessView: React.FC<{ quizzes: ReadonlyArray<Quiz> }> = ({ quizzes }) => {
  // Use the new atoms
  const quizSessionResult = useAtomValue(quizSessionAtom);
  const currentQuestion = useAtomValue(currentQuestionAtom);
  const savedResponse = useAtomValue(savedResponseAtom);
  const navigationState = useAtomValue(navigationStateAtom);
  const enginesResult = useAtomValue(enginesAtom);
  const activeQuizResult = useAtomValue(activeQuizAtom);

  // Auth session - to check if user is signed in
  const authSessionResult = useAtomValue(sessionAtom);
  const signInAnonymously = useAtomSet(signInAnonymouslyAtom, {
    mode: 'promise',
  });

  // Function setters
  const selectAnswer = useAtomSet(selectAnswerAtom);
  const navigateToQuestion = useAtomSet(navigateToQuestionAtom);
  const submitQuizAndAnalyze = useAtomSet(submitQuizAndAnalyzeAtom, {
    mode: 'promise',
  });
  const initializeQuiz = useAtomSet(initializeQuizAtom);

  // Submission state
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submissionStatus, setSubmissionStatus] = React.useState<string | null>(null);
  const [submissionError, setSubmissionError] = React.useState<string | null>(null);

  // Anonymous auth state
  const [isSigningInAnonymously, setIsSigningInAnonymously] = React.useState(false);
  const hasAttemptedAnonymousSignIn = React.useRef(false);

  // Dev panel state management using React useState
  const [devConfig, setDevConfig] = React.useState<Partial<AnalysisConfigOverrides>>({});
  const [devPanelVisible, setDevPanelVisible] = React.useState(false);

  // Auto-advance setting state
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = React.useState(true);

  // Admin state - admins see user view by default, can toggle admin view on
  const isAdmin = useAtomValue(isAdminAtom);
  const [showAdminView, setShowAdminView] = React.useState(false);

  // Compute effective admin state (admin AND has toggled admin view on)
  const showAdminFeatures = isAdmin && showAdminView;

  // Add keyboard shortcut to toggle dev panel (Ctrl/Cmd + D)
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
        event.preventDefault();
        setDevPanelVisible((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Extract values from Results
  const quizSession = Result.isSuccess(quizSessionResult)
    ? quizSessionResult.value
    : {
        responses: {},
        logs: [],
        sessionMetadata: { startedAt: new Date() },
        currentQuestionIndex: 0,
        currentQuiz: undefined,
      };
  const currentQuestionIndex = quizSession.currentQuestionIndex;
  const currentQuiz = quizSession.currentQuiz;

  // Get the default analysis engine (first active engine)
  const defaultEngine = Result.isSuccess(enginesResult)
    ? enginesResult.value.find((engine) => engine.isActive)
    : undefined;

  // Get real-time local analysis with dev config overrides
  const localAnalysisData = React.useMemo(() => {
    if (currentQuiz === undefined || defaultEngine === undefined) {
      return [];
    }
    try {
      // Call the analysis function directly instead of the hook
      return performLocalAnalysis(quizSession.responses, currentQuiz, defaultEngine, devConfig);
    } catch (error) {
      console.warn('Local analysis failed:', error);
      return [];
    }
  }, [quizSession.responses, currentQuiz, defaultEngine, devConfig]);

  // Get ideal answers for the current question
  const getIdealAnswersForQuestion = React.useCallback(
    (questionId: string) => {
      if (defaultEngine === undefined) return [];

      return defaultEngine.endings.flatMap((ending) =>
        ending.questionRules
          .filter((rule) => rule.questionId === questionId)
          .map((rule) => ({
            endingId: ending.endingId,
            endingName: ending.name,
            idealAnswers: [...rule.idealAnswers], // Convert readonly array to mutable array
            isPrimary: rule.isPrimary,
          })),
      );
    },
    [defaultEngine],
  );

  const currentQuestionIdealAnswers = React.useMemo(() => {
    if (currentQuestion === undefined) return [];
    return getIdealAnswersForQuestion(currentQuestion.id);
  }, [currentQuestion, getIdealAnswersForQuestion]);

  // Find the active quiz and get the corresponding quiz from the list
  const targetQuiz = React.useMemo(() => {
    if (!Result.isSuccess(activeQuizResult)) {
      return undefined;
    }
    const activeQuiz = activeQuizResult.value as any;
    if (activeQuiz === undefined || activeQuiz === null) {
      return undefined;
    }
    return quizzes.find((quiz) => quiz.id === activeQuiz.quizId);
  }, [activeQuizResult, quizzes]);

  // Initialize quiz if not already set
  React.useEffect(() => {
    if (targetQuiz !== undefined && currentQuiz === undefined) {
      initializeQuiz(targetQuiz);
    }
  }, [targetQuiz, currentQuiz, initializeQuiz]);

  // Auto sign-in anonymously if user is not authenticated
  // This ensures we can track quiz responses even for users who haven't signed up
  React.useEffect(() => {
    // Skip if we've already attempted sign-in or currently signing in
    if (hasAttemptedAnonymousSignIn.current || isSigningInAnonymously) {
      return;
    }

    // Skip if session is still loading
    if (Result.isWaiting(authSessionResult) || Result.isInitial(authSessionResult)) {
      return;
    }

    // Check if user is already signed in
    const isSignedIn = Result.isSuccess(authSessionResult) && authSessionResult.value?.user;
    if (isSignedIn) {
      console.log('[QuizTaker] User already signed in:', authSessionResult.value?.user?.id);
      return;
    }

    // User is not signed in - sign in anonymously
    hasAttemptedAnonymousSignIn.current = true;
    setIsSigningInAnonymously(true);
    console.log('[QuizTaker] No session found, signing in anonymously...');

    signInAnonymously()
      .then(() => {
        console.log('[QuizTaker] Anonymous sign-in successful');
        setIsSigningInAnonymously(false);
      })
      .catch((error) => {
        console.error('[QuizTaker] Anonymous sign-in failed:', error);
        setIsSigningInAnonymously(false);
        // Don't block quiz taking if anonymous sign-in fails
        // User can still take quiz, but responses won't be tracked
      });
  }, [authSessionResult, isSigningInAnonymously, signInAnonymously]);

  // Debug logging for SuccessView
  React.useEffect(() => {
    console.log('[SuccessView] enginesResult state:', {
      isSuccess: Result.isSuccess(enginesResult),
      isWaiting: Result.isWaiting(enginesResult),
      isInitial: Result.isInitial(enginesResult),
      isFailure: Result.isFailure(enginesResult),
      raw: enginesResult,
    });
    console.log('[SuccessView] activeQuizResult state:', {
      isSuccess: Result.isSuccess(activeQuizResult),
      isWaiting: Result.isWaiting(activeQuizResult),
      isInitial: Result.isInitial(activeQuizResult),
      isFailure: Result.isFailure(activeQuizResult),
      raw: activeQuizResult,
    });
  }, [enginesResult, activeQuizResult]);

  // Show skeleton if engines are not loaded yet
  if (!Result.isSuccess(enginesResult)) {
    console.log('[SuccessView] Showing skeleton - enginesResult not success');
    return <QuizTakerPageSkeleton />;
  }

  // Show error if no active engine is found
  if (defaultEngine === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Analysis Engine Not Found</h2>
          <p className="text-muted-foreground">No active analysis engine is available</p>
        </div>
      </div>
    );
  }

  // Handle loading states - show skeleton while waiting
  if (!Result.isSuccess(activeQuizResult)) {
    if (Result.isFailure(activeQuizResult)) {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Quiz Configuration Error</h2>
            <p className="text-muted-foreground">Could not find active quiz configuration</p>
          </div>
        </div>
      );
    }
    // Waiting or initial state - show skeleton
    return <QuizTakerPageSkeleton />;
  }

  if (targetQuiz === undefined) {
    // This can happen during initialization - show skeleton instead of error
    return <QuizTakerPageSkeleton />;
  }

  // Get questions from the real quiz data
  const questions = targetQuiz.questions as Array<Question>;

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Questions Found</h2>
          <p className="text-muted-foreground">This quiz doesn't have any questions yet.</p>
        </div>
      </div>
    );
  }

  if (currentQuestion === undefined) {
    // This can happen during initialization - show skeleton instead of error
    return <QuizTakerPageSkeleton />;
  }

  // Handler functions using the new atoms
  const handleRatingSelect = (rating: number) => {
    selectAnswer(rating);
  };

  const handleBack = () => {
    if (navigationState.canGoBack) {
      const newIndex = currentQuestionIndex - 1;
      navigateToQuestion(newIndex);
    }
  };

  const handleNext = () => {
    if (navigationState.canGoNext) {
      const newIndex = currentQuestionIndex + 1;
      navigateToQuestion(newIndex);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!Result.isSuccess(quizSessionResult)) return;

    setIsSubmitting(true);
    setSubmissionError(null);
    setSubmissionStatus('Saving and analyzing your responses...');

    try {
      const result = await submitQuizAndAnalyze({
        session: quizSessionResult.value,
      });

      if (!result?.responseId) {
        setSubmissionError('Failed to submit quiz. Please try again.');
        setIsSubmitting(false);
        setSubmissionStatus(null);
        return;
      }

      // Analysis is now run synchronously on the server, so we can navigate immediately
      window.location.href = `/my-response/${result.responseId}`;
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      setSubmissionError('Failed to submit quiz. Please try again.');
      setIsSubmitting(false);
      setSubmissionStatus(null);
    }
  };

  // Get color class using CSS variables for artist types based on question order
  const artistTypeColorClass = (
    _category?: string,
    colorOn?: boolean,
    questionIndex?: number,
  ): string => {
    if (colorOn !== true) return 'bg-white dark:bg-black';

    // Map question index to artist type (0-based index)
    const artistTypes = [
      'visionary',
      'consummate',
      'analyzer',
      'tech',
      'entertainer',
      'maverick',
      'dreamer',
      'feeler',
      'tortured',
      'solo',
    ];

    // Use question index to determine artist type, cycling through if there are more than 10 questions
    const artistTypeIndex = (questionIndex ?? 0) % artistTypes.length;
    const artistType = artistTypes[artistTypeIndex];

    // Use CSS variables for artist type colors with subtle background tinting
    switch (artistType) {
      case 'visionary':
        return 'bg-[var(--artist-visionary)]/5';
      case 'consummate':
        return 'bg-[var(--artist-consummate)]/5';
      case 'analyzer':
        return 'bg-[var(--artist-analyzer)]/5';
      case 'tech':
        return 'bg-[var(--artist-tech)]/5';
      case 'entertainer':
        return 'bg-[var(--artist-entertainer)]/5';
      case 'maverick':
        return 'bg-[var(--artist-maverick)]/5';
      case 'dreamer':
        return 'bg-[var(--artist-dreamer)]/5';
      case 'feeler':
        return 'bg-[var(--artist-feeler)]/5';
      case 'tortured':
        return 'bg-[var(--artist-tortured)]/5';
      case 'solo':
        return 'bg-[var(--artist-solo)]/5';
      default:
        return 'bg-white dark:bg-black';
    }
  };

  // Settings Menu Component
  const SettingsMenu: React.FC = () => (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <SettingsIcon className="h-4 w-4" />
          <span className="sr-only">Open settings</span>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end" className="w-56">
        <DropdownMenu.Label>Quiz Settings</DropdownMenu.Label>
        <DropdownMenu.Separator />
        <DropdownMenu.CheckboxItem
          checked={autoAdvanceEnabled}
          onCheckedChange={setAutoAdvanceEnabled}
        >
          Auto-advance to next question
        </DropdownMenu.CheckboxItem>
        {isAdmin && (
          <>
            <DropdownMenu.Separator />
            <DropdownMenu.CheckboxItem checked={showAdminView} onCheckedChange={setShowAdminView}>
              Show Admin View
            </DropdownMenu.CheckboxItem>
            {showAdminView && (
              <DropdownMenu.Item
                onClick={() => {
                  setDevPanelVisible(!devPanelVisible);
                }}
              >
                Toggle Dev Panel
              </DropdownMenu.Item>
            )}
          </>
        )}
      </DropdownMenu.Content>
    </DropdownMenu>
  );

  return (
    <PageContainer>
      {/* Ambient Background - decorative blurred radar visualization */}
      <ArtistTypeAmbientBackground data={localAnalysisData} />

      {/* Submission Error Banner */}
      {submissionError && (
        <div className="w-full max-w-7xl mx-auto mb-4">
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-center justify-between">
            <span>{submissionError}</span>
            <button
              onClick={() => setSubmissionError(null)}
              className="text-destructive hover:text-destructive/80"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div
        className={cn(
          'w-full max-w-7xl mx-auto flex-1 flex flex-col',
          showAdminFeatures ? 'md:grid md:grid-cols-3 md:gap-8' : 'justify-center',
        )}
      >
        {/* Left 2/3 (admin) or centered full-width (user) - Progress and Question Card */}
        <div
          className={cn(
            'flex flex-col gap-2 md:gap-8 flex-1',
            showAdminFeatures ? 'md:col-span-2' : 'w-full max-w-3xl mx-auto',
          )}
        >
          {/* Progress Bar Card */}
          <Card className="p-3 md:p-4">
            <div className="flex items-center justify-between gap-4">
              {/* Question number and progress bar */}
              <div className="flex items-center gap-2 md:gap-4 flex-1">
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap w-14 md:w-16 text-right">
                  {currentQuestionIndex + 1} of {questions.length}
                </span>
                <QuizProgressBar
                  questions={questions.map((q) => ({
                    id: q.id as unknown as number,
                    category: q.id,
                  }))}
                  currentIndex={currentQuestionIndex}
                  onQuestionClick={(index) => {
                    navigateToQuestion(index);
                  }}
                  categoryColorClass={artistTypeColorClass}
                  colorOn={showAdminFeatures && (devConfig.progressBarColors ?? true)}
                />
              </div>

              {/* Settings Menu */}
              <SettingsMenu />
            </div>
          </Card>

          {/* Question Card */}
          <div className="flex items-center justify-center flex-1 md:min-h-[70vh]">
            <QuestionCard
              title={currentQuestion.title}
              content={currentQuestion.description ?? ''}
              minLabel={
                currentQuestion.data.type === 'rating' ? currentQuestion.data.minLabel : 'Min'
              }
              maxLabel={
                currentQuestion.data.type === 'rating' ? currentQuestion.data.maxLabel : 'Max'
              }
              min={currentQuestion.data.type === 'rating' ? currentQuestion.data.minRating : 1}
              max={currentQuestion.data.type === 'rating' ? currentQuestion.data.maxRating : 10}
              selectedValues={savedResponse !== undefined ? [savedResponse] : []}
              idealAnswers={currentQuestionIdealAnswers}
              showIdealAnswers={showAdminFeatures && (devConfig.idealAnswerOverlay ?? true)}
              onRatingSelect={handleRatingSelect}
              onBack={handleBack}
              onNext={handleNext}
              onSubmit={handleSubmit}
              canGoBack={navigationState.canGoBack}
              canGoNext={navigationState.canGoNext}
              isLastQuestion={navigationState.isLast}
              autoAdvanceEnabled={autoAdvanceEnabled}
              isSubmitting={isSubmitting}
              submissionStatus={submissionStatus}
            />
          </div>
        </div>

        {/* Right 1/3 - Real-time Analysis Preview (Admin only) */}
        {showAdminFeatures && (
          <div className="col-span-1 flex items-center justify-center">
            <div className="sticky top-24 w-full">
              {localAnalysisData.length > 0 ? (
                <div className="relative w-full h-full min-w-96 rounded-[32px] border border-neutral-200/50 bg-neutral-100 pt-4 px-2 pb-2 backdrop-blur-lg md:pt-6 md:px-4 md:pb-4 dark:border-neutral-700 dark:bg-neutral-800/50 overflow-visible">
                  <ArtistTypeGraphCard
                    data={localAnalysisData}
                    showBarChart={true}
                    barChartHeight="h-48"
                    barChartMaxItems={10}
                    className="h-full w-full"
                    contentClassName="h-full w-full"
                    transparent
                    fill
                    {...(devConfig.beta !== undefined && {
                      beta: devConfig.beta,
                    })}
                  />
                </div>
              ) : (
                <div className="relative w-full h-full min-w-96 rounded-[32px] border border-neutral-200/50 bg-neutral-100 pt-4 px-2 pb-2 backdrop-blur-lg md:pt-6 md:px-4 md:pb-4 dark:border-neutral-700 dark:bg-neutral-800/50 overflow-visible">
                  <div className="flex items-center justify-center h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                    <div className="text-center text-muted-foreground">
                      <p className="text-sm">Analysis will appear here</p>
                      <p className="text-xs mt-1">Answer questions to see your artist type</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dev Panel (Admin only, when admin view is enabled) */}
      {isAdmin && showAdminView && (
        <DevPanel
          config={devConfig}
          {...(defaultEngine !== undefined && { engine: defaultEngine })}
          isVisible={devPanelVisible}
          onConfigChange={(newConfig) => {
            setDevConfig(newConfig);
          }}
          onToggleVisibility={() => {
            setDevPanelVisible(!devPanelVisible);
          }}
        />
      )}
    </PageContainer>
  );
};

const ErrorView: React.FC = () => {
  const refresh = useAtomRefresh(quizzesAtom.remote);

  return (
    <div className="flex flex-col gap-2">
      <p>Something went wrong...</p>
      <Button onClick={refresh}>Retry</Button>
    </div>
  );
};

// ============================================================================
// Types
// ============================================================================

export interface QuizTakerPageProps {
  /**
   * Loader data from TanStack Router containing dehydrated atoms.
   * If not provided, atoms will fetch client-side.
   */
  loaderData?: QuizTakerLoaderData;
}

// ============================================================================
// Page Content Component (used inside HydrationBoundary)
// ============================================================================

const QuizTakerPageContent: React.FC = () => {
  const quizzesResult = useAtomValue(quizzesAtom);
  const enginesResult = useAtomValue(enginesAtom);
  const activeQuizzesResult = useAtomValue(activeQuizzesAtom);

  // Debug logging
  React.useEffect(() => {
    const quizzesState = {
      isSuccess: Result.isSuccess(quizzesResult),
      isWaiting: Result.isWaiting(quizzesResult),
      isInitial: Result.isInitial(quizzesResult),
      isFailure: Result.isFailure(quizzesResult),
      _tag: (quizzesResult as any)?._tag,
      waiting: (quizzesResult as any)?.waiting,
      valueCount: Result.isSuccess(quizzesResult) ? quizzesResult.value.length : 'N/A',
      cause: Result.isFailure(quizzesResult) ? String((quizzesResult as any).cause) : undefined,
    };
    const enginesState = {
      isSuccess: Result.isSuccess(enginesResult),
      isWaiting: Result.isWaiting(enginesResult),
      isInitial: Result.isInitial(enginesResult),
      isFailure: Result.isFailure(enginesResult),
      _tag: (enginesResult as any)?._tag,
      waiting: (enginesResult as any)?.waiting,
      valueCount: Result.isSuccess(enginesResult) ? enginesResult.value.length : 'N/A',
      cause: Result.isFailure(enginesResult) ? String((enginesResult as any).cause) : undefined,
    };
    const activeQuizzesState = {
      isSuccess: Result.isSuccess(activeQuizzesResult),
      isWaiting: Result.isWaiting(activeQuizzesResult),
      isInitial: Result.isInitial(activeQuizzesResult),
      isFailure: Result.isFailure(activeQuizzesResult),
      _tag: (activeQuizzesResult as any)?._tag,
      waiting: (activeQuizzesResult as any)?.waiting,
      valueCount: Result.isSuccess(activeQuizzesResult) ? activeQuizzesResult.value.length : 'N/A',
      cause: Result.isFailure(activeQuizzesResult)
        ? String((activeQuizzesResult as any).cause)
        : undefined,
    };
    console.log('[QuizTakerPage] quizzes:', JSON.stringify(quizzesState));
    console.log('[QuizTakerPage] engines:', JSON.stringify(enginesState));
    console.log('[QuizTakerPage] activeQuizzes:', JSON.stringify(activeQuizzesState));

    // Log the full cause object for failures
    if (Result.isFailure(enginesResult)) {
      console.log('[QuizTakerPage] engines failure cause:', (enginesResult as any).cause);
    }
    if (Result.isFailure(activeQuizzesResult)) {
      console.log(
        '[QuizTakerPage] activeQuizzes failure cause:',
        (activeQuizzesResult as any).cause,
      );
    }
  }, [quizzesResult, enginesResult, activeQuizzesResult]);

  // Show skeleton for any non-success state (initial, waiting, or null)
  if (!Result.isSuccess(quizzesResult)) {
    if (Result.isFailure(quizzesResult)) {
      return <ErrorView />;
    }
    // Initial or waiting state - show skeleton
    return <QuizTakerPageSkeleton />;
  }

  return <SuccessView quizzes={quizzesResult.value} />;
};

// ============================================================================
// Page Component with Hydration
// ============================================================================

/**
 * QuizTakerPage - Route component with built-in SSR hydration support.
 *
 * Use this component in your TanStack Start route with loader data
 * for instant page loads with SSR, or without for client-side fetching.
 *
 * @example With SSR (recommended)
 * ```tsx
 * import { createFileRoute } from '@tanstack/react-router';
 * import { QuizTakerPage, loadQuizTaker } from '@quiz';
 *
 * export const Route = createFileRoute('/quiz')({
 *   loader: () => loadQuizTaker(),
 *   component: QuizPageWrapper,
 * });
 *
 * function QuizPageWrapper() {
 *   const loaderData = Route.useLoaderData();
 *   return <QuizTakerPage loaderData={loaderData} />;
 * }
 * ```
 */
export const QuizTakerPage: React.FC<QuizTakerPageProps> = ({ loaderData }) => {
  // If we have loader data, hydrate the atoms from SSR
  if (loaderData) {
    const hydrationState = [loaderData.quizzes, loaderData.engines, loaderData.activeQuizzes];
    return (
      <HydrationBoundary state={hydrationState}>
        <QuizTakerPageContent />
      </HydrationBoundary>
    );
  }

  // No loader data - atoms will fetch client-side
  // Note: This path may show loading states as atoms fetch
  return <QuizTakerPageContent />;
};
