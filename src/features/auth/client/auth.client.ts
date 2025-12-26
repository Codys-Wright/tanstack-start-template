import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";
import { twoFactorClient } from "better-auth/client/plugins";

/**
 * Better Auth client for React components with organization, passkey, and 2FA support.
 *
 * Features:
 * - Email/password authentication
 * - Google OAuth
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
 * // Get session
 * const { data: session } = await authClient.getSession();
 *
 * // Sign out
 * await authClient.signOut();
 * ```
 */
export const authClient = createAuthClient({
	baseURL: typeof window !== "undefined" ? window.location.origin : "",
	plugins: [organizationClient(), passkeyClient(), twoFactorClient()],
});

// Export inferred types from the client
export type AuthClient = typeof authClient;
export type Session = typeof authClient.$Infer.Session;
export type Organization = typeof authClient.$Infer.Organization;
export type Member = typeof authClient.$Infer.Member;
export type Invitation = typeof authClient.$Infer.Invitation;
export type Team = typeof authClient.$Infer.Team;
