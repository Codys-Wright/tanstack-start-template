import { Atom } from '@effect-atom/atom-react';
import * as BrowserKeyValueStore from '@effect/platform-browser/BrowserKeyValueStore';
import * as Schema from 'effect/Schema';

// Create a runtime for localStorage atoms
export const localStorageRuntime = Atom.runtime(BrowserKeyValueStore.layerLocalStorage);

// Atoms for dropdown selections - persisted to localStorage
export const selectedQuizIdAtom = Atom.kvs({
  runtime: localStorageRuntime,
  key: 'quiz-editor-selected-quiz-id',
  schema: Schema.String,
  defaultValue: () => '',
});

export const selectedEngineIdAtom = Atom.kvs({
  runtime: localStorageRuntime,
  key: 'quiz-editor-selected-engine-id',
  schema: Schema.String,
  defaultValue: () => '',
});

export const selectedArtistTypeAtom = Atom.kvs({
  runtime: localStorageRuntime,
  key: 'quiz-editor-selected-artist-type',
  schema: Schema.String,
  defaultValue: () => 'visionary',
});

export const selectedQuestionIndexAtom = Atom.kvs({
  runtime: localStorageRuntime,
  key: 'quiz-editor-selected-question-index',
  schema: Schema.Number,
  defaultValue: () => 0,
});

export const showIdealAnswersAtom = Atom.kvs({
  runtime: localStorageRuntime,
  key: 'quiz-editor-show-ideal-answers',
  schema: Schema.Boolean,
  defaultValue: () => true,
});

// Define sidebar view schemas
export const LeftSidebarViewSchema = Schema.Literal('quiz', 'analysis');

export const leftSidebarViewAtom = Atom.kvs({
  runtime: localStorageRuntime,
  key: 'quiz-editor-left-sidebar-view',
  schema: LeftSidebarViewSchema,
  defaultValue: () => 'quiz' as const,
});

export const sidebarVisibleAtom = Atom.kvs({
  runtime: localStorageRuntime,
  key: 'quiz-editor-sidebar-visible',
  schema: Schema.Boolean,
  defaultValue: () => true,
});

// Define schema for re-analysis chart data
export const ChartDataSchema = Schema.Array(
  Schema.Struct({
    type: Schema.String,
    count: Schema.Number,
    fill: Schema.String,
  }),
);

export const reanalysisDataAtom = Atom.kvs({
  runtime: localStorageRuntime,
  key: 'quiz-editor-reanalysis-data',
  schema: Schema.NullOr(ChartDataSchema),
  defaultValue: () => null,
});

// Analysis config atom using the service's AnalysisConfig structure
export const analysisConfigAtom = Atom.kvs({
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

// Transient state atoms (not persisted)
export const pendingRatingAtom = Atom.make<number | null>(null).pipe(Atom.keepAlive);
export const expectedNewVersionAtom = Atom.make<string | null>(null).pipe(Atom.keepAlive);
export const expectedTempQuizAtom = Atom.make<{
  originalQuizId: string;
  existingTempQuizIds: Array<string>;
} | null>(null).pipe(Atom.keepAlive);
export const isCreatingTempAtom = Atom.make<boolean>(false).pipe(Atom.keepAlive);
