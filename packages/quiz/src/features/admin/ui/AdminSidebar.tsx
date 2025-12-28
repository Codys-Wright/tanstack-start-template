"use client";

import { Atom } from "@effect-atom/atom-react";
import { BrowserKeyValueStore } from "@effect/platform-browser";
import {
  IconBuilding,
  IconChartBar,
  IconDashboard,
  IconFileText,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";
import { Schema } from "effect";
import * as React from "react";

import { NavMain, NavSecondary, NavUser, Sidebar } from "@shadcn";

// Create a runtime for localStorage atoms
const localStorageRuntime = Atom.runtime(BrowserKeyValueStore.layerLocalStorage);

// Admin sidebar visibility atom using localStorage
export const adminSidebarVisibleAtom = Atom.kvs({
  runtime: localStorageRuntime,
  key: "admin-sidebar-visible",
  schema: Schema.Boolean,
  defaultValue: () => true,
});

const adminData = {
  user: {
    name: "Admin User",
    email: "admin@example.com",
    avatar: "/placeholder-avatar.png",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: IconDashboard,
    },
    {
      title: "Quiz Responses",
      url: "/admin/responses",
      icon: IconFileText,
      disabled: true,
      tooltip: "Coming Soon!",
    },
    {
      title: "Analytics",
      url: "/admin/analytics",
      icon: IconChartBar,
      disabled: true,
      tooltip: "Coming Soon!",
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: IconUsers,
      disabled: true,
      tooltip: "Authentication is disabled right now",
    },
    {
      title: "Organization",
      url: "/admin/organizations",
      icon: IconBuilding,
      disabled: true,
      tooltip: "Authentication is disabled right now",
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/admin/settings",
      icon: IconSettings,
      disabled: true,
      tooltip: "Authentication is disabled right now",
    },
  ],
};

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
        <NavMain items={adminData.navMain} />
        <NavSecondary items={adminData.navSecondary} className="mt-auto" />
      </Sidebar.Content>
      <Sidebar.Footer>
        <NavUser user={adminData.user} />
      </Sidebar.Footer>
    </Sidebar>
  );
}
