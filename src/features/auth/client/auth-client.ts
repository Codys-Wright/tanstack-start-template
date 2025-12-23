import { createAuthClient } from "better-auth/react";

/**
 * Better Auth client for React components.
 * Use this for sign in, sign up, sign out, and session management on the client side.
 *
 * @example
 * ```tsx
 * // Sign in
 * await authClient.signIn.email({
 *   email: "user@example.com",
 *   password: "password123",
 * });
 *
 * // Get session
 * const { data: session } = await authClient.getSession();
 *
 * // Sign out
 * await authClient.signOut();
 * ```
 */
export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "",
});

export type Session = typeof authClient.$Infer.Session;
