import { Atom, Result } from "@effect-atom/atom-react";
import * as Effect from "effect/Effect";
import { authClient } from "../auth.client.js";
import type { SessionData, SignInInput, SignUpInput } from "../../domain/index.js";

/**
 * AuthApi - Effect Service wrapper around Better Auth client
 *
 * This wraps the Better Auth React client in Effect, allowing us to use
 * Effect-Atom for state management while leveraging Better Auth's proven
 * cookie handling and session management.
 *
 * Better Auth automatically handles:
 * - HTTP-only cookies with credentials: "include"
 * - Session refresh on window focus
 * - Cross-tab synchronization
 * - Cookie chunking for large sessions
 */
class AuthApi extends Effect.Service<AuthApi>()("@features/auth/AuthApi", {
	effect: Effect.sync(() => ({
		getSession: () =>
			Effect.tryPromise({
				try: async () => {
					const result = await authClient.getSession();
					return result.data as SessionData;
				},
				catch: (error) => new Error(`Failed to get session: ${error}`),
			}),

		signIn: (input: SignInInput) =>
			Effect.tryPromise({
				try: async () => {
					const result = await authClient.signIn.email({
						email: input.email,
						password: input.password,
						callbackURL: input.callbackURL,
						rememberMe: input.rememberMe,
					});
					if (result.error) {
						throw new Error(result.error.message || "Sign in failed");
					}
					return result.data;
				},
				catch: (error) =>
					new Error(
						`Sign in failed: ${error instanceof Error ? error.message : error}`,
					),
			}),

		signInWithGoogle: () =>
			Effect.tryPromise({
				try: async () => {
					const result = await authClient.signIn.social({
						provider: "google",
						callbackURL: `${window.location.origin}/auth/callback`,
					});
					if (result.error) {
						throw new Error(result.error.message || "Google sign in failed");
					}
					// OAuth redirect happens automatically, this won't return
					return result.data;
				},
				catch: (error) => new Error(`Google sign in failed: ${error}`),
			}),

		signInWithPasskey: () =>
			Effect.tryPromise({
				try: async () => {
					const result = await authClient.signIn.passkey();
					if (result.error) {
						throw new Error(result.error.message || "Passkey sign in failed");
					}
					return result.data;
				},
				catch: (error) => new Error(`Passkey sign in failed: ${error}`),
			}),

		signOut: () =>
			Effect.tryPromise({
				try: async () => {
					const result = await authClient.signOut();
					return result.data;
				},
				catch: (error) => new Error(`Sign out failed: ${error}`),
			}),

		signUp: (input: SignUpInput) =>
			Effect.tryPromise({
				try: async () => {
					const result = await authClient.signUp.email({
						name: input.name,
						email: input.email,
						password: input.password,
						image: input.image,
						callbackURL: input.callbackURL,
					});
					if (result.error) {
						throw new Error(result.error.message || "Sign up failed");
					}
					return result.data;
				},
				catch: (error) =>
					new Error(
						`Sign up failed: ${error instanceof Error ? error.message : error}`,
					),
			}),
	})),
}) {}

/**
 * Runtime for auth atoms - provides AuthApi service
 */
export const authRuntime = Atom.runtime(AuthApi.Default);

/**
 * sessionAtom - Reactive atom for current authentication session
 *
 * Uses Better Auth client under the hood, which automatically:
 * - Sends HTTP-only cookies with requests
 * - Refreshes session on window focus
 * - Syncs across browser tabs
 */
export const sessionAtom = (() => {
	const remoteAtom = authRuntime.atom(
		Effect.gen(function* () {
			const api = yield* AuthApi;
			return yield* api.getSession();
		}),
	);

	return Object.assign(
		Atom.writable(
			(get) => get(remoteAtom),
			// Allow manually updating session (for optimistic updates after signIn)
			(ctx, session: SessionData) => {
				ctx.setSelf(Result.success(session));
			},
			// Refresh function
			(refresh) => {
				refresh(remoteAtom);
			},
		),
		{ remote: remoteAtom },
	);
})();

/**
 * signInAtom - Atom effect for signing in with email/password
 *
 * On success:
 * 1. Returns SignInResponse
 * 2. Optimistically updates sessionAtom with fresh session data
 */
export const signInAtom = authRuntime.fn<SignInInput>()(
	Effect.fnUntraced(function* (input, get) {
		const api = yield* AuthApi;
		const signInResponse = yield* api.signIn(input);

		// After successful sign-in, fetch fresh session to update sessionAtom
		const freshSession = yield* api.getSession();
		get.set(sessionAtom, freshSession);

		return signInResponse;
	}),
);

/**
 * signInWithGoogleAtom - Atom effect for signing in with Google OAuth
 *
 * Initiates OAuth flow which redirects to Google and back to callback URL.
 * Session will be established after callback redirect.
 */
export const signInWithGoogleAtom = authRuntime.fn<void>()(
	Effect.fnUntraced(function* (_input, _get) {
		const api = yield* AuthApi;
		return yield* api.signInWithGoogle();
	}),
);

/**
 * signInWithPasskeyAtom - Atom effect for signing in with passkey
 *
 * On success:
 * 1. Prompts user for WebAuthn authentication
 * 2. Updates sessionAtom with fresh session data
 */
export const signInWithPasskeyAtom = authRuntime.fn<void>()(
	Effect.fnUntraced(function* (_input, get) {
		const api = yield* AuthApi;
		yield* api.signInWithPasskey();

		// After successful passkey sign-in, fetch fresh session
		const freshSession = yield* api.getSession();
		get.set(sessionAtom, freshSession);
	}),
);

/**
 * signOutAtom - Atom effect for signing out
 *
 * On success:
 * 1. Returns SignOutResponse
 * 2. Clears sessionAtom (sets to null)
 */
export const signOutAtom = authRuntime.fn<void>()(
	Effect.fnUntraced(function* (_input, get) {
		const api = yield* AuthApi;
		const result = yield* api.signOut();

		// Clear session after sign-out
		get.set(sessionAtom, null);

		return result;
	}),
);

/**
 * signUpAtom - Atom effect for signing up with email/password
 *
 * On success:
 * 1. Returns SignUpResponse
 * 2. Optimistically updates sessionAtom with fresh session data
 */
export const signUpAtom = authRuntime.fn<SignUpInput>()(
	Effect.fnUntraced(function* (input, get) {
		const api = yield* AuthApi;
		const signUpResponse = yield* api.signUp(input);

		// After successful sign-up, fetch fresh session to update sessionAtom
		const freshSession = yield* api.getSession();
		get.set(sessionAtom, freshSession);

		return signUpResponse;
	}),
);
