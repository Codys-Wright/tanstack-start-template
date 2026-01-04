import { LinkAccountCard } from '@auth';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/account/link-account')({
  component: LinkAccountPage,
});

function LinkAccountPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Link Accounts</h1>
          <p className="text-muted-foreground">
            Connect additional sign-in methods to your account.
          </p>
        </div>
        <LinkAccountCard />
      </div>
    </div>
  );
}
