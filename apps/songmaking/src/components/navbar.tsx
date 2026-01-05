/**
 * Navbar Component
 *
 * A simple navigation bar for the landing page with logo and account info.
 * Shows sign in button when logged out, user button when logged in.
 */

import { Link } from '@tanstack/react-router';
import { Button } from '@shadcn';
import { Music, LogIn } from 'lucide-react';
import { UserButton, SignedIn, SignedOut } from '@auth';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
              <Music className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Songmaking</span>
          </Link>

          {/* Account Section */}
          <div className="flex items-center gap-3">
            <SignedIn>
              <UserButton size="default" />
            </SignedIn>
            <SignedOut>
              <Link to="/auth/$authView" params={{ authView: 'sign-in' }}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Button>
              </Link>
              <Link to="/auth/$authView" params={{ authView: 'sign-up' }}>
                <Button size="sm">Get Started</Button>
              </Link>
            </SignedOut>
          </div>
        </div>
      </div>
    </header>
  );
}
