import * as FetchHttpClient from '@effect/platform/FetchHttpClient';
import * as HttpApiClient from '@effect/platform/HttpApiClient';
import * as HttpClient from '@effect/platform/HttpClient';
import * as Effect from 'effect/Effect';
import * as Schedule from 'effect/Schedule';
import { AuthApi } from '@auth/core/auth-api';

const getBaseUrl = (): string =>
  typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

/**
 * AuthApiClient - Effect HTTP API client for the Auth feature.
 *
 * Provides typed HTTP client for AuthApi endpoints (session management).
 * This is an Effect-based alternative to the Better Auth `authClient`.
 *
 * @example
 * ```ts
 * import { AuthApiClient } from "@auth";
 *
 * const program = Effect.gen(function* () {
 *   const client = yield* AuthApiClient;
 *
 *   // Get current session
 *   const session = yield* client.session.getSession();
 *
 *   // Sign in
 *   const signInResult = yield* client.session.signInEmail({
 *     email: "user@example.com",
 *     password: "password123",
 *   });
 *
 *   // Sign out
 *   yield* client.session.signOut();
 * });
 *
 * // Run with the client layer
 * program.pipe(Effect.provide(AuthApiClient.Default));
 * ```
 */
export class AuthApiClient extends Effect.Service<AuthApiClient>()('@auth/ApiClient', {
  dependencies: [FetchHttpClient.layer],
  scoped: Effect.gen(function* () {
    const client = yield* HttpApiClient.make(AuthApi, {
      baseUrl: getBaseUrl(),
      transformClient: (httpClient) =>
        httpClient.pipe(
          HttpClient.filterStatusOk,
          HttpClient.retryTransient({
            times: 3,
            schedule: Schedule.exponential('1 second'),
          }),
        ),
    });

    return client;
  }),
}) {}

/**
 * Layer that provides AuthApiClient
 */
export const AuthApiClientLive = AuthApiClient.Default;
