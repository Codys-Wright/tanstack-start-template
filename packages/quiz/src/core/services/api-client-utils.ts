import { type HttpApi, type HttpApiClient, type HttpApiGroup, HttpClient } from "@effect/platform";
import { Duration, Effect, Random, Schedule } from "effect";
import { envVars } from "../../lib/env-vars.js";

// 🎯 NEW: Type-level API Inspector
// This lets TypeScript see what's in the API at compile time!

/**
 * Extract all group information from an HttpApi at the type level
 * This gives you compile-time visibility into what groups and methods are available
 */
export type ApiInspector<TApi extends HttpApi.HttpApi.Any> =
  TApi extends HttpApi.HttpApi<infer _Id, infer Groups, infer _E, infer _R>
    ? {
        /** All available groups in the API */
        groups: {
          [K in Groups as HttpApiGroup.HttpApiGroup.Name<K>]: {
            /** Group name */
            name: HttpApiGroup.HttpApiGroup.Name<K>;
            /** All endpoints in this group */
            endpoints: HttpApiGroup.HttpApiGroup.Endpoints<K>;
            /** Client methods available for this group */
            methods: HttpApiClient.Client.Group<Groups, K["identifier"], never, never>;
          };
        };
        /** Array of all group names */
        groupNames: Array<HttpApiGroup.HttpApiGroup.Name<Groups>>;
        /** Total number of groups */
        groupCount: Groups extends never
          ? 0
          : Extract<Groups, { readonly topLevel: false }> extends never
            ? 0
            : 1;
      }
    : never;

/**
 * Get the client type for a specific API
 * This shows you exactly what methods will be available on the client
 */
export type ApiClientType<TApi extends HttpApi.HttpApi.Any> =
  TApi extends HttpApi.HttpApi<infer _Id, infer Groups, infer E, infer R>
    ? HttpApiClient.Client<Groups, E, R>
    : never;

/**
 * Extract group methods for a specific group from an API
 * This is like GroupMethods but works with the API type directly
 */
export type ApiGroupMethods<TApi extends HttpApi.HttpApi.Any, TGroupName extends string> =
  TApi extends HttpApi.HttpApi<infer _Id, infer Groups, infer _E, infer _R>
    ? HttpApiClient.Client.Group<Groups, TGroupName, never, never>
    : never;

/**
 * Type-safe way to get a group from an API by name
 */
export type ApiGroup<TApi extends HttpApi.HttpApi.Any, TGroupName extends string> =
  TApi extends HttpApi.HttpApi<infer _Id, infer Groups, infer _E, infer _R>
    ? HttpApiGroup.HttpApiGroup.WithName<Groups, TGroupName>
    : never;

export const configureApiClient = (client: HttpClient.HttpClient) =>
  client.pipe(
    HttpClient.transformResponse(
      Effect.fnUntraced(function* (response) {
        if (envVars.EFFECTIVE_ENV === "dev") {
          const sleepFor = yield* Random.nextRange(200, 500);
          yield* Effect.sleep(Duration.millis(sleepFor));
        }
        return yield* response;
      }),
    ),
    HttpClient.retryTransient({
      times: 3,
      schedule: Schedule.exponential("100 millis"),
    }),
  );

// Extract group methods type
export type GroupMethods<TGroup extends HttpApiGroup.HttpApiGroup.Any> = HttpApiClient.Client.Group<
  TGroup,
  HttpApiGroup.HttpApiGroup.Name<TGroup>,
  never,
  never
>;

export type RequiresGroup<TGroup extends HttpApiGroup.HttpApiGroup.Any> = {
  http: Record<HttpApiGroup.HttpApiGroup.Name<TGroup>, GroupMethods<TGroup>> &
    Record<string, unknown>;
};
