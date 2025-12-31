import { createFileRoute } from '@tanstack/react-router';
import { QuizTakerPage, QuizTakerPageSkeleton } from '@quiz';

/**
 * Standalone quiz taker route - plain quiz experience without background
 * Useful for embedded or minimal quiz display
 */
export const Route = createFileRoute('/quiz-taker')({
  component: QuizTakerPage,
  pendingComponent: QuizTakerPageSkeleton,
});
