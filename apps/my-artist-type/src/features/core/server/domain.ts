import { RpcAuthenticationMiddleware } from '@auth/server';
import { FeatureRpc } from '@example';
import { TodoRpc, TodoApi } from '@todo';
import { QuizRpc } from '@quiz';
import * as RpcMiddleware from '@effect/rpc/RpcMiddleware';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';
import * as OpenApi from '@effect/platform/OpenApi';
import * as HttpApi from '@effect/platform/HttpApi';

// ============================================================================
// RPC Middleware
// ============================================================================

export class RpcLogger extends RpcMiddleware.Tag<RpcLogger>()('RpcLogger', {
  wrap: true,
  optional: true,
}) {}

export const RpcLoggerLive = Layer.succeed(
  RpcLogger,
  RpcLogger.of((opts) =>
    Effect.flatMap(Effect.exit(opts.next), (exit) =>
      Exit.match(exit, {
        onSuccess: () => exit,
        onFailure: (cause) =>
          Effect.zipRight(
            Effect.annotateLogs(Effect.logError(`RPC request failed: ${opts.rpc._tag}`, cause), {
              'rpc.method': opts.rpc._tag,
              'rpc.clientId': opts.clientId,
            }),
            exit,
          ),
      }),
    ),
  ),
);

// ============================================================================
// AppRpc - Composed RPC Group with Global Middleware
// ============================================================================

/**
 * AppRpc - Composed RPC group with all feature RPCs merged.
 * Global middleware (auth, logging) is applied once here.
 *
 * Add more RPC groups using .merge() as features are added:
 * e.g., TodosRpc.merge(QuizRpc)
 */
export const DomainRpc = TodoRpc.merge(FeatureRpc)
  .merge(QuizRpc)
  .middleware(RpcAuthenticationMiddleware)
  .middleware(RpcLogger);

/**
 * DomainApi - Core HTTP API for the application.
 *
 * Note: ExampleApi has its own route layer (ExampleApiLive) with separate docs
 * at /api/example/docs. It's not merged here to avoid handler type conflicts.
 */
export class DomainApi extends HttpApi.make('api')
  .addHttpApi(TodoApi)
  .prefix('/api')
  .annotateContext(
    OpenApi.annotations({
      title: 'TanStack Start API',
      description: 'API for the TanStack Start application',
      version: '1.0.0',
    }),
  ) {}
