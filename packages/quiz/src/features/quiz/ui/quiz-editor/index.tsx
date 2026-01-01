'use client';

import { Version } from '@core/domain';
import { Result, useAtomSet, useAtomValue } from '@effect-atom/atom-react';
import type { AnalysisEngine } from '@/features/analysis-engine/domain/schema.js';
import type { Question } from '@/features/quiz/questions/schema.js';
import type { Quiz } from '@/features/quiz/domain/schema.js';
import * as Cause from 'effect/Cause';
import * as Exit from 'effect/Exit';
import { AlertDialog, Button, Input, Label, ResizablePanelGroup } from '@shadcn';
import { ArrowLeftIcon, ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import React from 'react';

import {
  autoSaveTempEngineAtom,
  clearTempEnginesAtom,
  EngineAction,
  enginesAtom,
} from '@/features/analysis-engine/client/atoms.js';
import {
  clearTempQuizzesAtom,
  createNewQuizVersionAtom,
  createTempQuizAtom,
  deleteQuizAtom,
  quizzesAtom,
  saveTempQuizAtom,
} from '@/features/quiz/client/atoms.js';

import { QuestionCard } from '../question-card.js';
import { QuizProgressBar } from '../quiz-progress-bar.js';

import {
  analysisConfigAtom,
  expectedNewVersionAtom,
  expectedTempQuizAtom,
  isCreatingTempAtom,
  pendingRatingAtom,
  selectedArtistTypeAtom,
  selectedEngineIdAtom,
  selectedQuestionIndexAtom,
  selectedQuizIdAtom,
  showIdealAnswersAtom,
  sidebarVisibleAtom,
} from './atoms.js';
import type { AnalysisConfig } from './components/engine-tweaks.js';

import {
  getIdealAnswersForCurrentSelection,
  getSelectedValuesForCurrentSelection,
} from './utils.js';

import { LeftSidebar, RightSidebar, TopBar } from './components/index.js';

// Main Quiz Editor Layout
export const QuizEditorLayout: React.FC = () => {
  const quizzesResult = useAtomValue(quizzesAtom);
  const enginesResult = useAtomValue(enginesAtom);

  // Atom-based state for selections
  const selectedQuizId = useAtomValue(selectedQuizIdAtom);
  const selectedEngineId = useAtomValue(selectedEngineIdAtom);
  const selectedArtistType = useAtomValue(selectedArtistTypeAtom);
  const selectedQuestionIndex = useAtomValue(selectedQuestionIndexAtom);
  const showIdealAnswers = useAtomValue(showIdealAnswersAtom);
  const pendingRating = useAtomValue(pendingRatingAtom);
  const expectedNewVersion = useAtomValue(expectedNewVersionAtom);
  const expectedTempQuiz = useAtomValue(expectedTempQuizAtom);

  // Sidebar visibility state
  const sidebarVisible = useAtomValue(sidebarVisibleAtom);
  const setSidebarVisible = useAtomSet(sidebarVisibleAtom);

  // Dialog states for confirmations
  const [isClearDraftsDialogOpen, setIsClearDraftsDialogOpen] = React.useState(false);
  const [isDeleteQuizDialogOpen, setIsDeleteQuizDialogOpen] = React.useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState('');

  // Derived values that automatically update based on selections
  const currentQuestionIdealAnswers = getIdealAnswersForCurrentSelection(
    quizzesResult,
    enginesResult,
    selectedQuizId,
    selectedEngineId,
    selectedQuestionIndex,
  );

  const currentSelectedValues = getSelectedValuesForCurrentSelection(
    quizzesResult,
    enginesResult,
    selectedQuizId,
    selectedEngineId,
    selectedArtistType,
    selectedQuestionIndex,
  );

  // Setters for atom-based state
  const setSelectedQuizId = useAtomSet(selectedQuizIdAtom);
  const setSelectedEngineId = useAtomSet(selectedEngineIdAtom);
  const setSelectedArtistType = useAtomSet(selectedArtistTypeAtom);
  const setSelectedQuestionIndex = useAtomSet(selectedQuestionIndexAtom);
  const setPendingRating = useAtomSet(pendingRatingAtom);
  const setExpectedNewVersion = useAtomSet(expectedNewVersionAtom);
  const setExpectedTempQuiz = useAtomSet(expectedTempQuizAtom);
  const isCreatingTemp = useAtomValue(isCreatingTempAtom);
  const setIsCreatingTemp = useAtomSet(isCreatingTempAtom);

  // Analysis config from atom (synced with engine)
  const analysisConfig = useAtomValue(analysisConfigAtom);
  const setAnalysisConfig = useAtomSet(analysisConfigAtom);

  // Quiz atoms for creating temp versions
  const createTempQuiz = useAtomSet(createTempQuizAtom, {
    mode: 'promiseExit',
  });

  // Engine atoms for modifying ideal answers
  const autoSaveTempEngine = useAtomSet(autoSaveTempEngineAtom);

  // Clear atoms for removing temp versions
  const clearTempQuizzes = useAtomSet(clearTempQuizzesAtom);
  const clearTempEngines = useAtomSet(clearTempEnginesAtom);

  // Delete atom for dangerous operations
  const deleteQuiz = useAtomSet(deleteQuizAtom);

  // Version creation atom
  const createNewVersion = useAtomSet(createNewQuizVersionAtom, {
    mode: 'promise',
  });

  // Save temp quiz atom
  const saveTempQuiz = useAtomSet(saveTempQuizAtom, { mode: 'promise' });

  // Registry for optimistic updates
  const setEnginesAtom = useAtomSet(enginesAtom);

  // Handle creating new version with auto-selection
  const handleCreateNewVersion = async (
    newVersion: string,
    incrementType: 'major' | 'minor' | 'patch',
    comment?: string,
  ) => {
    const currentQuiz = quizzes.find((q) => q.id === selectedQuizId);
    if (currentQuiz === undefined) {
      console.error('[QuizEditor] No quiz found for selectedQuizId:', selectedQuizId);
      return;
    }

    // Create Version object with semver and comment
    const versionObject = new Version({
      semver: newVersion,
      comment,
    });

    console.log('[QuizEditor] Creating new version:', {
      currentQuizId: currentQuiz.id,
      isTemp: currentQuiz.isTemp,
      newVersion: versionObject.semver,
      incrementType,
    });

    try {
      if (currentQuiz.isTemp) {
        // Save temp quiz as official version with the new version info
        console.log('[QuizEditor] Saving temp quiz as new version...');
        const result = await saveTempQuiz({
          quiz: currentQuiz,
          action: 'saveAsNew',
          newVersion: versionObject,
        });
        console.log('[QuizEditor] Temp quiz saved successfully:', result);

        // Set expected version to auto-select the new official version
        setExpectedNewVersion(versionObject.semver);
      } else {
        // Create new version from existing quiz
        const expectedVersion = versionObject.semver;

        console.log('[QuizEditor] Creating new version from existing quiz...');
        const result = await createNewVersion({
          quiz: currentQuiz,
          newVersion: versionObject,
          incrementType,
        });
        console.log('[QuizEditor] New version created successfully:', result);

        // Set expected version to auto-select when it appears
        setExpectedNewVersion(expectedVersion);
      }
    } catch (error) {
      console.error('[QuizEditor] Failed to create new version:', error);
    }
  };

  // Initialize selections on first load
  React.useEffect(() => {
    if (Result.isSuccess(quizzesResult) && Result.isSuccess(enginesResult)) {
      const quizzes = quizzesResult.value;
      const engines = enginesResult.value;

      // Always try to set quiz if not set or if current selection is invalid
      if (selectedQuizId === '' || !quizzes.some((q) => q.id === selectedQuizId)) {
        const artistTypeQuizzes = quizzes
          .filter(
            (q) => q.title === 'My Artist Type Quiz' || q.title === 'My Artist Type Quiz (Editing)',
          )
          .sort((a, b) => b.version.semver.localeCompare(a.version.semver));

        const defaultQuiz =
          artistTypeQuizzes[0] ??
          quizzes.find((q) => q.title.includes('My Artist Type')) ??
          quizzes[0];
        if (defaultQuiz !== undefined) {
          setSelectedQuizId(defaultQuiz.id);
        }
      }

      // Always try to set engine if not set or if current selection is invalid
      if (selectedEngineId === '' || !engines.some((e) => e.id === selectedEngineId)) {
        const activeEngine = engines.find((e) => e.isActive) ?? engines[0];
        if (activeEngine !== undefined) {
          setSelectedEngineId(activeEngine.id);
        }
      }
    }
  }, [quizzesResult, enginesResult, selectedQuizId, selectedEngineId]);

  // Fallback initialization - ensure we always have valid selections
  React.useEffect(() => {
    if (Result.isSuccess(quizzesResult) && Result.isSuccess(enginesResult)) {
      const quizzes = quizzesResult.value;
      const engines = enginesResult.value;

      if (
        quizzes.length > 0 &&
        (selectedQuizId === '' || !quizzes.some((q) => q.id === selectedQuizId))
      ) {
        const artistTypeQuizzes = quizzes
          .filter(
            (q) => q.title === 'My Artist Type Quiz' || q.title === 'My Artist Type Quiz (Editing)',
          )
          .sort((a, b) => b.version.semver.localeCompare(a.version.semver));

        const defaultQuiz = artistTypeQuizzes[0] ?? quizzes[0];
        if (defaultQuiz !== undefined) {
          setSelectedQuizId(defaultQuiz.id);
        }
      }

      if (
        engines.length > 0 &&
        (selectedEngineId === '' || !engines.some((e) => e.id === selectedEngineId))
      ) {
        const activeEngine = engines.find((e) => e.isActive) ?? engines[0];
        if (activeEngine !== undefined) {
          setSelectedEngineId(activeEngine.id);
        }
      }
    }
  }, [quizzesResult, enginesResult]);

  // Auto-sync engine selection when quiz selection changes
  React.useEffect(() => {
    if (Result.isSuccess(quizzesResult) && Result.isSuccess(enginesResult)) {
      const quizzes = quizzesResult.value;
      const engines = enginesResult.value;
      const selectedQuiz = quizzes.find((q) => q.id === selectedQuizId);

      if (selectedQuiz !== undefined) {
        const matchingEngine = findMatchingEngine(selectedQuiz, engines);

        if (matchingEngine !== undefined && matchingEngine.id !== selectedEngineId) {
          setSelectedEngineId(matchingEngine.id);
        }
      }
    }
  }, [selectedQuizId, quizzesResult, enginesResult, selectedEngineId]);

  // Apply pending rating changes when engine switches to temp version
  React.useEffect(() => {
    if (pendingRating !== null && Result.isSuccess(enginesResult)) {
      const engines = enginesResult.value;
      const currentEngine = engines.find((e) => e.id === selectedEngineId);
      if (currentEngine !== undefined && currentEngine.isTemp === true) {
        updateEngineIdealAnswerOptimistic(currentEngine, pendingRating);
        setPendingRating(null);
      }
    }
  }, [selectedEngineId, pendingRating, enginesResult]);

  // Sync analysisConfig with the selected engine's scoringConfig
  React.useEffect(() => {
    if (Result.isSuccess(enginesResult)) {
      const currentEngine = enginesResult.value.find((e) => e.id === selectedEngineId);
      if (currentEngine !== undefined) {
        const scoringConfig = currentEngine.scoringConfig;
        setAnalysisConfig({
          primaryPointValue: scoringConfig.primaryPointValue,
          secondaryPointValue: scoringConfig.secondaryPointValue,
          primaryPointWeight: scoringConfig.primaryPointWeight,
          secondaryPointWeight: scoringConfig.secondaryPointWeight,
          primaryDistanceFalloff: scoringConfig.primaryDistanceFalloff,
          secondaryDistanceFalloff: scoringConfig.secondaryDistanceFalloff,
          beta: scoringConfig.beta,
          disableSecondaryPoints: false,
          primaryMinPoints: 0.0,
          secondaryMinPoints: 0.0,
          minPercentageThreshold: 0.0,
          enableQuestionBreakdown: true,
          maxEndingResults: 10,
        });
      }
    }
  }, [selectedEngineId, enginesResult]);

  // Auto-switch to new version when it's created
  React.useEffect(() => {
    if (Result.isSuccess(quizzesResult) && expectedNewVersion !== null) {
      const quizzes = quizzesResult.value;
      const currentQuiz = quizzes.find((q) => q.id === selectedQuizId);

      if (currentQuiz !== undefined) {
        const baseTitle = currentQuiz.title.replace(' (Editing)', '');

        const newVersionQuiz = quizzes.find(
          (q) =>
            (q.title === baseTitle || q.title === currentQuiz.title) &&
            q.version.semver === expectedNewVersion &&
            q.isTemp === false &&
            q.isPublished === false &&
            q.id !== selectedQuizId,
        );

        if (newVersionQuiz !== undefined) {
          setSelectedQuizId(newVersionQuiz.id);
          setExpectedNewVersion(null);
        }
      }
    }
  }, [quizzesResult, expectedNewVersion, selectedQuizId]);

  // Auto-switch to new temp quiz when it's created
  React.useEffect(() => {
    if (Result.isSuccess(quizzesResult) && expectedTempQuiz !== null) {
      const quizzes = quizzesResult.value;
      const originalQuiz = quizzes.find((q) => q.id === expectedTempQuiz.originalQuizId);

      if (originalQuiz !== undefined) {
        const allTempQuizzes = quizzes.filter(
          (q) =>
            q.isTemp === true &&
            q.title === `${originalQuiz.title} (Editing)` &&
            q.version.semver === originalQuiz.version.semver,
        );

        const newTempQuizzes = allTempQuizzes.filter(
          (q) => !expectedTempQuiz.existingTempQuizIds.includes(q.id),
        );

        if (newTempQuizzes.length > 0) {
          const newestTempQuiz = newTempQuizzes.sort((a, b) => b.id.localeCompare(a.id))[0];
          if (newestTempQuiz !== undefined) {
            setSelectedQuizId(newestTempQuiz.id);
            setExpectedTempQuiz(null);
          }
        }
      }
    }
  }, [quizzesResult, expectedTempQuiz, selectedQuizId]);

  // Extract data from results
  const quizzesLoading = !Result.isSuccess(quizzesResult);
  const enginesLoading = !Result.isSuccess(enginesResult);
  const isLoading = quizzesLoading || enginesLoading;
  const quizzes = Result.isSuccess(quizzesResult) ? quizzesResult.value : [];
  const engines = Result.isSuccess(enginesResult) ? enginesResult.value : [];

  // Find the selected quiz
  const quiz =
    quizzes.find((q) => q.id === selectedQuizId) ??
    quizzes.find((q) => q.title.includes('My Artist Type'));

  const questions = (quiz?.questions as Array<Question>) ?? [];
  const selectedQuestion = questions[selectedQuestionIndex];

  const handleSelectQuestion = (index: number) => {
    setSelectedQuestionIndex(index);
  };

  const handleRatingSelect = async (rating: number) => {
    if (isCreatingTemp) {
      return;
    }

    const currentQuiz = quizzes.find((q) => q.id === selectedQuizId);
    const currentEngine = engines.find((e) => e.id === selectedEngineId);

    if (
      currentQuiz === undefined ||
      currentEngine === undefined ||
      selectedQuestion === undefined
    ) {
      return;
    }

    const isWorkingWithTempQuiz = currentQuiz.isTemp === true;
    const hasMatchingTempEngine = currentEngine.isTemp === true;

    if (isWorkingWithTempQuiz && hasMatchingTempEngine) {
      updateEngineIdealAnswerOptimistic(currentEngine, rating);
    } else if (isWorkingWithTempQuiz && !hasMatchingTempEngine) {
      updateEngineIdealAnswerOptimistic(currentEngine, rating);
    } else {
      try {
        setIsCreatingTemp(true);
        setPendingRating(rating);

        const existingTempQuizIds = quizzes
          .filter(
            (q) =>
              q.isTemp === true &&
              q.title === `${currentQuiz.title} (Editing)` &&
              q.version.semver === currentQuiz.version.semver,
          )
          .map((q) => q.id);

        setExpectedTempQuiz({
          originalQuizId: currentQuiz.id,
          existingTempQuizIds,
        });

        const result = createTempQuiz({ quiz: currentQuiz });

        if (result && typeof result.then === 'function') {
          result
            .then((exit: Exit.Exit<unknown, unknown>) => {
              if (Exit.isFailure(exit)) {
                // eslint-disable-next-line no-console
                console.error('Failed to create temp quiz:', Cause.pretty(exit.cause));
              }
              setIsCreatingTemp(false);
            })
            .catch((err: unknown) => {
              // eslint-disable-next-line no-console
              console.error('Failed to create temp quiz:', err);
              setIsCreatingTemp(false);
            });
        } else {
          setIsCreatingTemp(false);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error creating temp quiz:', error);
        setIsCreatingTemp(false);
        setPendingRating(null);
      }
    }
  };

  // Helper function to create updated engine with new ideal answer
  const createUpdatedEngine = (workingEngine: AnalysisEngine, rating: number) => {
    if (selectedQuestion === undefined) return workingEngine;

    const artistTypeEndingId = `the-${selectedArtistType.toLowerCase()}-artist`;

    const updatedEndings = workingEngine.endings.map((ending) => {
      if (ending.endingId === artistTypeEndingId) {
        const existingRuleIndex = ending.questionRules.findIndex(
          (rule) => rule.questionId === selectedQuestion.id,
        );

        if (existingRuleIndex >= 0) {
          const updatedRules = [...ending.questionRules];
          const existingRule = updatedRules[existingRuleIndex];
          if (existingRule !== undefined) {
            const currentIdealAnswers = existingRule.idealAnswers;
            let newIdealAnswers: Array<number>;

            if (existingRule.isPrimary) {
              if (currentIdealAnswers.includes(rating)) {
                newIdealAnswers = currentIdealAnswers.filter((r) => r !== rating);
              } else {
                newIdealAnswers = [...currentIdealAnswers, rating].sort((a, b) => a - b);
              }
            } else {
              newIdealAnswers = [rating];
            }

            updatedRules[existingRuleIndex] = {
              ...existingRule,
              idealAnswers: newIdealAnswers,
            };
          }
          return {
            ...ending,
            questionRules: updatedRules,
          };
        }

        return {
          ...ending,
          questionRules: [
            ...ending.questionRules,
            {
              questionId: selectedQuestion.id,
              idealAnswers: [rating],
              isPrimary: false,
            },
          ],
        };
      }
      return ending;
    });

    return {
      ...workingEngine,
      endings: updatedEndings,
    };
  };

  // Optimistic update for existing temp engine
  const updateEngineIdealAnswerOptimistic = (workingEngine: AnalysisEngine, rating: number) => {
    const updatedEngine = createUpdatedEngine(workingEngine, rating);
    setEnginesAtom(EngineAction.Upsert({ engine: updatedEngine }));
    autoSaveTempEngine({ engine: updatedEngine });
  };

  // Pending config change to apply after temp creation
  const [pendingConfigChange, setPendingConfigChange] = React.useState<AnalysisConfig | null>(null);

  // Handle analysis config changes - updates the temp engine's scoringConfig
  const handleAnalysisConfigChange = async (newConfig: AnalysisConfig) => {
    // Update the local atom for UI responsiveness
    setAnalysisConfig(newConfig);

    // Find the current quiz and engine
    const currentQuiz = quizzes.find((q) => q.id === selectedQuizId);
    const currentEngine = engines.find((e) => e.id === selectedEngineId);
    if (currentQuiz === undefined || currentEngine === undefined) return;

    // If working with temp engine, update directly
    if (currentEngine.isTemp) {
      const updatedEngine: AnalysisEngine = {
        ...currentEngine,
        scoringConfig: {
          primaryPointValue: newConfig.primaryPointValue,
          secondaryPointValue: newConfig.secondaryPointValue,
          primaryPointWeight: newConfig.primaryPointWeight,
          secondaryPointWeight: newConfig.secondaryPointWeight,
          primaryDistanceFalloff: newConfig.primaryDistanceFalloff,
          secondaryDistanceFalloff: newConfig.secondaryDistanceFalloff,
          beta: newConfig.beta,
          distanceGamma: 1.0,
          scoreMultiplier: 1.0,
        },
      };

      setEnginesAtom(EngineAction.Upsert({ engine: updatedEngine }));
      autoSaveTempEngine({ engine: updatedEngine });
      return;
    }

    // Not a temp engine - need to create a temp quiz/engine first
    if (isCreatingTemp) return;

    try {
      setIsCreatingTemp(true);
      setPendingConfigChange(newConfig);

      const existingTempQuizIds = quizzes
        .filter(
          (q) =>
            q.isTemp === true &&
            q.title === `${currentQuiz.title} (Editing)` &&
            q.version.semver === currentQuiz.version.semver,
        )
        .map((q) => q.id);

      setExpectedTempQuiz({
        originalQuizId: currentQuiz.id,
        existingTempQuizIds,
      });

      const result = await createTempQuiz({ quiz: currentQuiz });

      if (Exit.isSuccess(result)) {
        // Success - temp quiz/engine created
        // The pending config will be applied in a useEffect when the temp engine is ready
      } else {
        console.error(
          '[QuizEditor] Failed to create temp quiz for config change:',
          Cause.pretty(result.cause),
        );
        setPendingConfigChange(null);
      }
    } finally {
      setIsCreatingTemp(false);
    }
  };

  // Apply pending config change when temp engine becomes available
  React.useEffect(() => {
    if (pendingConfigChange !== null && Result.isSuccess(enginesResult)) {
      const currentEngine = enginesResult.value.find((e) => e.id === selectedEngineId);
      if (currentEngine !== undefined && currentEngine.isTemp === true) {
        const updatedEngine: AnalysisEngine = {
          ...currentEngine,
          scoringConfig: {
            primaryPointValue: pendingConfigChange.primaryPointValue,
            secondaryPointValue: pendingConfigChange.secondaryPointValue,
            primaryPointWeight: pendingConfigChange.primaryPointWeight,
            secondaryPointWeight: pendingConfigChange.secondaryPointWeight,
            primaryDistanceFalloff: pendingConfigChange.primaryDistanceFalloff,
            secondaryDistanceFalloff: pendingConfigChange.secondaryDistanceFalloff,
            beta: pendingConfigChange.beta,
            distanceGamma: 1.0,
            scoreMultiplier: 1.0,
          },
        };

        setEnginesAtom(EngineAction.Upsert({ engine: updatedEngine }));
        autoSaveTempEngine({ engine: updatedEngine });
        setPendingConfigChange(null);
      }
    }
  }, [selectedEngineId, pendingConfigChange, enginesResult]);

  // Find the matching analysis engine for a given quiz
  const findMatchingEngine = (
    targetQuiz: Quiz,
    availableEngines: ReadonlyArray<AnalysisEngine>,
  ): AnalysisEngine | undefined => {
    return availableEngines.find((engine) => engine.quizId === targetQuiz.id);
  };

  const handleAddQuestion = () => {
    // TODO: Implement add question functionality
  };

  const handleClearDraft = () => {
    clearTempQuizzes();
    clearTempEngines();

    if (Result.isSuccess(quizzesResult) && Result.isSuccess(enginesResult)) {
      const allQuizzes = quizzesResult.value;
      const allEngines = enginesResult.value;

      const nonTempQuiz = allQuizzes.find((q) => q.isTemp === false);
      const nonTempEngine = allEngines.find((e) => e.isTemp === false);

      if (nonTempQuiz !== undefined) {
        setSelectedQuizId(nonTempQuiz.id);
      }
      if (nonTempEngine !== undefined) {
        setSelectedEngineId(nonTempEngine.id);
      }
    }
  };

  const handleDeleteQuiz = () => {
    if (!Result.isSuccess(quizzesResult)) return;

    const currentQuiz = quizzes.find((q) => q.id === selectedQuizId);
    if (currentQuiz === undefined) return;

    deleteQuiz(currentQuiz.id);

    setTimeout(() => {
      const remainingQuizzes = quizzes.filter((q) => q.id !== currentQuiz.id);
      if (remainingQuizzes.length > 0) {
        const firstRemaining = remainingQuizzes[0];
        if (firstRemaining !== undefined) {
          setSelectedQuizId(firstRemaining.id);
        }
      }
    }, 100);

    setIsDeleteQuizDialogOpen(false);
    setDeleteConfirmText('');
  };

  const handlePreviousQuestion = () => {
    if (selectedQuestionIndex > 0) {
      setSelectedQuestionIndex(selectedQuestionIndex - 1);
    }
  };

  const handleNextQuestion = () => {
    if (selectedQuestionIndex < questions.length - 1) {
      setSelectedQuestionIndex(selectedQuestionIndex + 1);
    }
  };

  // Get color class for progress bar
  const artistTypeColorClass = (
    _category?: string,
    colorOn?: boolean,
    questionIndex?: number,
  ): string => {
    if (colorOn !== true) return 'bg-white dark:bg-black';

    const artistTypesList = [
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

    const artistTypeIndex = (questionIndex ?? 0) % artistTypesList.length;
    const artistType = artistTypesList[artistTypeIndex];

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

  return (
    <div className="flex h-[calc(100vh-1rem)] flex-col overflow-hidden">
      {/* Top Bar */}
      <TopBar
        quizzes={quizzes}
        engines={engines}
        isLoading={isLoading}
        selectedQuizId={selectedQuizId}
        selectedEngineId={selectedEngineId}
        selectedArtistType={selectedArtistType}
        onQuizChange={(quizId) => {
          setSelectedQuizId(quizId);
        }}
        onArtistTypeChange={setSelectedArtistType}
        onOpenClearDraftsDialog={() => setIsClearDraftsDialogOpen(true)}
        onCreateNewVersion={handleCreateNewVersion}
        onOpenDeleteQuizDialog={() => setIsDeleteQuizDialogOpen(true)}
      />

      {/* Main Content Area */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar - Quiz + Analysis tabs */}
        <ResizablePanelGroup.Panel
          defaultSize={25}
          minSize={20}
          maxSize={35}
          className="min-w-[220px] h-full overflow-hidden"
        >
          <LeftSidebar
            analysisConfig={analysisConfig}
            onAnalysisConfigChange={handleAnalysisConfigChange}
            questions={questions}
            selectedQuestionIndex={selectedQuestionIndex}
            onSelectQuestion={handleSelectQuestion}
            onAddQuestion={handleAddQuestion}
          />
        </ResizablePanelGroup.Panel>

        <ResizablePanelGroup.Handle withHandle />

        {/* Middle Section - Question Preview */}
        <ResizablePanelGroup.Panel defaultSize={sidebarVisible ? 50 : 75}>
          <div className="h-full p-4 flex flex-col relative">
            {/* Sidebar Toggle Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSidebarVisible(!sidebarVisible);
              }}
              className="absolute top-4 right-4 z-10 h-8 w-8 p-0"
              title={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
            >
              {sidebarVisible ? (
                <ChevronRightIcon className="h-4 w-4" />
              ) : (
                <ChevronLeftIcon className="h-4 w-4" />
              )}
            </Button>

            {/* Progress Bar */}
            <div className="mb-4">
              <QuizProgressBar
                questions={questions.map((q) => ({
                  id: q.id as unknown as number,
                  category: q.id,
                }))}
                currentIndex={selectedQuestionIndex}
                onQuestionClick={handleSelectQuestion}
                categoryColorClass={artistTypeColorClass}
                colorOn={true}
              />
            </div>

            {/* Question Card */}
            <div className="flex-1 flex items-center justify-center">
              {quizzesLoading ? (
                <div className="animate-pulse w-full max-w-2xl space-y-4 p-8">
                  <div className="h-8 bg-muted rounded w-3/4 mx-auto" />
                  <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
                  <div className="flex justify-center gap-2 mt-8">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="h-12 w-12 bg-muted rounded-full" />
                    ))}
                  </div>
                </div>
              ) : selectedQuestion !== undefined ? (
                <QuestionCard
                  title={selectedQuestion.title}
                  content=""
                  minLabel={
                    selectedQuestion.data.type === 'rating' ? selectedQuestion.data.minLabel : 'Min'
                  }
                  maxLabel={
                    selectedQuestion.data.type === 'rating' ? selectedQuestion.data.maxLabel : 'Max'
                  }
                  min={
                    selectedQuestion.data.type === 'rating' ? selectedQuestion.data.minRating : 1
                  }
                  max={
                    selectedQuestion.data.type === 'rating' ? selectedQuestion.data.maxRating : 10
                  }
                  selectedValues={currentSelectedValues}
                  idealAnswers={currentQuestionIdealAnswers}
                  showIdealAnswers={showIdealAnswers}
                  onRatingSelect={handleRatingSelect}
                  onBack={handlePreviousQuestion}
                  onNext={handleNextQuestion}
                  onSubmit={() => {}}
                  canGoBack={selectedQuestionIndex > 0}
                  canGoNext={selectedQuestionIndex < questions.length - 1}
                  isLastQuestion={selectedQuestionIndex === questions.length - 1}
                  autoAdvanceEnabled={false}
                />
              ) : (
                <div className="text-muted-foreground">No question selected</div>
              )}
            </div>

            {/* Navigation Controls */}
            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePreviousQuestion}
                disabled={selectedQuestionIndex === 0}
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="text-sm text-muted-foreground">
                {selectedQuestionIndex + 1} of {questions.length}
              </div>

              <Button
                variant="outline"
                onClick={handleNextQuestion}
                disabled={selectedQuestionIndex === questions.length - 1}
              >
                Next
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </ResizablePanelGroup.Panel>

        {sidebarVisible && (
          <>
            <ResizablePanelGroup.Handle withHandle />

            {/* Right Sidebar - Graphs */}
            <ResizablePanelGroup.Panel
              defaultSize={25}
              minSize={20}
              maxSize={35}
              className="min-w-[280px]"
            >
              <RightSidebar quiz={quiz} engines={engines} selectedEngineId={selectedEngineId} />
            </ResizablePanelGroup.Panel>
          </>
        )}
      </ResizablePanelGroup>

      {/* Clear All Drafts Confirmation Dialog */}
      <AlertDialog open={isClearDraftsDialogOpen} onOpenChange={setIsClearDraftsDialogOpen}>
        <AlertDialog.Content>
          <AlertDialog.Header>
            <AlertDialog.Title>Clear All Drafts</AlertDialog.Title>
            <AlertDialog.Description>
              This will remove all unsaved draft quizzes and their associated engines. Any changes
              you haven't saved as a new version will be lost.
            </AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer>
            <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
            <AlertDialog.Action
              onClick={() => {
                handleClearDraft();
                setIsClearDraftsDialogOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All Drafts
            </AlertDialog.Action>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>

      {/* Delete Quiz Confirmation Dialog */}
      <AlertDialog open={isDeleteQuizDialogOpen} onOpenChange={setIsDeleteQuizDialogOpen}>
        <AlertDialog.Content>
          <AlertDialog.Header>
            <AlertDialog.Title className="text-destructive">Delete Quiz</AlertDialog.Title>
            <AlertDialog.Description asChild>
              <div className="space-y-4">
                <p>
                  You are about to permanently delete{' '}
                  <strong>"{quiz?.title ?? 'this quiz'}"</strong>
                  {quiz?.version && ` (v${quiz.version.semver})`}.
                </p>
                <p className="text-destructive font-medium">
                  This action cannot be undone. All quiz data will be permanently removed.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="delete-confirm">
                    Type <strong>DELETE</strong> to confirm:
                  </Label>
                  <Input
                    id="delete-confirm"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="font-mono"
                  />
                </div>
              </div>
            </AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer>
            <AlertDialog.Cancel
              onClick={() => {
                setDeleteConfirmText('');
              }}
            >
              Cancel
            </AlertDialog.Cancel>
            <AlertDialog.Action
              onClick={handleDeleteQuiz}
              disabled={deleteConfirmText !== 'DELETE'}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete Quiz
            </AlertDialog.Action>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </div>
  );
};
