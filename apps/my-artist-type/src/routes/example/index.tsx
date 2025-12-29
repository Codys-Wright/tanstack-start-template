import { FeaturesPage, loadFeatures } from '@example';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/example/')({
  loader: () => loadFeatures(),
  component: FeaturesPageWrapper,
});

function FeaturesPageWrapper() {
  const loaderData = Route.useLoaderData();
  return <FeaturesPage loaderData={loaderData} />;
}
