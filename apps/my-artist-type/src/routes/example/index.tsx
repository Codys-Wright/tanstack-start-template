import { createFileRoute } from '@tanstack/react-router';
import { FeaturesRoute } from '@example';

export const Route = createFileRoute('/example/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <main className="container mx-auto p-4 md:p-6">
      <FeaturesRoute />
    </main>
  );
}
