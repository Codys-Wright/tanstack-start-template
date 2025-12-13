import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@shadcn";

const navItems = [
  { path: "/", label: "Home" },
  { path: "/about", label: "About" },
  { path: "/settings", label: "Settings" },
  { path: "/test", label: "Test Page" },
];

export function Navigation() {
  const router = useRouterState();
  const currentPath = router.location.pathname;

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
        </div>
      </div>
    </nav>
  );
}
