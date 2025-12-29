'use client';

import { type Icon } from '@tabler/icons-react';

import { Badge } from './badge';
import { Sidebar } from './sidebar';

export function NavMain({
  items,
}: {
  items: Array<{
    title: string;
    url: string;
    icon?: Icon;
    disabled?: boolean;
    tooltip?: string;
  }>;
}) {
  return (
    <Sidebar.Group>
      <Sidebar.GroupContent className="flex flex-col gap-2">
        {items.map((item) => (
          <Sidebar.Menu key={item.title}>
            <Sidebar.MenuItem>
              {item.disabled === true ? (
                <Sidebar.MenuButton
                  tooltip={item.tooltip ?? item.title}
                  className="opacity-50 cursor-not-allowed pointer-events-auto"
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                >
                  {item.icon !== undefined && <item.icon />}
                  <span>{item.title}</span>
                  {item.tooltip === 'Coming Soon!' && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Coming Soon!
                    </Badge>
                  )}
                </Sidebar.MenuButton>
              ) : (
                <Sidebar.MenuButton asChild tooltip={item.tooltip ?? item.title}>
                  <a href={item.url}>
                    {item.icon !== undefined && <item.icon />}
                    <span>{item.title}</span>
                  </a>
                </Sidebar.MenuButton>
              )}
            </Sidebar.MenuItem>
          </Sidebar.Menu>
        ))}
      </Sidebar.GroupContent>
    </Sidebar.Group>
  );
}
