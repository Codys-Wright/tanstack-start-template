import * as HttpServerResponse from "@effect/platform/HttpServerResponse";
import * as HttpServer from "@effect/platform/HttpServer";
import * as HttpLayerRouter from "@effect/platform/HttpLayerRouter";
import * as HttpApiSwagger from "@effect/platform/HttpApiSwagger";
import * as HttpApiScalar from "@effect/platform/HttpApiScalar";
import * as RpcSerialization from "@effect/rpc/RpcSerialization";
import * as RpcServer from "@effect/rpc/RpcServer";
import * as Layer from "effect/Layer";
import * as RpcMiddleware from "@effect/rpc/RpcMiddleware";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Logger from "effect/Logger";
import * as Context from "effect/Context";
import { DomainRpc, DomainApi } from "@/features/core/domain";
import { TodosRpcLive, TodosApiLive } from "@/features/todo/server";
import {
  HttpAuthenticationMiddlewareLive,
  RpcAuthenticationMiddlewareLive,
  BetterAuthService,
  BetterAuthRouter,
} from "@/features/auth/server";
import { serverRuntime } from "./server-runtime.js";
import * as NodeContext from "@effect/platform-node/NodeContext";
import * as PgMigrator from "@effect/sql-pg/PgMigrator";
import { PgLive, createMigrationLoader } from "@core";
import { authMigrations } from "@auth";

class RpcLogger extends RpcMiddleware.Tag<RpcLogger>()("RpcLogger", {
  wrap: true,
  optional: true,
}) {}

const RpcLoggerLive = Layer.succeed(
  RpcLogger,
  RpcLogger.of((opts) =>
    Effect.flatMap(Effect.exit(opts.next), (exit) =>
      Exit.match(exit, {
        onSuccess: () => exit,
        onFailure: (cause) =>
          Effect.zipRight(
            Effect.annotateLogs(
              Effect.logError(`RPC request failed: ${opts.rpc._tag}`, cause),
              {
                "rpc.method": opts.rpc._tag,
                "rpc.clientId": opts.clientId,
              }
            ),
            exit
          ),
      })
    )
  )
);

const RpcRouter = RpcServer.layerHttpRouter({
  group: DomainRpc.middleware(RpcLogger),
  path: "/api/rpc",
  protocol: "http",
  spanPrefix: "rpc",
  disableFatalDefects: true,
}).pipe(
  Layer.provide(TodosRpcLive),
  Layer.provide(RpcLoggerLive),
  Layer.provide(RpcAuthenticationMiddlewareLive),
  Layer.provide(RpcSerialization.layerNdjson)
);

// HttpApi router - FIXED
const HttpApiRouter = HttpLayerRouter.addHttpApi(DomainApi, {
  openapiPath: "/api/openapi.json", // Built-in OpenAPI endpoint
}).pipe(
  Layer.provide(TodosApiLive),
  Layer.provide(HttpAuthenticationMiddlewareLive), // Provide real auth middleware
  Layer.provide(HttpServer.layerContext)
);

// Scalar UI (modern OpenAPI docs) at /api/docs
const ScalarDocs = HttpApiScalar.layerHttpLayerRouter({
  api: DomainApi,
  path: "/api/docs",
  scalar: {
    theme: "moon",
    layout: "modern",
    darkMode: true,
    defaultOpenAllTags: true,
  },
});

// Swagger UI (classic OpenAPI docs) at /api/swagger
const SwaggerDocs = HttpApiSwagger.layerHttpLayerRouter({
  api: DomainApi,
  path: "/api/swagger",
});

const HealthRoute = HttpLayerRouter.use((router) =>
  router.add("GET", "/api/health", HttpServerResponse.text("OK"))
);

// Merge all routes - includes both Scalar and Swagger UIs
const AllRoutes = Layer.mergeAll(
  RpcRouter,
  HttpApiRouter,
  ScalarDocs, // Modern Scalar UI at /api/docs
  SwaggerDocs, // Classic Swagger UI at /api/swagger
  HealthRoute,
  BetterAuthRouter
).pipe(
  Layer.provideMerge(BetterAuthService.Default),
  Layer.provide(Logger.pretty)
  // Apply CORS globally if needed
  // Layer.provide(HttpLayerRouter.cors({
  //   allowedOrigins: ["http://localhost:3000"],
  //   credentials: true
  // }))
);

// Run auto-migration on startup
await Effect.runPromise(
  Effect.gen(function* () {
    yield* Effect.log("[AutoMigration] Starting database migration check...");

    const migrations = yield* PgMigrator.run({
      loader: createMigrationLoader({
        features: [authMigrations],
      }),
    });

    if (migrations.length === 0) {
      yield* Effect.log("[AutoMigration] No new migrations to apply.");
    } else {
      yield* Effect.log(
        `[AutoMigration] Applied ${migrations.length} migration(s):`
      );
      for (const [id, name] of migrations) {
        yield* Effect.log(`  - ${id.toString().padStart(4, "0")}_${name}`);
      }
    }

    yield* Effect.log("[AutoMigration] Database schema is up-to-date.");
  }).pipe(
    Effect.provide(Layer.merge(PgLive, NodeContext.layer)),
    Effect.tapError((error) =>
      Effect.logError(`[AutoMigration] Migration failed: ${error}`)
    ),
    Effect.orDie
  )
);

const memoMap = Effect.runSync(Layer.makeMemoMap);

const globalHmr = globalThis as unknown as {
  __EFFECT_DISPOSE__?: () => Promise<void>;
};

if (globalHmr.__EFFECT_DISPOSE__) {
  await globalHmr.__EFFECT_DISPOSE__();
  globalHmr.__EFFECT_DISPOSE__ = undefined;
}

const { handler, dispose } = HttpLayerRouter.toWebHandler(AllRoutes, {
  memoMap,
});

globalHmr.__EFFECT_DISPOSE__ = async () => {
  await dispose();
  await serverRuntime.dispose();
};

// Revert to original pattern - the Context.empty() is needed for TanStack Start integration
export const effectHandler = ({ request }: { request: Request }) =>
  handler(request, Context.empty() as any);
