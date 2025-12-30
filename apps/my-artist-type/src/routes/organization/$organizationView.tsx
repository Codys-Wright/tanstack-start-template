import { OrganizationView } from '@auth';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/organization/$organizationView')({
  component: OrganizationPage,
});

function OrganizationPage() {
  const { organizationView } = Route.useParams();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Organization Settings</h1>
        <OrganizationView pathname={organizationView} basePath="/organization" />
      </div>
    </div>
  );
}
