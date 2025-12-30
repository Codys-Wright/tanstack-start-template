import { UserButton } from '@auth';
import { Button, cn, DropdownMenu } from '@shadcn';
import { Link, useRouterState } from '@tanstack/react-router';
import { ChevronDownIcon } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/about', label: 'About' },
  { path: '/settings', label: 'Settings' },
  { path: '/test', label: 'Test Page' },
  { path: '/auth-test', label: 'Auth Test' },
];

const authPages = [
  { path: '/auth/sign-in', label: 'Sign In' },
  { path: '/auth/sign-up', label: 'Sign Up' },
  { path: '/auth/forgot-password', label: 'Forgot Password' },
  { path: '/auth/reset-password', label: 'Reset Password' },
  { path: '/auth/two-factor', label: 'Two-Factor Auth' },
  { path: '/auth/recover-account', label: 'Recover Account' },
  { path: '/auth/callback', label: 'OAuth Callback' },
];

const accountPages = [
  { path: '/account/settings', label: 'Account Settings' },
  { path: '/account/security', label: 'Security' },
  { path: '/account/api-keys', label: 'API Keys' },
];

const organizationPages = [
  { path: '/organization/settings', label: 'Org Settings' },
  { path: '/organization/members', label: 'Members' },
  { path: '/organization/invitations', label: 'Invitations' },
  { path: '/organization/teams', label: 'Teams' },
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
                    'text-sm font-medium transition-colors hover:text-primary',
                    isActive
                      ? 'text-foreground border-b-2 border-primary pb-1'
                      : 'text-muted-foreground',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* Dev Pages Dropdown */}
            <DropdownMenu>
              <DropdownMenu.Trigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  Dev Pages
                  <ChevronDownIcon className="size-4" />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="start" className="w-56">
                <DropdownMenu.Label>Auth Pages</DropdownMenu.Label>
                {authPages.map((page) => (
                  <DropdownMenu.Item key={page.path}>
                    <a href={page.path} className="cursor-pointer block w-full">
                      {page.label}
                    </a>
                  </DropdownMenu.Item>
                ))}

                <DropdownMenu.Separator />

                <DropdownMenu.Label>Account Pages</DropdownMenu.Label>
                {accountPages.map((page) => (
                  <DropdownMenu.Item key={page.path}>
                    <a href={page.path} className="cursor-pointer block w-full">
                      {page.label}
                    </a>
                  </DropdownMenu.Item>
                ))}

                <DropdownMenu.Separator />

                <DropdownMenu.Label>Organization Pages</DropdownMenu.Label>
                {organizationPages.map((page) => (
                  <DropdownMenu.Item key={page.path}>
                    <a href={page.path} className="cursor-pointer block w-full">
                      {page.label}
                    </a>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu>
          </div>

          {/* User Button */}
          <UserButton />
        </div>
      </div>
    </nav>
  );
}
