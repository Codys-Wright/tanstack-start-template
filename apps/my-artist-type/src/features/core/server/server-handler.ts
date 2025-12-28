import {
  BetterAuthRouter,
  HttpAuthenticationMiddlewareLive,
  RpcAuthenticationMiddleware,
  RpcAuthenticationMiddlewareLive,
  AuthService,
} from "@auth/server";
import { makeTodosApiLive, TodosRpcLive } from "@todo/server";
import * as HttpApiScalar from "@effect/platform/HttpApiScalar";
import * as HttpApiSwagger from "@effect/platform/HttpApiSwagger";
import * as HttpLayerRouter from "@effect/platform/HttpLayerRouter";
import * as HttpServer from "@effect/platform/HttpServer";
import * as HttpServerResponse from "@effect/platform/HttpServerResponse";
import * as RpcMiddleware from "@effect/rpc/RpcMiddleware";
import * as RpcSerialization from "@effect/rpc/RpcSerialization";
import * as RpcServer from "@effect/rpc/RpcServer";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Layer from "effect/Layer";
import * as Logger from "effect/Logger";
import { DomainApi, DomainRpc } from "../domain/index.js";

// HttpApi handlers for todos - uses makeTodosApiLive from @todo
const TodosApiLive = makeTodosApiLive(DomainApi);

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
              },
            ),
            exit,
          ),
      }),
    ),
  ),
);

// Apply authentication and logging middleware to RPC group
const DomainRpcWithMiddleware = DomainRpc.middleware(
  RpcAuthenticationMiddleware,
).middleware(RpcLogger);

const RpcRouter = RpcServer.layerHttpRouter({
  group: DomainRpcWithMiddleware,
  path: "/api/rpc",
  protocol: "http",
  spanPrefix: "rpc",
  disableFatalDefects: true,
}).pipe(
  Layer.provide(TodosRpcLive),
  Layer.provide(RpcLoggerLive),
  Layer.provide(RpcAuthenticationMiddlewareLive),
  Layer.provide(AuthService.Default),
  Layer.provide(RpcSerialization.layerNdjson),
);

// HttpApi router
const HttpApiRouter = HttpLayerRouter.addHttpApi(DomainApi, {
  openapiPath: "/api/openapi.json",
}).pipe(
  Layer.provide(TodosApiLive),
  Layer.provide(HttpAuthenticationMiddlewareLive),
  Layer.provide(AuthService.Default),
  Layer.provide(HttpServer.layerContext),
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
  router.add("GET", "/api/health", HttpServerResponse.text("OK")),
);

// Merge all routes - includes both Scalar and Swagger UIs
const AllRoutes = Layer.mergeAll(
  RpcRouter,
  HttpApiRouter,
  ScalarDocs,
  SwaggerDocs,
  HealthRoute,
  BetterAuthRouter,
).pipe(Layer.provideMerge(AuthService.Default), Layer.provide(Logger.pretty));

// // Run Better Auth migrations first (creates user, session, etc. tables)
// // Then run our Effect SQL migrations (AuthMigrations + TodoMigrations)
// Effect.runPromise(
//   Effect.gen(function* () {
//     yield* runBetterAuthMigrations;
//     yield* runMigrations(AuthMigrations, TodoMigrations);
//   }),
// );

const memoMap = Effect.runSync(Layer.makeMemoMap);

const { handler, dispose } = HttpLayerRouter.toWebHandler(AllRoutes, {
  memoMap,
});

// Revert to original pattern - the Context.empty() is needed for TanStack Start integration
export const effectHandler = ({ request }: { request: Request }) =>
  handler(request, Context.empty() as any);
