/**
 * @auth - Authentication & Authorization Package
 *
 * Client-safe exports: schemas, atoms, UI components, auth client
 *
 * For server-side code, import from "@auth/server"
 * For database code, import from "@auth/database"
 */

// ============================================================================
// Core - Client
// ============================================================================
export { authClient } from './core/client/client.js';

// ============================================================================
// Components - Conditional Wrappers
// ============================================================================
export { SignedIn } from './components/signed-in.js';
export { SignedOut } from './components/signed-out.js';
export { AuthLoading } from './components/auth-loading.js';

// ============================================================================
// User - Domain & UI
// ============================================================================
export * from './features/user/domain/schema.js';
export * from './features/user/client/presentation/components/user-avatar.js';
export * from './features/user/client/presentation/components/user-button.js';
export * from './features/user/client/presentation/components/user-view.js';

// ============================================================================
// Session - Domain, Client & UI
// ============================================================================
export * from './features/session/domain/schema.js';
export * from './features/session/client/atoms.js';
export * from './features/session/ui/auth-view.js';
export * from './features/session/ui/sign-in-form.js';
export * from './features/session/ui/sign-up-form.js';
export * from './features/session/ui/login-form.js';
export * from './features/session/ui/two-factor-form.js';

// ============================================================================
// Account - Domain & UI
// ============================================================================
export * from './features/account/domain/schema.js';
export * from './features/account/ui/forgot-password-form.js';
export * from './features/account/ui/reset-password-form.js';
export * from './features/account/ui/recover-account-form.js';
export * from './features/account/ui/account-view.js';
export * from './features/account/ui/account-settings-cards.js';
export * from './features/account/ui/security-settings-cards.js';

// ============================================================================
// Security - Domain, Client & Atoms
// ============================================================================
export * from './features/security/domain/schema.js';
export * from './features/security/client/atoms.js';

// ============================================================================
// Organization - Domain, Client & UI
// ============================================================================
export * from './features/organization/domain/schema.js';
export * from './features/organization/client/atoms.js';
export * from './features/organization/ui/organizations-card.js';
export * from './features/organization/ui/organization-view.js';
export * from './features/organization/ui/organization-settings-cards.js';
export * from './features/organization/ui/organization-members-card.js';

// ============================================================================
// Team - Domain & Client
// ============================================================================
export * from './features/team/domain/schema.js';
export * from './features/team/client/atoms.js';
export * from './features/team/client/hooks.js';

// ============================================================================
// Member - Domain
// ============================================================================
export * from './features/member/domain/schema.js';

// ============================================================================
// Invitation - Domain & UI
// ============================================================================
export * from './features/invitation/domain/schema.js';
export * from './features/invitation/ui/user-invitations-card.js';

// ============================================================================
// Admin - Domain & Client
// ============================================================================
export * from './features/admin/domain/schema.js';
export * from './features/admin/client/atoms.js';
