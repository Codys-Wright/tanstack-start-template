/**
 * @auth/domain - Pure domain schemas
 *
 * Type-safe schemas for authentication and authorization.
 * No dependencies on client/server/database - pure domain logic.
 */

// Admin
export * from './admin-rpc.schema.js';
// Core Auth Operations
export * from './account.schema.js';
export * from './auth.schema.js';
// Multi-tenancy
export * from './invitation.schema.js';
export * from './member.schema.js';
export * from './organization-role.schema.js';
export * from './organization.schema.js';
// Security
export * from './passkey.schema.js';
// User & Session
export * from './session.schema.js';
export * from './team-member.schema.js';
export * from './team.schema.js';
export * from './two-factor.schema.js';
export * from './user.schema.js';
