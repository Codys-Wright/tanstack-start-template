'use client';

import { Version } from '@core/domain';
import { Atom, Result, useAtomSet, useAtomValue } from '@effect-atom/atom-react';
import * as BrowserKeyValueStore from '@effect/platform-browser/BrowserKeyValueStore';
import type { AnalysisEngine } from '@/features/analysis-engine/domain/schema.js';
import type { Question } from '@/features/quiz/questions/schema.js';
import type { Quiz } from '@/features/quiz/domain/schema.js';
import * as Config from 'effect/Config';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
// Use the actual Result types from the atoms instead of importing platform types
import {
  Badge,
  Button,
  Card,
  Chart,
  cn,
  DropdownMenu,
  Input,
  Label,
  Resizable,
  ScrollArea,
  Select,
  Sidebar,
  Tabs,
  type ChartConfig,
} from '@shadcn';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BarChart3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GitBranchIcon,
  HelpCircleIcon,
  PlayIcon,
  RotateCcwIcon,
  SaveIcon,
  SettingsIcon,
  SlidersIcon,
} from 'lucide-react';
import React from 'react';
import { LabelList, Pie, PieChart } from 'recharts';
import { AnalysisService } from '../../analysis/domain/service.js';
import {
  artistColors,
  endingNameToArtistType,
  getArtistIconPath,
} from '../../analysis/ui/artist-type/artist-data-utils.js';
import { QuestionCard } from './question-card.js';
import { QuizProgressBar } from './quiz-progress-bar.js';
import { VersionIncrementDialog } from './version-increment-dialog.js';
import { enginesAtom } from '../../analysis-engine/client/atoms.js';
import { analysesAtom } from '../../analysis/client/atoms.js';
import { responsesAtom } from '../../responses/client/atoms.js';
import {
  clearTempQuizzesAtom,
  createNewQuizVersionAtom,
  createTempQuizAtom,
  deleteQuizAtom,
  quizzesAtom,
  saveTempQuizAtom,
} from '../client/atoms.js';

// Create a runtime for localStorage atoms
const localStorageRuntime = Atom.runtime(BrowserKeyValueStore.layerLocalStorage);

// Atoms for dropdown selections - persisted to localStorage
const selectedQuizIdAtom = Atom.kvs({
  runtime: localStorageRuntime,
  key: 'quiz-editor-selected-quiz-id',
  schema: Schema.String,
  defaultValue: () => '',
});

const selectedEngineIdAtom = Atom.kvs({
  runtime: localStorageRuntime,
  key: 'quiz-editor-selected-engine-id',
  schema: Schema.String,
  defaultValue: () => '',
});

const selectedArtistTypeAtom = Atom.kvs({
  runtime: localStorageRuntime,
  key: 'quiz-editor-selected-artist-type',
  schema: Schema.String,
  defaultValue: () => 'visionary',
});

const selectedQuestionIndexAtom = Atom.kvs({
  runtime: localStorageRuntime,
  key: 'quiz-editor-selected-question-index',
  schema: Schema.Number,
  defaultValue: () => 0,
});

const showIdealAnswersAtom = Atom.kvs({
  runtime: localStorageRuntime,
  key: 'quiz-editor-show-ideal-answers',
  schema: Schema.Boolean,
  defaultValue: () => true,
});

// Define sidebar view schemas
const LeftSidebarViewSchema = Schema.Literal('quiz', 'analysis');

const leftSidebarViewAtom = Atom.kvs({
  runtime: localStorageRuntime,
  key: 'quiz-editor-left-sidebar-view',
  schema: LeftSidebarViewSchema,
  defaultValue: () => 'quiz' as const,
});

const sidebarVisibleAtom = Atom.kvs({
  runtime: localStorageRuntime,
  key: 'quiz-editor-sidebar-visible',
  schema: Schema.Boolean,
  defaultValue: () => true,
});

// Define schema for re-analysis chart data
const ChartDataSchema = Schema.Array(
  Schema.Struct({
    type: Schema.String,
    count: Schema.Number,
    fill: Schema.String,
  }),
);

const reanalysisDataAtom = Atom.kvs({
  runtime: localStorageRuntime,
  key: 'quiz-editor-reanalysis-data',
  schema: Schema.NullOr(ChartDataSchema),
  defaultValue: () => null,
});

// Analysis config atom using the service's AnalysisConfig structure
const analysisConfigAtom = Atom.kvs({
  runtime: localStorageRuntime,
  key: 'quiz-editor-analysis-config',
  schema: Schema.Struct({
    primaryPointValue: Schema.Number,
    secondaryPointValue: Schema.Number,
    primaryPointWeight: Schema.Number,
    secondaryPointWeight: Schema.Number,
    primaryDistanceFalloff: Schema.Number,
    secondaryDistanceFalloff: Schema.Number,
    beta: Schema.Number,
    disableSecondaryPoints: Schema.Boolean,
    primaryMinPoints: Schema.Number,
    secondaryMinPoints: Schema.Number,
    minPercentageThreshold: Schema.Number,
    enableQuestionBreakdown: Schema.Boolean,
    maxEndingResults: Schema.Number,
  }),
  defaultValue: () => ({
    primaryPointValue: 10.0,
    secondaryPointValue: 5.0,
    primaryPointWeight: 1.0,
    secondaryPointWeight: 1.0,
    primaryDistanceFalloff: 0.1,
    secondaryDistanceFalloff: 0.5,
    beta: 0.8,
    disableSecondaryPoints: false,
    primaryMinPoints: 0.0,
    secondaryMinPoints: 0.0,
    minPercentageThreshold: 0.0,
    enableQuestionBreakdown: true,
    maxEndingResults: 10,
  }),
});

const pendingRatingAtom = Atom.make<number | null>(null).pipe(Atom.keepAlive);
const expectedNewVersionAtom = Atom.make<string | null>(null).pipe(Atom.keepAlive);
const expectedTempQuizAtom = Atom.make<{
  originalQuizId: string;
  existingTempQuizIds: Array<string>;
} | null>(null).pipe(Atom.keepAlive);

// Sidebar view state atom is now defined above with localStorage persistence

// Admin Sidebar Toggle Component using shadcn SidebarTrigger
const AdminSidebarToggle: React.FC = () => {
  return <Sidebar.Trigger className="h-8 w-8 p-0" />;
};

// Generate consistent random colors for temp/edit badges based on quiz ID
const getTempBadgeColor = (quizId: string): string => {
  // Simple hash function to convert string to number (offset by 7 to get different colors than drafts)
  let hash = 7;
  for (let i = 0; i < quizId.length; i++) {
    const char = quizId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Array of vibrant color combinations for temp/edit badges
  const colors = [
    'border-orange-500 text-orange-600',
    'border-red-500 text-red-600',
    'border-amber-500 text-amber-600',
    'border-yellow-500 text-yellow-600',
    'border-lime-500 text-lime-600',
    'border-emerald-500 text-emerald-600',
    'border-teal-500 text-teal-600',
    'border-cyan-500 text-cyan-600',
    'border-sky-500 text-sky-600',
    'border-blue-500 text-blue-600',
    'border-indigo-500 text-indigo-600',
    'border-violet-500 text-violet-600',
    'border-purple-500 text-purple-600',
    'border-fuchsia-500 text-fuchsia-600',
    'border-pink-500 text-pink-600',
    'border-rose-500 text-rose-600',
  ];

  // Use hash to pick a consistent color for this quiz ID
  const colorIndex = Math.abs(hash) % colors.length;
  return colors[colorIndex] ?? 'border-orange-500 text-orange-600';
};

// Helper function to get display version for temp vs permanent versions
const getDisplayVersion = (quiz: Quiz, allQuizzes: ReadonlyArray<Quiz>): string => {
  if (!quiz.isTemp) {
    // Permanent version - just show the semver
    return `v${quiz.version.semver}`;
  }

  // Temp version - show base version with draft number in parentheses
  const baseTitle = quiz.title.replace(' (Editing)', '');
  const baseVersion = quiz.version.semver;

  // Find all temp versions of this same base version
  const tempVersionsOfSameBase = allQuizzes
    .filter(
      (q) =>
        q.isTemp === true &&
        q.title.replace(' (Editing)', '') === baseTitle &&
        q.version.semver === baseVersion,
    )
    .sort((a, b) => a.id.localeCompare(b.id)); // Sort by ID for consistent ordering

  // Find the index of this specific temp version
  const draftIndex = tempVersionsOfSameBase.findIndex((q) => q.id === quiz.id);
  const draftNumber = draftIndex + 1;

  return `v${baseVersion} (Draft ${draftNumber})`;
};

// Helper function to detect if quiz content has changed from its original
const hasQuizChanged = (currentQuiz: Quiz, allQuizzes: ReadonlyArray<Quiz>): boolean => {
  if (currentQuiz.isTemp) {
    // For temp quizzes, find the original quiz and compare
    const baseTitle = currentQuiz.title.replace(' (Editing)', '');
    const originalQuiz = allQuizzes.find(
      (q) =>
        q.title === baseTitle &&
        q.version.semver === currentQuiz.version.semver &&
        q.isTemp === false,
    );

    if (originalQuiz === undefined) {
      // If we can't find the original, assume there are changes
      return true;
    }

    // Compare the relevant content fields
    return (
      JSON.stringify(currentQuiz.questions) !== JSON.stringify(originalQuiz.questions) ||
      currentQuiz.description !== originalQuiz.description ||
      currentQuiz.subtitle !== originalQuiz.subtitle ||
      JSON.stringify(currentQuiz.metadata) !== JSON.stringify(originalQuiz.metadata)
    );
  }

  // For non-temp quizzes, check if there's a temp version with changes
  const tempQuiz = allQuizzes.find(
    (q) =>
      q.title === `${currentQuiz.title} (Editing)` &&
      q.version.semver === currentQuiz.version.semver &&
      q.isTemp === true,
  );

  if (tempQuiz === undefined) {
    // No temp version exists, so no changes
    return false;
  }

  // Compare temp version with original
  return (
    JSON.stringify(tempQuiz.questions) !== JSON.stringify(currentQuiz.questions) ||
    tempQuiz.description !== currentQuiz.description ||
    tempQuiz.subtitle !== currentQuiz.subtitle ||
    JSON.stringify(tempQuiz.metadata) !== JSON.stringify(currentQuiz.metadata)
  );
};

// Helper function to get ideal answers for the current selection
const getIdealAnswersForCurrentSelection = (
  quizzesResult: ReturnType<typeof quizzesAtom.read>,
  enginesResult: ReturnType<typeof enginesAtom.read>,
  selectedQuizId: string,
  selectedEngineId: string,
  selectedQuestionIndex: number,
) => {
  if (!Result.isSuccess(quizzesResult) || !Result.isSuccess(enginesResult)) {
    return [];
  }

  const quizzes = quizzesResult.value;
  const engines = enginesResult.value;

  const selectedQuiz = quizzes.find((q: Quiz) => q.id === selectedQuizId);
  const selectedEngine = engines.find((e: AnalysisEngine) => e.id === selectedEngineId);

  if (selectedQuiz === undefined || selectedEngine === undefined) {
    return [];
  }

  const questions = selectedQuiz.questions as Array<Question>;
  const selectedQuestion = questions[selectedQuestionIndex];

  if (selectedQuestion === undefined) {
    return [];
  }

  // Get ideal answers for the current question
  const idealAnswers = selectedEngine.endings.flatMap((ending) =>
    ending.questionRules
      .filter((rule) => rule.questionId === selectedQuestion.id)
      .map((rule) => ({
        endingId: ending.endingId,
        endingName: ending.name,
        idealAnswers: [...rule.idealAnswers], // Convert readonly array to mutable array
        isPrimary: rule.isPrimary,
      })),
  );

  return idealAnswers;
};

// Helper function to get selected values for the current selection
const getSelectedValuesForCurrentSelection = (
  quizzesResult: ReturnType<typeof quizzesAtom.read>,
  enginesResult: ReturnType<typeof enginesAtom.read>,
  selectedQuizId: string,
  selectedEngineId: string,
  selectedArtistType: string,
  selectedQuestionIndex: number,
) => {
  if (!Result.isSuccess(enginesResult) || !Result.isSuccess(quizzesResult)) {
    return [];
  }

  const engines = enginesResult.value;
  const quizzes = quizzesResult.value;

  const selectedEngine = engines.find((e: AnalysisEngine) => e.id === selectedEngineId);
  const selectedQuiz = quizzes.find((q: Quiz) => q.id === selectedQuizId);

  if (selectedEngine === undefined || selectedQuiz === undefined) {
    return [];
  }

  const questions = selectedQuiz.questions as Array<Question>;
  const selectedQuestion = questions[selectedQuestionIndex];

  if (selectedQuestion === undefined) {
    return [];
  }

  const artistTypeEndingId = `the-${selectedArtistType.toLowerCase()}-artist`;
  const ending = selectedEngine.endings.find((e) => e.endingId === artistTypeEndingId);

  if (ending === undefined) {
    return [];
  }

  const questionRule = ending.questionRules.find((rule) => rule.questionId === selectedQuestion.id);

  if (questionRule === undefined) {
    return [];
  }

  const selectedValues = [...questionRule.idealAnswers]; // Create mutable copy

  return selectedValues;
};

// Artist Icon Component
const ArtistIcon: React.FC<{
  artistType: string;
  className?: string;
  size?: number;
}> = ({ artistType, className, size = 20 }) => {
  const [loadError, setLoadError] = React.useState(false);
  // Convert artist type to database ID format
  const databaseId = `the-${artistType.toLowerCase()}-artist`;
  const iconPath = getArtistIconPath(databaseId);

  if (iconPath === null || loadError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-gray-400 text-xs font-bold text-white',
          className,
        )}
        style={{ width: size, height: size }}
        role="img"
        aria-label={`${artistType} icon`}
      >
        {artistType.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div
      className={cn('flex items-center justify-center', className)}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        aspectRatio: '1 / 1',
        flexShrink: 0,
      }}
    >
      <img
        src={iconPath}
        alt={`${artistType} icon`}
        className="rounded-full dark:brightness-0 dark:invert"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          aspectRatio: '1 / 1',
        }}
        onError={() => {
          setLoadError(true);
        }}
      />
    </div>
  );
};

// Question List Component (for Quiz tab)
const QuestionList: React.FC<{
  onAddQuestion: () => void;
  onSelectQuestion: (index: number) => void;
  questions: ReadonlyArray<Question>;
  selectedIndex: number;
}> = ({ onAddQuestion: _onAddQuestion, onSelectQuestion, questions, selectedIndex }) => {
  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1">
        <div className="p-1 space-y-0.5">
          {questions.map((question, index) => (
            <button
              key={question.id}
              onClick={() => {
                onSelectQuestion(index);
              }}
              className={cn(
                'w-full text-left p-1.5 rounded text-xs transition-colors',
                'hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring/40',
                selectedIndex === index
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'text-foreground',
              )}
            >
              <div className="flex items-start gap-2 min-w-0">
                <span
                  className={cn(
                    'text-xs font-mono px-1 py-0.5 rounded flex-shrink-0 mt-0.5',
                    selectedIndex === index
                      ? 'bg-primary-foreground text-primary'
                      : 'bg-muted text-foreground',
                  )}
                >
                  {index + 1}
                </span>
                <span className="flex-1 min-w-0 text-xs leading-relaxed break-words">
                  {question.title}
                </span>
              </div>
            </button>
          ))}
          {/* Bottom spacer to ensure last item is fully scrollable */}
          <div className="h-16" />
        </div>
      </ScrollArea>
    </div>
  );
};

// Utility components for analysis controls
const NumberInput: React.FC<{
  description?: string;
  label: string;
  max?: number;
  min?: number;
  onChange: (value: number) => void;
  step?: number;
  value: number;
}> = ({ description, label, max, min, onChange, step = 0.1, value }) => (
  <div className="space-y-1">
    <Label className="text-sm font-medium">{label}</Label>
    {description !== undefined && <p className="text-xs text-muted-foreground">{description}</p>}
    <Input
      type="number"
      value={value}
      onChange={(e) => {
        const numValue = parseFloat(e.target.value);
        onChange(isNaN(numValue) ? 0 : numValue);
      }}
      min={min}
      max={max}
      step={step}
      className="h-8"
    />
  </div>
);

// Engine Tweaks Component (for Analysis tab)
const EngineTweaks: React.FC<{
  engines: ReadonlyArray<AnalysisEngine>;
  onArtistTypeChange: (artistType: string) => void;
  selectedArtistType: string;
  selectedEngineId: string;
}> = ({
  engines: _engines,
  onArtistTypeChange: _onArtistTypeChange,
  selectedArtistType: _selectedArtistType,
  selectedEngineId: _selectedEngineId,
}) => {
  const analysisConfig = useAtomValue(analysisConfigAtom);
  const setAnalysisConfig = useAtomSet(analysisConfigAtom);

  const updateConfig = (updates: Partial<typeof analysisConfig>) => {
    const newConfig = {
      ...analysisConfig,
      ...updates,
    };
    setAnalysisConfig(newConfig);
  };

  const resetToDefaults = () => {
    setAnalysisConfig({
      primaryPointValue: 10.0,
      secondaryPointValue: 5.0,
      primaryPointWeight: 1.0,
      secondaryPointWeight: 1.0,
      primaryDistanceFalloff: 0.1,
      secondaryDistanceFalloff: 0.5,
      beta: 0.8,
      disableSecondaryPoints: false,
      primaryMinPoints: 0.0,
      secondaryMinPoints: 0.0,
      minPercentageThreshold: 0.0,
      enableQuestionBreakdown: true,
      maxEndingResults: 10,
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <div>
          <h3 className="text-sm font-medium">Analysis Config</h3>
          <p className="text-xs text-muted-foreground mt-1">Adjust analysis parameters</p>
        </div>
        <Button size="sm" variant="ghost" onClick={resetToDefaults} title="Reset to defaults">
          <RotateCcwIcon className="h-3 w-3" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Analysis Configuration */}
          <Tabs defaultValue="scoring" className="w-full">
            <Tabs.List className="grid w-full grid-cols-2">
              <Tabs.Trigger value="scoring">Scoring</Tabs.Trigger>
              <Tabs.Trigger value="ui">UI</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="scoring" className="mt-4 h-full">
              <ScrollArea className="h-full">
                <div className="space-y-4 pr-4">
                  <NumberInput
                    description="Base points awarded for perfect primary ideal answers"
                    label="Primary Point Value"
                    max={50}
                    min={0}
                    onChange={(value) => {
                      updateConfig({ primaryPointValue: value });
                    }}
                    step={1}
                    value={analysisConfig.primaryPointValue}
                  />
                  <NumberInput
                    description="Base points awarded for perfect secondary ideal answers"
                    label="Secondary Point Value"
                    max={50}
                    min={0}
                    onChange={(value) => {
                      updateConfig({ secondaryPointValue: value });
                    }}
                    step={1}
                    value={analysisConfig.secondaryPointValue}
                  />
                  <NumberInput
                    description="Multiplier for primary questions (most important questions)"
                    label="Primary Point Weight"
                    max={3}
                    min={0}
                    onChange={(value) => {
                      updateConfig({ primaryPointWeight: value });
                    }}
                    step={0.1}
                    value={analysisConfig.primaryPointWeight}
                  />
                  <NumberInput
                    description="Multiplier for secondary questions (supporting questions)"
                    label="Secondary Point Weight"
                    max={3}
                    min={0}
                    onChange={(value) => {
                      updateConfig({ secondaryPointWeight: value });
                    }}
                    step={0.1}
                    value={analysisConfig.secondaryPointWeight}
                  />
                  <NumberInput
                    description="Percentage of points lost per step away from ideal answers. 0% = only exact matches get points, 100% = lose all points after 1 step"
                    label="Primary Distance Falloff (%)"
                    max={100}
                    min={0}
                    onChange={(value) => {
                      updateConfig({ primaryDistanceFalloff: value / 100 });
                    }}
                    step={5}
                    value={Math.round(analysisConfig.primaryDistanceFalloff * 100)}
                  />
                  <NumberInput
                    description="Percentage of points lost per step away from ideal answers. 0% = only exact matches get points, 100% = lose all points after 1 step"
                    label="Secondary Distance Falloff (%)"
                    max={100}
                    min={0}
                    onChange={(value) => {
                      updateConfig({ secondaryDistanceFalloff: value / 100 });
                    }}
                    step={5}
                    value={Math.round(analysisConfig.secondaryDistanceFalloff * 100)}
                  />
                </div>
              </ScrollArea>
            </Tabs.Content>

            <Tabs.Content value="ui" className="mt-4 h-full">
              <ScrollArea className="h-full">
                <div className="space-y-4 pr-4">
                  <NumberInput
                    description="Higher number separates the high percentages from the lower ones on the graph visually to reveal a more distinct winner"
                    label="Beta"
                    max={5}
                    min={0.1}
                    onChange={(value) => {
                      updateConfig({ beta: value });
                    }}
                    step={0.1}
                    value={analysisConfig.beta}
                  />
                </div>
              </ScrollArea>
            </Tabs.Content>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
};

// Left Sidebar Component (Quiz + Analysis tabs)
const LeftSidebar: React.FC<{
  engines: ReadonlyArray<AnalysisEngine>;
  onAddQuestion: () => void;
  onArtistTypeChange: (artistType: string) => void;
  onSelectQuestion: (index: number) => void;
  questions: ReadonlyArray<Question>;
  selectedArtistType: string;
  selectedEngineId: string;
  selectedQuestionIndex: number;
}> = ({
  engines,
  onAddQuestion,
  onArtistTypeChange,
  onSelectQuestion,
  questions,
  selectedArtistType,
  selectedEngineId,
  selectedQuestionIndex,
}) => {
  const leftSidebarView = useAtomValue(leftSidebarViewAtom);
  const setLeftSidebarView = useAtomSet(leftSidebarViewAtom);

  return (
    <div className="flex h-full flex-col border-r border-border/50">
      {/* Sidebar Header with View Switcher */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <h3 className="text-sm font-medium">
          {leftSidebarView === 'quiz' ? 'Quiz Editor' : 'Analysis Tools'}
        </h3>
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          <Button
            variant={leftSidebarView === 'quiz' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setLeftSidebarView('quiz');
            }}
            className="gap-1 h-6 px-2 text-xs"
          >
            <HelpCircleIcon className="h-3 w-3" />
            Quiz
          </Button>
          <Button
            variant={leftSidebarView === 'analysis' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setLeftSidebarView('analysis');
            }}
            className="gap-1 h-6 px-2 text-xs"
          >
            <SlidersIcon className="h-3 w-3" />
            Analysis
          </Button>
        </div>
      </div>

      {/* Sidebar Content */}
      {leftSidebarView === 'quiz' ? (
        <QuestionList
          questions={questions}
          selectedIndex={selectedQuestionIndex}
          onSelectQuestion={onSelectQuestion}
          onAddQuestion={onAddQuestion}
        />
      ) : (
        <EngineTweaks
          engines={engines}
          onArtistTypeChange={onArtistTypeChange}
          selectedArtistType={selectedArtistType}
          selectedEngineId={selectedEngineId}
        />
      )}
    </div>
  );
};

// Top Bar Component
const TopBar: React.FC<{
  engines: ReadonlyArray<AnalysisEngine>;
  onArtistTypeChange: (artistType: string) => void;
  onClearDraft: () => void;
  onCreateNewVersion: (
    newVersion: string,
    incrementType: 'major' | 'minor' | 'patch',
    comment?: string,
  ) => void;
  onDeleteQuiz: () => void;
  onQuizChange: (quizId: string) => void;
  quizzes: ReadonlyArray<Quiz>;
  selectedArtistType: string;
  selectedEngineId: string;
  selectedQuizId: string;
}> = ({
  onArtistTypeChange,
  onClearDraft,
  onCreateNewVersion,
  onDeleteQuiz,
  onQuizChange,
  quizzes,
  selectedArtistType,
  selectedQuizId,
}) => {
  // Filter to only show "My Artist Type Quiz" versions
  const artistTypeQuizVersions = quizzes
    .filter((q) => q.title === 'My Artist Type Quiz' || q.title === 'My Artist Type Quiz (Editing)')
    .sort((a, b) => b.version.semver.localeCompare(a.version.semver)); // Sort by version desc

  const selectedQuiz = quizzes.find((quiz) => quiz.id === selectedQuizId);
  const hasChanges = selectedQuiz !== undefined ? hasQuizChanged(selectedQuiz, quizzes) : false;

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

  const [isVersionDialogOpen, setIsVersionDialogOpen] = React.useState(false);

  return (
    <>
      <VersionIncrementDialog
        currentVersion={selectedQuiz !== undefined ? selectedQuiz.version.semver : '1.0.0'}
        isOpen={isVersionDialogOpen}
        onClose={() => {
          setIsVersionDialogOpen(false);
        }}
        onConfirm={onCreateNewVersion}
        title={
          selectedQuiz !== undefined && selectedQuiz.isTemp === true
            ? 'Save Changes as New Version'
            : 'Create New Quiz Version'
        }
      />
      <div className="flex items-center gap-4 p-4 border-b border-border/50 bg-card/50">
        <div className="flex items-center gap-2">
          <AdminSidebarToggle />
        </div>

        <div className="flex items-center gap-6 flex-1">
          {/* Combined Version Selection - Quiz + Engine */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Version:</span>
            <Select value={selectedQuizId} onValueChange={onQuizChange}>
              <Select.Trigger className="w-60">
                <Select.Value placeholder="Select version">
                  {selectedQuiz !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <span title={selectedQuiz.version.comment ?? undefined}>
                        {getDisplayVersion(selectedQuiz, artistTypeQuizVersions)}
                      </span>
                      {selectedQuiz.isTemp ? (
                        <Badge
                          variant="outline"
                          className={`text-xs px-1 ${getTempBadgeColor(selectedQuiz.id)}`}
                        >
                          Edit
                        </Badge>
                      ) : selectedQuiz.isPublished === true ? (
                        <Badge variant="default" className="text-xs px-1">
                          Live
                        </Badge>
                      ) : null}
                    </div>
                  )}
                </Select.Value>
              </Select.Trigger>
              <Select.Content>
                {artistTypeQuizVersions.map((quiz) => (
                  <Select.Item key={quiz.id} value={quiz.id}>
                    <div className="flex items-center gap-1.5">
                      <span>{getDisplayVersion(quiz, artistTypeQuizVersions)}</span>
                      {quiz.isTemp ? (
                        <Badge
                          variant="outline"
                          className={`text-xs px-1 ${getTempBadgeColor(quiz.id)}`}
                        >
                          Edit
                        </Badge>
                      ) : quiz.isPublished ? (
                        <Badge variant="default" className="text-xs px-1">
                          Live
                        </Badge>
                      ) : null}
                    </div>
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
          {/* Artist Type Selection */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Artist Type:</span>
            <Select value={selectedArtistType} onValueChange={onArtistTypeChange}>
              <Select.Trigger className="w-36">
                <Select.Value>
                  <div className="flex items-center gap-2">
                    <ArtistIcon artistType={selectedArtistType} size={16} />
                    <span className="capitalize">{selectedArtistType}</span>
                  </div>
                </Select.Value>
              </Select.Trigger>
              <Select.Content>
                {artistTypes.map((type) => (
                  <Select.Item key={type} value={type}>
                    <div className="flex items-center gap-2">
                      <ArtistIcon artistType={type} size={16} />
                      <span className="capitalize">{type}</span>
                    </div>
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          {selectedQuiz !== undefined && selectedQuiz.isTemp && (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setIsVersionDialogOpen(true);
              }}
              className="gap-2"
            >
              <SaveIcon className="h-4 w-4" />
              Save Changes
            </Button>
          )}

          {selectedQuiz !== undefined && !selectedQuiz.isTemp && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsVersionDialogOpen(true);
              }}
              disabled={!hasChanges}
              className={cn('gap-2', !hasChanges && 'opacity-50 cursor-not-allowed')}
              title={
                !hasChanges
                  ? 'No changes to save as new version'
                  : 'Create a new version with your changes'
              }
            >
              <GitBranchIcon className="h-4 w-4" />
              New Version
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenu.Trigger asChild>
              <Button variant="outline" size="sm">
                <SettingsIcon className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" className="w-48">
              <DropdownMenu.Label>Settings</DropdownMenu.Label>
              <DropdownMenu.Separator />
              <DropdownMenu.Item>
                <span>Quiz Settings</span>
              </DropdownMenu.Item>
              <DropdownMenu.Item>
                <span>Export Quiz</span>
              </DropdownMenu.Item>
              <DropdownMenu.Item>
                <span>Import Quiz</span>
              </DropdownMenu.Item>

              <DropdownMenu.Separator />

              <DropdownMenu.Item
                className="text-destructive"
                onClick={() => {
                  onClearDraft();
                }}
              >
                <span>Clear Draft</span>
              </DropdownMenu.Item>

              <DropdownMenu.Separator />

              <div className="px-2 py-1">
                <span className="text-xs font-semibold text-destructive uppercase tracking-wide">
                  Danger
                </span>
              </div>

              <DropdownMenu.Item
                className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                onClick={() => {
                  onDeleteQuiz();
                }}
              >
                <span>Delete Quiz</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
};

// Right Sidebar Component (Graphs only)
const RightSidebar: React.FC<{
  engines: ReadonlyArray<AnalysisEngine>;
  quiz: Quiz;
  selectedEngineId: string;
}> = ({ engines, quiz, selectedEngineId }) => {
  return (
    <div className="flex h-full flex-col border-l border-border/50">
      {/* Sidebar Content */}
      <SidebarGraphsView quiz={quiz} engines={engines} selectedEngineId={selectedEngineId} />
    </div>
  );
};

// Chart config matching the admin AnalysisChart
const chartConfig = {
  count: {
    label: 'Count',
  },
  visionary: {
    label: 'Visionary',
    color: 'var(--artist-visionary)',
  },
  consummate: {
    label: 'Consummate',
    color: 'var(--artist-consummate)',
  },
  analyzer: {
    label: 'Analyzer',
    color: 'var(--artist-analyzer)',
  },
  tech: {
    label: 'Tech',
    color: 'var(--artist-tech)',
  },
  entertainer: {
    label: 'Entertainer',
    color: 'var(--artist-entertainer)',
  },
  maverick: {
    label: 'Maverick',
    color: 'var(--artist-maverick)',
  },
  dreamer: {
    label: 'Dreamer',
    color: 'var(--artist-dreamer)',
  },
  feeler: {
    label: 'Feeler',
    color: 'var(--artist-feeler)',
  },
  tortured: {
    label: 'Tortured',
    color: 'var(--artist-tortured)',
  },
  solo: {
    label: 'Solo',
    color: 'var(--artist-solo)',
  },
} satisfies ChartConfig;

// Helper function to get the primary artist type from analysis results (from admin chart)
const getPrimaryArtistType = (
  endingResults: ReadonlyArray<{
    endingId: string;
    points: number;
    percentage: number;
  }>,
) => {
  if (endingResults.length === 0) return null;

  // Find the result with the highest points
  const primaryResult = endingResults.reduce((prev, current) =>
    current.points > prev.points ? current : prev,
  );

  // Map endingId to full name
  const endingIdToFullName: Record<string, string> = {};
  Object.keys(endingNameToArtistType).forEach((fullName) => {
    const endingId = fullName.toLowerCase().replace(/\s+/g, '-');
    endingIdToFullName[endingId] = fullName;
  });

  return endingIdToFullName[primaryResult.endingId] ?? primaryResult.endingId;
};

// Real Analysis Chart with Card wrapper (using exact admin logic)
const RealAnalysisChart: React.FC = () => {
  const analysisResult = useAtomValue(allAnalysisAtom);
  const responsesResult = useAtomValue(responsesAtom);

  const chartData = React.useMemo(() => {
    if (!Result.isSuccess(analysisResult)) {
      return [];
    }

    const analyses = analysisResult.value;

    // Count artist types from the most recent analysis for each response (exact admin logic)
    const artistTypeCounts: Record<string, number> = {};

    analyses.forEach((analysis) => {
      const primaryArtistType = getPrimaryArtistType(analysis.endingResults);
      if (primaryArtistType !== null) {
        const artistType = endingNameToArtistType[primaryArtistType];
        if (artistType !== undefined) {
          artistTypeCounts[artistType] = (artistTypeCounts[artistType] ?? 0) + 1;
        }
      }
    });

    // Convert to chart data format
    return Object.entries(artistTypeCounts).map(([artistType, count]) => ({
      type: artistType.toLowerCase(),
      count,
      fill: artistColors[artistType as keyof typeof artistColors],
    }));
  }, [analysisResult]);

  const totalAnalyses = React.useMemo(() => {
    if (!Result.isSuccess(analysisResult)) {
      return 0;
    }
    // Use the actual count of analysis results, not the chart data count (exact admin logic)
    return analysisResult.value.length;
  }, [analysisResult, responsesResult]);

  return (
    <Card className="flex flex-col h-full">
      <Card.Header className="pb-2">
        <Card.Title className="text-sm">Current Real Results</Card.Title>
        <Card.Description className="text-xs">
          Actual analysis results from all responses
        </Card.Description>
      </Card.Header>
      <Card.Content className="flex-1 pb-2">
        {!Result.isSuccess(analysisResult) ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground text-xs">Loading...</div>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="w-full h-full">
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie data={chartData} dataKey="count" nameKey="type" innerRadius={40} strokeWidth={3}>
                <LabelList
                  content={({ viewBox }) => {
                    if (
                      Boolean(viewBox) &&
                      typeof viewBox === 'object' &&
                      'cx' in viewBox &&
                      'cy' in viewBox
                    ) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-xl font-bold"
                          >
                            {totalAnalyses.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy ?? 0) + 16}
                            className="fill-muted-foreground text-xs"
                          >
                            Real
                          </tspan>
                        </text>
                      );
                    }
                    return null;
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
      </Card.Content>
    </Card>
  );
};

// Re-analysis Chart - Analyzes all responses with current engine
const ReanalysisChart: React.FC<{
  isAnalyzing?: boolean;
  onReanalyze?: () => void;
  responsesResult: ReturnType<typeof responsesAtom.read>;
  selectedEngine: AnalysisEngine;
}> = React.memo(({ isAnalyzing = false, onReanalyze, responsesResult }) => {
  const reanalysisData = useAtomValue(reanalysisDataAtom);

  // Keep the last valid data during analysis
  const [stableData, setStableData] = React.useState<typeof reanalysisData>(null);

  React.useEffect(() => {
    if (reanalysisData !== null) {
      setStableData(reanalysisData);
    }
  }, [reanalysisData]);

  const displayData = isAnalyzing && stableData !== null ? stableData : reanalysisData;
  const displayTotal =
    displayData !== null ? displayData.reduce((sum, item) => sum + item.count, 0) : 0;

  return (
    <Card className="flex flex-col h-full">
      <Card.Header className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <Card.Title className="text-sm">Re-analyze with Current Engine</Card.Title>
            <Card.Description className="text-xs">
              {reanalysisData === null
                ? 'Click to analyze all responses with current engine settings'
                : isAnalyzing
                  ? 'Analyzing with current engine configuration...'
                  : 'Fresh analysis results with current engine configuration'}
            </Card.Description>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onReanalyze}
            disabled={
              isAnalyzing || !Result.isSuccess(responsesResult) || onReanalyze === undefined
            }
            className="h-8 w-8 p-0"
          >
            <PlayIcon className="h-4 w-4" />
          </Button>
        </div>
      </Card.Header>
      <Card.Content className="flex-1 pb-2">
        {displayData === null ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <PlayIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Click the play button to re-analyze</p>
            </div>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="w-full h-full">
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={[...displayData]}
                dataKey="count"
                nameKey="type"
                innerRadius={40}
                strokeWidth={3}
                animationDuration={1600}
                animationEasing="ease-out"
                isAnimationActive={true}
              >
                <LabelList
                  content={({ viewBox }) => {
                    if (
                      Boolean(viewBox) &&
                      typeof viewBox === 'object' &&
                      'cx' in viewBox &&
                      'cy' in viewBox
                    ) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-xl font-bold"
                          >
                            {displayTotal.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy ?? 0) + 16}
                            className="fill-muted-foreground text-xs"
                          >
                            Re-analyzed
                          </tspan>
                        </text>
                      );
                    }
                    return null;
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
      </Card.Content>
    </Card>
  );
});

// Artist Type Comparison Component
const ArtistTypeComparison: React.FC<{
  isAnalyzing?: boolean;
  onReanalyze?: () => void;
  selectedEngine: AnalysisEngine;
}> = ({ isAnalyzing = false, onReanalyze, selectedEngine: _selectedEngine }) => {
  const analysisResult = useAtomValue(allAnalysisAtom);
  const reanalysisData = useAtomValue(reanalysisDataAtom);
  const responsesResult = useAtomValue(responsesAtom);

  // Get real analysis counts
  const realCounts = React.useMemo(() => {
    if (!Result.isSuccess(analysisResult)) {
      return {};
    }

    const analyses = analysisResult.value;
    const artistTypeCounts: Record<string, number> = {};

    analyses.forEach((analysis) => {
      const primaryArtistType = getPrimaryArtistType(analysis.endingResults);
      if (primaryArtistType !== null) {
        const artistType = endingNameToArtistType[primaryArtistType];
        if (artistType !== undefined) {
          artistTypeCounts[artistType] = (artistTypeCounts[artistType] ?? 0) + 1;
        }
      }
    });

    return artistTypeCounts;
  }, [analysisResult]);

  // Get engine projection counts
  const engineCounts = React.useMemo(() => {
    if (reanalysisData === null) {
      return {};
    }

    // Create endingId to fullName mapping
    const endingIdToFullName: Record<string, string> = {};
    Object.keys(endingNameToArtistType).forEach((fullName) => {
      const endingId = fullName.toLowerCase().replace(/\s+/g, '-');
      endingIdToFullName[endingId] = fullName;
    });

    const counts: Record<string, number> = {};
    reanalysisData.forEach((item) => {
      // Convert from database ID format (the-dreamer-artist) to artist type (Dreamer)
      const endingId = item.type.toLowerCase();
      const fullName = endingIdToFullName[endingId];
      if (fullName !== undefined) {
        const artistType = endingNameToArtistType[fullName];
        if (artistType !== undefined) {
          counts[artistType] = item.count;
        }
      }
    });

    return counts;
  }, [reanalysisData]);

  const artistTypes = [
    'Visionary',
    'Consummate',
    'Analyzer',
    'Tech',
    'Entertainer',
    'Maverick',
    'Dreamer',
    'Feeler',
    'Tortured',
    'Solo',
  ];

  return (
    <Card className="mt-3">
      <Card.Header className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <Card.Title className="text-sm">Engine vs Real Results</Card.Title>
            <Card.Description className="text-xs">
              Comparison of projected vs actual artist type distribution
            </Card.Description>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onReanalyze}
            disabled={
              isAnalyzing || !Result.isSuccess(responsesResult) || onReanalyze === undefined
            }
            className="h-8 w-8 p-0"
          >
            <PlayIcon className="h-4 w-4" />
          </Button>
        </div>
      </Card.Header>
      <Card.Content className="p-3">
        <div className="space-y-2">
          {artistTypes.map((artistType) => {
            const engineCount = engineCounts[artistType] ?? 0;
            const realCount = realCounts[artistType] ?? 0;

            return (
              <div key={artistType} className="grid grid-cols-3 items-center gap-2 py-1">
                {/* Left - Engine Count */}
                <div className="text-right">
                  <span className="text-sm font-mono text-blue-600 dark:text-blue-400">
                    {engineCount}
                  </span>
                </div>

                {/* Center - Artist Icon */}
                <div className="flex justify-center">
                  <ArtistIcon artistType={artistType.toLowerCase()} size={48} />
                </div>

                {/* Right - Real Count */}
                <div className="text-left">
                  <span className="text-sm font-mono text-green-600 dark:text-green-400">
                    {realCount}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 pt-2 border-t border-border/50">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="text-blue-600 dark:text-blue-400">Engine</span>
            <span className="text-green-600 dark:text-green-400">Real</span>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
};

// Sidebar Graphs View Component (Compact version for sidebar)
const SidebarGraphsView: React.FC<{
  engines: ReadonlyArray<AnalysisEngine>;
  quiz: Quiz;
  selectedEngineId: string;
}> = ({ engines, selectedEngineId }) => {
  const selectedEngine = engines.find((e) => e.id === selectedEngineId);

  // Get real analysis data from atoms
  const responsesResult = useAtomValue(responsesAtom);
  const quizzesResult = useAtomValue(quizzesAtom);
  const selectedQuizId = useAtomValue(selectedQuizIdAtom);
  const setReanalysisData = useAtomSet(reanalysisDataAtom);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  // Get analysis config from the left panel
  const analysisConfig = useAtomValue(analysisConfigAtom);

  // Shared reanalyze function that can be used by both components
  const handleReanalyze = React.useCallback(async () => {
    if (
      !Result.isSuccess(responsesResult) ||
      !Result.isSuccess(quizzesResult) ||
      selectedEngine === undefined
    ) {
      return;
    }

    if (selectedQuizId === '') {
      return;
    }

    // eslint-disable-next-line no-console
    console.log('✅ Starting analysis...');
    setIsAnalyzing(true);

    try {
      const allResponses = responsesResult.value;
      const allQuizzes = quizzesResult.value;

      // Use the currently selected quiz version from the dropdown for analysis
      const selectedQuiz = allQuizzes.find((quiz) => quiz.id === selectedQuizId);

      if (selectedQuiz === undefined) {
        return;
      }

      // Find all "My Artist Type Quiz" versions for response filtering
      const artistTypeQuizzes = allQuizzes.filter(
        (quiz) =>
          quiz.title === 'My Artist Type Quiz' || quiz.title === 'My Artist Type Quiz (Editing)',
      );
      const artistTypeQuizIds = new Set(artistTypeQuizzes.map((q) => q.id));

      // Filter responses to only include those from "My Artist Type Quiz" versions
      const responses = allResponses.filter((response) => artistTypeQuizIds.has(response.quizId));

      const artistTypeCounts: Record<string, number> = {};

      // Log config once at the start
      // eslint-disable-next-line no-console
      console.log('🔧 Analysis Config:', analysisConfig);

      // Process each response using the local analysis function
      for (const response of responses) {
        try {
          // selectedEngine is already checked above

          // Use AnalysisService directly like the working Typeform analysis
          try {
            const analysisResult = Effect.runSync(
              Effect.provide(
                AnalysisService.pipe(
                  Effect.flatMap((service) =>
                    service.analyzeResponse(
                      selectedEngine,
                      selectedQuiz,
                      response,
                      Config.succeed(analysisConfig),
                    ),
                  ),
                ),
                AnalysisService.Default,
              ),
            );

            // Transform the analysis result to the expected format
            const analysisResults = analysisResult.endingResults.map(
              (result: { endingId: string; percentage: number; points: number }) => ({
                artistType: endingNameToArtistType[result.endingId] ?? result.endingId,
                percentage: result.percentage,
                points: result.points,
                fullName: result.endingId,
                databaseId: result.endingId,
              }),
            );

            // Count the results - find the highest percentage result
            if (analysisResults.length > 0) {
              const winningResult = analysisResults.reduce((winner, current) =>
                current.percentage > winner.percentage ? current : winner,
              );

              // Check if all results have 0 points - this indicates an analysis error
              const allResultsHaveZeroPoints = analysisResults.every(
                (result) => result.points === 0,
              );
              if (allResultsHaveZeroPoints) {
                throw new Error(
                  `Analysis failed: All results have 0 points. This indicates a problem with the analysis engine or question matching. Response ID: ${response.id}`,
                );
              }

              if (winningResult.artistType !== '') {
                const artistType = winningResult.artistType;
                artistTypeCounts[artistType] = (artistTypeCounts[artistType] ?? 0) + 1;
              }
            }
          } catch {
            // Continue with other responses even if one fails
          }
        } catch {
          // Continue with other responses even if one fails
        }
      }

      // Convert to chart data format
      const chartData = Object.entries(artistTypeCounts).map(([artistType, count]) => ({
        type: artistType.toLowerCase(),
        count,
        fill: artistColors[artistType as keyof typeof artistColors],
      }));

      // Log analysis results and distribution
      const totalResponses = responses.length;
      const distribution = Object.entries(artistTypeCounts)
        .sort(([, a], [, b]) => b - a)
        .map(
          ([type, count]) => `${type}: ${count} (${((count / totalResponses) * 100).toFixed(1)}%)`,
        )
        .join(', ');

      // eslint-disable-next-line no-console
      console.log(
        `📊 Analysis Complete: ${totalResponses} responses analyzed. Distribution: ${distribution}`,
      );

      setReanalysisData([...chartData]); // Create mutable copy
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Re-analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    responsesResult,
    quizzesResult,
    selectedEngine,
    selectedQuizId,
    setReanalysisData,
    analysisConfig,
  ]);

  // Auto-reanalyze when config changes with debounce
  React.useEffect(() => {
    if (
      Result.isSuccess(responsesResult) &&
      Result.isSuccess(quizzesResult) &&
      selectedEngine !== undefined
    ) {
      const timeoutId = setTimeout(() => {
        void handleReanalyze();
      }, 500); // 500ms debounce

      return () => {
        clearTimeout(timeoutId);
      };
    }
    return undefined;
  }, [analysisConfig, handleReanalyze, responsesResult, quizzesResult, selectedEngine]);

  if (selectedEngine === undefined) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center text-muted-foreground">
          <BarChart3Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No analysis engine selected</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 p-3">
      <div className="space-y-3">
        {/* Re-analysis Chart - Top */}
        <div className="h-[300px]">
          <ReanalysisChart
            responsesResult={responsesResult}
            selectedEngine={selectedEngine}
            onReanalyze={handleReanalyze}
            isAnalyzing={isAnalyzing}
          />
        </div>

        {/* Real Analysis Distribution */}
        <div className="h-[300px]">
          <RealAnalysisChart />
        </div>

        {/* Artist Type Comparison */}
        <ArtistTypeComparison
          selectedEngine={selectedEngine}
          onReanalyze={handleReanalyze}
          isAnalyzing={isAnalyzing}
        />
      </div>
    </ScrollArea>
  );
};

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

  // Sidebar visibility state - moved to top to avoid hook order issues
  const sidebarVisible = useAtomValue(sidebarVisibleAtom);
  const setSidebarVisible = useAtomSet(sidebarVisibleAtom);

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

  // Quiz atoms for creating temp versions - use the atom function directly
  const createTempQuiz = useAtomSet(createTempQuizAtom);

  // Engine atoms for modifying ideal answers
  const autoSaveTempEngine = useAtomSet(autoSaveTempEngineAtom);

  // Clear atoms for removing temp versions
  const clearTempQuizzes = useAtomSet(clearTempQuizzesAtom);
  const clearTempEngines = useAtomSet(clearTempEnginesAtom);

  // Delete atom for dangerous operations
  const deleteQuiz = useAtomSet(deleteQuizAtom);

  // Version creation atom
  const createNewVersion = useAtomSet(createNewQuizVersionAtom);

  // Save temp quiz atom
  const saveTempQuiz = useAtomSet(saveTempQuizAtom);

  // Registry for optimistic updates
  const setEnginesAtom = useAtomSet(enginesAtom);

  // Handle creating new version with auto-selection
  const handleCreateNewVersion = (
    newVersion: string,
    incrementType: 'major' | 'minor' | 'patch',
    comment?: string,
  ) => {
    const currentQuiz = quizzes.find((q) => q.id === selectedQuizId);
    if (currentQuiz === undefined) return;

    // Create Version object with semver and comment
    const versionObject = new Version({
      semver: newVersion,
      comment,
    });

    if (currentQuiz.isTemp) {
      // Save temp quiz as official version with the new version info

      saveTempQuiz({
        quiz: currentQuiz,
        action: 'saveAsNew',
        newVersion: versionObject,
      });

      // Set expected version to auto-select the new official version
      setExpectedNewVersion(versionObject.semver);
    } else {
      // Create new version from existing quiz
      const expectedVersion = versionObject.semver;

      // The atom handles the async operation and toast notifications
      createNewVersion({
        quiz: currentQuiz,
        newVersion: versionObject,
        incrementType,
      });

      // Set expected version to auto-select when it appears
      setExpectedNewVersion(expectedVersion);
    }
  };

  // Initialize selections on first load - moved before early returns
  React.useEffect(() => {
    if (Result.isSuccess(quizzesResult) && Result.isSuccess(enginesResult)) {
      const quizzes = quizzesResult.value;
      const engines = enginesResult.value;

      // Always try to set quiz if not set or if current selection is invalid
      if (selectedQuizId === '' || !quizzes.some((q) => q.id === selectedQuizId)) {
        // Find "My Artist Type Quiz" versions and select the latest one
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
          // eslint-disable-next-line no-console
          console.log('🎯 Auto-selecting quiz:', defaultQuiz.title, defaultQuiz.version.semver);
          setSelectedQuizId(defaultQuiz.id);
        }
      }

      // Always try to set engine if not set or if current selection is invalid
      if (selectedEngineId === '' || !engines.some((e) => e.id === selectedEngineId)) {
        const activeEngine = engines.find((e) => e.isActive) ?? engines[0];
        if (activeEngine !== undefined) {
          // eslint-disable-next-line no-console
          console.log(
            '🎯 Auto-selecting engine:',
            activeEngine.name,
            activeEngine.isActive ? '(active)' : '',
          );
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

      // Force selection if we have data but no valid selections
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
          // eslint-disable-next-line no-console
          console.log('🔄 Fallback quiz selection:', defaultQuiz.title);
          setSelectedQuizId(defaultQuiz.id);
        }
      }

      if (
        engines.length > 0 &&
        (selectedEngineId === '' || !engines.some((e) => e.id === selectedEngineId))
      ) {
        const activeEngine = engines.find((e) => e.isActive) ?? engines[0];
        if (activeEngine !== undefined) {
          // eslint-disable-next-line no-console
          console.log('🔄 Fallback engine selection:', activeEngine.name);
          setSelectedEngineId(activeEngine.id);
        }
      }
    }
  }, [quizzesResult, enginesResult]);

  // Auto-sync engine selection when quiz selection changes
  React.useEffect(() => {
    if (Result.isSuccess(quizzesResult) && Result.isSuccess(enginesResult)) {
      const quizzes = quizzesResult.value;
      const engines = enginesResult.value; // Extract engines here
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
        // Apply the pending rating change
        updateEngineIdealAnswerOptimistic(currentEngine, pendingRating);
        setPendingRating(null); // Clear the pending rating
      }
    }
  }, [selectedEngineId, pendingRating, enginesResult]);

  // Auto-switch to new version when it's created
  React.useEffect(() => {
    if (Result.isSuccess(quizzesResult) && expectedNewVersion !== null) {
      const quizzes = quizzesResult.value;
      const currentQuiz = quizzes.find((q) => q.id === selectedQuizId);

      if (currentQuiz !== undefined) {
        // Handle both regular quizzes and temp quizzes (which have " (Editing)" suffix)
        const baseTitle = currentQuiz.title.replace(' (Editing)', '');

        const newVersionQuiz = quizzes.find(
          (q) =>
            (q.title === baseTitle || q.title === currentQuiz.title) &&
            q.version.semver === expectedNewVersion &&
            q.isTemp === false &&
            q.isPublished === false &&
            q.id !== selectedQuizId, // Don't select the same quiz
        );

        if (newVersionQuiz !== undefined) {
          setSelectedQuizId(newVersionQuiz.id);
          setExpectedNewVersion(null); // Clear the expected version
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
        // Find temp quizzes created from this original quiz
        const allTempQuizzes = quizzes.filter(
          (q) =>
            q.isTemp === true &&
            q.title === `${originalQuiz.title} (Editing)` &&
            q.version.semver === originalQuiz.version.semver,
        );

        // Only select temp quizzes that are NEW (not in our existing snapshot)
        const newTempQuizzes = allTempQuizzes.filter(
          (q) => !expectedTempQuiz.existingTempQuizIds.includes(q.id),
        );

        if (newTempQuizzes.length > 0) {
          // Get the newest temp quiz (most recently created based on ID)
          const newestTempQuiz = newTempQuizzes.sort((a, b) => b.id.localeCompare(a.id))[0];
          if (newestTempQuiz !== undefined) {
            setSelectedQuizId(newestTempQuiz.id);
            setExpectedTempQuiz(null); // Clear the expectation
          }
        }
      }
    }
  }, [quizzesResult, expectedTempQuiz, selectedQuizId]);

  // Early returns after all hooks
  if (!Result.isSuccess(quizzesResult) || !Result.isSuccess(enginesResult)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading quizzes and engines...</div>
      </div>
    );
  }

  const quizzes = quizzesResult.value;
  const engines = enginesResult.value;

  // Find the selected quiz
  const quiz =
    quizzes.find((q) => q.id === selectedQuizId) ??
    quizzes.find((q) => q.title.includes('My Artist Type'));

  if (quiz === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">No quiz found</div>
      </div>
    );
  }

  const questions = quiz.questions as Array<Question>;
  const selectedQuestion = questions[selectedQuestionIndex];

  // The ideal answers are now provided by the derived atom

  const handleSelectQuestion = (index: number) => {
    setSelectedQuestionIndex(index);
  };

  const handleRatingSelect = async (rating: number) => {
    // Get the current quiz and engine
    const currentQuiz = quizzes.find((q) => q.id === selectedQuizId);
    const currentEngine = engines.find((e) => e.id === selectedEngineId);
    if (currentQuiz === undefined || currentEngine === undefined || selectedQuestion === undefined)
      return;

    // Check if we're already working with a temp quiz
    const isWorkingWithTempQuiz = currentQuiz.isTemp === true;
    const hasMatchingTempEngine = currentEngine.isTemp === true;

    if (isWorkingWithTempQuiz && hasMatchingTempEngine) {
      // Already working with temp versions, just update the engine
      updateEngineIdealAnswerOptimistic(currentEngine, rating);
    } else if (isWorkingWithTempQuiz && !hasMatchingTempEngine) {
      // We have a temp quiz but no matching temp engine - this shouldn't happen
      // but let's handle it by just updating the current engine
      updateEngineIdealAnswerOptimistic(currentEngine, rating);
    } else {
      // Need to create temp versions first
      try {
        // 1. Set pending rating to apply after engine switches
        setPendingRating(rating);

        // Get existing temp quizzes for this original quiz BEFORE creating a new one
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
        }); // Track the original quiz ID and existing temp quiz IDs
        createTempQuiz({ quiz: currentQuiz });

        // The pending rating will be applied by the useEffect when the engine switches
      } catch {
        // Clear pending rating on error
        setPendingRating(null);
      }
    }
  };

  // Helper function to create updated engine with new ideal answer
  const createUpdatedEngine = (workingEngine: AnalysisEngine, rating: number) => {
    if (selectedQuestion === undefined) return workingEngine;

    // Find the artist type ending ID
    const artistTypeEndingId = `the-${selectedArtistType.toLowerCase()}-artist`;

    // Update the engine's endings to modify the question rules
    const updatedEndings = workingEngine.endings.map((ending) => {
      if (ending.endingId === artistTypeEndingId) {
        // Find or create the question rule for this question
        const existingRuleIndex = ending.questionRules.findIndex(
          (rule) => rule.questionId === selectedQuestion.id,
        );

        if (existingRuleIndex >= 0) {
          // Update existing rule
          const updatedRules = [...ending.questionRules];
          const existingRule = updatedRules[existingRuleIndex];
          if (existingRule !== undefined) {
            const currentIdealAnswers = existingRule.idealAnswers;
            let newIdealAnswers: Array<number>;

            if (existingRule.isPrimary) {
              // Primary artist type: Allow multiple selections (toggle behavior)
              if (currentIdealAnswers.includes(rating)) {
                // Remove rating if already selected
                newIdealAnswers = currentIdealAnswers.filter((r) => r !== rating);
              } else {
                // Add rating to existing selections
                newIdealAnswers = [...currentIdealAnswers, rating].sort((a, b) => a - b);
              }
            } else {
              // Secondary artist type: Only one selection allowed (replace behavior)
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

        // Create new rule - default to secondary (isPrimary: false)
        return {
          ...ending,
          questionRules: [
            ...ending.questionRules,
            {
              questionId: selectedQuestion.id,
              idealAnswers: [rating],
              isPrimary: false, // Default to secondary
            },
          ],
        };
      }
      return ending;
    });

    // Return the updated engine
    return {
      ...workingEngine,
      endings: updatedEndings,
    };
  };

  // Optimistic update for existing temp engine
  const updateEngineIdealAnswerOptimistic = (workingEngine: AnalysisEngine, rating: number) => {
    // 1. Immediately update local state (optimistic)
    const updatedEngine = createUpdatedEngine(workingEngine, rating);
    setEnginesAtom(EngineAction.Upsert({ engine: updatedEngine }));

    // 2. Persist to server in background
    autoSaveTempEngine({ engine: updatedEngine });
  };

  // Find the matching analysis engine for a given quiz using direct quizId reference
  const findMatchingEngine = (
    targetQuiz: Quiz,
    availableEngines: ReadonlyArray<AnalysisEngine>,
  ): AnalysisEngine | undefined => {
    // Simple direct lookup by quizId - this is much more reliable!
    const matchingEngine = availableEngines.find((engine) => engine.quizId === targetQuiz.id);

    if (matchingEngine !== undefined) {
      return matchingEngine;
    }

    return undefined;
  };

  // The currently selected values are now provided by the derived atom

  // Optimistic create temp engine and update

  const handleAddQuestion = () => {
    // TODO: Implement add question functionality
  };

  const handleClearDraft = () => {
    // Clear both temp quizzes and temp engines
    clearTempQuizzes();
    clearTempEngines();

    // Reset selection to first available non-temp quiz/engine
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

  const handleDeleteQuiz = async () => {
    if (!Result.isSuccess(quizzesResult)) return;

    const currentQuiz = quizzes.find((q) => q.id === selectedQuizId);
    if (currentQuiz === undefined) return;

    // Dangerous confirmation dialog
    const confirmed = window.confirm(
      `⚠️ DANGER: Delete "${currentQuiz.title}" v${currentQuiz.version}?\n\n` +
        `This action CANNOT be undone. The quiz and all its data will be permanently deleted.\n\n` +
        `Type "DELETE" in the next dialog to confirm.`,
    );

    if (!confirmed) return;

    // Double confirmation with text input
    const confirmText = window.prompt(
      `To confirm deletion of "${currentQuiz.title}", type "DELETE" (all caps):`,
    );

    if (confirmText !== 'DELETE') {
      if (confirmText !== null) {
        alert("Deletion cancelled. You must type exactly 'DELETE' to confirm.");
      }
      return;
    }

    deleteQuiz(currentQuiz.id);

    // The atom will handle the deletion and update the state automatically
    // Reset selection to first available quiz
    setTimeout(() => {
      const remainingQuizzes = quizzes.filter((q) => q.id !== currentQuiz.id);
      if (remainingQuizzes.length > 0) {
        const firstRemaining = remainingQuizzes[0];
        if (firstRemaining !== undefined) {
          setSelectedQuizId(firstRemaining.id);
        }
      }
    }, 100); // Small delay to allow atom to update
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

  // Get color class for progress bar (same as quiz-taker)
  const artistTypeColorClass = (
    _category?: string,
    colorOn?: boolean,
    questionIndex?: number,
  ): string => {
    if (colorOn !== true) return 'bg-white dark:bg-black';

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

    const artistTypeIndex = (questionIndex ?? 0) % artistTypes.length;
    const artistType = artistTypes[artistTypeIndex];

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
        selectedQuizId={selectedQuizId}
        selectedEngineId={selectedEngineId}
        selectedArtistType={selectedArtistType}
        onQuizChange={(quizId) => {
          setSelectedQuizId(quizId);
        }}
        onArtistTypeChange={setSelectedArtistType}
        onClearDraft={handleClearDraft}
        onCreateNewVersion={handleCreateNewVersion}
        onDeleteQuiz={handleDeleteQuiz}
      />

      {/* Main Content Area */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar - Quiz + Analysis tabs */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={35} className="min-w-[220px]">
          <LeftSidebar
            engines={engines}
            questions={questions}
            selectedQuestionIndex={selectedQuestionIndex}
            selectedArtistType={selectedArtistType}
            selectedEngineId={selectedEngineId}
            onSelectQuestion={handleSelectQuestion}
            onAddQuestion={handleAddQuestion}
            onArtistTypeChange={setSelectedArtistType}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Middle Section - Question Preview */}
        <ResizablePanel defaultSize={sidebarVisible ? 50 : 75}>
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

            {/* Question Card (using the same one from quiz-taker) */}
            <div className="flex-1 flex items-center justify-center">
              {selectedQuestion !== undefined ? (
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
                  selectedValues={currentSelectedValues} // Show multiple selections for primary artist types
                  idealAnswers={currentQuestionIdealAnswers} // Use the ideal answers from the selected engine
                  showIdealAnswers={showIdealAnswers}
                  onRatingSelect={handleRatingSelect} // Handle rating selection
                  onBack={handlePreviousQuestion}
                  onNext={handleNextQuestion}
                  onSubmit={() => {}} // No-op in editor
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
        </ResizablePanel>

        {sidebarVisible && (
          <>
            <ResizableHandle withHandle />

            {/* Right Sidebar - Graphs */}
            <ResizablePanel defaultSize={25} minSize={20} maxSize={35} className="min-w-[280px]">
              <RightSidebar quiz={quiz} engines={engines} selectedEngineId={selectedEngineId} />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
};
