import * as HttpServerResponse from "@effect/platform/HttpServerResponse";
import * as HttpServer from "@effect/platform/HttpServer";
import * as HttpLayerRouter from "@effect/platform/HttpLayerRouter";
import * as RpcSerialization from "@effect/rpc/RpcSerialization";
import * as RpcServer from "@effect/rpc/RpcServer";
import * as Layer from "effect/Layer";
import * as RpcMiddleware from "@effect/rpc/RpcMiddleware";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Logger from "effect/Logger";
import { DomainRpc, DomainApi } from "@/features/core/domain";
import { TodosRpcLive, TodosApiLive } from "@/features/todo/server";
import { EventStreamRpcLive } from "@/features/event-stream/server";
import { CurrentUserRpcMiddlewareLive } from "@/features/auth/auth-middleware-live";
import { serverRuntime } from "./server-runtime.js";

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

const RpcRouter = RpcServer.layerHttpRouter({
  group: DomainRpc.middleware(RpcLogger),
  path: "/api/rpc",
  protocol: "http",
  spanPrefix: "rpc",
  disableFatalDefects: true,
}).pipe(
  Layer.provide(TodosRpcLive),
  Layer.provide(EventStreamRpcLive),
  Layer.provide(RpcLoggerLive),
  Layer.provide(CurrentUserRpcMiddlewareLive),
  Layer.provide(RpcSerialization.layerNdjson),
);

const HttpApiRouter = HttpLayerRouter.addHttpApi(DomainApi).pipe(
  Layer.provide(TodosApiLive),
  Layer.provide(HttpServer.layerContext),
);

const HealthRoute = HttpLayerRouter.use((router) =>
  router.add("GET", "/api/health", HttpServerResponse.text("OK")),
);

const AllRoutes = Layer.mergeAll(RpcRouter, HttpApiRouter, HealthRoute).pipe(
  Layer.provide(Logger.pretty),
);

const memoMap = Effect.runSync(Layer.makeMemoMap);

const globalHmr = globalThis as unknown as {
  __EFFECT_DISPOSE__?: () => Promise<void>;
};

if (globalHmr.__EFFECT_DISPOSE__) {
  await globalHmr.__EFFECT_DISPOSE__();
  globalHmr.__EFFECT_DISPOSE__ = undefined;
}

const { handler, dispose } = HttpLayerRouter.toWebHandler(AllRoutes, { memoMap });

globalHmr.__EFFECT_DISPOSE__ = async () => {
  await dispose();
  await serverRuntime.dispose();
};

export const effectHandler = ({ request }: { request: Request }) => handler(request);
