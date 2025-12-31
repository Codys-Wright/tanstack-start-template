import * as Effect from 'effect/Effect';
import { AuthService } from '@auth/core/server/service';

/**
 * Organization Service - Wraps Better Auth organization operations in Effect
 *
 * Uses auth.api.* methods for organization operations.
 * The organization plugin exposes methods like:
 * - create, list, getFullOrganization, update, delete
 * - setActive, leave, checkSlug, hasPermission
 * - getActiveMember, getActiveMemberRole
 *
 * Note: We use type assertion (as any) because Better Auth's TypeScript types
 * don't fully expose plugin-added methods, but they exist at runtime.
 */
export class OrganizationService extends Effect.Service<OrganizationService>()(
  'OrganizationService',
  {
    dependencies: [AuthService.Default],
    effect: Effect.gen(function* () {
      const auth = yield* AuthService;
      // Type assertion needed because Better Auth types don't fully expose plugin methods
      const api = auth.api as any;

      return {
        /**
         * Create an organization
         */
        create: (input: {
          name: string;
          slug: string;
          logo?: string | null;
          metadata?: string | null;
          userId?: string | null;
          keepCurrentActiveOrganization?: boolean | null;
        }) =>
          Effect.tryPromise({
            try: () => api.createOrganization({ body: input }),
            catch: (error) => new Error(`Failed to create organization: ${error}`),
          }),

        /**
         * List all organizations for current user
         */
        list: () =>
          Effect.tryPromise({
            try: () => api.listOrganizations({}),
            catch: (error) => new Error(`Failed to list organizations: ${error}`),
          }),

        /**
         * Get the full organization (current active)
         */
        getFullOrganization: () =>
          Effect.tryPromise({
            try: () => api.getFullOrganization({}),
            catch: (error) => new Error(`Failed to get organization: ${error}`),
          }),

        /**
         * Update an organization
         */
        update: (input: {
          organizationId?: string | null;
          data: {
            name?: string | null;
            slug?: string | null;
            logo?: string | null;
            metadata?: string | null;
          };
        }) =>
          Effect.tryPromise({
            try: () => api.updateOrganization({ body: input }),
            catch: (error) => new Error(`Failed to update organization: ${error}`),
          }),

        /**
         * Delete an organization
         */
        delete: (input: { organizationId: string }) =>
          Effect.tryPromise({
            try: () => api.deleteOrganization({ body: input }),
            catch: (error) => new Error(`Failed to delete organization: ${error}`),
          }),

        /**
         * Set active organization
         */
        setActive: (input: { organizationId?: string | null; organizationSlug?: string | null }) =>
          Effect.tryPromise({
            try: () => api.setActiveOrganization({ body: input }),
            catch: (error) => new Error(`Failed to set active organization: ${error}`),
          }),

        /**
         * Leave an organization
         */
        leave: (input: { organizationId: string }) =>
          Effect.tryPromise({
            try: () => api.leaveOrganization({ body: input }),
            catch: (error) => new Error(`Failed to leave organization: ${error}`),
          }),

        /**
         * Check if slug is available
         */
        checkSlug: (input: { slug: string }) =>
          Effect.tryPromise({
            try: () => api.checkOrganizationSlug({ body: input }),
            catch: (error) => new Error(`Failed to check slug: ${error}`),
          }),

        /**
         * Check if current user has permission
         */
        hasPermission: (input: {
          permission?: Record<string, string[]>;
          permissions?: Record<string, string[]>;
        }) =>
          Effect.tryPromise({
            try: () => api.hasOrganizationPermission({ body: input }),
            catch: (error) => new Error(`Failed to check permission: ${error}`),
          }),

        /**
         * Get active member details
         */
        getActiveMember: () =>
          Effect.tryPromise({
            try: () => api.getActiveMember({}),
            catch: (error) => new Error(`Failed to get active member: ${error}`),
          }),

        /**
         * Get active member role
         */
        getActiveMemberRole: () =>
          Effect.tryPromise({
            try: () => api.getActiveMemberRole({}),
            catch: (error) => new Error(`Failed to get active member role: ${error}`),
          }),
      };
    }),
  },
) {}
