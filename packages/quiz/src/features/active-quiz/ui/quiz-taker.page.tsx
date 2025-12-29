import { Result, useAtomRefresh, useAtomSet, useAtomValue } from '@effect-atom/atom-react';
import type { Question } from '@/features/quiz/questions/schema.js';
import type { Quiz } from '@/features/quiz/domain/schema.js';
import { Button, Card, DropdownMenu } from '@shadcn';
import { SettingsIcon } from 'lucide-react';
import React from 'react';
import { ArtistTypeGraphCard } from '../components/artist-type/artist-type-graph-card.js';
import { QuestionCard } from '../components/question-card.js';
import { QuizProgressBar } from '../components/quiz-progress-bar.js';
import { enginesAtom } from '@/features/analysis-engine/client/atoms.js';
import { quizzesAtom } from '@/features/quiz/client/atoms.js';
import {
  activeQuizAtom,
  currentQuestionAtom,
  initializeQuizAtom,
  navigateToQuestionAtom,
  navigationStateAtom,
  quizSessionAtom,
  savedResponseAtom,
  selectAnswerAtom,
  submitQuizAtom,
  type AnalysisConfigOverrides,
} from '../client/atoms.js';
import { DevPanel } from './dev-panel.js';
import { performLocalAnalysis } from './local-analysis.js';

// PageContainer component with padding and layout (no background)
type PageContainerProps = {
  children: React.ReactNode;
};

const PageContainer: React.FC<PageContainerProps> = ({ children }) => (
  <div className="relative w-full px-4 py-8">{children}</div>
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

  // Function setters
  const selectAnswer = useAtomSet(selectAnswerAtom);
  const navigateToQuestion = useAtomSet(navigateToQuestionAtom);
  const submitQuiz = useAtomSet(submitQuizAtom);
  const initializeQuiz = useAtomSet(initializeQuizAtom);

  // Dev panel state management using React useState
  const [devConfig, setDevConfig] = React.useState<Partial<AnalysisConfigOverrides>>({});
  const [devPanelVisible, setDevPanelVisible] = React.useState(false);

  // Auto-advance setting state
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = React.useState(true);

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

  // Show loading state if engines are not loaded yet
  if (!Result.isSuccess(enginesResult)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading Analysis Engine...</h2>
          <p className="text-muted-foreground">Setting up analysis capabilities</p>
        </div>
      </div>
    );
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

  // Handle loading states
  if (!Result.isSuccess(activeQuizResult)) {
    if (Result.isWaiting(activeQuizResult)) {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Loading Quiz...</h2>
            <p className="text-muted-foreground">Finding the active My Artist Type quiz</p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Quiz Configuration Error</h2>
          <p className="text-muted-foreground">Could not find active quiz configuration</p>
        </div>
      </div>
    );
  }

  if (targetQuiz === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Quiz Not Found</h2>
          <p className="text-muted-foreground">Could not find the active My Artist Type quiz</p>
        </div>
      </div>
    );
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
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Question Not Found</h2>
          <p className="text-muted-foreground">
            Could not find question at index {currentQuestionIndex}
          </p>
        </div>
      </div>
    );
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

  const handleSubmit = () => {
    submitQuiz(true);

    // Handle quiz submission - this will eventually send data to server
    // Submission data is available in quizSession atom for backend integration
    alert(
      `Quiz submitted! You answered ${
        Object.keys(quizSession.responses).length
      } out of ${questions.length} questions.`,
    );
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
        <DropdownMenu.Separator />
        <DropdownMenu.Item
          onClick={() => {
            setDevPanelVisible(!devPanelVisible);
          }}
        >
          Toggle Dev Panel
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );

  return (
    <PageContainer>
      <div className="w-full max-w-7xl mx-auto grid grid-cols-3 gap-8">
        {/* Left 2/3 - Progress and Question Card */}
        <div className="col-span-2 flex flex-col gap-8">
          {/* Progress Bar Card */}
          <Card className="p-4">
            <div className="flex items-center justify-between gap-4">
              {/* Question number and progress bar */}
              <div className="flex items-center gap-4 flex-1">
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap w-16 text-right">
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
                  colorOn={devConfig.progressBarColors ?? true}
                />
              </div>

              {/* Settings Menu */}
              <SettingsMenu />
            </div>
          </Card>

          {/* Question Card */}
          <div className="flex items-center justify-center min-h-[70vh]">
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
              showIdealAnswers={devConfig.idealAnswerOverlay ?? true}
              onRatingSelect={handleRatingSelect}
              onBack={handleBack}
              onNext={handleNext}
              onSubmit={handleSubmit}
              canGoBack={navigationState.canGoBack}
              canGoNext={navigationState.canGoNext}
              isLastQuestion={navigationState.isLast}
              autoAdvanceEnabled={autoAdvanceEnabled}
            />
          </div>
        </div>

        {/* Right 1/3 - Real-time Analysis Preview */}
        <div className="col-span-1 flex items-center justify-center">
          <div className="sticky top-4 w-full">
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
      </div>

      {/* Dev Panel */}
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

export const QuizTakerPage: React.FC = () => {
  const quizzesResult = useAtomValue(quizzesAtom);

  return (
    <>
      {Result.builder(quizzesResult)
        .onFailure(() => <ErrorView />)
        .onSuccess((quizzes) => <SuccessView quizzes={quizzes} />)
        .onWaiting((result) => Result.isInitial(result) && result.waiting && <p>Loading...</p>)
        .orNull()}
    </>
  );
};
