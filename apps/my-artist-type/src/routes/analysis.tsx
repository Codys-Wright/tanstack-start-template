import { createFileRoute } from '@tanstack/react-router';
import { AnalysisPage } from '@quiz';

/**
 * Analysis route - displays quiz results and artist type analysis
 * Shows after user completes the quiz
 */
export const Route = createFileRoute('/analysis')({
  component: AnalysisPage,
});
