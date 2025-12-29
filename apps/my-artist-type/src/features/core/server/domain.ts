import { RpcAuthenticationMiddleware } from '@auth/server';
import { TodosRpc } from '@todo';
import * as RpcMiddleware from '@effect/rpc/RpcMiddleware';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';

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
 * e.g., TodosRpc.merge(QuizRpc).merge(AnalysisRpc)
 */
export const AppRpc = TodosRpc.middleware(RpcAuthenticationMiddleware).middleware(RpcLogger);
