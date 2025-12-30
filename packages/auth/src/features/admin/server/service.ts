import { admin } from 'better-auth/plugins';
import * as Effect from 'effect/Effect';
import { AuthService } from '@auth/core/server/service';

/**
 * Admin Service - Wraps Better Auth admin operations in Effect
 *
 * Uses auth.admin.* methods directly from the admin client.
 */
export class AdminService extends Effect.Service<AdminService>()('AdminService', {
  dependencies: [AuthService.Default],
  effect: Effect.gen(function* () {
    const auth = yield* AuthService;

    return {
      listOrganizations: () =>
        Effect.tryPromise({
          try: () => admin.listOrganizations({ query: {} }),
          catch: (error) => new Error(`Failed to list organizations: ${error}`),
        }),

      getOrganization: (organizationId: string) =>
        Effect.tryPromise({
          try: () => admin.getOrganization({ params: { organizationId } }),
          catch: (error) => new Error(`Failed to get organization: ${error}`),
        }),

      updateOrganization: (input: { organizationId: string; data: any }) =>
        Effect.tryPromise({
          try: () =>
            admin.updateOrganization({
              params: { organizationId: input.organizationId },
              body: input.data,
            }),
          catch: (error) => new Error(`Failed to update organization: ${error}`),
        }),

      deleteOrganization: (organizationId: string) =>
        Effect.tryPromise({
          try: () => admin.deleteOrganization({ params: { organizationId } }),
          catch: (error) => new Error(`Failed to delete organization: ${error}`),
        }),

      listSessions: () =>
        Effect.tryPromise({
          try: () => admin.listSessions({ query: {} }),
          catch: (error) => new Error(`Failed to list sessions: ${error}`),
        }),

      revokeSession: (sessionId: string) =>
        Effect.tryPromise({
          try: () => admin.revokeSession({ params: { sessionId } }),
          catch: (error) => new Error(`Failed to revoke session: ${error}`),
        }),

      listMembers: (organizationId?: string) =>
        Effect.tryPromise({
          try: () =>
            admin.listMembers({
              query: organizationId ? { organizationId } : {},
            }),
          catch: (error) => new Error(`Failed to list members: ${error}`),
        }),

      createUser: (input: {
        email: string;
        password: string;
        name: string;
        role?: string | string[];
        data?: Record<string, unknown>;
      }) =>
        Effect.tryPromise({
          try: () => admin.createUser({ body: input }),
          catch: (error) => new Error(`Failed to create user: ${error}`),
        }),

      updateUser: (input: { userId: string; data: Record<string, unknown> }) =>
        Effect.tryPromise({
          try: () =>
            admin.updateUser({
              params: { userId: input.userId },
              body: input.data,
            }),
          catch: (error) => new Error(`Failed to update user: ${error}`),
        }),

      setRole: (input: { userId?: string; role: string | string[] }) =>
        Effect.tryPromise({
          try: () => admin.setRole({ body: input }),
          catch: (error) => new Error(`Failed to set role: ${error}`),
        }),

      banUser: (input: { userId: string; banReason?: string; banExpiresIn?: number }) =>
        Effect.tryPromise({
          try: () => admin.banUser({ body: input }),
          catch: (error) => new Error(`Failed to ban user: ${error}`),
        }),

      setUserPassword: (input: { userId: string; newPassword: string }) =>
        Effect.tryPromise({
          try: () => admin.setUserPassword({ body: input }),
          catch: (error) => new Error(`Failed to set user password: ${error}`),
        }),

      hasPermission: (input: {
        userId?: string;
        role?: string;
        permission?: Record<string, string[]>;
      }) =>
        Effect.tryPromise({
          try: () => admin.hasPermission({ body: input }),
          catch: (error) => new Error(`Failed to check permission: ${error}`),
          }),
    };
  });
}) {}

