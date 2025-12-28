/**
 * @auth - Authentication & Authorization Package
 *
 * Client-safe exports: schemas, atoms, UI components, auth client
 *
 * For server-side code, import from "@auth/server"
 * For database code, import from "@auth/database"
 */

// ============================================================================
// Core - Client & Domain
// ============================================================================
export { authClient } from './features/_core/client';
export * from './features/_core/schema';

// ============================================================================
// User - Domain & UI
// ============================================================================
export * from './features/user/user.schema';
export * from './features/user/ui/user-avatar';
export * from './features/user/ui/user-button';
export * from './features/user/ui/user-view';

// ============================================================================
// Session - Domain, Client & UI
// ============================================================================
export * from './features/session/session.schema';
export * from './features/session/session.atoms';
export { SessionApiGroup } from './features/session/session-api';
export * from './features/session/ui/auth-view';
export * from './features/session/ui/sign-in-form';
export * from './features/session/ui/sign-up-form';
export * from './features/session/ui/login-form';
export * from './features/session/ui/two-factor-form';

// ============================================================================
// Account - Domain & UI
// ============================================================================
export * from './features/account/account.schema';
export * from './features/account/ui/forgot-password-form';
export * from './features/account/ui/reset-password-form';
export * from './features/account/ui/recover-account-form';
export * from './features/account/ui/account-view';
export * from './features/account/ui/account-settings-cards';
export * from './features/account/ui/change-email-card';
export * from './features/account/ui/update-avatar-card';
export * from './features/account/ui/update-name-card';
export * from './features/account/ui/security-settings-cards';
export * from './features/account/ui/settings-card';
export * from './features/account/ui/api-keys-card';

// ============================================================================
// Security - Domain
// ============================================================================
export * from './features/security/passkey.schema';
export * from './features/security/two-factor.schema';

// ============================================================================
// Organization - Domain, Client & UI
// ============================================================================
export * from './features/organization/organization.schema';
export * from './features/organization/organization-role.schema';
export * from './features/organization/organization.atoms';
export * from './features/organization/ui/organizations-card';

// ============================================================================
// Team - Domain & UI
// ============================================================================
export * from './features/team/team.schema';
export * from './features/team/team-member.schema';
export * from './features/team/use-team-permissions';
export * from './features/team/ui/teams-card';
export * from './features/team/ui/team-cell';
export * from './features/team/ui/team-members-card';
export * from './features/team/ui/team-members-dialog';
export * from './features/team/ui/add-team-member-dialog';
export * from './features/team/ui/create-team-dialog';
export * from './features/team/ui/update-team-dialog';
export * from './features/team/ui/delete-team-dialog';
export * from './features/team/ui/user-teams-card';

// ============================================================================
// Member - Domain
// ============================================================================
export * from './features/member/member.schema';

// ============================================================================
// Invitation - Domain & UI
// ============================================================================
export * from './features/invitation/invitation.schema';
export * from './features/invitation/ui/user-invitations-card';

// ============================================================================
// Admin - Domain & Client
// ============================================================================
export * from './features/admin/admin-rpc.schema';
export * from './features/admin/admin.atoms';
