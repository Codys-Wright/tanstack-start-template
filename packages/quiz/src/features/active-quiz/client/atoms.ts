// Active Quiz Client Atoms
// TODO: This file needs to be properly implemented once the ApiClient and runtime are set up

import type { Quiz } from '@/features/quiz/domain/schema.js';
import type {
  InteractionLog,
  QuizSession,
  SessionMetadata,
} from '@/features/responses/domain/schema.js';

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

// Placeholder exports - these need to be properly implemented
// once the Atom runtime and ApiClient infrastructure is in place

export type QuizSessionState = QuizSession & {
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
