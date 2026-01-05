import { createFileRoute, Link } from '@tanstack/react-router';
import { SignInForm, SignUpForm } from '@auth';
import { Music } from 'lucide-react';

// Search params schema for redirect after auth
interface AuthSearchParams {
  redirect?: string;
}

export const Route = createFileRoute('/auth/$authView')({
  component: AuthPage,
  validateSearch: (search: Record<string, unknown>): AuthSearchParams => {
    return {
      redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
    };
  },
});

function AuthPage() {
  const { authView } = Route.useParams();
  const { redirect } = Route.useSearch();

  // Default redirect to home if not specified
  const redirectTo = redirect || '/';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 mb-8 hover:opacity-80 transition-opacity">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
          <Music className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-bold text-xl">Songmaking</span>
      </Link>

      <div className="w-full max-w-md">
        {authView === 'sign-in' && <SignInForm redirectTo={redirectTo} />}
        {authView === 'sign-up' && <SignUpForm redirectTo={redirectTo} />}
        {authView !== 'sign-in' && authView !== 'sign-up' && (
          <div className="text-center text-muted-foreground">
            <p>Unknown auth view: {authView}</p>
            <Link
              to="/auth/$authView"
              params={{ authView: 'sign-in' }}
              className="text-primary hover:underline"
            >
              Go to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
