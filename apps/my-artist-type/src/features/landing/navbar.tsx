'use client';
import {
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  Navbar,
  NavbarButton,
  NavbarLogo,
  NavBody,
} from '@components';
import { ModeToggle, Tooltip } from '@ui/shadcn';
import { motion } from 'motion/react';
import { useState, type ReactNode } from 'react';

export function NavbarHome({ children }: { children?: ReactNode }) {
  const navItems = [
    {
      name: 'Artist Types',
      link: '/artist-types',
      disabled: true,
    },
    {
      name: 'Quiz',
      link: '/quiz',
    },
    {
      name: 'Admin',
      link: '/admin',
    },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="relative w-full">
      <Navbar className="fixed inset-x-0 top-0 z-50">
        <NavBody>
          <NavbarLogo />
          <motion.div
            onMouseLeave={() => setHovered(null)}
            className="absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-medium text-zinc-600 transition duration-200 hover:text-zinc-800 lg:flex lg:space-x-2"
          >
            {navItems.map((item, idx) => (
              <a
                key={`desktop-link-${idx}`}
                href={item.disabled ? '#' : item.link}
                onMouseEnter={() => !item.disabled && setHovered(idx)}
                onClick={(e) => {
                  if (item.disabled) {
                    e.preventDefault();
                  }
                }}
                className={`relative px-4 py-2 ${
                  item.disabled
                    ? 'text-neutral-400 dark:text-neutral-600 cursor-not-allowed opacity-50'
                    : 'text-neutral-600 dark:text-neutral-300'
                }`}
              >
                {hovered === idx && !item.disabled && (
                  <motion.div
                    layoutId="hovered"
                    className="absolute inset-0 h-full w-full rounded-full bg-gray-100 dark:bg-neutral-800"
                  />
                )}
                <span className="relative z-20">{item.name}</span>
              </a>
            ))}
          </motion.div>
          <div className="flex items-center gap-4">
            <Tooltip>
              <Tooltip.Trigger asChild>
                <NavbarButton
                  variant="secondary"
                  disabled
                  className="opacity-50 cursor-not-allowed"
                >
                  Login
                </NavbarButton>
              </Tooltip.Trigger>
              <Tooltip.Content>Authentication is disabled right now</Tooltip.Content>
            </Tooltip>
            <NavbarButton variant="primary">Take the Quiz!</NavbarButton>
            <div className="relative z-[70]">
              <ModeToggle />
            </div>
          </div>
        </NavBody>

        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => {
              setIsMobileMenuOpen(false);
            }}
          >
            {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.disabled ? '#' : item.link}
                onClick={(e) => {
                  if (item.disabled) {
                    e.preventDefault();
                  } else {
                    setIsMobileMenuOpen(false);
                  }
                }}
                className={`relative ${
                  item.disabled
                    ? 'text-neutral-400 dark:text-neutral-600 cursor-not-allowed opacity-50'
                    : 'text-neutral-600 dark:text-neutral-300'
                }`}
              >
                <span className="block">{item.name}</span>
              </a>
            ))}
            <div className="flex w-full flex-col gap-4">
              <Tooltip>
                <Tooltip.Trigger asChild>
                  <NavbarButton
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                    }}
                    variant="primary"
                    className="w-full opacity-50 cursor-not-allowed"
                    disabled
                  >
                    Login
                  </NavbarButton>
                </Tooltip.Trigger>
                <Tooltip.Content>Authentication is disabled right now</Tooltip.Content>
              </Tooltip>
              <NavbarButton
                onClick={() => {
                  setIsMobileMenuOpen(false);
                }}
                variant="primary"
                className="w-full"
              >
                Take the Quiz!
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
      {children}
    </div>
  );
}
