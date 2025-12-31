import { cn, Button } from '@shadcn';
import { Link } from '@tanstack/react-router';
import { AccountSettingsCards } from './account-settings-cards.js';
import { SecuritySettingsCards } from './security-settings-cards.js';
import { OrganizationsCard } from '@auth/features/organization/ui/organizations-card.js';
import { UserInvitationsCard } from '@auth/features/invitation/ui/user-invitations-card.js';

export type AccountViewPath = 'SETTINGS' | 'SECURITY' | 'TEAMS' | 'API_KEYS' | 'ORGANIZATIONS';

export interface AccountViewProps {
  className?: string;
  classNames?: {
    base?: string;
    cards?: string;
    drawer?: { menuItem?: string };
    sidebar?: { base?: string; button?: string; buttonActive?: string };
    card?: Record<string, string>;
  };
  pathname?: string;
  view?: AccountViewPath;
  hideNav?: boolean;
  showTeams?: boolean;
  /**
   * Whether to show the organizations section
   * @default true
   */
  showOrganizations?: boolean;
  /**
   * Whether to show the security section
   * @default true
   */
  showSecurity?: boolean;
  /**
   * Base path for account routes
   * @default "/account"
   */
  basePath?: string;
}

const viewPaths: Record<AccountViewPath, string> = {
  SETTINGS: 'settings',
  SECURITY: 'security',
  TEAMS: 'teams',
  API_KEYS: 'api-keys',
  ORGANIZATIONS: 'organizations',
};

/**
 * AccountView - Renders the appropriate account settings view based on the pathname
 *
 * Supports the following views:
 * - settings: Account profile settings (name, email, avatar)
 * - security: Password, 2FA, sessions, passkeys
 * - teams: User's teams (if enabled)
 * - api-keys: API key management (if enabled)
 * - organizations: Organization management
 *
 * @example
 * ```tsx
 * // In your route file:
 * function AccountPage() {
 *   const { accountView } = Route.useParams();
 *   return <AccountView pathname={accountView} />;
 * }
 * ```
 */
export function AccountView({
  className,
  classNames,
  pathname,
  view: viewProp,
  hideNav = false,
  showTeams = false,
  showOrganizations = true,
  showSecurity = true,
  basePath = '/account',
}: AccountViewProps) {
  // Determine current view from pathname or prop
  const path = pathname?.split('/').pop();
  const view = viewProp || getViewByPath(path) || 'SETTINGS';

  // Build nav items based on feature flags
  const navItems: { view: AccountViewPath; label: string }[] = [
    { view: 'SETTINGS', label: 'Account' },
    ...(showSecurity ? [{ view: 'SECURITY' as const, label: 'Security' }] : []),
    // TODO: Conditionally show based on feature flags
    // { view: 'TEAMS', label: 'Teams' },
    ...(showOrganizations ? [{ view: 'ORGANIZATIONS' as const, label: 'Organizations' }] : []),
  ];

  return (
    <div
      className={cn(
        'flex w-full grow flex-col gap-4 md:flex-row md:gap-12',
        className,
        classNames?.base,
      )}
    >
      {/* Mobile Navigation */}
      {!hideNav && (
        <div className="flex justify-between gap-2 md:hidden">
          <span className="font-semibold text-base">
            {navItems.find((i) => i.view === view)?.label}
          </span>
          {/* TODO: Add Drawer component for mobile nav */}
        </div>
      )}

      {/* Desktop Sidebar Navigation */}
      {!hideNav && (
        <div className="hidden md:block">
          <div className={cn('flex w-48 flex-col gap-1 lg:w-60', classNames?.sidebar?.base)}>
            {navItems.map((item) => (
              <Link key={item.view} to={`${basePath}/${viewPaths[item.view]}`}>
                <Button
                  size="lg"
                  className={cn(
                    'w-full justify-start px-4 transition-none',
                    classNames?.sidebar?.button,
                    view === item.view ? 'font-semibold' : 'text-foreground/70',
                    view === item.view && classNames?.sidebar?.buttonActive,
                  )}
                  variant="ghost"
                >
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className={cn('flex-1', classNames?.cards)}>
        {view === 'SETTINGS' && <AccountSettingsCards />}
        {view === 'SECURITY' && showSecurity && <SecuritySettingsCards />}
        {view === 'TEAMS' && showTeams && <TeamsPlaceholder />}
        {view === 'ORGANIZATIONS' && showOrganizations && (
          <div className="space-y-4 md:space-y-6">
            <OrganizationsCard />
            <UserInvitationsCard />
          </div>
        )}
      </div>
    </div>
  );
}

function getViewByPath(path?: string): AccountViewPath | undefined {
  if (!path) return undefined;
  const entry = Object.entries(viewPaths).find(([_, p]) => p === path);
  return entry ? (entry[0] as AccountViewPath) : undefined;
}

// ============================================================================
// Placeholder Components - Replace with actual implementations when ready
// ============================================================================

function TeamsPlaceholder() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <p>Teams feature coming soon...</p>
    </div>
  );
}
