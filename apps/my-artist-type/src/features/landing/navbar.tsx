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
import { SignedIn, SignedOut, UserButton, isAdminAtom, isAnonymousAtom } from '@auth';
import { lastResponseIdAtom } from '@quiz';
import { ModeToggle } from '@theme';
import { motion } from 'motion/react';
import { useState, useEffect, type ReactNode, useMemo } from 'react';
import { useAtomValue } from '@effect-atom/atom-react';

export function NavbarHome({ children }: { children?: ReactNode }) {
  const isAdmin = useAtomValue(isAdminAtom);
  const isAnonymous = useAtomValue(isAnonymousAtom);
  const lastResponseId = useAtomValue(lastResponseIdAtom);

  // Track if we're on the client to avoid hydration mismatch
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Determine if user has taken the quiz before
  // On SSR, always show default "Take the Quiz!" to match initial client render
  const hasResults = isClient && lastResponseId !== null;
  const quizButtonText = hasResults ? 'Your Results' : 'Take the Quiz!';
  const quizButtonLink = hasResults ? `/my-response/${lastResponseId}` : '/quiz';

  const navItems = useMemo(
    () => [
      {
        name: 'Artist Types',
        link: '/artist-types',
      },
      {
        name: 'Quiz',
        link: '/quiz',
      },
      ...(isAdmin
        ? [
            {
              name: 'Admin',
              link: '/admin',
            },
          ]
        : []),
    ],
    [isAdmin],
  );

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
                href={item.link}
                onMouseEnter={() => setHovered(idx)}
                className="relative px-4 py-2 text-neutral-600 dark:text-neutral-300"
              >
                {hovered === idx && (
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
            <SignedOut>
              <NavbarButton href="/auth/sign-in" variant="secondary">
                Login
              </NavbarButton>
            </SignedOut>
            <SignedIn>
              {isClient && isAnonymous ? (
                <NavbarButton href="/account/claim-account" variant="secondary">
                  Claim Account
                </NavbarButton>
              ) : (
                <UserButton size="icon" />
              )}
            </SignedIn>
            <NavbarButton href={quizButtonLink} variant="primary">
              {quizButtonText}
            </NavbarButton>
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
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative text-neutral-600 dark:text-neutral-300"
              >
                <span className="block">{item.name}</span>
              </a>
            ))}
            <div className="flex w-full flex-col gap-4">
              <SignedOut>
                <NavbarButton
                  href="/auth/sign-in"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                  }}
                  variant="secondary"
                  className="w-full"
                >
                  Login
                </NavbarButton>
              </SignedOut>
              <SignedIn>
                {isClient && isAnonymous ? (
                  <NavbarButton
                    href="/account/claim-account"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                    }}
                    variant="secondary"
                    className="w-full"
                  >
                    Claim Your Account!
                  </NavbarButton>
                ) : (
                  <div className="flex justify-center">
                    <UserButton size="default" />
                  </div>
                )}
              </SignedIn>
              <NavbarButton
                href={quizButtonLink}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                }}
                variant="primary"
                className="w-full"
              >
                {quizButtonText}
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
      {children}
    </div>
  );
}
