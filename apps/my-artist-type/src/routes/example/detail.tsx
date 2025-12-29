import { FeatureDetailPage, loadFeatureById } from '@example';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/example/$featureId')({
  loader: ({ params }) => loadFeatureById(params.featureId),
  component: FeatureDetailPageWrapper,
});

function FeatureDetailPageWrapper() {
  const loaderData = Route.useLoaderData();
  return <FeatureDetailPage loaderData={loaderData} />;
}
