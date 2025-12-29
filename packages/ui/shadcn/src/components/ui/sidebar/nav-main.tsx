'use client';

import { IconCirclePlusFilled, type Icon } from '@tabler/icons-react';

import { Badge } from '../badge.js';
import { Sidebar } from './sidebar.js';

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
        <Sidebar.Menu>
          <Sidebar.MenuItem>
            <Sidebar.MenuButton
              asChild
              tooltip="Quiz Editor"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            >
              <a href="/admin/quiz-editor">
                <IconCirclePlusFilled />
                <span>Quiz Editor</span>
              </a>
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>
        </Sidebar.Menu>
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
          ))}
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  );
}
