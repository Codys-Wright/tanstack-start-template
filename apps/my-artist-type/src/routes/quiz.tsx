import { createFileRoute } from '@tanstack/react-router';
import { QuizTakerPage, QuizTakerPageSkeleton, loadQuizTaker } from '@quiz';

/**
 * Main quiz route - the primary quiz-taking experience with styled background
 * This is the public-facing quiz page with SSR hydration for instant loading.
 */
export const Route = createFileRoute('/quiz')({
  loader: () => loadQuizTaker(),
  component: QuizPageWrapper,
  pendingComponent: QuizPagePending,
});

function QuizPageWrapper() {
  const loaderData = Route.useLoaderData();
  return <QuizTakerPage loaderData={loaderData} />;
}

function QuizPagePending() {
  return <QuizTakerPageSkeleton />;
}
