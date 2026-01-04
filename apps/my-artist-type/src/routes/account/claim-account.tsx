import { ClaimAccountForm } from '@auth';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/account/claim-account')({
  component: ClaimAccountPage,
});

function ClaimAccountPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-md mx-auto">
        <ClaimAccountForm callbackURL="/account/settings" />
      </div>
    </div>
  );
}
