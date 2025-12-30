import type { ReactNode } from 'react';
import { Result, useAtomValue } from '@effect-atom/atom-react';
import { sessionAtom } from '@auth/features/session/client/atoms';

/**
 * Conditionally renders content for unauthenticated users only
 *
 * Renders its children only when no user is authenticated and the authentication
 * state is not pending. If a session exists or is being loaded, nothing is rendered.
 * Useful for displaying sign-in prompts or content exclusive to guests.
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

  return !session && !isPending ? <>{children}</> : null;
}
