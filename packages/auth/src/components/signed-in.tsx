import type { ReactNode } from 'react';
import { Result, useAtomValue } from '@effect-atom/atom-react';
import { sessionAtom } from '@auth/features/session/client/atoms';

/**
 * Conditionally renders content for authenticated users only
 *
 * Renders its children only when a user is authenticated with a valid session.
 * If no session exists, nothing is rendered. Useful for displaying protected
 * content or UI elements that should only be visible to signed-in users.
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

  return session ? <>{children}</> : null;
}
