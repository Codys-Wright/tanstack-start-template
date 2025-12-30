import type { ReactNode } from 'react';
import { Result, useAtomValue } from '@effect-atom/atom-react';
import { sessionAtom } from '@auth/features/session/client/atoms';

/**
 * Conditionally renders content while authentication state is loading
 *
 * Renders its children only when the authentication state is being determined.
 * Once the session is loaded (either authenticated or not), nothing is rendered.
 * Useful for displaying loading spinners or skeleton states during auth checks.
 *
 * @example
 * ```tsx
 * <AuthLoading>
 *   <Skeleton className="h-10 w-10 rounded-full" />
 * </AuthLoading>
 * ```
 */
export function AuthLoading({ children }: { children: ReactNode }) {
  const sessionResult = useAtomValue(sessionAtom);
  const isPending = Result.isInitial(sessionResult) && sessionResult.waiting;

  return isPending ? <>{children}</> : null;
}
