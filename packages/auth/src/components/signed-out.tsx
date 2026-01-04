import { type ReactNode, useState, useEffect } from 'react';
import { Result, useAtomValue } from '@effect-atom/atom-react';
import { sessionAtom } from '@auth/features/session/client/atoms';

/**
 * Conditionally renders content for unauthenticated users only
 *
 * Renders its children only when no user is authenticated and the authentication
 * state is not pending. If a session exists or is being loaded, nothing is rendered.
 * Useful for displaying sign-in prompts or content exclusive to guests.
 *
 * Note: To prevent hydration mismatches, this component renders nothing on the
 * server and only shows content after client hydration when session state is known.
 *
 * @example
 * ```tsx
 * <SignedOut>
 *   <p>Please sign in to continue</p>
 *   <Link to="/auth/sign-in">Sign In</Link>
 * </SignedOut>
 * ```
 */
export function SignedOut({ children }: { children: ReactNode }) {
  const sessionResult = useAtomValue(sessionAtom);
  const isPending = Result.isInitial(sessionResult) && sessionResult.waiting;
  const session = Result.isSuccess(sessionResult) ? sessionResult.value : null;

  // Prevent hydration mismatch by not rendering during SSR
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  // On SSR or before hydration, render nothing to match server output
  if (!isClient) return null;

  return !session && !isPending ? <>{children}</> : null;
}
