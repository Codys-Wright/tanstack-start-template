import { createFileRoute } from '@tanstack/react-router';
import { MyResponsePage, MyResponsePageSkeleton, loadMyResponse } from '@quiz';

/**
 * My Response route - displays quiz results for a specific response.
 * This is the page users are redirected to after completing the quiz.
 */
export const Route = createFileRoute('/my-response/$responseId')({
  loader: ({ params }) => loadMyResponse({ data: { responseId: params.responseId } }),
  component: MyResponsePageWrapper,
  pendingComponent: MyResponsePagePending,
});

function MyResponsePageWrapper() {
  const { responseId } = Route.useParams();
  const loaderData = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <MyResponsePage responseId={responseId} loaderData={loaderData} />
    </div>
  );
}

function MyResponsePagePending() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <MyResponsePageSkeleton />
    </div>
  );
}
