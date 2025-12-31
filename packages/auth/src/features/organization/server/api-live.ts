import * as HttpApiBuilder from '@effect/platform/HttpApiBuilder';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { AuthApi } from '@auth/core/auth-api';
import { OrganizationService } from '@auth/features/organization/server/service';
import {
  OrganizationError,
  type Organization,
  type OrganizationMember,
} from '@auth/features/organization/domain/schema';

/**
 * OrganizationApiLive - HTTP API handlers for organization group.
 *
 * Implements Better Auth organization plugin endpoints:
 * - create, list, getFullOrganization, update, delete
 * - setActive, leave, checkSlug, hasPermission
 * - getActiveMember, getActiveMemberRole
 *
 * Note: We use type assertions because Better Auth's runtime response types
 * are not fully typed, but the data matches our schemas at runtime.
 */
export const OrganizationApiLive = HttpApiBuilder.group(AuthApi, 'organization', (handlers) =>
  handlers
    .handle('create', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Organization API] Creating organization', payload.name);
        const org = yield* OrganizationService;
        const result = yield* org.create({
          name: payload.name,
          slug: payload.slug,
          logo: payload.logo,
          metadata: payload.metadata,
          userId: payload.userId,
          keepCurrentActiveOrganization: payload.keepCurrentActiveOrganization,
        });
        return result as Organization;
      }).pipe(Effect.mapError((e) => new OrganizationError({ message: String(e) }))),
    )
    .handle('list', () =>
      Effect.gen(function* () {
        yield* Effect.log('[Organization API] Listing organizations');
        const org = yield* OrganizationService;
        const result = yield* org.list();
        return result as readonly Organization[];
      }).pipe(Effect.mapError((e) => new OrganizationError({ message: String(e) }))),
    )
    .handle('getFullOrganization', () =>
      Effect.gen(function* () {
        yield* Effect.log('[Organization API] Getting full organization');
        const org = yield* OrganizationService;
        const result = yield* org.getFullOrganization();
        return result as Organization | null;
      }).pipe(Effect.mapError((e) => new OrganizationError({ message: String(e) }))),
    )
    .handle('update', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Organization API] Updating organization', payload.organizationId);
        const org = yield* OrganizationService;
        const result = yield* org.update({
          organizationId: payload.organizationId,
          data: {
            name: payload.data.name,
            slug: payload.data.slug,
            logo: payload.data.logo,
            metadata: payload.data.metadata,
          },
        });
        return result as Organization;
      }).pipe(Effect.mapError((e) => new OrganizationError({ message: String(e) }))),
    )
    .handle('delete', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Organization API] Deleting organization', payload.organizationId);
        const org = yield* OrganizationService;
        const result = yield* org.delete({
          organizationId: payload.organizationId,
        });
        // Better Auth returns the deleted organization ID as a string
        return (result as string) || payload.organizationId;
      }).pipe(Effect.mapError((e) => new OrganizationError({ message: String(e) }))),
    )
    .handle('setActive', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Organization API] Setting active organization', payload);
        const org = yield* OrganizationService;
        const result = yield* org.setActive({
          organizationId: payload.organizationId,
          organizationSlug: payload.organizationSlug,
        });
        return result as Organization | null;
      }).pipe(Effect.mapError((e) => new OrganizationError({ message: String(e) }))),
    )
    .handle('leave', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Organization API] Leaving organization', payload.organizationId);
        const org = yield* OrganizationService;
        yield* org.leave({ organizationId: payload.organizationId });
        return { success: true as const };
      }).pipe(Effect.mapError((e) => new OrganizationError({ message: String(e) }))),
    )
    .handle('checkSlug', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Organization API] Checking slug', payload.slug);
        const org = yield* OrganizationService;
        const result = yield* org.checkSlug({ slug: payload.slug });
        // Better Auth returns { status: boolean }
        const status =
          typeof result === 'object' && result !== null && 'status' in result
            ? Boolean((result as { status: unknown }).status)
            : Boolean(result);
        return { status };
      }).pipe(Effect.mapError((e) => new OrganizationError({ message: String(e) }))),
    )
    .handle('hasPermission', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Organization API] Checking permission');
        const org = yield* OrganizationService;
        const result = yield* org.hasPermission({
          permission: payload.permission as Record<string, string[]> | undefined,
          permissions: payload.permissions as Record<string, string[]> | undefined,
        });
        // Better Auth returns { success: boolean, error?: string }
        if (typeof result === 'object' && result !== null) {
          const r = result as { success?: unknown; error?: unknown };
          return {
            success: Boolean(r.success),
            error: r.error ? String(r.error) : undefined,
          };
        }
        return { success: Boolean(result) };
      }).pipe(Effect.mapError((e) => new OrganizationError({ message: String(e) }))),
    )
    .handle('getActiveMember', () =>
      Effect.gen(function* () {
        yield* Effect.log('[Organization API] Getting active member');
        const org = yield* OrganizationService;
        const result = yield* org.getActiveMember();
        return result as OrganizationMember | null;
      }).pipe(Effect.mapError((e) => new OrganizationError({ message: String(e) }))),
    )
    .handle('getActiveMemberRole', () =>
      Effect.gen(function* () {
        yield* Effect.log('[Organization API] Getting active member role');
        const org = yield* OrganizationService;
        const result = yield* org.getActiveMemberRole();
        // Better Auth returns the role as a string or null
        return (result as string) || null;
      }).pipe(Effect.mapError((e) => new OrganizationError({ message: String(e) }))),
    ),
).pipe(Layer.provide(OrganizationService.Default));
