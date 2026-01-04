import { type ReactNode, useState, useEffect } from 'react';
import { Result, useAtomValue } from '@effect-atom/atom-react';
import { sessionAtom } from '@auth/features/session/client/atoms';

/**
 * Conditionally renders content for authenticated users only
 *
 * Renders its children only when a user is authenticated with a valid session.
 * If no session exists, nothing is rendered. Useful for displaying protected
 * content or UI elements that should only be visible to signed-in users.
 *
 * Note: To prevent hydration mismatches, this component renders nothing on the
 * server and only shows content after client hydration when session state is known.
 *
 * @example
 * ```tsx
 * <SignedIn>
 *   <p>Welcome back!</p>
 *   <UserButton />
 * </SignedIn>
 * ```
 */
export function SignedIn({ children }: { children: ReactNode }) {
  const sessionResult = useAtomValue(sessionAtom);
  const session = Result.isSuccess(sessionResult) ? sessionResult.value : null;

  // Prevent hydration mismatch by not rendering during SSR
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  // On SSR or before hydration, render nothing to match server output
  if (!isClient) return null;

  return session ? <>{children}</> : null;
}
