import * as HttpApiBuilder from '@effect/platform/HttpApiBuilder';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { AuthApi } from '@auth/core/auth-api';
import { TeamService } from '@auth/features/team/server/service';
import { TeamError, type Team, type TeamMember } from '@auth/features/team/domain/schema';

/**
 * TeamApiLive - HTTP API handlers for team group.
 *
 * Implements Better Auth organization plugin team endpoints:
 * - create, list, update, remove
 * - setActive, addMember, removeMember
 * - listMembers, listUserTeams
 *
 * Note: We use type assertions because Better Auth's runtime response types
 * are not fully typed, but the data matches our schemas at runtime.
 */
export const TeamApiLive = HttpApiBuilder.group(AuthApi, 'team', (handlers) =>
  handlers
    .handle('create', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Team API] Creating team', payload.name);
        const team = yield* TeamService;
        const result = yield* team.create({
          name: payload.name,
          organizationId: payload.organizationId,
        });
        return result as Team;
      }).pipe(Effect.mapError((e) => new TeamError({ message: String(e) }))),
    )
    .handle('list', () =>
      Effect.gen(function* () {
        yield* Effect.log('[Team API] Listing teams');
        const team = yield* TeamService;
        const result = yield* team.list();
        return result as readonly Team[];
      }).pipe(Effect.mapError((e) => new TeamError({ message: String(e) }))),
    )
    .handle('update', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Team API] Updating team', payload.teamId);
        const team = yield* TeamService;
        const result = yield* team.update({
          teamId: payload.teamId,
          data: { name: payload.data.name },
        });
        return result as Team;
      }).pipe(Effect.mapError((e) => new TeamError({ message: String(e) }))),
    )
    .handle('remove', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Team API] Removing team', payload.teamId);
        const team = yield* TeamService;
        yield* team.remove({
          teamId: payload.teamId,
          organizationId: payload.organizationId,
        });
        return { success: true as const };
      }).pipe(Effect.mapError((e) => new TeamError({ message: String(e) }))),
    )
    .handle('setActive', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Team API] Setting active team', payload.teamId);
        const team = yield* TeamService;
        const result = yield* team.setActive({ teamId: payload.teamId });
        return result as Team | null;
      }).pipe(Effect.mapError((e) => new TeamError({ message: String(e) }))),
    )
    .handle('addMember', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Team API] Adding team member', payload.userId);
        const team = yield* TeamService;
        const result = yield* team.addMember({
          teamId: payload.teamId,
          userId: payload.userId,
          role: payload.role,
        });
        return result as TeamMember;
      }).pipe(Effect.mapError((e) => new TeamError({ message: String(e) }))),
    )
    .handle('removeMember', ({ payload }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Team API] Removing team member', payload.userId);
        const team = yield* TeamService;
        yield* team.removeMember({
          teamId: payload.teamId,
          userId: payload.userId,
        });
        return { success: true as const };
      }).pipe(Effect.mapError((e) => new TeamError({ message: String(e) }))),
    )
    .handle('listMembers', ({ urlParams }) =>
      Effect.gen(function* () {
        yield* Effect.log('[Team API] Listing team members', urlParams.teamId);
        const team = yield* TeamService;
        const result = yield* team.listMembers({ teamId: urlParams.teamId });
        return result as readonly TeamMember[];
      }).pipe(Effect.mapError((e) => new TeamError({ message: String(e) }))),
    )
    .handle('listUserTeams', () =>
      Effect.gen(function* () {
        yield* Effect.log('[Team API] Listing user teams');
        const team = yield* TeamService;
        const result = yield* team.listUserTeams();
        return result as readonly Team[];
      }).pipe(Effect.mapError((e) => new TeamError({ message: String(e) }))),
    ),
).pipe(Layer.provide(TeamService.Default));
