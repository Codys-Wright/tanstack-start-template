import { Result } from '@effect-atom/atom-react';
import type {
  AnalysisEngine,
  EndingDefinition,
  QuestionRule,
} from '@/features/analysis-engine/domain/schema.js';
import type { Question } from '@/features/quiz/questions/schema.js';
import type { Quiz } from '@/features/quiz/domain/schema.js';
import { enginesAtom } from '@/features/analysis-engine/client/atoms.js';
import { quizzesAtom } from '@/features/quiz/client/atoms.js';

// Generate consistent random colors for temp/edit badges based on quiz ID
export const getTempBadgeColor = (quizId: string): string => {
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
export const getDisplayVersion = (quiz: Quiz, allQuizzes: ReadonlyArray<Quiz>): string => {
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
export const hasQuizChanged = (currentQuiz: Quiz, allQuizzes: ReadonlyArray<Quiz>): boolean => {
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
export const getIdealAnswersForCurrentSelection = (
  quizzesResult: ReturnType<typeof quizzesAtom.read>,
  enginesResult: ReturnType<typeof enginesAtom.read>,
  selectedQuizId: string,
  _selectedEngineId: string,
  selectedQuestionIndex: number,
) => {
  if (!Result.isSuccess(quizzesResult) || !Result.isSuccess(enginesResult)) {
    return [];
  }

  const quizzes = quizzesResult.value;
  const engines = enginesResult.value;

  const selectedQuiz = quizzes.find((q: Quiz) => q.id === selectedQuizId);
  if (selectedQuiz === undefined) {
    return [];
  }

  // Find the engine that matches this quiz by quizId (strict - no fallbacks)
  const matchingEngine = engines.find((e: AnalysisEngine) => e.quizId === selectedQuiz.id);

  if (matchingEngine === undefined) {
    // No engine for this quiz version - return empty (data needs to be fixed)
    return [];
  }

  const questions = selectedQuiz.questions as Array<Question>;
  const selectedQuestion = questions[selectedQuestionIndex];

  if (selectedQuestion === undefined) {
    return [];
  }

  // Get ideal answers for the current question using the matching engine
  const idealAnswers = matchingEngine.endings.flatMap((ending: EndingDefinition) =>
    ending.questionRules
      .filter((rule: QuestionRule) => rule.questionId === selectedQuestion.id)
      .map((rule: QuestionRule) => ({
        endingId: ending.endingId,
        endingName: ending.name,
        idealAnswers: [...rule.idealAnswers],
        isPrimary: rule.isPrimary,
      })),
  );

  return idealAnswers;
};

// Helper function to get selected values for the current selection
export const getSelectedValuesForCurrentSelection = (
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

// Artist types list
export const artistTypes = [
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
] as const;

export type ArtistType = (typeof artistTypes)[number];

// Get CSS classes for artist type color tinting
// Uses the global CSS variables defined for each artist type
export const getArtistTypeColorStyle = (
  artistType: string,
): { backgroundColor: string; borderColor: string } => {
  const varName = `--artist-${artistType.toLowerCase()}`;
  return {
    backgroundColor: `color-mix(in srgb, var(${varName}) 15%, transparent)`,
    borderColor: `color-mix(in srgb, var(${varName}) 40%, transparent)`,
  };
};

// Get inline style for artist type text color
export const getArtistTypeTextStyle = (artistType: string): { color: string } => {
  const varName = `--artist-${artistType.toLowerCase()}`;
  return {
    color: `var(${varName})`,
  };
};
