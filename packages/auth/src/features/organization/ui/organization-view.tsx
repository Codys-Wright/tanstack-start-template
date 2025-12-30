import { cn, Button } from '@shadcn';
import { Link } from '@tanstack/react-router';
import { OrganizationSettingsCards } from './organization-settings-cards.js';
import { OrganizationMembersCard } from './organization-members-card.js';

export type OrganizationViewPath = 'SETTINGS' | 'MEMBERS' | 'TEAMS' | 'API_KEYS';

export interface OrganizationViewProps {
  className?: string;
  classNames?: {
    base?: string;
    cards?: string;
    drawer?: { menuItem?: string };
    sidebar?: { base?: string; button?: string; buttonActive?: string };
    card?: Record<string, string>;
  };
  pathname?: string;
  view?: OrganizationViewPath;
  hideNav?: boolean;
  /**
   * Organization slug for slug-based routing
   */
  slug?: string;
  /**
   * Base path for organization routes
   * @default "/organization"
   */
  basePath?: string;
}

const viewPaths: Record<OrganizationViewPath, string> = {
  SETTINGS: 'settings',
  MEMBERS: 'members',
  TEAMS: 'teams',
  API_KEYS: 'api-keys',
};

/**
 * OrganizationView - Renders the appropriate organization settings view based on the pathname
 *
 * Supports the following views:
 * - settings: Organization profile settings (name, slug, logo)
 * - members: Organization members management
 * - teams: Teams within the organization (if enabled)
 * - api-keys: Organization API keys (if enabled)
 *
 * @example
 * ```tsx
 * // In your route file:
 * function OrganizationPage() {
 *   const { organizationView } = Route.useParams();
 *   return <OrganizationView pathname={organizationView} />;
 * }
 * ```
 */
export function OrganizationView({
  className,
  classNames,
  pathname,
  view: viewProp,
  hideNav = false,
  slug,
  basePath = '/organization',
}: OrganizationViewProps) {
  // Determine current view from pathname or prop
  const path = pathname?.split('/').pop();
  const view = viewProp || getViewByPath(path) || 'SETTINGS';

  // TODO: Add authentication check - redirect if not authenticated
  // TODO: Add organization check - redirect if no active organization

  const navItems: { view: OrganizationViewPath; label: string }[] = [
    { view: 'SETTINGS', label: 'Settings' },
    { view: 'MEMBERS', label: 'Members' },
    // TODO: Conditionally show based on feature flags
    // { view: 'TEAMS', label: 'Teams' },
    // { view: 'API_KEYS', label: 'API Keys' },
  ];

  // Build path with optional slug
  const buildPath = (viewPath: string) => {
    if (slug) {
      return `${basePath}/${slug}/${viewPath}`;
    }
    return `${basePath}/${viewPath}`;
  };

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
              <Link key={item.view} to={buildPath(viewPaths[item.view])}>
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
        {view === 'SETTINGS' && <OrganizationSettingsCards />}
        {view === 'MEMBERS' && <OrganizationMembersCard />}
        {view === 'TEAMS' && <TeamsPlaceholder />}
        {view === 'API_KEYS' && <ApiKeysPlaceholder />}
      </div>
    </div>
  );
}

function getViewByPath(path?: string): OrganizationViewPath | undefined {
  if (!path) return undefined;
  const entry = Object.entries(viewPaths).find(([_, p]) => p === path);
  return entry ? (entry[0] as OrganizationViewPath) : undefined;
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

function ApiKeysPlaceholder() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <p>Organization API keys coming soon...</p>
    </div>
  );
}
