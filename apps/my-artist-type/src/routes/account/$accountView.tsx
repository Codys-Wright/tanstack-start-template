import { AccountView } from '@auth';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/account/$accountView')({
  beforeLoad: async ({ context }) => {
    // Get session from context if available, otherwise check atom state
    // For SSR, we need to handle the case where session isn't hydrated yet
  },
  component: AccountPage,
});

function AccountPage() {
  const { accountView } = Route.useParams();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Account Settings</h1>
        <AccountView pathname={accountView} basePath="/account" showOrganizations={false} />
      </div>
    </div>
  );
}
