import { passkey } from '@better-auth/passkey';
import { betterAuth } from 'better-auth';
import type { BetterAuthOptions } from 'better-auth';
import { getMigrations } from 'better-auth/db';
import { admin, openAPI } from 'better-auth/plugins';
import { organization } from 'better-auth/plugins/organization';
import { twoFactor } from 'better-auth/plugins/two-factor';
import { getRequestHeaders } from '@tanstack/react-start/server';
import { EmailService } from '@email';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Redacted from 'effect/Redacted';
import * as Runtime from 'effect/Runtime';
import { Unauthenticated, type SessionData } from '../session/domain/schema.js';
import type { UserId } from '../user/domain/schema.js';
import { AuthConfig } from './config';
import { AuthDatabase } from './database';

// Re-export for backwards compatibility with existing server code
export { Unauthenticated };

// ============================================================================
// Auth Service
// ============================================================================

export type BetterAuthInstance = ReturnType<typeof betterAuth>;

/**
 * Creates Better Auth options.
 * Exported so it can be reused in auth.ts for CLI tools.
 */
export const makeBetterAuthOptions = (params: {
  baseURL: string;
  secret: string;
  clientOrigin: string;
  db: unknown; // Kysely instance
  googleClientId?: string;
  googleClientSecret?: string;
  appName: string;
  sendEmail: (to: string, subject: string, html: string) => Promise<void>;
}): BetterAuthOptions => ({
  baseURL: params.baseURL,
  secret: params.secret,
  appName: params.appName,

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await params.sendEmail(
        user.email,
        'Reset your password',
        `<p>Click the link below to reset your password:</p><p><a href="${url}">${url}</a></p>`,
      );
    },
  },

  database: {
    db: params.db,
    type: 'postgres' as const,
    casing: 'camel' as const,
  },

  user: {
    additionalFields: {
      fake: {
        type: 'boolean',
        defaultValue: false,
        required: false,
        input: false, // Don't allow setting via input, only programmatically
      },
    },
  },

  socialProviders:
    params.googleClientId && params.googleClientSecret
      ? {
          google: {
            clientId: params.googleClientId,
            clientSecret: params.googleClientSecret,
          },
        }
      : undefined,

  plugins: [
    openAPI(),

    admin({
      defaultRole: 'user',
      adminRoles: ['admin'],
      impersonationSessionDuration: 60 * 60, // 1 hour
      defaultBanExpiresIn: undefined, // Bans never expire by default
    }),

    organization({
      allowUserToCreateOrganization: true,
      creatorRole: 'owner',
      membershipLimit: 100,
      organizationLimit: 10,

      sendInvitationEmail: async (data) => {
        await params.sendEmail(
          data.email,
          `Invitation to join ${data.organization.name}`,
          `<p>You've been invited to join <strong>${data.organization.name}</strong>.</p>
					<p>Invitation ID: ${data.invitation.id}</p>`,
        );
      },

      teams: {
        enabled: true,
        maximumTeams: 10,
      },

      schema: {
        organization: {
          fields: {},
          additionalFields: {
            fake: {
              type: 'boolean',
              defaultValue: false,
              required: false,
              input: false,
            },
          },
        },
      },
    }),

    twoFactor({
      issuer: params.appName,
    }),

    passkey({
      rpName: params.appName,
      rpID: new URL(params.baseURL).hostname,
      origin: params.clientOrigin,
    }),
  ],

  trustedOrigins: [params.clientOrigin, params.baseURL],
});

/**
 * Creates the auth service with Better Auth instance and helper methods
 */
const makeAuthService = Effect.gen(function* () {
  const env = yield* AuthConfig;
  const kysely = yield* AuthDatabase;
  const emailService = yield* EmailService;
  const runtime = yield* Effect.runtime<EmailService>();

  const options = makeBetterAuthOptions({
    baseURL: env.BETTER_AUTH_URL,
    secret: Redacted.value(env.BETTER_AUTH_SECRET),
    clientOrigin: env.CLIENT_ORIGIN,
    db: kysely,
    googleClientId: Option.isSome(env.GOOGLE_CLIENT_ID)
      ? Redacted.value(env.GOOGLE_CLIENT_ID.value)
      : undefined,
    googleClientSecret: Option.isSome(env.GOOGLE_CLIENT_SECRET)
      ? Redacted.value(env.GOOGLE_CLIENT_SECRET.value)
      : undefined,
    appName: env.APP_NAME,
    sendEmail: async (to, subject, html) => {
      await Runtime.runPromise(runtime)(emailService.send({ to, subject, html }));
    },
  });

  const { runMigrations } = yield* Effect.promise(() => getMigrations(options));
  yield* Effect.promise(runMigrations);

  const auth = betterAuth(options);

  return {
    ...auth,
    /**
     * Gets the current session from cookies.
     * Returns SessionData (session + user) on success.
     * Fails with Unauthenticated error if no valid session exists.
     *
     * @example
     * ```ts
     * const auth = yield* AuthService;
     * const session = yield* auth.getSession;
     * const userId = session.user.id;
     * ```
     */
    getSession: Effect.tryPromise({
      try: () => auth.api.getSession() as Promise<SessionData>,
      catch: () => new Unauthenticated(),
    }).pipe(
      Effect.flatMap((session) =>
        session ? Effect.succeed(session) : Effect.fail(new Unauthenticated()),
      ),
    ),

    /**
     * Gets the user ID from request headers.
     * Returns null if no valid session exists instead of failing.
     * Useful for endpoints that are optionally authenticated.
     *
     * @param headers - Optional request headers. If not provided, will get headers from current request.
     * @returns Effect that resolves to UserId or null
     *
     * @example
     * ```ts
     * const auth = yield* AuthService;
     * const userId = yield* auth.getUserIdFromHeaders();
     * if (userId) {
     *   // User is authenticated
     * } else {
     *   // User is not authenticated
     * }
     * ```
     */
    getUserIdFromHeaders: (headers?: HeadersInit): Effect.Effect<UserId | null, never, never> =>
      Effect.sync(() => headers ?? getRequestHeaders()).pipe(
        Effect.flatMap((requestHeaders) =>
          Effect.tryPromise({
            try: () =>
              auth.api.getSession({
                headers: requestHeaders,
              }) as Promise<SessionData | null>,
            catch: () => new Error('Failed to get session'),
          }).pipe(
            Effect.catchAll(() =>
              Effect.gen(function* () {
                yield* Effect.logInfo('[getUserIdFromHeaders] Session error - returning null');
                return null;
              }),
            ),
            Effect.map((session) => (session ? (session.user.id as UserId) : null)),
          ),
        ),
      ),

    /**
     * Gets the current authenticated user's ID from request headers.
     * Fails with Unauthenticated error if no valid session exists.
     * Useful for endpoints that require authentication.
     *
     * @param headers - Optional request headers. If not provided, will get headers from current request.
     * @returns Effect that resolves to UserId or fails with Unauthenticated
     *
     * @example
     * ```ts
     * const auth = yield* AuthService;
     * const currentUserId = yield* auth.currentUserId();
     * // currentUserId is guaranteed to be valid here
     * ```
     */
    currentUserId: (headers?: HeadersInit): Effect.Effect<UserId, Unauthenticated, never> =>
      Effect.sync(() => headers ?? getRequestHeaders()).pipe(
        Effect.flatMap((requestHeaders) =>
          Effect.tryPromise({
            try: () =>
              auth.api.getSession({
                headers: requestHeaders,
              }) as Promise<SessionData | null>,
            catch: () => new Unauthenticated(),
          }).pipe(
            Effect.flatMap((session: SessionData | null) =>
              session
                ? Effect.succeed(session.user.id as UserId)
                : Effect.fail(new Unauthenticated()),
            ),
          ),
        ),
      ),
  };
});

export class AuthService extends Effect.Service<AuthService>()('AuthService', {
  effect: makeAuthService,
  accessors: true,
  // Use Layer.orDie to convert ConfigError into defects
  // This prevents ConfigError from propagating up to consumers
  dependencies: [
    AuthDatabase.Default.pipe(Layer.orDie),
    AuthConfig.Default.pipe(Layer.orDie),
    EmailService.Default.pipe(Layer.orDie),
  ],
}) {}
