/**
 * @auth/core/auth-types - Shared type definitions for Better Auth
 *
 * This file defines the auth configuration at the TYPE level only.
 * We create a dummy betterAuth call that TypeScript can infer types from,
 * without needing runtime values like database connections or secrets.
 *
 * This allows us to:
 * 1. Get proper types for auth.api methods (no more `as any`)
 * 2. Share types between server and client
 * 3. Keep the Effect service implementation clean
 */

import { betterAuth } from 'better-auth';
import { admin, anonymous, openAPI } from 'better-auth/plugins';
import { organization } from 'better-auth/plugins/organization';
import { twoFactor } from 'better-auth/plugins/two-factor';
import { passkey } from '@better-auth/passkey';

// ============================================================================
// Type-Level Auth Configuration
// ============================================================================

/**
 * Plugins array defined separately so TypeScript can properly infer
 * the plugin types without readonly constraints.
 */
const authPlugins = [
  openAPI(),
  anonymous({
    emailDomainName: 'anonymous.local',
    disableDeleteAnonymousUser: false,
  }),
  admin({
    defaultRole: 'user',
    adminRoles: ['admin'],
    impersonationSessionDuration: 60 * 60,
    defaultBanExpiresIn: undefined,
  }),
  organization({
    allowUserToCreateOrganization: true,
    creatorRole: 'owner',
    membershipLimit: 100,
    organizationLimit: 10,
    teams: {
      enabled: true,
      maximumTeams: 10,
    },
    schema: {
      organization: {
        fields: {},
        additionalFields: {
          fake: {
            type: 'boolean' as const,
            defaultValue: false,
            required: false,
            input: false,
          },
        },
      },
    },
  }),
  twoFactor({
    issuer: '',
  }),
  passkey({
    rpName: '',
    rpID: '',
    origin: '',
  }),
];

/**
 * This is a TYPE-ONLY configuration. It's never executed at runtime in production.
 * We use it purely to infer the correct types for the auth API.
 */
const authTypeConfig = {
  // Minimal required fields for type inference
  baseURL: '',
  secret: '',
  appName: '',

  emailAndPassword: {
    enabled: true as const,
    requireEmailVerification: false as const,
  },

  database: {
    db: {} as any,
    type: 'postgres' as const,
    casing: 'camel' as const,
  },

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google'],
      allowDifferentEmails: true,
    },
  },

  user: {
    additionalFields: {
      fake: {
        type: 'boolean' as const,
        defaultValue: false,
        required: false,
        input: false,
      },
    },
  },

  socialProviders: {
    google: {
      clientId: '',
      clientSecret: '',
    },
  },

  plugins: authPlugins,

  trustedOrigins: [] as string[],
};

/**
 * Type representing our auth configuration options.
 * Used for type inference only.
 */
export type AuthOptions = typeof authTypeConfig;

/**
 * The fully typed Better Auth instance type.
 * This gives us access to all the typed API methods.
 */
export type BetterAuthInstance = ReturnType<typeof betterAuth<AuthOptions>>;

/**
 * The typed API object with all plugin methods included.
 * Use this to get proper types for auth.api.* calls.
 */
export type BetterAuthApi = BetterAuthInstance['api'];

/**
 * Inferred types from the auth instance.
 * Includes Session, User, Organization, etc.
 */
export type BetterAuthInfer = BetterAuthInstance['$Infer'];

// ============================================================================
// Re-export specific inferred types for convenience
// ============================================================================

export type InferredSession = BetterAuthInfer['Session'];
export type InferredOrganization = BetterAuthInfer extends {
  Organization: infer O;
}
  ? O
  : never;
export type InferredMember = BetterAuthInfer extends { Member: infer M } ? M : never;
export type InferredInvitation = BetterAuthInfer extends { Invitation: infer I } ? I : never;
export type InferredTeam = BetterAuthInfer extends { Team: infer T } ? T : never;
