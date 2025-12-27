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
export { authClient } from "./features/_core/auth.client.js";
export * from "./features/_core/auth.schema.js";
export * from "./features/_core/auth.context.js";
export * from "./features/_core/auth.policy.js";

// ============================================================================
// User - Domain & UI
// ============================================================================
export * from "./features/user/user.schema.js";
export * from "./features/user/ui/index.js";

// ============================================================================
// Session - Domain, Client & UI
// ============================================================================
export * from "./features/session/session.schema.js";
export * from "./features/session/session.atoms.js";
export * from "./features/session/ui/index.js";

// ============================================================================
// Account - Domain & UI
// ============================================================================
export * from "./features/account/account.schema.js";
export * from "./features/account/ui/index.js";

// ============================================================================
// Security - Domain
// ============================================================================
export * from "./features/security/passkey.schema.js";
export * from "./features/security/two-factor.schema.js";

// ============================================================================
// Organization - Domain, Client & UI
// ============================================================================
export * from "./features/organization/organization.schema.js";
export * from "./features/organization/organization-role.schema.js";
export * from "./features/organization/organization.atoms.js";
export * from "./features/organization/ui/index.js";

// ============================================================================
// Team - Domain & UI
// ============================================================================
export * from "./features/team/team.schema.js";
export * from "./features/team/team-member.schema.js";
export * from "./features/team/use-team-permissions.js";
export * from "./features/team/ui/index.js";

// ============================================================================
// Member - Domain
// ============================================================================
export * from "./features/member/member.schema.js";

// ============================================================================
// Invitation - Domain & UI
// ============================================================================
export * from "./features/invitation/invitation.schema.js";
export * from "./features/invitation/ui/index.js";

// ============================================================================
// Admin - Domain & Client
// ============================================================================
export * from "./features/admin/admin-rpc.schema.js";
export * from "./features/admin/admin.atoms.js";
