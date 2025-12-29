import * as FetchHttpClient from '@effect/platform/FetchHttpClient';
import * as HttpApiClient from '@effect/platform/HttpApiClient';
import * as HttpClient from '@effect/platform/HttpClient';
import * as Effect from 'effect/Effect';
import * as Schedule from 'effect/Schedule';
import { TodosApi } from '../domain/index.js';

const getBaseUrl = (): string =>
  typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

/**
 * TodosApiClient - HTTP API client for the Todos feature.
 *
 * Provides typed HTTP client for TodosApi endpoints.
 *
 * @example
 * ```ts
 * import { TodosApiClient } from "@todo";
 *
 * const program = Effect.gen(function* () {
 *   const client = yield* TodosApiClient;
 *   const todos = yield* client.todos.list();
 *   const newTodo = yield* client.todos.create({ title: "New todo" });
 * });
 *
 * // Run with the client layer
 * program.pipe(Effect.provide(TodosApiClient.Default));
 * ```
 */
export class TodosApiClient extends Effect.Service<TodosApiClient>()('@todo/ApiClient', {
  dependencies: [FetchHttpClient.layer],
  scoped: Effect.gen(function* () {
    const client = yield* HttpApiClient.make(TodosApi, {
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
 * Layer that provides TodosApiClient
 */
export const TodosApiClientLive = TodosApiClient.Default;
