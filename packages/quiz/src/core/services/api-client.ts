import { FetchHttpClient, HttpApiClient } from "@effect/platform";
import { DomainApi } from "@my-artist-type/domain";
import { Effect } from "effect";
import { envVars } from "../../lib/env-vars.js";
import { configureApiClient } from "./api-client-utils";

export class ApiClient extends Effect.Service<ApiClient>()("@org/ApiClient", {
  dependencies: [FetchHttpClient.layer],
  scoped: Effect.gen(function* () {
    return {
      http: yield* HttpApiClient.make(DomainApi, {
        baseUrl: envVars.API_URL,
        transformClient: configureApiClient,
      }),
    } as const;
  }),
}) {}
