import { RpcAuthenticationMiddleware } from '@auth/server';
import { ArtistTypeRpc } from '@artist-types';
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
// RPC Middleware - Tracing
// ============================================================================

/**
 * RpcTracer - OpenTelemetry tracing middleware for RPC handlers.
 *
 * Wraps each RPC handler execution with an Effect.withSpan to create
 * traceable spans that are exported to Jaeger via OtlpTracer.
 *
 * This middleware uses `wrap: true` to wrap the handler execution,
 * and `optional: true` so it doesn't block RPC execution if not provided.
 */
export class RpcTracer extends RpcMiddleware.Tag<RpcTracer>()('RpcTracer', {
  wrap: true,
  optional: true,
}) {}

/**
 * RpcTracerLive - Live implementation of RpcTracer middleware.
 *
 * Creates an OpenTelemetry span for each RPC call with:
 * - Span name: `rpc.<method>` (e.g., `rpc.quiz_list`)
 * - Attributes: clientId, method name
 *
 * The span wraps the entire handler execution including nested Effect.fn spans.
 */
export const RpcTracerLive = Layer.succeed(
  RpcTracer,
  RpcTracer.of((opts) =>
    Effect.withSpan(opts.next, `rpc.${opts.rpc._tag}`, {
      attributes: {
        'rpc.method': opts.rpc._tag,
        'rpc.clientId': String(opts.clientId),
      },
      captureStackTrace: false,
    }),
  ),
);

// ============================================================================
// RPC Middleware - Logging
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
 * Global middleware (auth, tracing, logging) is applied once here.
 *
 * Middleware order (outermost to innermost):
 * 1. RpcTracer - Creates OpenTelemetry spans for each RPC call
 * 2. RpcLogger - Logs errors (inside the tracing span)
 * 3. RpcAuthenticationMiddleware - Validates authentication
 *
 * Add more RPC groups using .merge() as features are added:
 * e.g., TodosRpc.merge(QuizRpc)
 */
export const DomainRpc = TodoRpc.merge(FeatureRpc)
  .merge(QuizRpc)
  .merge(ArtistTypeRpc)
  .middleware(RpcAuthenticationMiddleware)
  .middleware(RpcLogger)
  .middleware(RpcTracer);

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
