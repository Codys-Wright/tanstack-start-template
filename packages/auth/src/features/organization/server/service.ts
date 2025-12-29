import * as Effect from 'effect/Effect';
import { AuthService } from '../../_core/service.js';

/**
 * Organization Service - Wraps organization operations in Effect
 *
 * Uses Better Auth client methods for:
 * - List organizations
 * - Get organization by ID
 * - Create organization
 * - Update organization
 * - Delete organization
 * - Set active organization
 */
export class OrganizationService extends Effect.Service<OrganizationService>()(
  'OrganizationService',
  {
    dependencies: [AuthService.Default],
    effect: Effect.gen(function* () {
      const auth = yield* AuthService;
      const organizationClient = (auth.api as any).organization;

      return {
        /**
         * List organizations
         */
        listOrganizations: () =>
          Effect.tryPromise({
            try: () => organizationClient.listOrganizations(),
            catch: (error) => new Error(`Failed to list organizations: ${error}`),
          }),

        /**
         * Get organization by ID
         */
        getOrganization: (organizationId: string) =>
          Effect.tryPromise({
            try: () =>
              organizationClient.getFullOrganization({
                query: { organizationId },
              }),
            catch: (error) => new Error(`Failed to get organization: ${error}`),
          }),

        /**
         * Create organization
         */
        createOrganization: (input: {
          name: string;
          slug: string;
          logo?: string | null;
          metadata?: unknown;
          userId?: string | null;
          keepCurrentActiveOrganization?: boolean;
        }) =>
          Effect.tryPromise({
            try: () => organizationClient.create({ body: input }),
            catch: (error) => new Error(`Failed to create organization: ${error}`),
          }),

        /**
         * Update organization
         */
        updateOrganization: (input: {
          organizationId: string;
          name?: string;
          slug?: string;
          logo?: string | null;
          metadata?: unknown;
        }) =>
          Effect.tryPromise({
            try: () =>
              organizationClient.update({
                query: { organizationId: input.organizationId },
                body: {
                  name: input.name,
                  slug: input.slug,
                  logo: input.logo,
                  metadata: input.metadata as string | null | undefined,
                },
              }),
            catch: (error) => new Error(`Failed to update organization: ${error}`),
          }),

        /**
         * Delete organization
         */
        deleteOrganization: (organizationId: string) =>
          Effect.tryPromise({
            try: () =>
              organizationClient.delete({
                body: { organizationId },
              }),
            catch: (error) => new Error(`Failed to delete organization: ${error}`),
          }),

        /**
         * Set active organization
         */
        setActiveOrganization: (input: { organizationId?: string; organizationSlug?: string }) =>
          Effect.tryPromise({
            try: () =>
              organizationClient.setActiveOrganization({
                query: input,
              }),
            catch: (error) => new Error(`Failed to set active organization: ${error}`),
          }),
      };
    }),
  },
) {}
