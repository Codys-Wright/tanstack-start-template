'use client';

import { type Icon } from '@tabler/icons-react';

import { Sidebar } from './sidebar';

export function NavSecondary({
  items,
  ...props
}: {
  items: Array<{
    title: string;
    url: string;
    icon: Icon;
    disabled?: boolean;
    tooltip?: string;
  }>;
} & React.ComponentPropsWithoutRef<typeof Sidebar.Group>) {
  return (
    <Sidebar.Group {...props}>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          {items.map((item) => (
            <Sidebar.MenuItem key={item.title}>
              {item.disabled === true ? (
                <Sidebar.MenuButton
                  tooltip={item.tooltip ?? item.title}
                  className="opacity-50 cursor-not-allowed pointer-events-auto"
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </Sidebar.MenuButton>
              ) : (
                <Sidebar.MenuButton asChild>
                  <a href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </a>
                </Sidebar.MenuButton>
              )}
            </Sidebar.MenuItem>
          ))}
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  );
}
