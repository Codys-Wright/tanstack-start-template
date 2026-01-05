/**
 * Access Control Configuration
 *
 * Defines custom permissions and roles for the application.
 * Uses Better Auth's access control system for both admin and organization plugins.
 *
 * @see https://www.better-auth.com/docs/plugins/admin#custom-permissions
 * @see https://www.better-auth.com/docs/plugins/organization#custom-permissions
 */

import { createAccessControl } from 'better-auth/plugins/access';
import {
  defaultStatements as adminDefaultStatements,
  adminAc,
} from 'better-auth/plugins/admin/access';
import {
  defaultStatements as orgDefaultStatements,
  ownerAc,
  adminAc as orgAdminAc,
  memberAc,
} from 'better-auth/plugins/organization/access';

// =============================================================================
// Custom Permission Statements
// =============================================================================

/**
 * Custom permission statements for the application.
 * These extend the default admin and organization permissions.
 */
export const customStatements = {
  /** Announcement permissions */
  announcement: ['create', 'read', 'update', 'delete', 'publish'],
  /** Course permissions */
  course: ['create', 'read', 'update', 'delete', 'publish', 'enroll'],
  /** Quiz permissions */
  quiz: ['create', 'read', 'update', 'delete', 'submit', 'grade'],
  /** Content permissions */
  content: ['create', 'read', 'update', 'delete', 'publish'],
  /** Analytics permissions */
  analytics: ['read', 'export'],
} as const;

/**
 * Combined statements including admin defaults and custom statements.
 * Used for the admin plugin access control.
 */
export const adminStatements = {
  ...adminDefaultStatements,
  ...customStatements,
} as const;

/**
 * Combined statements including organization defaults and custom statements.
 * Used for the organization plugin access control.
 */
export const orgStatements = {
  ...orgDefaultStatements,
  ...customStatements,
} as const;

// =============================================================================
// Access Controllers
// =============================================================================

/**
 * Admin access controller with custom statements.
 */
export const adminAccessControl = createAccessControl(adminStatements);

/**
 * Organization access controller with custom statements.
 */
export const orgAccessControl = createAccessControl(orgStatements);

// =============================================================================
// Admin Roles
// =============================================================================

/**
 * Super admin role - has all permissions including admin operations.
 */
export const superAdminRole = adminAccessControl.newRole({
  ...adminAc.statements,
  announcement: ['create', 'read', 'update', 'delete', 'publish'],
  course: ['create', 'read', 'update', 'delete', 'publish', 'enroll'],
  quiz: ['create', 'read', 'update', 'delete', 'submit', 'grade'],
  content: ['create', 'read', 'update', 'delete', 'publish'],
  analytics: ['read', 'export'],
});

/**
 * Admin role - can manage content but not users.
 */
export const adminRole = adminAccessControl.newRole({
  announcement: ['create', 'read', 'update', 'delete', 'publish'],
  course: ['create', 'read', 'update', 'delete', 'publish'],
  quiz: ['create', 'read', 'update', 'delete', 'grade'],
  content: ['create', 'read', 'update', 'delete', 'publish'],
  analytics: ['read'],
});

/**
 * Moderator role - can manage content with limited permissions.
 */
export const moderatorRole = adminAccessControl.newRole({
  announcement: ['create', 'read', 'update', 'publish'],
  course: ['read', 'update'],
  quiz: ['read', 'grade'],
  content: ['create', 'read', 'update'],
  analytics: ['read'],
});

/**
 * Regular user role - basic read permissions.
 */
export const userRole = adminAccessControl.newRole({
  announcement: ['read'],
  course: ['read', 'enroll'],
  quiz: ['read', 'submit'],
  content: ['read'],
});

// =============================================================================
// Organization Roles
// =============================================================================

/**
 * Organization owner role - has all org permissions plus custom permissions.
 */
export const orgOwnerRole = orgAccessControl.newRole({
  ...ownerAc.statements,
  announcement: ['create', 'read', 'update', 'delete', 'publish'],
  course: ['create', 'read', 'update', 'delete', 'publish', 'enroll'],
  quiz: ['create', 'read', 'update', 'delete', 'submit', 'grade'],
  content: ['create', 'read', 'update', 'delete', 'publish'],
  analytics: ['read', 'export'],
});

/**
 * Organization admin role - can manage org content.
 */
export const orgAdminRole = orgAccessControl.newRole({
  ...orgAdminAc.statements,
  announcement: ['create', 'read', 'update', 'publish'],
  course: ['create', 'read', 'update', 'publish'],
  quiz: ['create', 'read', 'update', 'grade'],
  content: ['create', 'read', 'update', 'publish'],
  analytics: ['read'],
});

/**
 * Organization member role - basic org permissions.
 */
export const orgMemberRole = orgAccessControl.newRole({
  ...memberAc.statements,
  announcement: ['read'],
  course: ['read', 'enroll'],
  quiz: ['read', 'submit'],
  content: ['read'],
});

// =============================================================================
// Role Maps
// =============================================================================

/**
 * Admin roles map for the admin plugin.
 */
export const adminRoles = {
  superadmin: superAdminRole,
  admin: adminRole,
  moderator: moderatorRole,
  user: userRole,
} as const;

/**
 * Organization roles map for the organization plugin.
 */
export const orgRoles = {
  owner: orgOwnerRole,
  admin: orgAdminRole,
  member: orgMemberRole,
} as const;

// =============================================================================
// Type Exports
// =============================================================================

export type AdminRole = keyof typeof adminRoles;
export type OrgRole = keyof typeof orgRoles;
export type CustomPermission = keyof typeof customStatements;
export type AnnouncementAction = (typeof customStatements.announcement)[number];
export type CourseAction = (typeof customStatements.course)[number];
export type QuizAction = (typeof customStatements.quiz)[number];
export type ContentAction = (typeof customStatements.content)[number];
export type AnalyticsAction = (typeof customStatements.analytics)[number];
