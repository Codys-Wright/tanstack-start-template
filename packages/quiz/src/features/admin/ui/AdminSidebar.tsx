'use client';

import { Atom, Result, useAtomValue } from '@effect-atom/atom-react';
import * as BrowserKeyValueStore from '@effect/platform-browser/BrowserKeyValueStore';
import {
  IconBuilding,
  IconChartBar,
  IconDashboard,
  IconEdit,
  IconFileText,
  IconPlayerPlay,
  IconSettings,
  IconUsers,
} from '@tabler/icons-react';
import * as Schema from 'effect/Schema';
import * as React from 'react';

import { sessionAtom } from '@auth';
import { NavMain, NavSecondary, NavUser, Sidebar, Skeleton } from '@shadcn';

// Create a runtime for localStorage atoms
const localStorageRuntime = Atom.runtime(BrowserKeyValueStore.layerLocalStorage);

// Admin sidebar visibility atom using localStorage
export const adminSidebarVisibleAtom = Atom.kvs({
  runtime: localStorageRuntime,
  key: 'admin-sidebar-visible',
  schema: Schema.Boolean,
  defaultValue: () => true,
});

const adminNavData = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/admin',
      icon: IconDashboard,
    },
    {
      title: 'Current Quiz',
      url: '/admin/current-quiz',
      icon: IconPlayerPlay,
    },
    {
      title: 'Quiz Editor',
      url: '/admin/quiz-editor',
      icon: IconEdit,
    },
    {
      title: 'Quiz Responses',
      url: '/admin/responses',
      icon: IconFileText,
      disabled: true,
      tooltip: 'Coming Soon!',
    },
    {
      title: 'Analytics',
      url: '/admin/analytics',
      icon: IconChartBar,
      disabled: true,
      tooltip: 'Coming Soon!',
    },
    {
      title: 'Users',
      url: '/admin/users',
      icon: IconUsers,
      disabled: true,
      tooltip: 'Authentication is disabled right now',
    },
    {
      title: 'Organization',
      url: '/admin/organizations',
      icon: IconBuilding,
      disabled: true,
      tooltip: 'Authentication is disabled right now',
    },
  ],
  navSecondary: [
    {
      title: 'Settings',
      url: '/admin/settings',
      icon: IconSettings,
      disabled: true,
      tooltip: 'Authentication is disabled right now',
    },
  ],
};

/**
 * Skeleton loading state for the NavUser component
 */
function NavUserSkeleton() {
  return (
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="grid flex-1 gap-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  );
}

/**
 * NavUser component that displays the current authenticated user's info
 */
function NavUserWithSession() {
  const sessionResult = useAtomValue(sessionAtom);

  // Show skeleton while loading
  if (!Result.isSuccess(sessionResult)) {
    return <NavUserSkeleton />;
  }

  // Show skeleton if no user data yet
  if (!sessionResult.value?.user) {
    return <NavUserSkeleton />;
  }

  const authUser = sessionResult.value.user;
  const user = {
    name: authUser.name || 'Unknown User',
    email: authUser.email || '',
    avatar: authUser.image || '/placeholder-avatar.png',
  };

  return <NavUser user={user} />;
}

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <Sidebar.Header>
        <Sidebar.Menu>
          <Sidebar.MenuItem>
            <Sidebar.MenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="/">
                <img
                  src="/svgs/MyArtistTypeLogo.svg"
                  alt="My Artist Type Logo"
                  width={24}
                  height={24}
                  className="dark:brightness-0 dark:invert"
                />
                <span className="text-base font-semibold">My Artist Type</span>
              </a>
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>
        </Sidebar.Menu>
      </Sidebar.Header>
      <Sidebar.Content>
        <NavMain items={adminNavData.navMain} />
        <NavSecondary items={adminNavData.navSecondary} className="mt-auto" />
      </Sidebar.Content>
      <Sidebar.Footer>
        <NavUserWithSession />
      </Sidebar.Footer>
    </Sidebar>
  );
}
