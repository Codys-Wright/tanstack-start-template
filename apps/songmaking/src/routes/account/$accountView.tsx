import { createFileRoute } from '@tanstack/react-router';
import { AccountView } from '@auth';

export const Route = createFileRoute('/account/$accountView' as any)({
  component: AccountPage,
  beforeLoad: ({ context }) => {
    // TODO: Check if user is authenticated
    // If not, redirect to sign-in
  },
});

function AccountPage() {
  const { accountView } = Route.useParams();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
        <AccountView pathname={accountView} basePath="/account" />
      </div>
    </div>
  );
}
