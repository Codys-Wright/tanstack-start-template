import { Link, useRouterState } from "@tanstack/react-router";
import { cn, Badge, Button } from "@shadcn";
import { sessionAtom, signOutAtom } from "@/features/auth/client";
import { useAtomValue, useAtom, Result } from "@effect-atom/atom-react";

const navItems = [
  { path: "/", label: "Home" },
  { path: "/about", label: "About" },
  { path: "/settings", label: "Settings" },
  { path: "/test", label: "Test Page" },
  { path: "/auth-test", label: "Auth Test" },
];

export function Navigation() {
  const router = useRouterState();
  const currentPath = router.location.pathname;
  
  // Use Effect-Atom for session state
  const sessionResult = useAtomValue(sessionAtom);
  const [_signOutResult, signOut] = useAtom(signOutAtom);

  // Extract session from Result type
  const session = Result.isSuccess(sessionResult) ? sessionResult.value : null;
  const loading = Result.isInitial(sessionResult);

  const handleSignOut = () => {
    signOut();
    // Note: Better to navigate after signOut succeeds, but keeping simple for now
    window.location.href = "/login";
  };

  return (
    <nav className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            {navItems.map((item) => {
              const isActive = currentPath === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    isActive
                      ? "text-foreground border-b-2 border-primary pb-1"
                      : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {loading ? (
              <Badge variant="outline">Loading...</Badge>
            ) : session?.user ? (
              <>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="default" className="font-mono text-xs">
                    User ID: {session.user.id.substring(0, 8)}...
                  </Badge>
                  {session.user.email && (
                    <span className="text-xs text-muted-foreground">
                      {session.user.email}
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button variant="default" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
