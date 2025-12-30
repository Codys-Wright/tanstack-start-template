import { AuthView } from '@auth';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/auth/$authView')({
  component: AuthPage,
});

function AuthPage() {
  const { authView } = Route.useParams();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AuthView pathname={authView} />
    </div>
  );
}
