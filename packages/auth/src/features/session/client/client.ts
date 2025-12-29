import { createAuthClient } from 'better-auth/react';
import { adminClient, organizationClient, twoFactorClient } from 'better-auth/client/plugins';
import { passkeyClient } from '@better-auth/passkey/client';

/**
 * Better Auth client for React components with admin, organization, passkey, and 2FA support.
 *
 * Features:
 * - Email/password authentication
 * - Google OAuth
 * - Admin operations (create users, ban, impersonate, etc.)
 * - Organizations with members and invitations
 * - Teams within organizations
 * - Passkeys (WebAuthn)
 * - Two-factor authentication (TOTP)
 *
 * @example
 * ```tsx
 * // Sign in
 * await authClient.signIn.email({
 *   email: "user@example.com",
 *   password: "password123",
 * });
 *
 * // Sign in with Google
 * await authClient.signIn.social({ provider: "google" });
 *
 * // Create organization
 * await authClient.organization.create({ name: "My Org" });
 *
 * // Admin: Ban user
 * await authClient.admin.banUser({
 *   userId: "user-id",
 *   banReason: "Spamming",
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
  baseURL: typeof window !== 'undefined' ? window.location.origin : '',
  plugins: [
    adminClient(),
    organizationClient({
      teams: {
        enabled: true,
      },
    }),
    passkeyClient(),
    twoFactorClient(),
  ],
});

// Export inferred types from the client
export type AuthClient = typeof authClient;
export type BetterAuthSession = typeof authClient.$Infer.Session;
export type BetterAuthOrganization = typeof authClient.$Infer.Organization;
export type BetterAuthMember = typeof authClient.$Infer.Member;
export type BetterAuthInvitation = typeof authClient.$Infer.Invitation;
export type BetterAuthTeam = typeof authClient.$Infer.Team;
