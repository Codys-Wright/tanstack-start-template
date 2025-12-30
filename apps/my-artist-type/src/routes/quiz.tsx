import { createFileRoute } from '@tanstack/react-router';
import { QuizTakerPage, loadQuizTaker } from '@quiz';

/**
 * Main quiz route - the primary quiz-taking experience with styled background
 * This is the public-facing quiz page with SSR hydration for instant loading.
 */
export const Route = createFileRoute('/quiz')({
  loader: () => loadQuizTaker(),
  component: QuizPageWrapper,
});

function QuizPageWrapper() {
  const loaderData = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <QuizTakerPage loaderData={loaderData} />
    </div>
  );
}
