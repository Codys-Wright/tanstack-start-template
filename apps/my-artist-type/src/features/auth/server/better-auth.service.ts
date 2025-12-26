import { betterAuth } from "better-auth";
import type { BetterAuthOptions } from "better-auth";
import { getMigrations } from "better-auth/db";
import { admin, openAPI } from "better-auth/plugins";
import { organization } from "better-auth/plugins/organization";
import { passkey } from "@better-auth/passkey";
import { twoFactor } from "better-auth/plugins/two-factor";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as Redacted from "effect/Redacted";
import { BetterAuthConfig, getAuthSecret } from "./better-auth.config.js";
import { BetterAuthDatabase } from "./better-auth.database.js";
import { EmailService } from "./email.service.js";

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
				"Reset your password",
				`<p>Click the link below to reset your password:</p><p><a href="${url}">${url}</a></p>`,
			);
		},
	},

	database: {
		db: params.db,
		type: "postgres" as const,
		casing: "camel" as const,
		schema: {
			user: {
				additionalFields: {
					fake: {
						type: "boolean",
						defaultValue: false,
						required: false,
						input: false, // Don't allow setting via input, only programmatically
					},
				},
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
			defaultRole: "user",
			adminRoles: ["admin"],
			impersonationSessionDuration: 60 * 60, // 1 hour
			defaultBanExpiresIn: undefined, // Bans never expire by default
		}),

		organization({
			allowUserToCreateOrganization: true,
			creatorRole: "owner",
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

const makeBetterAuth = Effect.gen(function* () {
	const env = yield* BetterAuthConfig;
	const kysely = yield* BetterAuthDatabase;
	const emailService = yield* EmailService;

	const options = makeBetterAuthOptions({
		baseURL: env.BETTER_AUTH_URL,
		secret: getAuthSecret(env),
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
			await Effect.runPromise(emailService.send({ to, subject, html }));
		},
	});

	const { runMigrations } = yield* Effect.promise(() =>
		getMigrations(options),
	);
	yield* Effect.promise(runMigrations);

	return betterAuth(options);
});

export class BetterAuthService extends Effect.Service<BetterAuthService>()(
	"BetterAuthService",
	{
		effect: makeBetterAuth,
		dependencies: [
			BetterAuthDatabase.Default,
			BetterAuthConfig.Default,
			EmailService.Default,
		],
	},
) {}
