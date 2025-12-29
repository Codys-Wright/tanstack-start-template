import * as HttpApiBuilder from '@effect/platform/HttpApiBuilder';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { AuthApi } from '../../../core/server/api.js';
import { OrganizationService } from './service.js';

/**
 * OrganizationApiLive - HTTP API handlers for organization group within AuthApi.
 *
 * Provides handlers for organization management operations using Better Auth API.
 * This is composed into AuthApiLive.
 */
export const OrganizationApiLive = HttpApiBuilder.group(AuthApi, 'organizations', (handlers) =>
  handlers
    .handle('list', () =>
      Effect.gen(function* () {
        yield* Effect.log('[Organization API] Listing organizations');
        const org = yield* OrganizationService;
        return yield* org.listOrganizations() as any;
      }),
    )
    .handle('getById', ({ path }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Organization API] Getting organization', path.id);
        const org = yield* OrganizationService;
        return yield* org.getOrganization(path.id) as any;
      }),
    )
    .handle('create', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Organization API] Creating organization', payload.name);
        const org = yield* OrganizationService;
        return yield* org.createOrganization(payload) as any;
      }),
    )
    .handle('update', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Organization API] Updating organization', payload.organizationId);
        const org = yield* OrganizationService;
        return yield* org.updateOrganization(payload) as any;
      }),
    )
    .handle('delete', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Organization API] Deleting organization', payload.organizationId);
        const org = yield* OrganizationService;
        yield* org.deleteOrganization(payload.organizationId);
        return { success: true };
      }),
    )
    .handle('setActive', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Organization API] Setting active organization');
        const org = yield* OrganizationService;
        return yield* org.setActiveOrganization(payload) as any;
      }),
    ),
).pipe(Layer.provide(OrganizationService.Default));
